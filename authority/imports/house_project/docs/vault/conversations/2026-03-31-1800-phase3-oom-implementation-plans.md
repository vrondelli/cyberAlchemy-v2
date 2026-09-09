---
tags: [remessa, oom, memory-optimization, polars, celery, upload-pipeline, dedup, chunking, column-projection, gc]
node_type: implementation-plan
is_session: true
layer: cross-cutting
nature: analytical
status: active
created: 2026-03-31
timestamp: 2026-03-31T18:00:00-03:00
expires: 2026-05-30
conversation_id: phase3-oom-opt-plans-2026-03-31
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md
promoted_candidates:
  - "Upload pipeline tasks should always pass explicit column whitelists to StageRemessaService to avoid loading unused columns into worker memory."
  - "Memory trim (gc.collect + malloc_trim) must be called at phase boundaries in any long-running Celery task that processes large DataFrames."
expected_importance: 6
importance_rationale: "The session produced a complete, concrete implementation plan that closes the remaining OOM mitigation gaps in the remessa upload pipeline and surfaced a previously undocumented spec drift in Opt-2."
---

# Phase 3 — OOM Mitigation: Implementation Plans for Remaining Optimizations

**Date:** 2026-03-31
**Tags:** #remessa #oom #memory-optimization #polars #celery #upload-pipeline #dedup #chunking #column-projection #gc

## Summary

This session had two phases. The first was a gap analysis of the spec `2026-03-31-003-remessa-upload-oom-fix.md` to identify which of the recently-added optimization items had been implemented versus remained pending. The second phase was writing detailed, TDD-style implementation plans for each of the five pending optimizations (Opt-2, Opt-E1, Opt-E2, Opt-E3, Opt-E4) and appending them to the same spec as "Phase 3 — Detailed Implementation Plans."

### Phase 1 — Gap analysis

Reading the full spec and current code confirmed: Tasks 1–6 done, Opt-1 (read fewer columns) done, Opt-3 (Categorical casting) done. Five items remained:

**Opt-2 (partial):** Dates are `pl.Date` in the pipeline (`upload_rules_base.py` lines 303–306, no `strftime` back-conversion). However, both dedup queries still call `.isoformat()` on `datetime.date` values returned by Django ORM:
- `aquisicao/use_cases/upload.py:55`
- `liquidacao/use_cases/upload.py:36`

This produces `str` tuples that the cast loop in `upload_service.py:215–219` silently reconciles on every upload. The pipeline is not broken — but it performs unnecessary type-cast work. This was spec drift: Opt-2 was marked complete in intent but was only partially applied.

**Opt-E1 through Opt-E4:** None implemented. Specific gaps confirmed:
- `stage_remessa_service.py:219` still uses `partition_by(identity_keys, as_dict=True)` for contracts — holds all N sub-DataFrames in memory simultaneously.
- No `gc.collect` or `malloc_trim` calls at any phase boundary in either `stage_remessa_service.py` or `upload_service.py`.
- `REMESSA_STAGING_CHUNK_SIZE` is missing from `settings.py`; the service falls back to `getattr(..., 1000)` but the env var is never declared.
- No per-phase column projection before the staging or contracts loops.

### Phase 2 — Implementation plans written

All five plans were appended to the spec. Each plan follows the TDD structure: failing test → exact code change with before/after → verify green.

**Opt-2 — Remove `.isoformat()` from dedup queries:**
Remove the `.isoformat()` branch from the normalisation loops in both `_aquisicao_dedup_query` and `_liquidacao_dedup_query`. `datetime.date` objects pass through directly. The cast loop in `upload_service.py` already handles type alignment (`pl.Date` vs `pl.Utf8`) and will simply find no mismatch. A pre-implementation audit grep is required to catch any string literal date comparisons in the codebase.

**Opt-E4 — Lower chunk size defaults:**
Add `REMESSA_STAGING_CHUNK_SIZE = int(os.getenv("REMESSA_STAGING_CHUNK_SIZE", "500"))` to `settings.py` directly above the existing `REMESSA_CONTRACT_CHUNK_SIZE`. Lower both defaults to 500. Zero logic change — purely settings. The service already reads both via `getattr`.

**Opt-E2 — Per-phase column projection:**
Add `staging_col_whitelist: Optional[List[str]]` and `contract_col_whitelist: Optional[List[str]]` optional params to `StageRemessaService.__init__`. A `_project()` helper inside `stage()` applies projection before each loop, always preserving Object-dtype columns regardless of the whitelist (needed for `_complementary_data` in the staging builder). The caller (Celery task) supplies explicit column lists via `_AQUISICAO_STAGING_COLS` and `_AQUISICAO_CONTRACT_COLS` constants defined in `celery_tasks.py`. Identity keys must always be included by the caller. Liquidação does not use contracts — its `contract_col_whitelist` stays `None`.

**Opt-E1 — Single-pass aggregate for contracts (no `partition_by`):**
A new optional `contract_instance_builder_fn(row_dict, ...) → single ContratoCCB` parameter is added to `StageRemessaService`. The legacy `contract_builder_fn` path is kept for backward compatibility. When `contract_instance_builder_fn` is set, the service pre-aggregates via `group_by(identity_keys + ['numero_titulo'])` once on the projected DataFrame, then iterates `iter_rows(named=True)` — no `partition_by` dict, no simultaneous sub-DataFrames. A new `_build_single_aquisicao_contract(row_dict, ...)` function is added in `celery_tasks.py` alongside (not replacing) the existing `_build_aquisicao_contracts`. Key design consideration: `group_by` keys must be deduplicated via `dict.fromkeys` since `identity_keys` for Aquisição already includes `cnpj_fundo` and `data_aquisicao`.

**Opt-E3 — Phase boundary memory cleanup:**
A module-level `_trim_memory()` helper (`gc.collect()` + Linux-only `ctypes.CDLL('libc.so.6').malloc_trim(0)`, silently skipped on other platforms) is added to both `stage_remessa_service.py` and `upload_service.py`. Called at 4 boundaries: after staging loop complete, after contracts loop complete (in stage service), and after `del unique_df` and `del csv_df` (in upload service).

### Key design decisions

1. **Opt-E1 uses additive interface, not a breaking change.** The existing `contract_builder_fn` path is preserved as a legacy branch. This avoids breaking any future domain that wires up `StageRemessaService` with the old interface.

2. **Opt-E2 projection always preserves Object-dtype columns.** The `_project()` helper auto-appends any Object-dtype columns not in the whitelist. This is essential because `_build_complementary_data()` in the staging builder checks `row.get('_complementary_data')` first — if this Object column is projected away, the builder falls back to a DB query per row (N+1 problem at 3M rows).

3. **Opt-2 is safe because the cast loop already handles it.** Removing `.isoformat()` does not require changing any downstream code. The `pl.Date` vs `datetime.date` alignment is already handled by the cast loop.

4. **Opt-E3 on macOS is a no-op for `malloc_trim`.** The `try/except` guard ensures this never raises on darwin. The `gc.collect()` part is always active and still recovers Python-managed memory.

## Epistemic Impact

**Spec drift discovered:** Opt-2 was effectively implemented at the pipeline level (`pl.Date` dtype used throughout) but not completed in the dedup query normalisation. The spec listed it as "not yet implemented" without explicitly calling out this partial state. This session made the gap explicit and provided the precise fix.

**Belief confirmed:** The Polars allocator behavior (never returns freed pages to OS) documented in project memory `project_polars_allocator.md` is the theoretical foundation for Opt-E3. This session affirms that a `malloc_trim` call at phase boundaries is the correct remedy — not just a workaround.

**Promoted candidates (see frontmatter):**
1. Explicit column whitelists for `StageRemessaService` should become a general premise for any large-file processing pipeline — not just remessa uploads.
2. `_trim_memory()` at phase boundaries should become a codified engineering pattern for all long-running Celery tasks that process multi-GB DataFrames.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` | modified | Appended Phase 3 — detailed TDD implementation plans for Opt-2, Opt-E4, Opt-E2, Opt-E1, Opt-E3 including failing tests, exact code changes, and interface design decisions |

## Connections

- `validates` → `project_polars_allocator.md` (memory) — Opt-E3 design confirms that Polars freed pages require explicit `malloc_trim`; consistent with the allocator premise recorded in memory.
- `derives-from` → `specs/003-remessa-upload-with-events/2026-03-31-003-remessa-upload-oom-fix.md` — Phase 3 plans extend the same spec document.

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Opt-2: remove `.isoformat()` from dedup loops in both domains | HIGH | Plan written; not implemented |
| Opt-E4: add `REMESSA_STAGING_CHUNK_SIZE` to `settings.py`, lower both chunk defaults to 500 | HIGH | Plan written; not implemented |
| Opt-E2: add `staging_col_whitelist` / `contract_col_whitelist` to `StageRemessaService` | HIGH | Plan written; not implemented |
| Opt-E1: replace `partition_by(as_dict=True)` with `group_by + iter_rows`, add `contract_instance_builder_fn` | HIGH | Plan written; not implemented |
| Opt-E3: add `_trim_memory()` and call at 4 phase boundaries | MEDIUM | Plan written; not implemented |
| Promote column-whitelist and malloc_trim patterns to premise nodes | LOW | Identified as candidates; not yet promoted |

## Open Questions

- After Opt-E4 lowers chunk sizes to 500, monitor DB insert throughput on staging with the 1.2 GB benchmark CSV. If total upload time increases beyond acceptable threshold, tune per environment via env vars rather than reverting the default.
- The `contract_instance_builder_fn` interface change requires confirming `ContratoCCB` field names against the actual model before implementation — the plan is derived from `_build_aquisicao_contracts` but the model may have been updated since.
