---
tags: [filter-system, polymorphic-eligibility, refactor, entity-type, cascade-algorithm, filter-evaluations]
node_type: discovery
is_session: true
layer: domain
nature: technical
status: active
created: 2026-04-18
timestamp: 2026-04-18T00:00:00-03:00
expires: 2026-06-17
conversation_id: merged-polymorphic-filters-arc
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md
  - specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md
promoted_candidates: []
expected_importance: 9
importance_rationale: "Four-session arc that resolved four design contradictions and produced a stable v0.7.0 plan, directly gating Phase 1 execution of the polymorphic filter refactor."
---

# Polymorphic Eligibility Filters — Full Session Arc

## Summary

Four-session arc (2026-04-18 to 2026-04-19) designed and corrected the polymorphic eligibility filter refactor. Architecture discovery established `object_type` and `entity_type` as distinct concepts, designed a dominant-level cascade algorithm covering 7 confirmed scenarios, and replaced `RemessaFilterResult` with a new `filter_evaluations` table. Session 4 found and resolved four design contradictions: `object_type` moved from filter class attribute to `FilterDefinition` DB field; `entity_type` became a closed `EntityType` enum (7 values); historical migration eliminated; dual-read cutover machinery dropped (deploy gap is ~60s with `acks_late=True`). Plan reached v0.7.0, ready for Phase 1 execution.

## Contradictions

- Validates: filter classes must be pure domain functions — `object_type` and `entity_type` are configuration, not class state.
- Validates: filter results are recomputed on every run, not historical records — no migration needed.

## Files touched

- specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md
- specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md
