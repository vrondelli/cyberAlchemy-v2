---
tags: [event-system, pipeline]
node_type: spec
is_session: true
layer: [architecture, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T20:00:00-03:00
expires: 2026-05-22
conversation_id: cf0fd162-2cc1-49ec-a35c-7274c14b574f
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Added `log_entity_event` / `log_entity_event_safe` abstraction to `event_log_service.py` and migrated `run_ocr.py` — localized architecture fix enforcing Constitution Rule 7 for `EventLogEntities` writes."
satisfaction_score:
  mean: 8
  min: 7
  max: 9
  std: 0.8
---

# EventLogEntities Service Abstraction

**Date:** 2026-03-23 20:00 (UTC-3)
**Tags:** #event-system #pipeline

## Summary

This session addressed a Constitution Rule 7 violation in `run_ocr.py`, which was writing directly to `EventLogEntities.objects.create()` instead of going through an infrastructure service abstraction. The investigation revealed that while `EventLog` had a well-established service layer (`log_event()` / `log_event_safe()` in `event_log_service.py`), no equivalent existed for `EventLogEntities`. The session created the missing abstraction and migrated the only production violator.

The session began with the user asking whether `run_ocr.py` is used in production. Analysis confirmed it is — called via the Celery task `run_ocr_task` in `bulk_import_tasks.py` as Phase 6 of the document import pipeline. The user then identified two issues: (1) events were not appearing in the expected monitoring path, and (2) the direct ORM access violated architecture rules.

### Investigation: Production Usage and Event Emission

- **Problem/Goal:** Determine if `run_ocr.py` is used in production and why its events weren't visible.
- **Decision:** Confirmed `run_ocr.py` is production code (Phase 6, async OCR path). Events were being written to `EventLogEntities` directly while monitoring queries `EventLog` via `log_event()`. The mismatch meant events were persisted but invisible to the standard event pipeline.
- **Changes:** No code changes in this phase — diagnosis only.

### Creating the EventLogEntities Service Abstraction

- **Problem/Goal:** No service abstraction exists for `EventLogEntities` writes, unlike `EventLog` which has `log_event()` / `log_event_safe()`.
- **Decision:** Create symmetric functions `log_entity_event()` and `log_entity_event_safe()` in `event_log_service.py`. Keep them simpler than the `EventLog` counterparts — no catalog lookup, tier, TTL, or description template since entity events are lightweight granular records.
- **Changes:** Added both functions to `event_log_service.py`. `log_entity_event_safe()` is the fail-open wrapper for use in code paths where event persistence must not crash the main transaction.

### Migrating run_ocr.py

- **Problem/Goal:** Replace 3 direct `EventLogEntities.objects.create()` calls with the new abstraction.
- **Decision:** Use `log_entity_event_safe()` (not `log_entity_event()`) since OCR event persistence should never crash the extraction pipeline.
- **Changes:** Replaced all 3 calls in `run_ocr_for_version()` and `_mark_unmatched()`. Updated imports accordingly.

Key outputs:
- `event_log_service.py` — added `log_entity_event()` + `log_entity_event_safe()`
- `run_ocr.py` — migrated to use `log_entity_event_safe()`

## Key Decisions

- **Symmetric API surface:** `log_entity_event` / `log_entity_event_safe` mirror `log_event` / `log_event_safe` in naming and behavior, keeping the service layer consistent.
- **No catalog for entity events:** Entity events are simpler than `EventLog` events — no tier, TTL, description template, or idempotency key. The function is a thin wrapper that centralizes the write.
- **Fail-open for OCR path:** Used `log_entity_event_safe()` in `run_ocr.py` since event persistence failure must not crash OCR extraction.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `infrastructure/database/event_log_service.py` | `modified` | Added `log_entity_event()` and `log_entity_event_safe()` — authorised writers for `EventLogEntities` |
| `domains/aquisicao/use_cases/run_ocr.py` | `modified` | Migrated 3 direct `EventLogEntities.objects.create()` calls to `log_entity_event_safe()` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[vault/conversations/2026-03-12-0000-event-log-entities-refactor.md]]| `updates` | That session migrated `run_ocr.py` from `log_event()` → `EventLogEntities.objects.create()`. This session now routes those writes through `log_entity_event_safe()`. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Specs (`ccb-critical-field-check-implementation.md`, `ccb-business-rules-refactor-implementation.md`) still show `EventLogEntities.objects.create()` in proposed code snippets | This session | MEDIUM | Those are implementation proposals for future work — should use `log_entity_event_safe()` when implemented |
| `process_bulk_import.py` imports `EventLogEntities` but never writes to it — dead import | This session | LOW | Cleanup candidate |
