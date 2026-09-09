---
tags: [ccb, pipeline]
node_type: discovery
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T12:39:47-03:00
expires: 2026-05-22
conversation_id: 1454a890-e7be-40ed-b0dd-3afff478ca34
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: false
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Identified a UniqueViolation bug in _process_folder that crashes folder processing when two RG files (frente/verso) in the same folder both classify as Identificacao, violating the DB constraint (folder_id, doc_type, version_number) — affects every real-world batch with front+back ID scans."
satisfaction: { score: 7, min: 5, max: 9, std: 1.5 }
---

# Failed Folder Unique Constraint Bug

**Date:** 2026-03-23 12:39 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session diagnosed why two folders (`700268571-2` and `700572306-4`) in Batch 163 (the latest `BulkImportBatch`) failed with `status=failed, reason=task_error`. The investigation revealed a **UniqueViolation** bug in the `_process_folder` function in `process_bulk_import.py`.

The root cause is a database-level unique constraint `document_version_folder_id_doc_type_versi_15cbcc78_uniq` on `(folder_id, doc_type, version_number)` that is not reflected in the Django model (which explicitly comments `# No unique_together`). When a folder contains two RG images (frente and verso), both are classified as `doc_type='Identificacao'` with `version_number=1`. The first `dv.save(update_fields=['doc_type'])` succeeds, but the second violates the constraint and raises `psycopg2.errors.UniqueViolation`. After exhausting 3 retries, the `process_folder_task` marks the folder as `failed/task_error`.

The session also confirmed that the Celery Redis queue was empty (no purge needed), and provided the user with commands to purge Celery/Redis queues for future use.

### Investigating Failed Document Versions
- **Problem/Goal:** User wanted to understand why `DocumentVersion` records failed in the last batch.
- **Decision:** The "failed" status was actually on `DocumentsFolderResult` (not directly on DVs). The DVs were stuck in `pendente/pending_ocr`.
- **Changes:** No code changes — diagnostic investigation only.

### Root Cause: UniqueViolation on Multiple RG Files
- **Problem/Goal:** Each folder has `RG-F` (frente) and `RG-V` (verso) JPG files. Both classify as `doc_type='Identificacao'`.
- **Decision:** The constraint `(folder_id, doc_type, version_number)` in the DB doesn't allow two files with the same doc_type in the same folder. Three correction paths identified: (1) increment `version_number`, (2) remove the orphaned constraint, (3) use sub-type classification.
- **Changes:** No code fix applied yet — bug documented for follow-up.

### Redis Queue Purge
- **Problem/Goal:** User asked how to purge the Celery/Redis task queue.
- **Decision:** Provided `celery purge -f`, `redis-cli DEL`, and `FLUSHALL` commands.
- **Changes:** User ran `celery purge` — 0 messages were queued.

Key outputs:
- Identified the `UniqueViolation` as the crash cause for 2 of 9 folders in Batch 163

## Key Decisions

- **No code fix applied yet:** The unique constraint bug was diagnosed but not corrected in this session. Requires a design decision on how to handle multiple files of the same `doc_type` per folder.

## Files Changed

### Code

No code files were changed in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/2026-03-23-1239-failed-folder-unique-constraint-bug.md` | `created` | This session node documenting the UniqueViolation bug discovery |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix UniqueViolation for multiple same-doc_type files per folder | This session | ⚠️ HIGH | Open — blocks every batch with RG frente+verso |
| Orphaned DB constraint `document_version_folder_id_doc_type_versi_15cbcc78_uniq` not in Django model | This session | MEDIUM | Open — constraint exists in DB but `Meta` says `# No unique_together` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/business-rules.md` | `contextualizes` | The bulk import pipeline rules that the bug violates |
