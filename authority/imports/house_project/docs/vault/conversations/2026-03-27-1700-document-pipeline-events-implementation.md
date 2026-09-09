---
tags: [event-system, pipeline, ccb, infrastructure]
node_type: spec
is_session: true
layer: application, architecture
nature: technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T17:00:00-03:00
expires: 2026-05-26
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Established the canonical observability contract for the CCB bulk import pipeline — 7 named event types with actor/origin attribution — and amended constitution Rule 12 that had an incorrect prohibition."
---

# Document Pipeline Events — Implementation Session

**Date:** 2026-03-27 17:00 (UTC-3)
**Tags:** #event-system #pipeline #ccb #infrastructure

## Summary

This session implemented the document pipeline events system described in the discovery and implementation plan specs. The work adds observability to the CCB bulk import pipeline by emitting granular EventLogEntities events at every pipeline step, replacing the incomplete OCR trio (`DOCUMENT_OCR_STARTED`, `DOCUMENT_OCR_EXTRACTION_COMPLETED`, `DOCUMENT_OCR_EXTRACTION_FAILED`) with 7 well-defined outcome events.

### Discovery & Implementation Plan Review

The session began by reviewing both `document-pipeline-events-discovery.md` (v0.3.0) and `document-pipeline-events-implementation.md` (v0.1.0). The discovery was assessed as ready. The implementation plan had gaps: missing detail on the two emission points for `DOCUMENT_EXTRACTION_RESULT`, no concrete step for `run_ocr.py` cleanup, missing `_entry()` catalog definitions, and no E2E test specification. The implementation plan was rewritten to v0.2.0 with exact line references, full catalog entry code, and concrete steps for all identified gaps.

### Schema & Infrastructure Foundation (Phase 1)

Two new identity hash functions (`document_hash`, `folder_hash`) were added to `entity_identity.py`. The `EventLogEntities` model received `actor` (FK, nullable) and `origin` (CharField) fields, and `entity_id` was widened from `max_length=32` to `255`. The `log_entity_event` / `log_entity_event_safe` signatures were extended with backward-compatible `actor` and `origin` params. Seven new `EventType` enum values were added under the `documents_validation` domain, and 7 corresponding CATALOG entries were created. Five old catalog entries were deleted (OCR trio + cross-check passed/failed). Constitution Rule 12 was amended to allow `log_entity_event_safe` for sequential pipeline steps.

### Pipeline Event Emission (Phase 2)

The core implementation modified `process_bulk_import.py` to emit events at each pipeline step. `_step_classify_dvs` was refactored to emit `DOCUMENT_EXTRACTION_RESULT` on failure paths (download failed, no text, unclassifiable). `_step_extract_and_match` emits `DOCUMENT_EXTRACTION_RESULT` (success), `DOCUMENT_CRITICAL_FIELDS_EVALUATED`, and `DOCUMENT_NON_CRITICAL_FIELDS_EVALUATED` at the end of each per-DV loop. Transient attributes (`_extraction_method`, `_critical_evaluated`, `_non_critical_evaluated`, etc.) propagate data from the three extraction sub-functions to the emission point. `_step_merge_identificacao`, `_step_kit_evaluation`, and `_step_cross_check` each received a `batch` parameter for event context. `_step_contrato_lookup` uses a nested helper (`_emit_contrato_event`) for DRY emission across its 6 exit paths.

### Cleanup & Bug Fix (Phase 3)

All old OCR trio emissions were removed from `process_bulk_import.py`. `run_ocr.py` (dead code, never enqueued) had all 5 event emissions removed with a TODO comment for future revival. The catalog test was updated for new/removed event types. During live testing, `DocumentVersion.created_at` was discovered to not exist — the field is `uploaded_at`. This was fixed across all 5 references in the pipeline code.

### Migration Issue

The auto-generated Django migration tried to drop a constraint `event_log_entities_unique_event_entity` that didn't exist in the production DB. The `RemoveConstraint` operation was removed from the migration file to fix this.

### Worktree Friction

The implementation was initially done on a git worktree branch (`feature/document-pipeline-events`), following the `executing-plans` skill. This caused significant friction: the Celery worker ran old code from main while Django served the new code from the worktree, making live testing impossible. The branch was merged to main and the worktree skills were disabled per user request.

## Epistemic Impact

- **Constitution Rule 12 — contradiction resolved.** The rule previously stated "Always use `bulk_create` — never create entries one by one with `save()`". This was incorrect for the document pipeline where events are emitted at different points in a sequential per-document loop. Amended to distinguish batch insertion from sequential pipeline emission.
- **`DocumentVersion.created_at` does not exist.** The discovery and implementation plan assumed `created_at`; the actual field is `uploaded_at`. This assumption was baked into the `document_hash()` call signature in the plan and would recur in future work touching DocumentVersion timestamps.
- **`EventLogEntities` schema gap.** The table was missing `actor` and `origin` fields that `EventLog` already had. Now aligned for these two fields.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `infrastructure/entity_identity.py` | modified | Added `document_hash` and `folder_hash` identity helpers |
| `infrastructure/database/models.py` | modified | Added `actor`, `origin` to `EventLogEntities`; `entity_id` max_length 32→255; 7 new `EventType` enum values |
| `infrastructure/database/event_log_service.py` | modified | Added `actor`/`origin` params to `log_entity_event`/`log_entity_event_safe` |
| `infrastructure/messaging/event_catalog.py` | modified | 7 new `_entry()` registrations; deleted 5 obsolete entries; fixed stale references |
| `docs/vault/constitution/event-system-constitution.md` | modified | Rule 12 amended: bulk_create guidance + code example fix |
| `domains/documents_validation/use_cases/process_bulk_import.py` | modified | 7 event emissions added; 4 old removed; `created_at` → `uploaded_at` bug fix |
| `domains/documents_validation/use_cases/run_ocr.py` | modified | Removed 5 dead event emission calls |
| `domains/aquisicao/tests/test_event_types_catalog.py` | modified | Updated for new/removed event types |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | modified | Added `TestPipelineEvents` E2E test class (11 tests) |
| `migrations/infrastructure_database/0044_eventlogentities_actor_origin_entityid.py` | created | Schema migration for actor, origin, entity_id |
| `specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md` | modified | Rewritten to v0.2.0 with full detail |

## Connections

| Document | Type | Description |
|---|---|---|
| [[document-pipeline-events-discovery]] | `implements` | Discovery that defined the 7 events and schema |
| [[document-pipeline-events-implementation]] | `contextualizes` | Implementation plan reviewed, detailed, and executed |
| [[event-system-constitution]] | `amends` | Rule 12 contradiction resolved |
| [[ccb-flow-refactor]] | `relates-to` | Pipeline steps where events are emitted |

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Capture `EventLogEntities`/`EventLog` field parity as explicit spec | Discovered during actor/origin migration | HIGH | open |
| Add `DocumentVersion` field reference to data dictionary (`uploaded_at`, not `created_at`) | Bug found during implementation | MEDIUM | open |
| Update `document-pipeline-events-implementation.md` to reflect `uploaded_at` fix | Plan still says `created_at` | MEDIUM | open |
