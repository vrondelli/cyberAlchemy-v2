# T5 — Transfer to financial-settlement business rules

Layer/slice: L3/S4. DAG: K, L, M. Complexity: high.

## Objective and SWUs

- SWU-T5-01: present existing C3 deal-split and P4 payout-effects properties,
  four cases, eight mutations and non-admitted residue; obtain domain-owner
  selection of C3, P4, a bounded revision or stop.
- SWU-T5-02: bind the selected property to exact proposal, generated cases,
  adapter, consumer implementation, proof context, tools and observations;
  run counterexample search and mutation calibration; conditionally route a
  confirmed defect repair under separate scope.
- SWU-T5-03: separate reviewer replays the same property and bounds and records
  reusable-core versus financial-adapter effort.

Ordered rules: owner meaning precedes verification; provenance labels distinguish
manual, adopted and TDE-derived properties; positive cases prevent reject-all
success; actual defects are separated from seeded mutations; no-counterexample
is always bounded.

Failure modes: no owner, property drift, consumer adapter not reaching actual
implementation, mutation denominator mismatch, proof-input substitution,
missing effect observation, duplicate/zero payout not covered, or conflicting
review. Each stops transfer promotion or narrows the claim.

Write scope: owner decision, new transfer package, isolated evidence and review.
Existing experimental adoption report remains source evidence, not rewritten
authority.

Done evidence: owner-confirmed property, exact bindings, typed result, complete
selected cases/mutations, independent replay, measured core/adapter effort and
explicit remaining clause residue.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).

