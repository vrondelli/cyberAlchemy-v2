---
tags: [pipeline, identificacao, testing]
node_type: test
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T13:26:00-03:00
expires: 2026-05-22
conversation_id: 771d9ec8-6425-45ad-8a17-93bb86145195
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/document-merge-implementation.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Added integration tests and fixed specification details for the upcoming pre-extraction image merge feature, ensuring the classification cascade handles Identificacao files accurately without false UniqueViolation constraints in the future."
---

# Identificacao Merge Tests and Spec Refinement

**Date:** 2026-03-23 13:26 (UTC-3)
**Tags:** #pipeline #identificacao #testing

## Summary

This session focused on reviewing the proposed implementation plan for merging `Identificacao` image files (e.g. RG front and back) prior to OCR extraction to prevent `UniqueViolation` database crashes. We identified bugs in the proposed Python implementation spec related to OCR text context loss and dangling files in MinIO. 

The specification (`document-merge-implementation.md`) was updated to correct these logic gaps. We then implemented the behavior-driven integration tests for the merge feature in `test_parallel_bulk_import.py`. During the test implementation, we discovered that the dummy test file `RG.pdf` was failing the filename regex constraint (`(?i)^RG\d*[_\-]`) and falling back to text-based extraction, which caused false test failures. We corrected the mock setup to use `RG-F.pdf` properly isolating the classification. The tests run and are appropriately marked with `@pytest.mark.skip` to prevent CI failure until the production code is written.

### Spec Refinement: Memory & Cleanup
- **Problem/Goal:** The initial spec wiped `ocr_text` upon merging, meaning downstream Universal/Regex fallbacks would fail if Gemini was disabled or crashed. Additionally, it relied on `victim.delete()` without removing the orphaned bytes from MinIO.
- **Decision:** Concatenate the text values of combined files to guarantee regex fallback mechanisms survive. Delete the physical blobs (`victim.gcs_path` and `old_gcs_path`) before pruning database rows.
- **Changes:** Updated the code block and explanation in `document-merge-implementation.md`.

### Testing Implementation
- **Problem/Goal:** Need to enforce the newly defined merge logic and ensure it properly deduplicates DVs without modifying folders that have distinct files.
- **Decision:** Add three test assertions (`test_process_folder_merges_multiple_identificacao_files`, `test_process_folder_merge_handles_mixed_types`, `test_process_folder_no_merge_needed`) and skip them until the Python implementation is complete.
- **Changes:** Mocked `fitz.open()` locally to simulate the PDF merge and validate `file_size` updates alongside database consolidation.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestDocumentMerge` class (3 tests) | Multiple files of the same `doc_type` must be aggregated into a single PDF blob before OCR/Gemini extraction to prevent UniqueConstraint failures and ensure complete context per document type. |

**Why these tests matter:** Preventing UniqueViolations in Celery tasks guarantees that folder processing doesn't crash halfway through simply because a user uploaded both the front and back of their ID. Merging them also feeds Gemini the complete document.

## Key Decisions

- **OCR Text Context:** Concatenate texts from all pages during a merge rather than resetting to `None`, preserving initial text extraction attempts.
- **MinIO Cleanup:** Always invoke `shared_services.gcs.delete_object` for overwritten and victim files to avoid unbounded storage bloat.
- **Test Setup Constraints:** Mock file names must strictly match `(?i)^RG\d*[_\-]` (e.g. `RG-F.pdf`) to successfully traverse Tier 0 classification without relying on mock text injections.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Added the `TestDocumentMerge` class with skip decorators, and fixed filename regex bypass issues. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `modified` | Amended Python code implementation plan to fix memory context loss and MinIO file orphans. |
