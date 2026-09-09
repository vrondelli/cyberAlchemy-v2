---
tags: [testing, acquisition, liquidation]
node_type: test
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T20:01:43-03:00
expires: 2026-05-17
conversation_id: 633c30d9-7b58-46ff-bc4d-25b62a998512
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Identified test coverage gaps in kit matching and liquidação upload rules, surfacing missing validations."
---

# Test Coverage Gaps — Kit Matching & Liquidação Upload Rules

**Date:** 2026-03-18 20:01 (UTC-3)
**Tags:** #testing #acquisition #liquidation

## Summary

This session analyzed test coverage gaps for recent uncommitted changes across the kit-matching feature (template-aware KitTypes, OR-logic evaluation, bulk import detail API) and liquidação upload rules (new column aliases, `_derive_columns` method). A structured coverage analysis was produced first, identifying 4 missing tests (M1–M4), 2 incomplete tests (I1–I2), and categorizing each by importance (6–9/10). Then 18 new tests were implemented across 3 test files, covering all identified gaps except M1 (Step 2c `_process_folder` integration), which was deferred due to the heavy-weight mocking infrastructure it would require. All 237 tests pass with zero regressions.

### Test Coverage Analysis

- **Problem/Goal:** Identify which uncommmitted code changes lack tests, using the `/test-uncommited-changes` workflow.
- **Decision:** Produced a structured artifact classifying gaps by importance and effort. Prioritized M2/M3/I1/I2 as quick wins and M4 as medium effort.
- **Changes:** Created `test_coverage_analysis.md` artifact with detailed gap breakdown.

### Liquidação Upload Rules Tests (M2, M3)

- **Problem/Goal:** `LiquidacaoUploadRules._derive_columns` and new FORMATTING_MAP aliases had zero test coverage.
- **Decision:** Added 6 unit tests for `_derive_columns` (derivation, no-overwrite, edge cases) and 5 E2E tests for partner-specific column aliases (`sacado_cnpj_cpf`, `tipo_liquidacao`, `data_baixa`, `id_parcela`, `id_titulo`).
- **Changes:** Two new test classes in `test_upload_tasks.py`: `TestLiquidacaoDeriveColumns` and `TestLiquidacaoFormattingMapAliases`.

### Kit Matching Edge Cases (I1)

- **Problem/Goal:** `evaluate_kit_completion` OR-logic had untested edge cases — first-wins semantics, duplicate doc_types, mixed specific+generic requirements.
- **Decision:** Added 3 tests documenting these behaviors as specification.
- **Changes:** Extended `TestEvaluateKitCompletion` in `test_kit_management.py`.

### Checklist Template Boundary (I2)

- **Problem/Goal:** Verify that checklist generation intentionally does NOT propagate `template_id` from kit `required_docs` to `DocumentChecklist` items.
- **Decision:** Added a boundary test to prevent accidental coupling.
- **Changes:** Added `test_template_id_not_propagated_to_checklist_items` in `test_checklist.py`.

### Bulk Import Detail Kit Fields (M4)

- **Problem/Goal:** `BulkImportDetailView` response included 3 new kit-related fields (`matched_kit_type_name`, `required_docs_count`, `documents_matched`) with no API tests.
- **Decision:** Added 3 tests covering matched kit, null kit, and response shape.
- **Changes:** Extended `TestBulkImportDetailAPI` in `test_bulk_import.py`.

Key outputs:
- `test_coverage_analysis.md` — structured gap analysis
- 18 new tests across 3 files

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/liquidacao/tests/test_upload_tasks.py` | 6 new in `TestLiquidacaoDeriveColumns`, 5 new in `TestLiquidacaoFormattingMapAliases` | Partner CSV variants with non-canonical column names must be correctly mapped during upload processing |
| `domains/aquisicao/tests/test_kit_management.py` | 3 new in `TestEvaluateKitCompletion` | Kit OR-logic must pick the first fully-satisfied kit; duplicate doc_types consume independently; template-specific reqs take priority |
| `domains/aquisicao/tests/test_checklist.py` | 1 new in `TestGenerateChecklistUseCase` | Checklist items carry only doc_type, not template_id — design boundary preventing accidental coupling |
| `domains/aquisicao/tests/test_bulk_import.py` | 3 new in `TestBulkImportDetailAPI` | Kit matching results must appear in bulk import detail API response for frontend display |

**Why these tests matter:** Without the liquidação alias tests, partner CSVs with alternate column names would silently drop data during upload. Without the kit matching edge case tests, the OR-logic semantics are undefined and could regress. Without the API field tests, frontend regressions from serialization changes would go undetected.

## Key Decisions

- **M1 deferred:** Step 2c `_process_folder` integration test requires mocking GCS, OCR extraction, and the full pipeline. The domain function is well-tested (10 tests), reducing the risk. To be addressed when E2E test infrastructure is improved.
- **Template_id boundary as test:** Rather than documenting the design choice that checklist items don't carry `template_id` only in comments, it's codified as a test that will break if someone adds the field unintentionally.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/liquidacao/tests/test_upload_tasks.py` | `modified` | Added `TestLiquidacaoDeriveColumns` (6 tests) and `TestLiquidacaoFormattingMapAliases` (5 tests) |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Added 3 edge-case tests to `TestEvaluateKitCompletion` |
| `domains/aquisicao/tests/test_checklist.py` | `modified` | Added `test_template_id_not_propagated_to_checklist_items` |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Added 3 M4 tests to `TestBulkImportDetailAPI` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Step 2c `_process_folder` integration test (M1) | Coverage analysis | ⚠️ HIGH | Deferred — needs E2E mocking infrastructure |

## Open Questions

- How to efficiently mock the full `_process_folder` pipeline (GCS upload → OCR extraction → kit evaluation) for M1 without making the test fragile.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/kittype-with-template-implementation.md]] | `validates` | Tests verify the kit-matching feature spec described here |
