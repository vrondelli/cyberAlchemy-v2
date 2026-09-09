---
tags: [ccb, parallel-processing, spec-review, dedup]
layer: domain
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T00:00:00-03:00
expires: 2026-05-13
conversation_id: b5b5acea-3318-44a4-b84e-04f0925bc407
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 5
importance_rationale: "Reviewed parallel upload spec including deduplication strategy, domain-level design decisions."
---

# Parallel Document Upload Spec Review

**Date:** 2026-03-14
**Tags:** #ccb #parallel-processing #spec-review #dedup #bulk-import

## Summary

Reviewed `ccb-parallel-documents-upload-implementation.md` against the actual codebase, identifying 13 issues across business rules, architecture, and clarity. All items were resolved through discussion, the spec was fully rewritten with corrections, and two new backlog items were added.

Key outputs:
- `specs/002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md` — rewritten spec with all corrections
- `specs/002-ccb-validation-workflow/backlog-ccb.md` — two new items added (concurrent batch lock, field validation)

## Conversation Arc

**Started:** The user asked for a thorough review of the parallel document upload implementation spec to find unclear areas, wrong business rules, and potential problems.

**Ended:** All 13 review items were resolved with user decisions, the spec was rewritten incorporating all changes, and two deferred items were added to the backlog.

## Key Decisions

- **Dedup key**: Use `contrato_extracted_id` (OCR-extracted string), not `contract_hash` (DB row hash), for both cross-batch and intra-batch dedup queries.
- **Same-batch duplicates**: Changed from `deletado` to `pendente` — operator decides which folder to keep.
- **Reason on status change**: Every status change must carry a reason. `rejeitado` → `deletado` transitions must set `reason=duplicate_contrato_database`.
- **Concurrent batches**: No automated locking for now — operator discipline prevents two batches from processing simultaneously. Added to backlog as MEDIUM.
- **Upload retry**: Failed MinIO uploads are retried up to 3 times using `ThreadPoolExecutor` + `as_completed()`.
- **`stream_id` semantics**: It is a causal action thread identifier (not an entity tracker). All events in one bulk upload flow share the same `stream_id`. Must be set in constructor since `bulk_create` skips `save()`.
- **`REASON_OCR_MATCH` status**: Folder status should be `completado` (not `pendente`) when all documents pass OCR and cross-check. Transitions to `aprovado` only on user approval.
- **Counter updates**: Computed in `finalize_batch_task` (chord callback) via full recount queries — no incremental F() updates. Updates both batch-level and folder-level counters.
- **Event name**: Changed from `DOCUMENT_BULK_SCAN_COMPLETED` to `DOCUMENT_BULK_UPLOAD_COMPLETED`.
- **Zip cleanup**: Delete staging zip from MinIO after pre-extraction.
- **Critical field validation**: Deferred to next phase; added to backlog as MEDIUM.
- **`DocumentsFolderResult` lookup**: Use `(batch_id, leaf_folder_path)` — unique within a batch.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Concurrent batch processing lock | Cross-batch dedup race condition | Backlogged (MEDIUM) |
| Critical/non-critical field validation | `DocumentTemplate` has columns but no enforcement | Backlogged (MEDIUM) |
| `delete_object` function in `shared_services/gcs.py` | Zip cleanup after pre-extraction | Noted in spec |

## Backlog Items Added

- **MEDIUM** — Concurrent batch processing lock (automated mechanism to prevent two `traverse_and_identify` tasks from running simultaneously)
- **MEDIUM** — Enforce critical/non-critical field validation in `_process_folder` after OCR extraction

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md]] | `updates` | Full spec rewrite with all review corrections |
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Added 2 new backlog items |
|[[aquisicao/use_cases/process_bulk_import.py]]| `contextualizes` |Cross-referenced current implementation against spec|
|[[aquisicao/tasks/bulk_import_tasks.py]]| `contextualizes` |Verified existing Celery task structure|
|[[aquisicao/repositories/models.py]]| `contextualizes` |Verified model fields and status/reason constants|
