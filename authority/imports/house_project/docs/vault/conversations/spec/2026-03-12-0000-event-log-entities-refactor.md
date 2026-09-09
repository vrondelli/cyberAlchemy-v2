---
tags: [event-log, event-log-entities, refactor, migration, architecture]
layer: architecture
nature: reference
status: active
created: 2026-03-12
timestamp: 2026-03-12T00:00:00-03:00
expires: 2026-05-11
conversation_id: 63eb4bf0-bc19-429a-be81-f0458b01e2e4
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-12
expected_importance: 6
importance_rationale: "Refactored event log entities aligning architecture with constitution, cross-cutting change."
---

# EventLogEntities Refactor — Conceptual Correction & FK Removal

**Date:** 2026-03-12
**Tags:** #event-log #event-log-entities #refactor #migration

## Summary

This session corrected a long-standing conceptual misunderstanding of `EventLogEntities`. The table was documented and modelled as a "1-to-N bridge table" pointing back to a parent `EventLog` row. The correct design is that `EventLogEntities` is an independent, co-equal event record table for granular entities (a specific document, a specific parcela). The FK to `EventLog` was removed via migration 0036, with `stream_id` and `event_type` added as independent fields. The session also migrated the first production call sites (`run_ocr.py`, `process_bulk_import.py`) from `log_event()` → `EventLogEntities.objects.create()` for all document-level events.

Key outputs:
- `migration 0036_eventlogentities_remove_fk.py` — removes FK, adds `stream_id` + `event_type` + formalises `entity_domain` + `object_type`
- `run_ocr.py` — all 3 OCR events now write to `EventLogEntities` only
- `process_bulk_import.py` — `DOCUMENT_VERSION_CREATED` now writes to `EventLogEntities` only
- Constitution Rule 12 and Developer Guide §9 rewritten

## Conversation Arc

**Started:** User corrected the assistant's description of `EventLogEntities` as a "1-to-N bridge table," explaining that it is simply the event record for granular entities and has no inherent link back to macro-level `EventLog` events.

**Ended:** FK removed, migration applied, document-level OCR and version-creation events migrated exclusively to `EventLogEntities`; remaining document event types (`DOCUMENT_SOFT_DELETED`, `DOCUMENT_RENAMED`, etc.) identified as future call sites to implement.

## Key Decisions

- **No FK on `EventLogEntities`:** The table is fully independent. Hierarchy between entities is encoded in domain data (hashes), not event table FK chains.
- **`entity_domain` + `object_type` instead of `entity_type`:** DB already had these two columns from prior prod drift; formalised in migration 0036 and model.
- **Unique constraint dropped:** Without the FK, the `(event, entity_type, entity_id)` constraint no longer makes sense. The same entity can legitimately have multiple events of the same type.
- **Document events go ONLY to `EventLogEntities`:** Avoids the error of recording the same event in two places. `log_event()` is not called for document-level events.
- **`entity_id` = deterministic hash, not PK:** `contract_hash` used instead of `str(contrato.pk)`, aligning with Constitution Rule 12.
- **Entity registry additions:** `contracts_batch`, `contract`, `document`, `folder` added to the entity registry in both the constitution and developer guide.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `DOCUMENT_SOFT_DELETED` → `EventLogEntities` | Constitution Rule 12 | ⏳ No call site yet |
| `DOCUMENT_RENAMED` → `EventLogEntities` | Constitution Rule 12 | ⏳ No call site yet |
| `DOCUMENT_UNMATCHED_FLAGGED` → `EventLogEntities` | Constitution Rule 12 | ⏳ No call site yet |
| `CCB_OVERRIDE_JUSTIFICATION` → `EventLogEntities` | Constitution Rule 12 | ⏳ No call site yet |
| `DOCUMENT_CROSS_CHECK_FAILED` → `EventLogEntities` | Constitution Rule 12 | ⏳ No call site yet |
| `DOCUMENT_BULK_IMPORT_APPROVED` → also write `EventLogEntities` rows per document | Constitution Rule 12 | ⏳ Not yet implemented |
| `FILTER_RESULT_RECORDED` → `EventLogEntities` per failing installment | Constitution Rule 12 | ⏳ Not yet implemented |

## Backlog Items Added

- ⚠️ HIGH — Implement `EventLogEntities.objects.create()` for cross-check, override, soft-delete, and rename document events when those use cases are built
- ⚠️ HIGH — Add `EventLogEntities.bulk_create()` to `approve_batch()` for per-document entity rows
- MEDIUM — Add `EventLogEntities.bulk_create()` to filter pipeline for per-installment entity rows

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/architecture/event-system-constitution.md]] | `updates` | Rule 12 rewritten — no bridge table; entity registry extended |
| [[event_system/developer-guide.md]] | `updates` | §9 rewritten; architecture diagram label updated; entity registry extended |
| [[database/models.py]] | `updates` | `EventLogEntities` FK removed; `stream_id`, `event_type`, `entity_domain`, `object_type` added |
|[[infrastructure_database/0036_eventlogentities_remove_fk.py]]| `implements` |Idempotent migration handling prod drift and fresh test DB|
| [[aquisicao/use_cases/run_ocr.py]] | `updates` | OCR events migrated to `EventLogEntities` only |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | `DOCUMENT_VERSION_CREATED` migrated to `EventLogEntities` only |
| [[tests/test_sprint2_models.py]] | `updates` | `TestEventLogEntities` rewritten for new schema |
| [[aquisicao/tests/test_ocr.py]] | `updates` | 3 test assertions updated to query `EventLogEntities` |
