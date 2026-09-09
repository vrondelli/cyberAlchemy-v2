---
tags: [ccb, schema, refactor, review]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: 49b9cd8d-35bb-45a5-8925-4b48f6a6e758
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 5
importance_rationale: "Reviewed CCB table/column refactoring strategy, schema-level architectural decisions."
---

# CCB Tables Column Refactor — Review & Fixes

**Date:** 2026-03-13
**Tags:** #ccb #schema #refactor #review #entities

## Summary

Reviewed `ccb-tables-column-refactor.md` for inconsistencies, ambiguities, and missing items by cross-referencing against `ccb-entities.md`, `ccb-business-rules-refactor-implementation.md`, and the actual codebase models. Found 15 issues (5 inconsistencies, 4 ambiguities, 4 missing items, 2 nits). All were addressed based on user decisions, resulting in updates to all three spec documents.

Key outputs:
- `ccb-tables-column-refactor.md` — fixed STATUS_FAILED, duplicate logic, ccb_ocr_complete, gcs_path semantics, DocumentChecklist deprecation section, counter update logic
- `ccb-entities.md` — full v5 schema sync (4-state statuses, new columns, reason tables, deprecated DocumentChecklist, updated relationships diagram)
- `ccb-business-rules-refactor-implementation.md` — fixed field names (documents_no_match, perceptual_hash, required_docs_count), duplicate logic, added Cleanup 4 for DocumentChecklist drop

## Conversation Arc

**Started:** User asked for a review of `ccb-tables-column-refactor.md` to find inconsistencies, ambiguities, or errors across spec documents and the codebase.

**Ended:** All three spec documents are now consistent. User refined several counter update logic details (folders_aprovado deferred until all docs verified, async extraction backlog note) via inline edits after the initial fixes.

## Key Decisions

- **STATUS_FAILED kept from old model:** The existing `STATUS_FAILED = 'failed'` is retained (not removed in the diff), so BulkImportBatch has 4 states: `pendente/aprovado/rejeitado/failed`. DocumentsFolderResult and DocumentVersion also get `failed` + `processing_error` reason.
- **Duplicate detection skips deletado:** A contrato from a previous import is only treated as a duplicate if its status is `pendente` or `aprovado`. If `deletado`, the new upload proceeds normally.
- **Aprovado reasons narrowed:** Only `ocr_complete` or `override` — the ambiguous `(null)` reason was removed.
- **ccb_status mirrors DocumentVersion:** Not its own enum; always reflects the CCB DocumentVersion's current status.
- **gcs_path scoping:** Batch = batch path, folder = folder path, document = document path. Each level stores its own scope.
- **DocumentChecklist deprecated:** Marked for removal. Required docs resolved at runtime via `KitType.required_docs`. Cleanup 4 added to business rules refactor.
- **ccb_ocr_complete description:** Not tied to OCR specifically — counts any successful data extraction + contract match. Incremented synchronously.
- **folders_aprovado deferred:** Not incremented at CCB identification — only after all documents in the folder are verified (OCR + future cross-check).
- **documents_no_match is canonical:** Replaces `documents_unmatched` from earlier drafts. Covers extraction failures and linking failures.
- **perceptual_hash is canonical:** Field name on DocumentVersion for the dHash. `document_hash` references were all corrected.
- **Async extraction is a backlog item:** Current PyMuPDF extraction is synchronous; moving to async Celery task is deferred.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Add `STATUS_FAILED` + `REASON_PROCESSING_ERROR` to DocumentsFolderResult and DocumentVersion models | Review finding #12 | Spec'd, not implemented |
| Drop `DocumentChecklist` table | Review finding #11 + Cleanup 4 | Spec'd (deprecated in code, drop in follow-up migration) |
| Move PDF extraction to async Celery task | User backlog note | Backlog |
| Implement `folders_aprovado` increment after all-docs-verified | User edit | Spec'd, not implemented |

## Backlog Items Added

- ⚠️ MEDIUM — Move synchronous PyMuPDF extraction in `_process_folder` to an async Celery task
- ⚠️ HIGH — Implement `folders_aprovado` counter logic (increment only after full folder verification)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-tables-column-refactor.md]] | `updates` | Fixed 12+ issues: STATUS_FAILED, duplicate logic, counter semantics, DocumentChecklist deprecation |
| [[002-ccb-validation-workflow/ccb-entities.md]] | `updates` | Full v5 schema sync — 4-state statuses, new fields, reason tables, deprecated DocumentChecklist |
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Fixed field names, duplicate logic, added Cleanup 4 |
|[[002-ccb-validation-workflow/backlog-ccb.md]]| `contextualizes` |Existing backlog — async extraction item should be added here|
