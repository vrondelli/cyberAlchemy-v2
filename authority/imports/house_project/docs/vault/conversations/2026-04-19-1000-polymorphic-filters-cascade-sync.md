---
tags: [filter-system, polymorphic, cascade, spec-003, plan-sync]
node_type: implementation-plan
is_session: true
layer: [architecture, domain]
nature: [procedural, technical]
status: active
created: 2026-04-19
timestamp: 2026-04-19T10:00:00-03:00
expires: 2026-06-18
decisions_made: true
contradictions_found: true
specs_updated: [specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md, specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Corrects the cascade model from 'immediate source' to 'dominant-level', resolves two unconfirmed edge cases, and aligns both design docs to the corrected model before the validation session."
---

# Polymorphic Filters — Cascade Edge Cases & Doc Sync

## Objective

Record the session that confirmed two unresolved cascade edge cases and applied all agreed corrections to both the plan and discovery documents, advancing both from draft to active.

## Summary

Confirmed Scenario F (all three hierarchy levels fail → dominant = remessa, all non-direct get `from_remessa`) and Scenario C (two contracts fail directly → dominant = contrato). Replaced the "immediate source" cascade model with the dominant-level model: every non-direct entity gets `from_{dominant_level}`, the highest level with at least one direct failure. Also corrected enum locations (three enums to `domains/document_validation/choices.py`), removed `entity_type` from filter class attributes, and stripped liquidação namespace suffixes. Both plan (v0.5.0 → v0.6.0) and discovery (v0.4.0 → v0.5.0) advanced to `active`.

## Files touched

- `specs/003-remessa-upload-with-events/docs/filter-system/refactor/plan-polymorphic-filters.md`
- `specs/003-remessa-upload-with-events/docs/filter-system/refactor/discovery-polymorphic-filters.md`
