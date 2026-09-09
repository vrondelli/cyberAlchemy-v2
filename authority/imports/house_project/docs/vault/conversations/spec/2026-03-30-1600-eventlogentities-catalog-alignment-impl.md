---
tags: [event-system, infrastructure, pipeline]
node_type: spec
is_session: true
layer: [architecture, domain]
nature: technical
status: active
created: 2026-03-30
timestamp: 2026-03-30T16:00:00-03:00
expires: 2026-05-29
conversation_id: b3a91f04-7e2d-4c88-a501-d9e83c1f2b47
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/event_system/implementation-plan-entity-event-catalog-alignment.md
promoted_candidates:
  - "Rule: shared infrastructure wrappers must not require callers to re-supply data already present in the catalog → event-system-constitution.md"
  - "Rule: error handlers in fail-open wrappers must not reference outer-scope parameters that may be removed → development-practices-constitution.md"
expected_importance: 7
importance_rationale: "This session closed a systemic drift vector in the event infrastructure — the fix is load-bearing (the safe wrapper's fail-open guarantee would have silently broken on the next catalog correction), affects all future callers of log_entity_event, and surfaces two constitution candidates that would prevent a whole class of bugs from recurring."
---

# EventLogEntities — Catalog Alignment Implementation (Steps 2–4)

**Date:** 2026-03-30 16:00 (UTC-3)
**Tags:** #event-system #infrastructure #pipeline

## Summary

This session implemented Steps 2, 3, and 4 of the `EventLogEntities` catalog alignment plan defined in `specs/event_system/implementation-plan-entity-event-catalog-alignment.md`. Steps 0 (renaming misclassified `EventType` values and correcting the catalog) and 1 (adding the `tier` column to `EventLogEntities` and initially deriving it from the catalog) were already complete before the session started.

### Problem

`log_event()` already auto-derives all ontology fields (`tier`, `entity_domain`, `object_type`, `action`, `event_name`) from the event catalog. `log_entity_event()` did not follow the same pattern — it still required callers to explicitly pass `entity_domain` and `object_type`, even though those values are fully determined by the `event_type` alone and already encoded in the catalog. All 8 call sites in `extraction_steps.py` were repeating catalog data verbatim. The problem is drift risk: any future catalog correction would require finding and updating call sites by hand, and there was no mechanism to detect divergence.

### Pre-implementation review

Before writing code, the plan was reviewed against the actual codebase. Two gaps were identified:

1. The plan didn't mention updating the `log_entity_event()` docstring, which still described `entity_domain` and `object_type` as caller-supplied parameters with example values like `'aquisicao' | 'liquidacao'`. After parameter removal this would have been misleading. The docstring was updated as part of Step 2.

2. An acceptance criterion said `KeyError` should be raised with "an actionable message", but the proposed test only asserted `assertRaises(KeyError)` without checking message content. The user confirmed this was acceptable.

A critical pre-existing bug was also discovered during review: the `except` block in `log_entity_event_safe()` referenced `entity_domain` in its format string. After removing `entity_domain` from the signature, this would have caused a `NameError` inside the error handler — silently destroying the fail-open guarantee. The plan correctly identified this bug, and the fix was included in Step 2.

### Step 2 — Signature cleanup (`event_log_service.py`)

`entity_domain` and `object_type` were removed from both `log_entity_event()` and `log_entity_event_safe()`. The function body now derives all three catalog fields inline:

```python
catalog_entry = event_catalog.get(event_type)
tier          = catalog_entry['tier']
entity_domain = catalog_entry.get('entity_domain', '')
object_type   = catalog_entry.get('object_type', '')
```

The error-log format string in `log_entity_event_safe()` was fixed to reference `entity_id` instead of the removed `entity_domain`. The docstring was updated.

### Step 3 — Call site cleanup (`extraction_steps.py`)

All 8 `log_entity_event_safe()` call sites had `entity_domain=...` and `object_type=...` removed. This was a purely mechanical change — all values matched the catalog exactly, so no data was lost. The line numbers matched the plan.

### Step 4 — Test replacement (`test_event_log_service.py`)

`TestLogEntityEvent` and `TestLogEntityEventSafe` were fully replaced:

- Stale `entity_domain='aquisicao'` fixtures removed (these were incorrect even before this refactor, since Step 0 had already corrected the catalog).
- `test_persists_all_fields_correctly` now asserts `tier='tech'`, `entity_domain='documents_validation'`, and `object_type='document'` as catalog-derived values — using `DOCUMENT_OCR_ERROR` specifically because its `tier='tech'` (non-default) proves derivation is not falling back to the field's `default=EventLog.Tier.BUSINESS`.
- DB round-trip assertions extended to cover all three derived fields.
- Dead `KeyboardInterrupt` block in `test_does_not_propagate_exception_to_caller` removed and replaced with proper assertions for `ValueError` and `RuntimeError`.
- New test `test_unregistered_event_type_raises_key_error` added.

## Epistemic Impact

**Validated:** The event-system constitution's principle that the catalog is the single source of truth for event ontology fields. `log_event()` already embodied this; the session extended it to `log_entity_event()`, making the pattern consistent across all event writers.

**Drift fixed:** `log_entity_event()` required callers to re-supply catalog data that was already derivable. This drift has been eliminated. The 8 call sites in `extraction_steps.py` no longer carry dead weight.

**Bug fixed:** `log_entity_event_safe()` had a latent `NameError` bomb in its error handler that would have fired on the next catalog correction that removed `entity_domain` from the outer scope.

**Constitution candidates surfaced (see `promoted_candidates` above):**
- The rule "infrastructure wrappers must not require callers to re-supply catalog-derivable data" should be added to `event-system-constitution.md` to prevent the same class of drift from recurring in future writers.
- The rule "error handlers in fail-open wrappers must not reference outer-scope parameters" should be added to `development-practices-constitution.md` to prevent `NameError`-class silent failures in all future safe wrappers.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/database/event_log_service.py` | modified | Removed `entity_domain`/`object_type` from `log_entity_event()` and `log_entity_event_safe()` signatures; added catalog derivation for both; fixed `NameError` bug in safe wrapper error-log format string; updated docstring |
| `domains/documents_validation/use_cases/extraction_steps.py` | modified | Removed `entity_domain=` and `object_type=` from all 8 `log_entity_event_safe()` call sites |
| `infrastructure/tests/test_event_log_service.py` | modified | Replaced `TestLogEntityEvent` and `TestLogEntityEventSafe` with catalog-aligned versions; removed stale `aquisicao` fixtures; added `test_unregistered_event_type_raises_key_error` |
| `infrastructure/database/models.py` | modified | (Steps 0+1, pre-session) `EventType` enum values corrected; `tier` field added to `EventLogEntities` |
| `infrastructure/messaging/event_catalog.py` | modified | (Step 0, pre-session) `entity_domain` corrected for `DOCUMENT_OCR_ERROR` and `DOCUMENT_CROSS_CHECK_OVERRIDDEN` |
| `migrations/infrastructure_database/0045_eventlogentities_tier.py` | created | Migration for `tier` column on `EventLogEntities` |
| `migrations/infrastructure_database/0046_rename_ocr_and_cross_check_event_type_domain.py` | created | Migration to backfill corrected domain prefix in existing rows of both tables |

## Connections

- `derives-from` → `specs/event_system/implementation-plan-entity-event-catalog-alignment.md` — this session executed Steps 2–4 of that plan
- `validates` → event-system constitution principle: catalog is the single source of truth for ontology derivation
- `contextualizes` → `docs/vault/conversations/spec/2026-03-23-2000-event-log-entities-abstraction.md` — that session established the `log_entity_event()` abstraction; this session completed its alignment

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Ratify "catalog-derivable fields must not be re-supplied by callers" as a rule in `event-system-constitution.md` | MEDIUM | Open |
| Ratify "error handlers must not reference outer-scope parameters that may be removed" in `development-practices-constitution.md` | MEDIUM | Open |
| `test_unregistered_event_type_raises_key_error` does not assert the `KeyError` message content — acceptance criterion for "actionable message" technically unverified | LOW | Acknowledged |
