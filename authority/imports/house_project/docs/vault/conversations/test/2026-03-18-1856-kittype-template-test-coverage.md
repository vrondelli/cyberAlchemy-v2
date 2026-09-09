---
tags: [testing, ccb, acquisition]
node_type: test
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T18:56:38-03:00
expires: 2026-05-17
conversation_id: 13eeccd9-0349-4bb2-a529-a808d4babb51
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Template-aware test coverage for KitType system, validating configuration-driven behavior."
---

# KitType Template-Aware Test Coverage

**Date:** 2026-03-18 18:56 (UTC-3)
**Tags:** #testing #ccb #acquisition

## Summary

This session analyzed the uncommitted changes for the template-aware KitType feature and implemented all missing tests to close coverage gaps. The analysis identified 7 categories of missing or incomplete tests across 3 test files, prioritized by business risk (financial impact of incorrect checklist generation, frontend→backend contract breakage, validation bypass). After the analysis, 18 new tests were implemented covering all identified gaps, bringing the total to 206 passing tests.

A contradiction was found and resolved during the session: `TestCreateKitFull.test_raises_if_active_config_exists` asserted that creating a second kit for the same (tipo_produto, emissor) pair should raise a `ValueError`. The actual business rule allows multiple active kits per pair (a contract can require multiple document kits). The test was corrected by the user to `test_allows_multiple_active_kits_for_same_pair`, and the corresponding API test was updated from expecting 400 to expecting 201.

### Test Coverage Analysis

- **Problem/Goal:** The `/test-uncommited-changes` workflow was invoked to identify gaps in test coverage for the template-aware KitType changes (11 modified files).
- **Decision:** Categorized 7 gap areas by priority: HIGH (checklist generation with new format), MEDIUM (create_kit_full, API endpoints, _validate_required_docs), LOW (edge cases in templates-by-doc-type and kit config response content).
- **Changes:** Created `test_coverage_analysis.md` artifact documenting all findings with business context and risk assessment.

### Test Implementation

- **Problem/Goal:** Implement the 18 tests identified as missing.
- **Decision:** Added tests directly to existing test files rather than creating new test modules, to maintain co-location with related tests.
- **Changes:** Added tests to `test_checklist.py` (3 tests for dual-format handling), `test_kit_management.py` (12 tests for `_validate_required_docs`, templates-by-doc-type edge cases, kit config response content), and `test_bulk_import.py` (5 tests for `create_kit_full` and API with `list[dict]` format).

### Multiple Active Kits Correction

- **Problem/Goal:** The test `test_raises_if_active_config_exists` incorrectly assumed that only one active kit could exist per (tipo_produto, emissor) pair.
- **Decision:** The user corrected this to allow multiple active kits, reflecting the actual business rule that a contract may need multiple document kits.
- **Changes:** User renamed test to `test_allows_multiple_active_kits_for_same_pair` and updated API test from 400→201.

Key outputs:
- `domains/aquisicao/tests/test_checklist.py` — 3 new tests for `generate_checklist` dual-format handling
- `domains/aquisicao/tests/test_kit_management.py` — 12 new tests for validation, edge cases, and response content
- `domains/aquisicao/tests/test_bulk_import.py` — 5 new tests for `create_kit_full` and API with `list[dict]`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_checklist.py` | `test_creates_items_from_dict_format_required_docs`, `test_skips_empty_doc_type_in_dict_format`, `test_handles_legacy_list_str_stored_in_db` | Checklist generation correctly processes both legacy `list[str]` and new `list[dict]` required_docs formats — contracts must never appear falsely complete |
| `domains/aquisicao/tests/test_kit_management.py` | `TestValidateRequiredDocs` (7 tests), `test_empty_name_uses_fallback`, `test_multiple_templates_same_doc_type`, `TestKitConfigRequiredDocsContent` (2 tests) | Doc type validation against `SUPPORTED_DOC_TYPES`, template FK validation, template/doc_type consistency, API response content correctness |
| `domains/aquisicao/tests/test_bulk_import.py` | `test_creates_with_dict_format_required_docs`, `test_creates_with_template_id_in_dict_format`, `test_kit_full_with_dict_format_returns_201`, `test_kit_full_with_template_id_returns_201`, `test_kit_full_with_invalid_template_id_returns_400`, `test_allows_multiple_active_kits_for_same_pair`, `test_kit_full_allows_multiple_kits_returns_201` | Kit creation endpoint accepts the new `list[dict]` format (matches frontend payload), invalid template_ids are rejected at HTTP layer, multiple active kits per pair are allowed |

**Why these tests matter:** The `generate_checklist` function determines which documents a contract is missing — if it silently skips items due to format issues, contracts appear complete when they're not, creating direct financial risk. The API tests for `list[dict]` verify the actual frontend→backend contract that the Cadastros UI relies on for kit creation.

## Key Decisions

- **Direct `_validate_required_docs` tests:** Tested the private validation function directly (not just through `create_kit_type`) to isolate and verify each validation constraint independently.
- **Legacy DB simulation:** Used `KitType.objects.create()` to bypass `normalize_required_docs` and simulate pre-migration rows still stored as `list[str]` in the database.
- **Empty string fallback for template names:** The `DocumentTemplate.name` column has a NOT NULL constraint at DB level, so the null-name fallback test uses `name=''` to exercise the `name or fallback` logic.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_checklist.py` | `modified` | Added 3 tests for `generate_checklist` with `list[dict]`, empty doc_type skip, and legacy format |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Added `TestValidateRequiredDocs` (7 tests), 2 templates-by-doc-type edge cases, `TestKitConfigRequiredDocsContent` (2 tests) |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Added 5 tests for `create_kit_full`/API with `list[dict]`; user corrected active config exists test |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/kittype-with-template-implementation.md]] | `validates` | Tests validate the template-aware KitType implementation described in the spec |
