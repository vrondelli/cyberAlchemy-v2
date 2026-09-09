---
tags: [ccb, pipeline, identificacao]
node_type: test
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T18:15:00-03:00
expires: 2026-05-23
conversation_id: eceabd13-c5ca-456c-84b5-5869425ea0a3
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/document-merge-implementation.md"]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Added defensive edge cases to process_bulk_import physical merge and hardened the integration test suite for the bulk import pipeline."
---

# Document Merge Edge Cases & Test Hardening

**Date:** 2026-03-24 18:15 (UTC-3)
**Tags:** #ccb #pipeline #identificacao

## Summary

This session focused on hardening the newly implemented physical document merge pipeline for `Identificacao` documents against potential structural crashes. We identified that a folder filled entirely with corrupt bytes would result in a PyMuPDF object with `page_count == 0`, triggering a `ValueError: document empty` upon calling `write()`. 

To resolve this, we added an explicit defensive check in `_step_merge_identificacao` to gracefully abort the physical merge while retaining the survivor document in the database, preserving system uptime over perfect data capture in failure edge cases. We also wrapped the GCS upload logic in a `try/except` block to ensure mid-flight network errors do not crash the Celery worker task.

Finally, we translated these architectural edge cases into the test suite. We replaced fragile Mock-based tests with real PyMuPDF behavior using malformed byte strings and expanded the coverage to verify correct ID prefix generation and GCS upload failure resilience.

### Empty Document Crash Prevention
- **Problem/Goal:** PyMuPDF throws a `ValueError` if `write()` is called on a PDF with no pages (which occurs if all merged files failed `insert_pdf` due to corruption).
- **Decision:** Abort the physical merge if `page_count == 0` and keep the original survivor's bytes and filename.
- **Changes:** Updated `_step_merge_identificacao` in `process_bulk_import.py` with `if merged_pdf.page_count == 0:`.

### GCS Upload Failure Resilience
- **Problem/Goal:** `upload_bytes()` raises exceptions on failure (e.g., MinIO network issues or quota limits).
- **Decision:** The pipeline must swallow upload exceptions during the merge step and fallback to keeping the original survivor document unmodified.
- **Changes:** Wrapped `upload_bytes` in a `try/except` block.

### Test Suite Hardening
- **Problem/Goal:** Existing tests overly relied on mocking PyMuPDF internals, making them fragile and decoupled from actual library behavior during corruption events.
- **Decision:** Remove `mock_fitz_open` patches where possible and rely on real C-layer PyMuPDF memory manipulation.
- **Changes:** Added `test_process_folder_merge_handles_all_corrupt_files_cleanly` and `test_process_folder_merge_handles_gcs_upload_failure`. Refactored `test_process_folder_handles_corrupt_file_during_merge` to use real byte strings.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_handles_corrupt_file_during_merge` | Corrupt individual files should be skipped during the merge without aborting the task. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merge_handles_all_corrupt_files_cleanly` | If all files in a merge group are corrupt, the process should keep a survivor and not crash PyMuPDF. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_merge_handles_gcs_upload_failure` | GCS network errors during the newly merged PDF upload should gracefully fallback to the original file. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_identify_id_prefix_generation` | Dynamic filename generation correctly identifies and combines document prefixes (e.g., CPF_RG). |

**Why these tests matter:** The bulk import pipeline operates on large ZIP files containing dozens of raw, unvalidated documents from external users. Ensuring Celery tasks never crash midway prevents partial processing states, guaranteeing system stability and avoiding manual database intervention.

## Key Decisions

- **Handling empty PDFs:** Abort physical merge but keep the original survivor document rather than failing the Celery task.
- **GCS Upload Resilience:** Treat the physical merge as an optional enhancement; if the generated PDF cannot be uploaded, discard it rather than crashing the task.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added defensive checks for `page_count == 0` and `try/except` for GCS uploads in identical document merge flow. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Rewrote tests to avoid fragile PyMuPDF mocks; added coverage for edge cases. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `modified` | Updated the Verification Plan with the new edge case integration tests. |
