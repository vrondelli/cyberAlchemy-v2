---
tags: [event-system, architecture, infrastructure]
node_type: implementation-plan
is_session: true
layer: [architecture, application]
nature: [technical, procedural]
status: active
created: 2026-03-30
timestamp: 2026-03-30T14:30:00-03:00
expires: 2026-05-29
conversation_id: eventlogentities-catalog-alignment-20260330
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/event_system/implementation-plan-entity-event-catalog-alignment.md]
promoted_candidates: [event-system-constitution.md amendment — callers must not override catalog-defined entity_domain/object_type]
expected_importance: 7
importance_rationale: "The session closes a real schema and API inconsistency against an established constitutional pattern, produces a concrete execution plan for the remaining work, and surfaces a candidate amendment to the event-system constitution."
---

# EventLogEntities — Catalog Alignment

**Date:** 2026-03-30 14:30 (UTC-3)
**Tags:** #event-system #architecture #infrastructure

## Summary

This session addressed two related inconsistencies in the `EventLogEntities` table and its writer service, discovered by comparing them against the already-established pattern in `EventLog` / `log_event()`.

### Problem 1 — Missing `tier` column on `EventLogEntities`

The `EventLog` table has a `tier` column (`'business'` | `'tech'`) and `log_event()` auto-derives it from the event catalog. `EventLogEntities` had no such column at all, making it impossible to filter or prune entity events by tier — an inconsistency with the `EventLog` schema pattern. Since every event in the catalog already carries a `tier` value, the fix was straightforward: add the column to the model with `default=EventLog.Tier.BUSINESS`. This default is safe precisely because the event-system constitution already prohibits tech events from using `EventLogEntities`. `log_entity_event()` was updated to do a catalog lookup on each call and pass the derived `tier` to `objects.create()`. Migration `0045` was created and applied.

### Problem 2 — Redundant `entity_domain` and `object_type` parameters

After implementing the tier fix, we compared the `log_entity_event()` signature against `log_event()`. `log_event()` auto-derives `entity_domain`, `object_type`, `action`, and `event_name` from the catalog — callers pass none of those. But `log_entity_event()` still required callers to explicitly pass `entity_domain` and `object_type`, creating a drift risk: if the catalog entry changes, the call site won't be updated automatically.

We checked all 8 call sites in `extraction_steps.py` and confirmed that every single one passes values that are verbatim copies of the catalog. No caller has a legitimate reason to override these fields — they are ontological facts about the event type, not runtime context. No alternative approach was considered: the pattern is already established and proven by `log_event()`, and the constitutional constraint means callers should never need to deviate from catalog-defined values.

Rather than implementing this refactor immediately, we wrote a full 4-step implementation plan so the work is sequenced and reviewable.

### Implementation plan output

`specs/event_system/implementation-plan-entity-event-catalog-alignment.md` covers:
- **Step 1** (done) — `tier` column added to model, service, and migration.
- **Step 2** — Remove `entity_domain` and `object_type` from `log_entity_event()` and `log_entity_event_safe()` signatures; derive from catalog.
- **Step 3** — Remove the two now-redundant arguments from all 8 call sites in `extraction_steps.py`.
- **Step 4** — Update `test_event_log_service.py` to reflect the new signature and assert catalog-derived values.

## Epistemic Impact

The constitutional rule that tech events must not use `EventLogEntities` was **confirmed** in practice — it is the exact reason `default=EventLog.Tier.BUSINESS` is valid. The session did not challenge it; it relied on it.

The session identified that `log_entity_event()` had **drifted** from the established `log_event()` pattern. The rule "callers pass only what the catalog cannot derive" was already the spec for `log_event()` but was never enforced on `log_entity_event()`.

**Promoted candidate:** The implicit rule *"no caller of an entity event writer may override catalog-defined `entity_domain` or `object_type`"* is not yet formally written. It should be ratified as an amendment to `docs/vault/constitution/event-system-constitution.md`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/database/models.py` | modified | Added `tier` field (CharField, `Tier` choices, `default=BUSINESS`) to `EventLogEntities`. Mirrors `EventLog` schema; enables tier-based filtering of entity events. |
| `infrastructure/database/event_log_service.py` | modified | `log_entity_event()` now looks up the catalog and derives `tier` before persisting. Docstring updated to remove the stale claim of "no catalog lookup". |
| `migrations/infrastructure_database/0045_eventlogentities_tier.py` | created | Adds `tier` column to `event_log_entities` table with non-null default `'business'`. |
| `specs/event_system/implementation-plan-entity-event-catalog-alignment.md` | created | Full 4-step implementation plan for the remaining catalog alignment work. |

## Connections

- `validates` → `docs/vault/constitution/event-system-constitution.md` — the constitutional prohibition of tech events on `EventLogEntities` was applied and confirmed as the basis for the `default=BUSINESS` decision.
- `contextualizes` → `specs/event_system/developer-guide.md` — the developer guide describes how `log_event()` auto-derives fields; this session extends that pattern to `log_entity_event()`.

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Implement Step 2: remove `entity_domain`/`object_type` from `log_entity_event()` signature | HIGH | Not started — plan written |
| Implement Step 3: update 8 call sites in `extraction_steps.py` | HIGH | Not started — dependent on Step 2 |
| Implement Step 4: update tests in `test_event_log_service.py` | HIGH | Not started — dependent on Steps 2–3 |
| Ratify "callers must not override catalog-defined `entity_domain`/`object_type`" as a formal rule in `event-system-constitution.md` | MEDIUM | Not started |
| Audit other event writer services for similar catalog-derivation drift | MEDIUM | Not started — only `log_entity_event()` was compared in this session |
