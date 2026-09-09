---
tags: [ccb, schema, migration, tests, v5]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: 64d60aac-a7ac-4064-9d9d-5eebf7867e5d
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 5
importance_rationale: "Migrated test infrastructure to CCB v5 schema, establishing new test patterns post-migration."
---

# CCB V5 Schema — Test Suite & Migration Update

**Date:** 2026-03-13
**Tags:** #ccb #schema #migration #tests #v5

## Summary

Reviewed the `ccb-tables-column-refactor.md` spec for inconsistencies, then implemented the V5 schema migration and updated all three CCB test files (`test_bulk_import.py`, `test_document_models.py`, `test_ocr.py`) to align with the new status constants, field names, and removal of `DocumentChecklist` dependencies. Also fixed two unrelated migration issues (aquisicao raw SQL index and infrastructure_database state-only migration). All 125 tests pass.

Key outputs:
- `review_report.md` — cross-reference analysis of `ccb-tables-column-refactor.md` vs models/specs
- `implementation_plan.md` — plan for the table-column refactor implementation
- `migrations/aquisicao/0021_rename_extracted_id_titulo_...` — V5 schema migration
- `migrations/infrastructure_database/0037_...` — rewritten as state-only migration

## Conversation Arc

**Started:** The user asked for a review of `ccb-tables-column-refactor.md` to find inconsistencies, ambiguities, and errors by cross-referencing it with models.py and related spec documents.

**Ended:** All V5 schema changes are migrated and all 125 aquisicao tests pass; the counter update logic was separated out to `ccb-business-rules-refactor-implementation.md` for future implementation.

## Key Decisions

- **Counter logic deferred:** The counter update logic (batch-level counters like `folders_pendente`, `ccb_accepted`) was moved out of the table-column refactor scope into `ccb-business-rules-refactor-implementation.md` for separate implementation.
- **DocumentChecklist kept but deprecated:** The `DocumentChecklist` model and its tests remain in the codebase but are marked deprecated; new tests use `folder`/`batch`/`doc_type` instead.
- **Status constants simplified:** Old granular statuses (`STATUS_PENDING_OCR`, `STATUS_OCR_COMPLETE`, `STATUS_UNMATCHED`, `STATUS_DELETADO`) replaced with three: `pendente`, `aprovado`, `rejeitado` — with `reason` field providing specificity.
- **Infrastructure migration 0037 as state-only:** Migration 0036 already applied all DB changes via idempotent RunSQL, so 0037 was rewritten using `SeparateDatabaseAndState` to only update Django's migration state.
- **Raw SQL index drop:** The `aquisicao_dfr_batch_contrato_uidx` was created via raw SQL (not `unique_together`), so the migration uses `RunSQL DROP INDEX IF EXISTS` instead of `AlterUniqueTogether`.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Counter update logic implementation | `ccb-business-rules-refactor-implementation.md` | Deferred |
| Naive datetime warnings in approve batch tests | `BulkImportBatch.approved_at` | Pre-existing, not addressed |
| `DocumentChecklist` model full removal | Deprecated but still present | Backlog |

## Backlog Items Added

- ⚠️ MEDIUM — Implement counter update logic from `ccb-business-rules-refactor-implementation.md`
- LOW — Remove deprecated `DocumentChecklist` model and its test class
- LOW — Fix naive datetime warnings in approve batch tests (`approved_at`)

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[002-ccb-validation-workflow/ccb-tables-column-refactor.md]]| `contextualizes` |Source spec reviewed for inconsistencies|
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Counter update logic moved here |
| [[aquisicao/tests/test_bulk_import.py]] | `updates` | V5 status/reason constants, removed DocumentChecklist |
| [[aquisicao/tests/test_document_models.py]] | `updates` | Replaced checklist_item with folder/batch/doc_type |
| [[aquisicao/tests/test_ocr.py]] | `updates` | Replaced DocumentChecklist with batch/folder fixtures |
|[[aquisicao/0021_rename_extracted_id_titulo_documentsfolderresult_contrato_extracted_id_and_more.py]]| `implements` |V5 schema migration|
| [[infrastructure_database/0037_remove_eventlogentities_event_log_entities_unique_event_entity_and_more.py]] | `updates` | Rewritten as state-only migration |
