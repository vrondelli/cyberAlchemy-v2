---
tags: [frontend-backend, api-contracts, idempotency, error-standardization, sprint-planning, cors]
node_type: discovery
is_session: true
layer: cross-cutting
nature: decision
status: active
created: 2026-04-10
timestamp: 2026-04-10T18:00:00-03:00
expires: 2026-06-09
conversation_id: merged-kx9p2-k8p5q-r4k7p-m9k3t
decisions_made: true
contradictions_found: false
specs_updated:
  - specs/frontend-backend/docs/discovery-frontend-backend-contracts.md
  - specs/frontend-backend/docs/prep-idempotency-design.md
  - specs/frontend-backend/docs/prep-api-contract-constitution-draft.md
  - specs/frontend-backend/docs/implementation-plan.md
  - specs/frontend-backend/README.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Captures the full arc from bug discovery to approved 82h execution plan with concrete architectural decisions (idempotency strategy, error standardization scope, backward compatibility) that constrain all subsequent implementation work."
---

# Frontend-Backend Communication Contracts — Full Arc

## Summary

Over April 10-11, 14+ sessions progressed from CORS + invalid token bug discovery through contract discovery (5 communication patterns, 4 critical tensions), two rounds of robot-talks that grew the plan from 38.5h to 82h, and deployment integration. Victor approved the FULL 4-week scenario (D1A+D2A+D3A+D4A, 82h, April 14 kickoff). Key decisions: idempotency via body fingerprint + Redis SETNX, error standardization across ~55 paths, job polling, backward compatibility via Accept Both/Return New. Remaining blockers: CORS/token fix and 1.5h error audit before Sprint 0.

## Files touched

- specs/frontend-backend/docs/discovery-frontend-backend-contracts.md
- specs/frontend-backend/docs/prep-idempotency-design.md
- specs/frontend-backend/docs/prep-api-contract-constitution-draft.md
- specs/frontend-backend/docs/implementation-plan.md
- specs/frontend-backend/README.md
