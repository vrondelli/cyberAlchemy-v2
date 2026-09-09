---
tags: [ccb, models, spec, event-system, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T10:30:37-03:00
expires: 2026-05-12
conversation_id: 4ef3c58a-4dec-49f3-acc2-0b7d3935cd02
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 7
importance_rationale: "Designed CCB v5 column schema integrating event-system, models, and refactor — high blast radius architectural decision."
---

# Column Schema v5 Design & EventLogEntities Reframing

**Date:** 2026-03-13 10:30 (UTC-3)  
**Tags:** #ccb #models #spec #event-system #refactor

## Summary

Reframed `EventLogEntities` as independent granular event records (not a subordinate bridge table), updating the event system constitution and developer guide. Then iteratively designed the v5 column schema for `BulkImportBatch`, `DocumentsFolderResult`, and `DocumentVersion` through 5 review rounds. Simplified all three models to 3-status systems (`pendente/aprovado/rejeitado` for batch, `pendente/aprovado/deletado` for folder and document). Removed `checklist_item` FK from `DocumentVersion`, replacing it with `folder`, `batch`, and `doc_type` fields. Created a detailed pipeline flow mapping every decision point to exact field updates.

## Key Decisions

- **EventLogEntities** are independent first-class event records, not a bridge/fan-out table. No FK to EventLog.
- **BulkImportBatch** simplified to 3 statuses: `pendente / aprovado / rejeitado`. Internal processing phases tracked via events, not status columns. Added 13 aggregate counter fields updated via `F()` expressions.
- **DocumentsFolderResult** replaced `contrato` FK with `contract_hash` CharField and renamed `extracted_id_titulo` to `contrato_extracted_id`. Added `justification` TextField for operator overrides, `ccb_status` to mirror CCB document state, and `user_override` reason.
- **DocumentVersion** removed `checklist_item` FK entirely. Added `folder`, `batch`, `doc_type`, `reason`, and `document_hash` (dHash for PDFs, pHash for images). Simplified to 3 statuses: `pendente / aprovado / deletado`. `replaced` is a reason under `deletado`, not a status.
- **`version_number`** scoped to `(folder, doc_type)` instead of `checklist_item`. `is_current` = most recent upload per `(folder, doc_type)`.
- **Duplicate contrato** split: same-batch duplicate tags both folders as `pendente/duplicate_contrato`; pre-existing DB duplicate marks only the new upload as `deletado/duplicate_contrato`.
- **`ocr_complete`** is now an `aprovado` reason (not `pendente`) — OCR success means the document is approved pending cross-check.
- **DocumentChecklist table** deferred to backlog — required docs derived from `KitType.required_docs` at query time.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Rewrote with v5 schema: 3-status models, removed checklist_item, added detailed pipeline flow with field updates |
| [[002-ccb-validation-workflow/backlog-ccb.md]] | `updates` | Added bottom-up kit selection backlog item and extraction_config subsystem |
| [[vault/constitution/event-system-constitution.md]] | `updates` | Rule 12 rewritten: EventLogEntities as independent records, removed bridge/fan-out framing |
| [[vault/guides/developer-guide.md]] | `updates` | Navigation table and entity registry updated with CCB domain entity types |
