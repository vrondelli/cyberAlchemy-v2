---
tags: [ccb, refactor, models, testing]
layer: architecture
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T14:13:46-03:00
expires: 2026-05-13
conversation_id: 3f14b25b-ad19-4023-b5af-0e8593e12527
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 6
importance_rationale: "Implemented parallel upload with dedup, architectural change spanning models and testing."
---

# Parallel Document Upload — Full Implementation

**Date:** 2026-03-14 14:13 (UTC-3)  
**Tags:** #ccb #refactor #models #testing

## Summary

Implemented the full CCB parallel document upload architecture per the spec in `ccb-parallel-documents-upload-implementation.md`. Added storage layer prerequisites (`delete_object`, `download_bytes_to_file`), model changes (`upload_failures` JSONField + migration 0024), and refactored the entire `process_bulk_import.py` pipeline from synchronous single-threaded to an orchestrator pattern using `ThreadPoolExecutor` for parallel file uploads and Celery `chord` for per-folder processing. Created two new Celery tasks (`process_folder_task`, `finalize_batch_task`) and three new helpers (`_deduplicate_batch`, `_update_batch_counters`, `_build_batch_summary`). Wrote 27 new tests in `test_parallel_bulk_import.py` and cleaned up 18 obsolete tests from `test_bulk_import.py`. Full suite: 86 tests passing.

## Key Decisions

- `_process_folder` signature changed from `(batch, folder_path, zip_file, ccb_templates, matched_contratos)` to `(batch_id, folder_path)` — now loads state from DB and reads files from MinIO
- Intra-batch deduplication moved from inline in `_process_folder` to a dedicated `_deduplicate_batch` helper called during finalization
- Cross-batch dedup handles the `rejeitado` → `deletado` transition: if a prior batch's folder was rejected, the new folder succeeds and the old one transitions to `deletado`
- Counter updates use raw SQL for performance at scale (bulk UPDATE)
- `finalize_batch_task` chord callback always fires even if individual folder tasks fail, ensuring the completion event is always emitted

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md]] | `implements` | Full implementation of the parallel upload spec |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | Major refactor: orchestrator pattern, new helpers |
| [[aquisicao/tasks/bulk_import_tasks.py]] | `updates` | Added process_folder_task and finalize_batch_task |
| [[storage/minio_client.py]] | `updates` | Added delete_object and download_bytes_to_file |
| [[aquisicao/repositories/models.py]] | `updates` | Added upload_failures JSONField to BulkImportBatch |
|[[aquisicao/tests/test_parallel_bulk_import.py]]| `implements` |27 new tests for parallel architecture|
