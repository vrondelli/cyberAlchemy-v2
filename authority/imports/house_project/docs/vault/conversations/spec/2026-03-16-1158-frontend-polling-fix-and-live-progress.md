---
tags: [frontend, ccb, models]
layer: application
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T11:58:10-03:00
expires: 2026-05-15
conversation_id: 560f4b85-5794-48f7-bc47-f45cf09b4b44
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 4
importance_rationale: "Fixed frontend polling and added live progress UI, application layer improvement."
---

# Frontend Polling Fix and Live Processing Progress

**Date:** 2026-03-16 11:58 (UTC-3)  
**Tags:** #frontend #ccb #models

## Summary

Fixed a frontend polling race condition where the bulk import UI captured stale `pending_ocr` state before `_process_folder` tasks completed. Added `processing_complete` flag and `folders_processed` counter to the API response. Rewrote the frontend to show the folder table during processing with a live progress bar instead of hiding everything behind a spinner. Changed initial folder reason from `no_template` to `pending_ocr` so the UI correctly shows "Aguardando extração OCR" until processing finishes.

## Key Decisions

- `processing_complete` is computed at API response time (no model/migration needed) by checking if any DV still has `pending_ocr` reason
- Initial folder reason changed from `no_template` → `pending_ocr`; `_process_folder` now explicitly sets folder reason in the no-templates early return path
- Added `REASON_PENDING_OCR` constant to `DocumentsFolderResult` model
- Frontend polling always updates results during processing (no more spinner-only state)
- Added 7 missing `REASON_LABELS` to `Contratos.jsx` for correct Portuguese display

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[aquisicao/interfaces/views.py]] | `updates` | Added `processing_complete`, `folders_processed`, `folder_processed` to BulkImportDetailView |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | Initial folder reason → `pending_ocr`; explicit reason set in no-templates path |
| [[aquisicao/repositories/models.py]] | `updates` | Added `REASON_PENDING_OCR` to `DocumentsFolderResult` |
| [[src/pages/Contratos.jsx]] | `updates` | Live progress UI, fixed polling race condition, added REASON_LABELS |
| [[aquisicao/tests/test_bulk_import.py]] | `updates` | 3 new tests for `processing_complete` flag |
| [[aquisicao/tests/test_parallel_bulk_import.py]] | `updates` | Updated fixture defaults to use `REASON_PENDING_OCR` |
