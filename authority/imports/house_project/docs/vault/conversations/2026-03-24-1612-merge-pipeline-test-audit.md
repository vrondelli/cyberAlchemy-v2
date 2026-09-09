---
tags: [pipeline, ccb, acquisition]
node_type: test
is_session: true
layer: domain
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:12:20-03:00
expires: 2026-05-23
conversation_id: dfcde6e5-fdd5-4a06-abb5-e92be2dd10f6
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/document-merge-implementation.md]
promoted_candidates: []
expected_importance: 3
importance_rationale: "Hardened the Identificação merge pipeline against crash scenarios (corrupt files, GCS failures) and remediated fragile test infrastructure — localized resilience improvement, no architectural impact."
version: 0.1.0
last_updated: 2026-03-24
---

# Test Audit & Hardening — Document Merge Pipeline

**Date:** 2026-03-24 16:12 (UTC-3)
**Tags:** #pipeline #ccb #acquisition

## Summary

This session performed a comprehensive QA audit of the uncommitted changes to the `_step_merge_identificacao` function in the bulk import pipeline, then implemented all remediation recommendations. The session started by inspecting uncommitted changes (production + test code), running the full test suite to validate the existing state (241 passed), then executed the `/test-uncommited-changes` workflow to produce a structured test audit artifact.

The audit identified 2 important missing tests, 3 incomplete test assertions, and 4 fragile tests relying on a `fitz.open` global MagicMock pattern that had diverged from the refactored production code. All 8 findings were remediated in a single batch of edits, bringing the test count from 241 to 243 with all passing. Additionally, 9 scratch debugging scripts were cleaned from the project root.

### Scratch Script Cleanup
- **Problem/Goal:** Untracked debugging scripts (`check_1_5.py`, `check_api.py`, `check_db.py`, etc.) cluttering the project root.
- **Decision:** Delete all 9 scripts before proceeding with the audit.
- **Changes:** `rm check_1_5.py check_api.py check_db.py check_first.py check_multi.py diag.py get_kits.py test_eval.py test_kit.py`

### Test Audit — Gap Analysis
- **Problem/Goal:** Assess whether the uncommitted merge hardening changes have adequate test coverage.
- **Decision:** Classified 8 findings across 4 categories: missing tests (2), incomplete assertions (3), fragile mocks (4), with zero critical gaps.
- **Changes:** Created `test-audit-merge-hardening.md` artifact with structured audit tables.

### Test Remediation — Fragile Mock Refactoring
- **Problem/Goal:** 4 tests (`test_merges_multiple`, `test_mixed_types`, `test_no_merge_needed`, `test_does_not_merge_non_identificacao`) patched `fitz.open` globally with MagicMock, bypassing real merge logic and producing vacuous assertions.
- **Decision:** Replace all 4 with real `fitz` PDFs and behavioral assertions (checking for `_merged.pdf` in upload calls instead of asserting on mock internals).
- **Changes:** Rewrote each test to create real PDFs via `fitz.open()`, use filename-based `mock_download` side effects, and assert on observable behavior.

### Test Remediation — Assertion Strengthening
- **Problem/Goal:** `test_all_corrupt` had a tautological `final_name` assertion; `test_gcs_upload_failure` only checked `original_name` but not `gcs_path` or `file_size`.
- **Decision:** Replace weak assertions with exact equality checks on all survivor fields.
- **Changes:** `assert survivor.final_name == 'RG-1.pdf'`, added `gcs_path` and `file_size` checks to upload failure test.

### New Tests — Coverage Gaps
- **Problem/Goal:** No test validated old GCS object cleanup after successful merge, or `classified_files` dict mutation correctness.
- **Decision:** Add both as integration tests in `TestDocumentMerge`.
- **Changes:** `test_merge_success_deletes_old_survivor_gcs_object` (validates `delete_object` calls), `test_merge_updates_classified_files_dict_correctly` (unit-tests `_step_merge_identificacao` directly).

Key outputs:
- `test-audit-merge-hardening.md` — structured QA audit artifact
- 2 new tests + 4 refactored tests + 2 fixed assertions in `test_parallel_bulk_import.py`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merges_multiple_identificacao_files` (refactored) | Multiple ID documents merge into one PDF without crashing the pipeline |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merge_handles_mixed_types` (refactored) | PDF + image files merge correctly with exception tolerance |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_no_merge_needed` (refactored) | Single-document folders skip merge logic entirely |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_does_not_merge_non_identificacao` (refactored) | Non-Identificacao doc types never trigger merge |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merge_handles_all_corrupt_files_cleanly` (fixed) | All-corrupt files abort physical merge, preserve survivor |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merge_handles_gcs_upload_failure` (strengthened) | GCS upload failure reverts all survivor fields |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_merge_success_deletes_old_survivor_gcs_object` (new) | Old GCS objects are cleaned up after successful merge |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_merge_updates_classified_files_dict_correctly` (new) | In-memory dict mutation is correct for downstream extraction |

**Why these tests matter:** The Identificação merge step runs before field extraction and CCB cross-checking. If the survivor's bytes, GCS path, or dict entry are wrong, Gemini extracts from stale data, contrato matching fails silently, and operators see incorrect document names in the review UI — all without any visible error.

## Key Decisions

- **Refactor over rewrite:** Kept the existing test structure but replaced the mocking strategy (MagicMock → real `fitz` PDFs) to maintain code review continuity.
- **Behavioral assertions over implementation assertions:** Replaced `mock.insert_pdf.assert_not_called()` (tests implementation) with `assert not any('_merged.pdf' in c for c in upload_calls)` (tests behavior).
- **Direct unit test for dict mutation:** `test_merge_updates_classified_files_dict_correctly` calls `_step_merge_identificacao` directly rather than going through `_process_folder`, because the dict mutation is an internal contract not observable through DB queries alone.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | 4 tests refactored (real fitz PDFs), 2 assertions strengthened, 2 new tests added |
| `check_1_5.py`, `check_api.py`, `check_db.py`, `check_first.py`, `check_multi.py`, `diag.py`, `get_kits.py`, `test_eval.py`, `test_kit.py` | `deleted` | Scratch debugging scripts |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `modified` | Test plan section updated (pre-existing uncommitted change) |
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `modified` | Structural edits (pre-existing uncommitted change) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `validates` | Tests validate all 10 scenarios listed in the spec's Test Plan section |
