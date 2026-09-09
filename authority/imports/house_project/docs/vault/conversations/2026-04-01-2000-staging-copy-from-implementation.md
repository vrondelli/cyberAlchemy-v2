---
tags: [infrastructure, pipeline, acquisition, liquidation, application]
node_type: spec
is_session: true
layer: application, domain
nature: technical
status: active
created: 2026-04-01
timestamp: 2026-04-01T20:00:00-03:00
expires: 2026-05-31
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Implemented COPY FROM STDIN for 3.3M-row staging pipeline, introducing a new repository pattern and ~90x theoretical speedup gated behind a feature flag."
---

# Implementation: Replace ORM bulk_create with PostgreSQL COPY FROM

**Date:** 2026-04-01 20:00 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition #liquidation #application

## Summary

This session implemented the PostgreSQL `COPY FROM STDIN` optimization for the remessa upload staging pipeline, replacing the ORM `bulk_create` loop that processes 3.3M rows in ~45 minutes. The implementation followed a pre-existing, fully reviewed plan (`2026-04-01-staging-copy-from-plan.md` v1.3.0) and is gated behind a `USE_COPY_STAGING` feature flag for safe rollout.

### Vectorized Hash Computation

The core challenge was replicating the Python-only `compute_entity_hash()` — SHA-256 on pipe-separated normalized fields — entirely in Polars expressions. The `polars_normalize()` function was added to `entity_identity.py`, accepting both column names and `pl.Expr` objects (needed for the sacado coalesce). A `map_batches` fallback was used exclusively for `Decimal` columns because Polars' `Decimal.cast(Utf8)` preserves scale (e.g., `"1000000.00"`) while Python's `format(Decimal.normalize(), "f")` strips trailing zeros (`"1000000"`). All other types (Date, Datetime, Utf8) use pure Polars expressions with zero Python iteration. Hash compatibility was verified across 5 dedicated tests covering strings, dates, decimals, the aquisição sacado coalesce pattern, and the liquidação pattern with decimal `valor_pagamento`.

### DataFrame Builders per Domain

`prepare_aquisicao_staging_df()` and `prepare_liquidacao_staging_df()` were added to each domain's `upload_stager.py`. These functions take the `clean_df`, join it with a small remessa DataFrame to resolve FKs, compute hashes and complementary JSON via Polars expressions, add constant columns (`status`, `filter_result`, timestamps), cast decimals to Utf8 for CSV, and select/rename columns to match exact DB column names. A key ordering subtlety was discovered during implementation: decimal-to-Utf8 casts must happen **after** the `with_columns` call that computes hashes, because the hash expressions reference the original Decimal-typed columns. Placing them before causes a `round can only be used on numeric types` error since the columns would already be Utf8 when the lazy hash expression is evaluated.

### Repository COPY Functions

`bulk_copy_staging()` was added as a standalone module-level function (not a class method) in each domain's `repositories.py`, per the architecture constitution. The function chunks the DataFrame at 500K rows, writes each chunk to a CSV `BytesIO` buffer with `\N` as the NULL sentinel, and sends it via `cursor.copy_expert()`. The `\N` sentinel was chosen over empty string to avoid silently converting legitimate empty strings to NULL in NOT NULL columns.

### Service Integration

`StageRemessaService.__init__` received two new optional parameters (`staging_df_builder_fn`, `staging_copy_fn`). The `stage()` method uses a triple-check (`USE_COPY_STAGING` flag + both functions present) to decide between COPY and ORM paths, ensuring incremental per-domain rollout and instant rollback.

### Testing

23 new tests were added across 3 new test files plus 5 tests added to the existing `test_entity_identity.py`. Tests cover hash compatibility (byte-identical between Python and Polars paths), sacado coalesce edge cases, DataFrame column correctness, COPY-to-DB field value matching, NULL decimal handling, feature flag toggling, and fallback to ORM when builder is `None`. All 1949 existing tests continue to pass.

## Epistemic Impact

- The plan `2026-04-01-staging-copy-from-plan.md` v1.3.0 was fully validated by execution — every prescribed step was implemented without deviation. The plan can be considered `consolidated` as a historical record.
- The `polars_normalize` + `batch_sha256` approach confirmed that vectorized hash computation is viable for this pipeline, consistent with the existing memory note about avoiding `map_elements`.
- No beliefs were challenged — the implementation matched expectations from the discovery and plan phases.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `house_project/settings.py` | modified | Added `USE_COPY_STAGING` feature flag |
| `infrastructure/entity_identity.py` | modified | Added `polars_normalize()` and `batch_sha256()` for vectorized hash computation |
| `infrastructure/remessa/stage_remessa_service.py` | modified | Added COPY/ORM conditional path and two new `__init__` params |
| `domains/aquisicao/tasks/upload_stager.py` | modified | Added `prepare_aquisicao_staging_df()`, wired to stager |
| `domains/liquidacao/tasks/upload_stager.py` | modified | Added `prepare_liquidacao_staging_df()`, wired to stager |
| `domains/aquisicao/repositories/repositories.py` | modified | Added `bulk_copy_staging()` with chunked COPY |
| `domains/liquidacao/repositories/repositories.py` | modified | Added `bulk_copy_staging()` with chunked COPY |
| `infrastructure/tests/test_entity_identity.py` | modified | 5 new hash compatibility tests |
| `domains/aquisicao/tests/test_upload_stager_copy.py` | created | 7 tests for aquisição COPY path |
| `domains/liquidacao/tests/test_upload_stager_copy.py` | created | 6 tests for liquidação COPY path |
| `infrastructure/tests/test_stage_remessa_copy.py` | created | 5 integration tests for full `stage()` via COPY |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[2026-04-01-staging-copy-from-plan]] | `derives-from` | Implementation plan that this session executed |
| [[2026-04-01-staging-copy-from-discovery]] | `derives-from` | Discovery that mapped the constraints and feasibility |
| [[development-practices-constitution]] | `constrained-by` | Repository Isolation, Deterministic Pipelines |
| [[folder-structure-constitution]] | `constrained-by` | Layer purity — persistence via repositories only |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Remove `USE_COPY_STAGING` flag after production validation | Implementation | LOW | Open |
| Document `bulk_copy_staging` as a canonical repository pattern | Architecture | MEDIUM | Open |
| Post-deploy benchmark at 3.3M rows to validate ~30s target | Operations | HIGH | Open |
