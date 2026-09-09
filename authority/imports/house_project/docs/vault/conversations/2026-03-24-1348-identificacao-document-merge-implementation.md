---
tags: [acquisition, pipeline]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T13:48:41-03:00
expires: 2026-05-23
conversation_id: 83b1acc4-c4c1-40a2-86cd-3238639f5344
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/document-merge-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Implemented the document merge architectural decision for Identificacao documents, eliminating a UniqueViolation crash and resolving a critical bug in the bulk import pipeline."
---

# Implementing Document Merge for Identificacao

**Date:** 2026-03-24 13:48 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

This session focused on resolving a `UniqueViolation` database crash that occurred when the bulk import pipeline attempted to process folders containing multiple `Identificacao` documents (such as front and back RG images). Initially, a data migration was considered to drop the stale database constraint. However, it was discovered that an architectural decision had already been formally planned in `document-merge-implementation.md` to properly address the issue by merging the document images into a single PDF before extraction.

The session shifted from the incorrect schema fix to implementing the approved architectural plan. The implementation was injected into `process_bulk_import.py`, specifically targeting only `Identificacao` type documents as requested by the user. The test suite was subsequently updated by removing the skip markers for the merge feature and creating a new test to ensure non-Identificacao documents bypass the merge logic. The full test suite passed without any regressions.

### Investigating the Bulk Import Crash
- **Problem/Goal:** A bulk import batch failed with `psycopg2.errors.UniqueViolation` on the `document_version` table because of a stale database constraint `(folder_id, doc_type, version_number)` triggered by multiple `Identificacao` files.
- **Decision:** Rather than dropping the constraint, implement the previously approved architectural decision to merge the files into a single PDF before extraction.
- **Changes:** Updated `document-merge-implementation.md` to explicitly restrict the merging strictly to `doc_type == "Identificacao"`.

### Implementing the Merge Logic
- **Problem/Goal:** Apply the merge logic into the `process_bulk_import` pipeline without disrupting the existing flow.
- **Decision:** Create a helper function `_step_merge_identificacao` that intercepts the classified files dict, groups the `Identificacao` files, merges them using `fitz` (PyMuPDF), pushes the single PDF to MinIO, and consolidates the `DocumentVersion` records into a single survivor.
- **Changes:** Injected `_step_merge_identificacao` into `domains/aquisicao/use_cases/process_bulk_import.py` right before Step 2b.

### Validating the Pipeline and Edge Cases
- **Problem/Goal:** Ensure the new merge logic works as expected and does not unintentionally merge other document types.
- **Decision:** Enable the existing skipped integration tests for document merging and write a new test specifically for the negative case (non-Identificacao documents).
- **Changes:** Removed `@pytest.mark.skip` from `TestDocumentMerge` in `test_parallel_bulk_import.py`. Added a new test `test_process_folder_does_not_merge_non_identificacao` to verify that multiple `Holerite` files are processed independently. Ran and passed all 1213 tests in the acquisition domain.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestDocumentMerge` (unskipped all tests) | Identificacao documents (front/back) must be merged into a single PDF |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_process_folder_does_not_merge_non_identificacao` | Documents that are not `Identificacao` must never be merged, even if multiple exist in the folder |

**Why these tests matter:** They ensure the pipeline correctly consolidates identification documents to provide Gemini with maximum context, avoiding database constraint crashes, while guaranteeing that other document types are strictly processed as individual files.

## Key Decisions

- **Architecture implementation:** Confirmed that the correct fix for the multi-file `UniqueViolation` is merging the files at the application layer, not dropping the database constraint.
- **Merge scope restriction:** Enforced a strict limitation where the document merge logic exclusively applies to `doc_type == "Identificacao"`, preventing unintended modifications to other document types.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Injected `_step_merge_identificacao` to merge multiple Identificacao files into a single PDF |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Unskipped `TestDocumentMerge` class and added `test_process_folder_does_not_merge_non_identificacao` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `modified` | Added the constraint to ensure the pseudo-code specifically checks `if doc_type != "Identificacao": continue` |

## Connections

- `validates` -> [document-merge-implementation.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/document-merge-implementation.md)
