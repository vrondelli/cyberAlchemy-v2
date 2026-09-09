---
tags: [bulk-import, document-preview, frontend, api]
layer: application
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T00:00:00-03:00
expires: 2026-05-13
conversation_id: 9e667c1e-8035-4877-83bd-9560a2929a5a
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 4
importance_rationale: "Fixed document preview and batch processing bugs in the application layer, localized impact."
---

# Document Preview, Batch Summary & Pipeline Fixes

**Date:** 2026-03-14
**Tags:** #bulk-import #document-preview #frontend #api #pipeline

## Summary

This session focused on building the document preview feature, adding a batch summary table with drill-down navigation, and fixing several pipeline issues. Key outcomes: batch history is now a table with summary counts, folders are expandable to show documents inline, clicking a document opens a view-only PDF/image preview with extracted data side panel, same-batch duplicates now mark both folders as pendente, contract_hash is computed when missing, and rejected batches can be re-opened for viewing.

Key outputs:
- `frontend/src/pages/Contratos.jsx` — batch summary table, folder drill-down, document preview modal with extracted data panel
- `domains/aquisicao/interfaces/views.py` — `DocumentVersionFileView` for file serving, updated `BulkImportListView`/`BulkImportDetailView` with counts and `extracted_data`/`final_name`
- `domains/aquisicao/interfaces/urls.py` — new route for document file serving
- `domains/aquisicao/use_cases/process_bulk_import.py` — same-batch duplicate fix, contract_hash computation, configurable match field, CCB DV reason fix, DV update on decline

## Conversation Arc

**Started:** The user needed to fix a frontend infinite loading issue after zip uploads and wanted to see batch summaries with drill-down into folders and documents.

**Ended:** All features implemented and verified — batch table with counts, folder/document drill-down, PDF preview modal with extracted data, pipeline fixes for duplicates and status propagation. Rejected batches are now viewable.

## Key Decisions

- **Blob URL for preview:** Instead of exposing a direct file URL (which would require auth in the iframe), we fetch with token headers and create an in-memory blob URL. This also enables view-only mode with `#toolbar=0`.
- **Same-batch duplicates — both pendente:** When two folders match the same contrato, both are set to `pendente/duplicate_contrato` (not `deletado`), allowing operator review. Used `dict[int, int]` instead of `set[int]` to track and retroactively update the first folder.
- **Contract hash computation:** `ContratoCCB.contract_hash` is nullable for CSV-imported records. Now computed as `md5(id_titulo)` and backfilled on the contrato record when missing.
- **Configurable match field:** The contrato lookup column is now a constant `CONTRATO_MATCH_FIELD = 'numero_titulo'` for easy swapping.
- **Rejected batch viewing:** `loadBatch` maps `rejeitado`/`aprovado` to the `review` UI state so results are always visible. Approve/Decline buttons auto-hide for closed batches.
- **DV status on decline:** `decline_batch()` now updates both `DocumentsFolderResult` and `DocumentVersion` rows to `rejeitado/batch_rejeitado`.
- **Rename display:** Documents show `original_name → final_name` when they differ (currently always equal — renaming logic not yet implemented).

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Document renaming logic (folders & files) | User inquiry — no rename step exists in pipeline | Not started |
| Cross-batch duplicate sets status to `deletado` — should it be `pendente`? | Consistency with same-batch duplicate logic | Open question |
| `batch_declined` vs `batch_rejeitado` reason naming inconsistency | `DocumentsFolderResult` uses `batch_declined`, `DocumentVersion` uses `batch_rejeitado` | Should unify |
| No same-batch duplicate test | Test gap identified during verification | Not started |

## Backlog Items Added

- ⚠️ MEDIUM — Implement document/folder renaming logic in the pipeline
- ⚠️ LOW — Unify `batch_declined`/`batch_rejeitado` reason constants across models
- ⚠️ LOW — Add test for same-batch duplicate detection (both folders marked pendente)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[aquisicao/interfaces/views.py]] | `updates` | Added DocumentVersionFileView, updated list/detail views |
| [[aquisicao/interfaces/urls.py]] | `updates` | Added document file serving route |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | Fixed duplicate handling, contract_hash, decline_batch |
| [[src/pages/Contratos.jsx]] | `updates` | Batch table, drill-down, preview modal, status fixes |
