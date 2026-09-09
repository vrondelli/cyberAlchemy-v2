---
tags: [oom-fix, memory-optimization, polars, upload-pipeline, categorical-encoding, column-filtering]
node_type: spec
is_session: true
layer: infrastructure
nature: technical, procedural
status: active
created: 2026-03-31
timestamp: 2026-03-31T17:00:00-03:00
expires: 2026-05-30
conversation_id: a63c5352-b52b-db53-5000-000000000001
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md]
promoted_candidates:
  - Polars Categorical join hazard (local-encoding mismatch on independent casts) → development-practices-constitution.md or new premise
  - DB queries belong at service-layer boundary, not inside processing functions → procedural premise for upload pipeline
expected_importance: 8
importance_rationale: "Fixes two silent correctness bugs in the OOM spec and delivers ~1.9–2.2 GB of expected peak memory reduction in the upload pipeline, directly addressing the production incident."
---

# Phase 2 Opt-1 + Opt-3 — Column Filtering and Categorical Encoding

**Date:** 2026-03-31 17:00 (UTC-3)
**Tags:** #oom-fix #memory-optimization #polars #upload-pipeline #categorical-encoding #column-filtering

## Summary

This session confirmed Phase 1 of the OOM fix spec was fully implemented, then assessed and delivered Phase 2 optimizations Opt-1 and Opt-3. Before any code was written, a safety review of both optimizations was conducted against the live code — and two spec bugs were found that would have caused incorrect behavior in production.

Phase 1 (Tasks 1–6) was verified complete via code inspection across all affected files. The only outstanding item is Step 5.5: a runtime smoke test on a 1.2 GB CSV upload in staging, which is an operational check that cannot be automated.

### Opt-1 — Column filtering at ingest (`pl.read_csv(columns=[...])`)

**Problem:** A CSV with many unused columns (e.g. 80 columns from a financial system where only 11 are needed) loads all 69 unused columns as Utf8 buffers. At 3M rows × 69 cols × ~8 bytes each, that is ~1.7 GB of avoidable RAM.

**Spec bug found — double header read:** The spec's design called `_read_header_columns` twice per upload: once in `process_file` to compute `columns_to_load`, and once inside `_read_csv` for `schema_overrides`. Fix: thread the already-computed `header_columns` into `_read_csv` as an optional parameter so the second file open never happens.

**Spec bug found — misleading base class claim:** The spec claimed "base class returning `[]` is equivalent to no filtering." This is wrong. Returning `[]` still produces a `columns_to_load` that drops all unrecognized columns (since `_complementary = set()` and `_wanted & header_columns` only covers known columns). The claim was removed from the spec. The base class is correctly documented as a no-op for domains without complementary columns — it does not pass through all columns.

**Decided:** Pre-fetch complementary column names via `get_complementary_col_names()` at the service layer boundary (in `ProcessUploadService.process_file_upload`) before calling `process_file`. This keeps the DB query outside the processing function (correct boundary) and ensures configured complementary columns are included in `columns_to_load` so the validator's mandatory-column check still works. The DB query (one indexed filter on `domain`) is cheap.

**Done:**
- `BaseUploadRules`: added `get_complementary_col_names() -> List[str]` (returns `[]`), updated `_read_csv` with `columns_to_load` and `header_columns` params, updated `process_file` with `complementary_col_names` param and full column-set computation logic.
- `AquisicaoUploadRules` / `LiquidacaoUploadRules`: overrode `get_complementary_col_names()` with domain-filtered `ComplementaryTableColumnConfig` query (import inside method body to avoid circular import — mirrors pattern in celery_tasks.py).
- `ProcessUploadService`: pre-fetches complementary cols before `process_file` call.

### Opt-3 — Categorical cast for low-cardinality string columns

**Problem:** High-repetition string columns (`cnpj_fundo`, `tipo_produto`, etc.) at 3M rows are stored as Utf8 buffers. Casting to `pl.Categorical` stores only an integer index per row, saving ~200–500 MB.

**Spec bug found — wrong placement:** The spec said to add the cast "immediately after `del unique_df`" (line ~227 in `upload_service.py`). This is wrong. `_remessa_level_dedup` is called ~35 lines later and performs joins on `to_insert_df` using `identity_keys`, which includes `cnpj_fundo` for Aquisicao — one of the proposed `CATEGORICAL_COLS`. Joining two Polars Categorical columns that were encoded independently (one from the cast on `to_insert_df`, one cast from a Python dict rebuild inside `_remessa_level_dedup`) risks local-encoding mismatches. Polars compares integer codes, not string values, for Categorical joins when a global StringCache is not active. This would produce silently wrong join results — rows would not match even when the string values are identical.

**Decided:** Move the cast to after `_remessa_level_dedup` returns, right before `_save_duplicates_csv`. At that point, the only remaining operations on `to_insert_df` are: `write_csv` (Categorical serializes as string, safe), `aggregate_for_remessa` (group_by on Categorical, safe in Polars), and the `_obj_df` re-attach join (uses DEDUP_KEYS only — `campo_chave`, `sacado_cnpj_cpf`, `data_aquisicao` — none of which are in `CATEGORICAL_COLS`).

**Also decided:** Liquidacao `CATEGORICAL_COLS = ['tipo_baixo']` only. `cnpj_fundo` and `movimento` are excluded because both are `LIQ_KEYS` (dedup keys) and participate in joins.

**Done:**
- `BaseUploadRules`: added `CATEGORICAL_COLS: List[str] = []`.
- `AquisicaoUploadRules`: `CATEGORICAL_COLS = ['tipo_produto', 'tipo_instrumento', 'cnpj_emissor', 'cnpj_fundo']`.
- `LiquidacaoUploadRules`: `CATEGORICAL_COLS = ['tipo_baixo']`.
- `ProcessUploadService`: Categorical cast block added after `_remessa_level_dedup` returns with `if c in to_insert_df.columns` guard for optional columns.

### Spec doc update

Both Opt-1 and Opt-3 sections in `2026-03-31-003-remessa-upload-oom-fix.md` were updated with implementation status (`Status: implemented`) and inline correction notes explaining the bugs and how they were fixed.

## Epistemic Impact

**Spec drift fixed:** Two bugs in `2026-03-31-003-remessa-upload-oom-fix.md` were corrected:
1. The double `_read_header_columns` call (efficiency bug).
2. The Categorical cast placement before `_remessa_level_dedup` (silent correctness bug).

**Belief challenged — Polars Categorical join safety:** The assumption that casting columns to Categorical before joins is safe was found to be wrong when the two sides of the join are cast independently (without a shared global StringCache). This is a non-obvious Polars footgun with no current home in the project's engineering guidelines.

**Belief confirmed — DB queries at service boundaries:** The pattern of pre-fetching config at the service-layer boundary (rather than inside domain processing functions) was validated again. `get_complementary_col_names()` belongs in `ProcessUploadService`, not inside `BaseUploadRules.process_file`.

**Promoted candidates:**
- The Polars Categorical join hazard should be added to `development-practices-constitution.md` or a new `premises/polars-categorical-join-safety.md` node.
- "DB queries belong at the service-layer boundary, not inside processing functions" should become a procedural premise for upload pipeline work.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/remessa/upload_rules_base.py` | modified | Added `CATEGORICAL_COLS`, `get_complementary_col_names()`, updated `_read_csv` with `columns_to_load` + `header_columns` params (avoids double header read), updated `process_file` with `complementary_col_names` param and column-set computation (Opt-1 + Opt-3) |
| `domains/aquisicao/domain/upload_rules.py` | modified | Added `CATEGORICAL_COLS = ['tipo_produto', 'tipo_instrumento', 'cnpj_emissor', 'cnpj_fundo']` and `get_complementary_col_names()` override querying `ComplementaryTableColumnConfig` for `domain='aquisicao'` |
| `domains/liquidacao/domain/upload_rules.py` | modified | Added `CATEGORICAL_COLS = ['tipo_baixo']` (cnpj_fundo and movimento excluded as LIQ_KEYS) and `get_complementary_col_names()` override for `domain='liquidacao'` |
| `infrastructure/remessa/upload_service.py` | modified | Pre-fetches complementary cols at service boundary before `process_file`; Categorical cast placed after `_remessa_level_dedup` returns (spec placement bug fix) |
| `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` | modified | Added implementation status + inline correction notes for Opt-1 (double header read, `[]` claim) and Opt-3 (cast placement hazard) |

## Connections

- `derives-from` → `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` — this session implements Phase 2 of that spec
- `contextualizes` → `docs/vault/conversations/2026-03-31-1050-csv-upload-oom-root-cause.md` — root cause session that motivated the spec
- `contextualizes` → `docs/vault/conversations/2026-03-31-1130-remessa-upload-oom-diagnosis.md` — diagnosis session that produced Phase 1

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add Polars Categorical join hazard (local-encoding mismatch) to `development-practices-constitution.md` or a new premise node | Opt-3 placement bug discovery | HIGH | open |
| Write tests for `columns_to_load` / `complementary_col_names` params and repositioned Categorical cast | Opt-1 + Opt-3 implementation | HIGH | open |
| Opt-2 (keep dates as `pl.Date` through pipeline) not implemented — requires pre-implementation grep audit for string-literal date comparisons | spec Phase 2 | MEDIUM | open |
| `get_complementary_col_names()` issues one DB query per upload — memoize if batch upload scenarios emerge | Opt-1 implementation | LOW | open |

## Open Questions

- Step 5.5 of the spec (runtime verification on 1.2 GB upload after contract-phase fix) is still pending a staging deploy. Should this trigger a follow-up session node once confirmed?
