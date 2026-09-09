---
tags: [ccb, acquisition, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T20:35:12-03:00
expires: 2026-05-17
conversation_id: 75c746c9-9f4f-4e65-ae41-eb9c89e369c8
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-spec-v1.md]
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 4
importance_rationale: "Implemented document and folder renaming, application layer feature."
---

# Document & Folder Renaming Implementation

**Date:** 2026-03-18 20:35 (UTC-3)
**Tags:** #ccb #acquisition #pipeline

## Summary

This session investigated and implemented a naming convention for uploaded documents and folders in the bulk import pipeline. The original spec (`ccb-spec-v1.md`) proposed a `CPF_CCB_Bancarizador_Date` / `CPF_CCB_DocumentType_v1.pdf` naming scheme that was never implemented — uploaded files kept their original names throughout the entire pipeline. The session first confirmed this gap by tracing `final_name` and `leaf_folder_path` through the codebase, then designed and implemented a simpler naming convention aligned with the current data model.

The implemented convention renames documents to `{doc_type}_{contrato_extracted_id}.pdf` and folders to `{contrato_extracted_id}_{upload_date}` (YYYYMMDD format). This rename only applies on the happy path — when documents are successfully classified and the contrato is resolved. Failed, pending, or unclassified documents keep their original names.

### Naming Convention Design

- **Problem/Goal:** The spec defined a naming convention (`CPF_CCB_Bancarizador_Date` for folders, `CPF_CCB_DocumentType_v1.pdf` for PDFs) but it was never implemented. All uploaded files kept their `original_name` as `final_name`.
- **Decision:** Simplified the naming convention to use data already available in the pipeline: `{doc_type}_{contrato_extracted_id}.pdf` for documents, `{contrato_extracted_id}_{upload_date}` for folders. This avoids needing CPF/Bancarizador lookups that would require joining to `ContratoCCB` or `AquisicaoManual`.
- **Changes:** Added Step 6 to `_process_folder()` in `process_bulk_import.py` that runs after the cross-check step on the happy path.

### Spec Update

- **Problem/Goal:** `ccb-spec-v1.md` referenced the old naming convention in two places.
- **Decision:** Updated both references to match the implemented convention.
- **Changes:** Lines 218 and 1238 of `ccb-spec-v1.md` updated.

Key outputs:
- `process_bulk_import.py` — Step 6 renaming logic added
- `test_parallel_bulk_import.py` — 4 new tests in `TestDocumentFolderRenaming` class
- `ccb-spec-v1.md` — naming convention updated to match implementation

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_successful_folder_renames_dvs_final_name` | Classified documents must be renamed to `{doc_type}_{contrato_extracted_id}.pdf` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_successful_folder_renames_leaf_folder_path` | Folder path must be renamed to `{contrato_extracted_id}_{upload_date}` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_unclassified_dv_keeps_original_final_name` | Unclassified documents must keep their original filename |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_failed_folder_keeps_original_names` | Failed pipeline runs must not rename anything |

**Why these tests matter:** Without these tests, a regression could silently disable file renaming (leaving documents unnamed) or incorrectly rename failed documents (hiding their actual identity). The naming convention is critical for downstream auditing and operator review.

## Key Decisions

- **Simplified naming convention:** Used `{doc_type}_{contrato_extracted_id}` instead of the original `CPF_CCB_Bancarizador_Date` proposal. The simpler format uses data already available in `_process_folder()` without extra DB queries.
- **Happy path only:** Renaming only happens when the full pipeline succeeds (contrato matched). This avoids corrupting names on failed documents.
- **`original_name` immutability:** `original_name` is never modified — it's the audit trail. Only `final_name` is updated.
- **No GCS rename:** The rename only changes database fields (`final_name`, `leaf_folder_path`), not the actual GCS object keys. GCS paths are stored separately in `gcs_path`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added Step 6 renaming logic after cross-check in `_process_folder()` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Added `TestDocumentFolderRenaming` class with 4 test methods |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-spec-v1.md` | `modified` | Updated naming convention from `CPF_CCB_Bancarizador_Date` to `{doc_type}_{contrato_extracted_id}` in 2 places |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-spec-v1.md]] | `updates` | Updated naming convention to match implementation |
