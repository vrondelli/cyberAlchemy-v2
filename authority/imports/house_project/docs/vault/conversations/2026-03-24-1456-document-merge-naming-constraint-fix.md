---
tags: [ccb, pipeline, infrastructure]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T14:56:00-03:00
expires: 2026-05-23
conversation_id: 83b1acc4-c4c1-40a2-86cd-3238639f5344
decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: ['specs/002-ccb-validation-workflow/upload-flow-diagram.md']
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed a critical PostgreSQL UniqueConstraint crash blocking the PyMuPDF document merge pipeline and implemented dynamic physical naming for Identification files (e.g. RG_CPF_{id}.pdf)."
version: 0.1.0
last_updated: 2026-03-24
---

# Fixing Bulk Import Merge Failures & Implementing Dynamic ID Naming

**Date:** 2026-03-24 14:56 (UTC-3)
**Tags:** #ccb #pipeline #infrastructure

## Summary

This session finalized the implementation of the physical document merge feature in the bulk import pipeline. During testing, it was discovered that the `_step_classify_dvs` Celery task was crashing due to a `django.db.utils.IntegrityError`. Even though the `unique_together` declarative definition had been previously removed from the `DocumentVersion` model in Django, the underlying PostgreSQL `UniqueConstraint` on `(folder_id, doc_type, version_number)` was still active. A custom migration was written and applied to drop the lingering index. 

Once the pipeline was unblocked, additional logic was added to satisfy the requirement for dynamically renaming merged Identification documents. During the PDF merge (`_step_merge_identificacao`), the pipeline now parses the original file names for acronyms (RG, CPF, CNH), creates a sorted prefix, and saves it in the `survivor_dv.original_name`. Finally, in `_step_rename_documents`, this prefix is extracted and used to produce the final document filename (e.g., `RG_CPF_12345.pdf`). The flow chart in the specs was updated to reflect these new constraints.

### Debugging the IntegrityError Crash
- **Problem/Goal:** Folders with multiple `Identificacao` files (e.g., RG-F and RG-V) were failing with a `task_error`, and duplicate rows were persisting in the database instead of being physically merged.
- **Decision:** Use raw Python scripts locally to synchronously execute the folder processing and capture the traceback log, which revealed a `UniqueConstraint` violation in PostgreSQL blockading the Celery task.
- **Changes:** Created a new migration `0044_drop_documentversion_unique_constraint.py` with `migrations.RunSQL` to explicitly `DROP CONSTRAINT IF EXISTS document_version_folder_id_doc_type_versi_15cbcc78_uniq`.

### Dynamic Renaming of Identification Files
- **Problem/Goal:** Once the documents are merged into a single physical PDF, the system needs to append the types of documents it encapsulates in the final filename (e.g., `RG_CPF_{numero_titulo}.pdf`).
- **Decision:** Acronyms will be parsed directly from the filenames during the merge step, stored temporarily in the merged artifact's `original_name`, and consumed later at step 6 for final rename.
- **Changes:** Added the `_identify_id_prefix` helper function. Updated `_step_merge_identificacao` to construct names like `RG_CPF_merged.pdf` and `_step_rename_documents` to strip `_merged.pdf` before combining with the CCB `id_titulo`.

### Diagram Spec Update
- **Problem/Goal:** The `upload-flow-diagram.md` flowchart needed to encompass the physical document merge logically situated between the OCR steps.
- **Decision:** Inject the merge block before the Tier 1 Doc Type Classification node to accurately sequence the physical resolution of images before OCR processing finalization.
- **Changes:** Updated `docs/specs/002-ccb-validation-workflow/upload-flow-diagram.md`.

## Key Decisions

- **Database Constraints:** Dropping the constraint via raw SQL inside a custom migration is required when `manage.py makemigrations` fails to detect `unique_together` deletion due to intermediate migration rollbacks.
- **Naming Rule:** The document types contained within a physically merged `Identificacao` document will be sorted alphabetically (e.g., `CNH_CPF_RG`) and appended natively as a prefix to the `id_titulo`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `migrations/aquisicao/0044_drop_documentversion_unique_constraint.py` | `created` | Custom migration with raw Postgres SQL dropping the unique constraint. |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added `_identify_id_prefix` helper, refactored `_step_merge_identificacao` and `_step_rename_documents` for dynamic naming. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Added `Merge Físico de Identificação` box and updated documentation on the final renaming block. |
