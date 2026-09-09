---
tags: [testing, models, ccb]
node_type: spec
layer: application
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T16:01:00-03:00
expires: 2026-05-16
conversation_id: 3cf414f0-dbec-4b0f-afdd-693ad7b3156a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]
promoted_candidates: []
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 4
importance_rationale: "Analyzed test coverage and fixed contract builder bug, moderate debugging session."
---

# Test Coverage Analysis & Contract Builder Bug Fix

**Date:** 2026-03-17 16:01 (UTC-3)
**Tags:** #testing #models #ccb

## Summary

This session analyzed the uncommitted changes in the codebase to identify test coverage gaps
for the complementary table feature. The analysis discovered that several critical and
high-priority tests were already implemented in previous sessions (approve_remessa field
propagation, `_derive_columns`, `_detect_separator`, checklist after emissor rename). The
remaining gaps were filled with 8 new tests across 4 files. Two bugs were found and fixed:
a duplicate `cnpj_emissor` entry in `AQUISICAO_EXPORT_FIELDS`, and a silent data loss bug
in `_build_aquisicao_contracts` where `cnpj_emissor` and `tipo_instrumento` were dropped
during a Polars `group_by` aggregation. All 1371 tests pass.

### Duplicate cnpj_emissor in Export Fields
- **Problem/Goal:** `AQUISICAO_EXPORT_FIELDS` in `remessa_fields.py` contained `cnpj_emissor` twice, which would cause export CSVs to include the column twice.
- **Decision:** Remove the duplicate and add a no-duplicates regression test.
- **Changes:** Removed duplicate entry in `remessa_fields.py`; added `test_export_fields_have_no_duplicates` in `test_sprint2_models.py`.

### ContratoCCB Builder Data Loss
- **Problem/Goal:** `_build_aquisicao_contracts` in `celery_tasks.py` uses Polars `group_by().agg()` to aggregate installments into contracts. The `cnpj_emissor` and `tipo_instrumento` columns were not included in the aggregation, so they were silently dropped — `row.get('cnpj_emissor')` always returned `None`. This would cause `generate_checklist_for_contrato` to fail.
- **Decision:** Add `pl.col('cnpj_emissor').first()` and `pl.col('tipo_instrumento').first()` to the `agg()` call, with a guard for columns that may not exist in the DataFrame.
- **Changes:** Fixed `celery_tasks.py`; added `TestBuildAquisicaoContracts` (2 tests) in `test_upload_tasks.py`.

### apply_complementary_validation Wrapper Tests
- **Problem/Goal:** The `apply_complementary_validation` wrapper function (which produces the `_complementary_data` column) had no integration tests.
- **Decision:** Add 4 test methods covering: populated column, no-configs case, missing mandatory column, and original column preservation.
- **Changes:** Added `TestApplyComplementaryValidation` class in `test_validate_complementary_columns.py`.

### E2E Staging Complementary Column Assertions
- **Problem/Goal:** The E2E upload tests did not assert the new complementary table fields on staging rows (`tipo_instrumento` FK, `data_emissao`, `parcela_contagem_total`, `parcela_posicao_atual`).
- **Decision:** Add a dedicated E2E test method that asserts all complementary columns after a full pipeline run.
- **Changes:** Added `test_staging_complementary_columns_populated` in `test_upload_e2e.py`.

Key outputs:
- `test_upload_tasks.py` — 2 new tests for `_build_aquisicao_contracts`
- `test_validate_complementary_columns.py` — 4 new tests for `apply_complementary_validation`
- `test_upload_e2e.py` — 1 new E2E test for complementary staging columns
- `test_sprint2_models.py` — 1 regression guard for export field duplicates

## Key Decisions

- **ContratoCCB per-contract attributes:** `cnpj_emissor` and `tipo_instrumento` are per-contract (not per-parcela) attributes. They are identical across all rows in a contract group, so `.first()` in the aggregation is the correct approach.
- **Defensive column check:** The fix uses `if col in rows_df.columns` before adding to the agg, so older CSVs without these columns still work.
- **Remessa does not need emissor:** `RemessaAquisicaoId` operates at a higher level (fund + date + cessao) and does not need `cnpj_emissor` or `tipo_instrumento`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/remessa/remessa_fields.py` | `modified` | Removed duplicate `cnpj_emissor` from `AQUISICAO_EXPORT_FIELDS` |
| `domains/aquisicao/tasks/celery_tasks.py` | `modified` | Added `cnpj_emissor.first()` and `tipo_instrumento.first()` to `_build_aquisicao_contracts` group_by aggregation |
| `domains/aquisicao/tests/test_upload_tasks.py` | `modified` | Added `TestBuildAquisicaoContracts` class (2 tests: aggregation correctness + cnpj_emissor propagation) |
| `domains/aquisicao/tests/test_validate_complementary_columns.py` | `modified` | Added `TestApplyComplementaryValidation` class (4 tests) |
| `domains/aquisicao/tests/test_upload_e2e.py` | `modified` | Added `test_staging_complementary_columns_populated` E2E test |
| `infrastructure/tests/test_sprint2_models.py` | `modified` | Added `test_export_fields_have_no_duplicates` regression guard |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md` | `modified` | Updated Test Implementation Status with new tests, added Bug Fixes section |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `BaseUploadRules.OPTIONAL_COLS` base class tests | Test coverage analysis | LOW | Functionally covered via `test_upload_tasks.py` |
| Full integration: registry validation → stage rejection | Test coverage analysis | MEDIUM | Planned |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/conversations/2026-03-17-1529-fixing-upload-schema-e2e-tests.md]] | `derives-from` | E2E test patterns established in that session were extended here |
| [[vault/conversations/2026-03-17-1218-complementary-table-tests-and-validation.md]] | `derives-from` | Complementary validation tests started there, wrapper tests added here |
| [[vault/conversations/2026-03-17-0130-complementary-table-detailed-implementation-plan.md]] | `updates` | Implementation plan updated with bug fixes and new test status |
