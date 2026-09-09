---
tags: [ccb, refactor, testing]
layer: architecture
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T15:17:35-03:00
expires: 2026-05-13
conversation_id: 3f14b25b-ad19-4023-b5af-0e8593e12527
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 5
importance_rationale: "Fixed cross-batch deduplication logic, correctness fix in a critical data pipeline path."
---

# Fix Cross-Batch Duplicate Detection & Celery Task Registration

**Date:** 2026-03-14 15:17 (UTC-3)  
**Tags:** #ccb #refactor #testing

## Summary

Fixed three issues preventing the bulk import pipeline from working end-to-end. First, the `upload_failures` migration (0024) had never been applied, causing the batch list API to return 500. Second, `process_folder_task` and `finalize_batch_task` were not registered in the Celery worker (needed a restart), so `_process_folder` never executed. Third, the cross-batch duplicate detection was structurally broken: it ran after the `ContratoCCB` lookup, meaning folders with `reason=no_id_match` (contrato not found) were never checked for duplicates. Moved the dedup check before the contrato lookup and removed the `reason=ocr_match` filter so any active prior folder with the same `contrato_extracted_id` blocks re-uploads.

## Key Decisions

- Cross-batch dedup now fires right after `contrato_extracted_id` is set, before the `ContratoCCB` lookup
- Dedup matches on `contrato_extracted_id` only — no `reason` or `contract_hash` filter needed
- `finalize_batch_task` signature changed from `(self, results, batch_id)` to `(self, batch_id)` to match `.si()` immutable call pattern
- Duplicate folders get `contract_hash=None` since the dedup fires before contrato matching

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | Moved cross-batch dedup before ContratoCCB lookup, removed reason filter |
| [[aquisicao/tasks/bulk_import_tasks.py]] | `updates` | Fixed finalize_batch_task signature (removed results param) |
| [[aquisicao/tests/test_parallel_bulk_import.py]] | `updates` | Updated 4 finalize_batch_task test calls |
| [[aquisicao/tests/test_ocr.py]] | `updates` | Updated cross-batch dedup assertions (contract_hash is None for duplicates) |
