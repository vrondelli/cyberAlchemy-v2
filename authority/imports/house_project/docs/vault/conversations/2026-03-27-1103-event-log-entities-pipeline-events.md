---
tags: [event-system, ccb, pipeline, infrastructure]
node_type: constitution
is_session: true
layer: architecture, domain
nature: technical, explanatory
status: active
created: 2026-03-27
timestamp: 2026-03-27T11:03:43-03:00
expires: 2026-05-26
conversation_id: 2026-03-27-event-log-entities-pipeline-events
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - docs/vault/constitution/event-system-constitution.md
  - specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Rule 12 amended to a two-dimensional EventLog/EventLogEntities split and 9 new CCB document pipeline events designed with payloads, directly guiding the next observability implementation sprint."
---

# CCB Document Pipeline Events & EventLogEntities Design

**Date:** 2026-03-27 11:03 (UTC-3)
**Tags:** #event-system #ccb #pipeline #infrastructure

## Summary

This session covered three interconnected threads: debugging why `EventLogEntities`
had not been receiving data, designing a complete set of per-document events for
the CCB validation pipeline, and amending Rule 12 of the event system constitution
to reflect a more precise two-dimensional distinction between the two tables.

The root cause of the empty table was identified through systematic investigation:
`run_ocr_for_version` — the only function calling `log_entity_event_safe` — was
never invoked by the actual pipeline. The CCB pipeline performs OCR inline inside
`_step_classify_dvs` and `_step_extract_and_match` in `process_bulk_import.py`,
with no event emission at any step.

A preliminary fix was applied by wiring `log_entity_event_safe` calls into the
pipeline steps, but the main outcome of the session is the discovery document
`document-pipeline-events-discovery.md`, which proposes the full set of
`EventLogEntities` events with structured payloads to be implemented in a
subsequent sprint.

The session also clarified the architecture of the two-table event system:
the distinction is not merely "macro vs granular" but two-dimensional —
`EventLog` records state-changing events (human decisions, lifecycle transitions),
while `EventLogEntities` records per-entity observations (pipeline steps and
human read/consult events). This was ratified as an amendment to Rule 12.

A schema alignment was also identified: `EventLogEntities` needs `actor`, `origin`,
and an expanded `entity_id` field to support human events like `DOCUMENT_VIEWED`.

### Root Cause: EventLogEntities Empty for Two Weeks

- **Problem:** `EventLogEntities` had received no data from the document pipeline.
- **Decision:** `run_ocr_for_version` is dead code in the pipeline context — the
  OCR happens inline and never calls it. The fix is to wire events directly into
  `_step_classify_dvs` and `_step_extract_and_match`.
- **Changes:** Added `log_entity_event_safe` calls in `process_bulk_import.py`
  (OCR_STARTED, OCR_EXTRACTION_COMPLETED/FAILED). Updated `run_ocr.py` to use
  `contract_hash or str(version.pk)` as `entity_id` instead of `contract_hash`
  alone (which could be empty).

### Two-Dimensional Table Split

- **Problem:** Rule 12 described the split as "macro vs granular". This was
  incomplete — a user viewing a document is human, high-volume, and non-state-changing,
  and belongs in `EventLogEntities`. The old description didn't capture this.
- **Decision:** The correct distinction is two-dimensional:
  1. **Granularity:** `EventLog` = 1 row/operation; `EventLogEntities` = 1 row/entity
  2. **State-change:** `EventLog` = state-changing (approve, reject, override);
     `EventLogEntities` = observations (pipeline steps, human reads)
  `CCB_OVERRIDE_JUSTIFICATION` and `DOCUMENT_CROSS_CHECK_OVERRIDDEN` stay in
  `EventLog` because they are state-changing human actions with actor + tier.
- **Changes:** Rule 12 updated in `event-system-constitution.md` (v2.1.0).

### Proposed Document Pipeline Events

Nine new `EventLogEntities` event types were designed with full metadata payloads:

| Event | Trigger |
|---|---|
| `DOCUMENT_OCR_RESULT` | End of `_step_classify_dvs` per DV — text extraction + classification + empresa in one event |
| `DOCUMENT_TEMPLATE_EVALUATED` | End of `_step_extract_and_match` per DV — matched/not + scores + extraction method |
| `DOCUMENT_CRITICAL_FIELDS_VALIDATED` | After `check_critical_fields` per DV |
| `DOCUMENT_NON_CRITICAL_FIELDS_VALIDATED` | After `check_non_critical_coverage` per DV |
| `DOCUMENT_CONTRATO_MATCHED` | `_step_contrato_lookup` found the contrato |
| `DOCUMENT_CONTRATO_NOT_FOUND` | `_step_contrato_lookup` failed |
| `DOCUMENT_CROSS_CHECK_PASSED` | `_step_cross_check` approved |
| `DOCUMENT_CROSS_CHECK_FAILED` | `_step_cross_check` found divergent fields |
| `DOCUMENT_VIEWED` | User opens a document in the UI (human, needs actor) |

Key design decisions:
- `DOCUMENT_OCR_RESULT` consolidates text extraction + doc_type classification
  (previously two separate events) since they happen in the same step.
- Field validation events are kept separate (critical ≠ non-critical).
- `DOCUMENT_VIEWED` is the only human event in `EventLogEntities` — a read/consult,
  not a state change.

### EventLogEntities Schema Alignment

- **Problem:** `EventLogEntities` lacks `actor` and `origin` (needed for
  `DOCUMENT_VIEWED`) and has `entity_id max_length=32` vs `EventLog`'s 255.
- **Decision:** Add `actor` (nullable FK), `origin` (CharField), and expand
  `entity_id` to 255 characters.
- **Changes:** Documented in the discovery doc. Migration not yet written.

Key outputs:
- `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` — full event catalog with payloads, schema alignment requirements, and constitution amendment proposal
- `docs/vault/constitution/event-system-constitution.md` — Rule 12 updated to two-dimensional split (v2.1.0)

## Key Decisions

- **EventLogEntities is for observations, EventLog is for state changes.** Not "macro vs granular" — the split is about whether the event creates a business state change.
- **Human read events go to EventLogEntities.** A user viewing a document is high-volume and non-state-changing, despite being human-originated.
- **`DOCUMENT_OCR_RESULT` consolidates extraction + classification.** These happen in the same pipeline step (`_step_classify_dvs`) and should be one event with a rich payload rather than two separate events.
- **Field validation events stay separate.** Critical and non-critical checks are distinct gates with different downstream behavior.
- **`entity_id` uses `contract_hash or str(version.pk)`.** `contract_hash` is preferred for cross-version traceability; PK is the fallback when hash is not yet assigned.
- **`DOCUMENT_CROSS_CHECK_OVERRIDDEN` stays in EventLog.** It is a state-changing human action with actor, tier, and financial audit significance.
- **Schema alignment needed before implementing `DOCUMENT_VIEWED`.** `actor` and `origin` must be added to `EventLogEntities` first.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/use_cases/process_bulk_import.py` | `modified` | Added `log_entity_event_safe` import and preliminary OCR event calls in `_step_classify_dvs` and `_step_extract_and_match` |
| `domains/documents_validation/use_cases/run_ocr.py` | `modified` | Changed `entity_id` to use `contract_hash or str(version.pk)`; updated `_mark_unmatched` signature from `contract_hash` to `entity_id` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` | `created` | Full discovery: 9 proposed events with payloads, schema alignment requirements, two-dimensional table split rationale |
| `docs/vault/constitution/event-system-constitution.md` | `modified` | Rule 12 updated to two-dimensional split; v2.0.0 → v2.1.0 |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement 9 new EventType enum values + catalog entries | discovery doc | ⚠️ HIGH | pending |
| Migration: add `actor`, `origin` to `EventLogEntities`, expand `entity_id` to 255 | discovery doc | ⚠️ HIGH | pending |
| Replace preliminary OCR events in `process_bulk_import.py` with the full proposed set | discovery doc | ⚠️ HIGH | pending |
| Add `event_key` idempotency to entity events emitted from Celery tasks | constitution Rule 8 | MEDIUM | pending |
| Implement `DOCUMENT_VIEWED` in document detail view | discovery doc | MEDIUM | pending |

## Connections

| Document | Type | Description |
|---|---|---|
| [[event-system-constitution]] | `amends` | Rule 12 updated to two-dimensional split |
| [[document-pipeline-events-discovery]] | `produces` | Discovery doc created this session |
| [[document-validation-pipeline-discovery]] | `extends` | Adds observability layer to the pipeline already documented there |
