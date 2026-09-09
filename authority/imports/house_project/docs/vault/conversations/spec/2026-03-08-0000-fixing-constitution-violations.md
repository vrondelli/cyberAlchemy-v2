---
tags: [spec, event-system]
layer: architecture
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: f3285fb8-3c3e-460a-9a0e-94b1a7974e47
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 5
importance_rationale: "Fixed event-system code to comply with architecture constitution, establishing enforcement precedent."
---

# Fixing Constitution Violations

**Date:** 2026-03-08  
**Tags:** #spec #event-system

## Summary

Updated the Phase 6 implementation plan to address all identified inconsistencies with the project constitutions. Made specific code and documentation changes to ensure compliance with folder structure, event system, and development practice rules.

## Key Decisions

- `JustifyFilterOverrideUseCase` relocated out of `shared_services` into the correct domain
- `entity_type` and `entity_id` corrected for event logging
- `stream_id` generation aligned with existing conventions
- Test files and API endpoints relocated to comply with folder structure rules

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `validates` | Phase 6 plan updated to comply |
| [[folder-structure-constitution]] | `validates` | File placements corrected to follow the constitution |
