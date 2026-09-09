---
tags: [pipeline, acquisition]
node_type: test
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T18:12:30-03:00
expires: 2026-05-20
conversation_id: e7ffbb4c-d664-468a-b856-37cbb8b93d1b
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-21

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Routine test-isolation fix — migration 0041 seed data contaminated 12 tests across 3 files; resolved with autouse cleanup fixtures and a PyMuPDF mock."
user_satisfaction:
  mean: 7
  min: 5
  max: 9
  std: 1.5
---

# Test Isolation: Seed Data Contamination Fix

**Date:** 2026-03-21 18:12 (UTC-3)
**Tags:** #pipeline #acquisition

## Summary

This session diagnosed and fixed 12 failing tests across 3 test files in the `domains/aquisicao` module. All failures traced back to two root causes: (1) migration `0041_auto_20260321_1629` seeds a "CCB Capital Consig (Seed)" `DocumentTemplate` row that persists across test runs, breaking assertions that assume an empty table; (2) `_compute_fingerprint` in the pipeline now opens PDFs with PyMuPDF, which crashes on the fake PDF bytes used in one test. The fix was minimal and localized — autouse fixtures to clean the `DocumentTemplate` table before each test, plus a targeted mock for PyMuPDF.

### Seed Data Contamination (11 tests)
- **Problem/Goal:** Migration 0041 inserts a "CCB Capital Consig (Seed)" template into the `document_template` table. Tests in `test_document_template.py` and `test_kit_management.py` assume an empty table (e.g., `assert list_templates().count() == 0`), causing count mismatches, wrong ordering, and incorrect template matching.
- **Decision:** Use `autouse=True` pytest fixtures that call `DocumentTemplate.objects.all().delete()` before each test, rather than modifying the migration or the test assertions.
- **Changes:** Added module-level `clean_templates` fixture to `test_document_template.py` and class-level fixture to `TestTemplatesByDocTypeAPI` in `test_kit_management.py`.

### PyMuPDF on Fake PDF Bytes (1 test)
- **Problem/Goal:** `test_no_templates_registered_gives_no_template` calls `_process_folder` without mocking `_compute_fingerprint`. The pipeline now calls `fitz.open()` on the test's fake PDF bytes (`b'%PDF-1.4\nBT\n(CCB-123456)\nET\n'`), which are not a valid PDF, causing `pymupdf.FileDataError`.
- **Decision:** Mock `_compute_fingerprint` to return `FAKE_FINGERPRINT`, consistent with the pattern used in all other pipeline tests. Also added inline `DocumentTemplate.objects.all().delete()` to ensure the seed template doesn't make the "no templates" assertion fail.
- **Changes:** Added `_compute_fingerprint` mock and seed cleanup to `test_no_templates_registered_gives_no_template` in `test_parallel_bulk_import.py`.

Key outputs:
- All 12 tests now pass (verified: 75 passed, 0 failed)

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_document_template.py` | All tests (autouse fixture) | Template registration, listing, filtering, and matching operate correctly on a clean table |
| `domains/aquisicao/tests/test_kit_management.py` | `TestTemplatesByDocTypeAPI` (autouse fixture) | Templates-by-doc-type API returns correct groupings without seed data noise |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_no_templates_registered_gives_no_template` | Pipeline correctly identifies "no template" reason when no templates exist |

**Why these tests matter:** These tests validate core document template management and pipeline classification. Without proper isolation, seed data from migrations makes tests pass or fail based on deployment state rather than logic correctness — masking real regressions.

## Key Decisions

- **Cleanup over migration change:** Chose to add cleanup fixtures rather than modifying migration 0041 or marking it as non-test-safe, because seed data is legitimate for production and other tests may depend on it.
- **Inline cleanup for single test:** Used inline `DocumentTemplate.objects.all().delete()` in `test_parallel_bulk_import.py` rather than a class-wide fixture, since only one test in the class was affected.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_document_template.py` | `modified` | Added module-level `clean_templates` autouse fixture to delete all `DocumentTemplate` rows before each test |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Added class-level `clean_templates` autouse fixture to `TestTemplatesByDocTypeAPI` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Added seed cleanup + `_compute_fingerprint` mock to `test_no_templates_registered_gives_no_template` |
