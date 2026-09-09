---
tags: [acquisition, frontend]
node_type: spec
is_session: true
layer: [application, domain]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T12:55:09-03:00
expires: 2026-05-19
conversation_id: 40ec8712-5580-418c-89f1-bdd141f5abda
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed nested object rendering crashes in document previews and implemented bulk import batch deletion, unblocking operator workflows in the frontend."
---

# Debugging Bulk Import and Previews

**Date:** 2026-03-20 12:55 (UTC-3)
**Tags:** #acquisition #frontend

## Summary

This session focused on fixing critical UI bugs in the Contratos dashboard and extending the bulk import functionality. The primary issue was a "white screen" crash when users clicked to preview "Averbação" documents. The root cause was traced to a React rendering bug where nested objects inside the `extracted_data` JSON (specifically the `contratos` array) were being passed directly as React children. This was fixed by implementing a recursive rendering function that correctly stringifies and indents nested objects and arrays.

After resolving the crash, a new feature was implemented to allow operators to delete entire bulk import batches directly from the UI. This involved adding a `delete_batch` use case that hard-deletes the batch and its orphans, exposing a `DELETE` API endpoint, and wiring up a confirmation modal and delete button in the frontend table. Finally, the session resolved an issue where the template preview list was failing to load (500 Internal Server Error) due to a missing `empresa` column. The user had added the field to the `DocumentTemplate` model, but the `0037_add_empresa_to_document_template` migration contained a stale conflict. The migration was fixed and applied, restoring the template registry page.

### Fixing "Averbação" Document White Screen Crash
- **Problem/Goal:** Clicking on "Averbação" documents caused the entire React application to crash to a white screen.
- **Decision:** The crash was caused by `typeof value === 'object'` rendering in `Contratos.jsx`. React cannot natively render objects or arrays. Given that `extracted_data` can contain arbitrary nested structures (like `[{situacao: 'Ativo', ...}]`), a recursive stringification approach was needed.
- **Changes:** Replaced the simple inline check with a recursive `renderValue(val, depth)` helper in `Contratos.jsx`. Primitives are stringified, nulls become `—`, and objects/arrays are deeply iterated and rendered with indentation and left borders to create a readable tree.

### Adding Bulk Import Batch Deletion
- **Problem/Goal:** Users needed a way to delete bulk import batches via the UI, but no backend endpoint or UI button existed for this action.
- **Decision:** Implement a hard-delete flow starting from a terminal status batch row. The backend should cascade the deletion properly to avoid orphan records, particularly handling `DocumentVersion` which uses `SET_NULL` for batch foreign keys.
- **Changes:** 
  - Created `delete_batch` in `process_bulk_import.py` to hard-delete `DocumentVersion` rows explicitly, then delete the `BulkImportBatch` (which cascades to `DocumentsFolderResult`).
  - Added `BulkImportDeleteView` at `/api/aquisicao/bulk-import/<batch_id>/delete/`.
  - Added an "Ações" column to the `Lotes anteriores` table in `Contratos.jsx` with a trash icon and a confirmation modal.

### Fixing Template API Crash (empresa field)
- **Problem/Goal:** The "Registrar Template" tab showed no templates because the API was returning a 500 error (`column document_template.empresa does not exist`).
- **Decision:** The `empresa` field had been added to the model and views, but the corresponding database migration was stuck.
- **Changes:** Cleaned up the auto-generated `0037_add_empresa_to_document_template.py` migration file to remove a stale `AlterUniqueTogether` operation that referenced a non-existent `contrato` field. Applied the migration successfully, syncing the DB schema and restoring the API.

## Key Decisions

- **Nested Data Display:** Render deeply nested `extracted_data` objects recursively into the UI instead of stringifying as JSON, providing a much better reading experience for arrays of objects (e.g., multiple loans in an Averbação).
- **Batch Deletion Cascade:** Explicitly delete `DocumentVersion` records before deleting the batch, because the `batch` foreign key on `DocumentVersion` is configured as `SET_NULL` rather than `CASCADE`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added `delete_batch()` use case and universal extraction fallback logic. |
| `domains/aquisicao/interfaces/urls.py` | `modified` | Mapped `BulkImportDeleteView` to `/bulk-import/<batch_id>/delete/`. |
| `domains/aquisicao/interfaces/views.py` | `modified` | Added `BulkImportDeleteView`. Updated template views to include `empresa` field. |
| `frontend/src/pages/Contratos.jsx` | `modified` | Added `renderValue` for nested extracted data, and added batch delete UI flow. |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | User added `EMPRESA_KEYWORDS` and `SUPPORTED_EMPRESAS`. |
| `migrations/aquisicao/0037_add_empresa_to_document_template.py` | `modified` | Fixed failing migration by removing stale Operations. |
