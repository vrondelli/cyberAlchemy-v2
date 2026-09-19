---
artifact_id: UIR-PLAN-UPSTREAM-PATCH-REQUEST-v0.1
status: proposed
owner: invoke design or apply-approved refresh
blocks_swu_011: false
---

# Upstream Design Patch Request

Plan mode did not edit upstream design artifacts. A later `invoke design` or
apply-approved refresh should consider these small deltas:

- `SPEC.md`: add successor evidence outcomes and acceptance criteria for finite
  absence, policy evaluation, owner decisions, and versioned recomposition.
- `ARCHITECTURE.md`: add bounded-search, dossier-policy, and relationship
  owner-decision records plus dossier/index v2 flow.
- `EVIDENCE-CONTRACTS.md`: specify construction rules, failure states,
  prohibited inferences, and predecessor contracts for successor records.

The approved refresh report supplies the operative design delta until these
requests are applied. This request becomes stale if decision policies,
generation-001 handles, or the DS-D8 authority digest change.
