# Distill Validation: EVF L1 Repeatability

- Mode: validate
- Scope: the staged post-L0 L1 Plan and two-SWU Work Pack
- Result: `flag`
- Authority effect: none

## Smallest Coherent Units

`SWU-GCP-002-P4` and `SWU-GCP-003-R4` are the smallest independently
meaningful proof boundaries. P4 owns one effect implication and the shared graph
freeze. R4 owns one pure Boolean decision. Neither is a broad task-shaped bucket.

## Split Analysis

- Reject graph-only P4 split: structural presence can pass without the effect.
- Reject predicate/effect P4 split: neither half proves `enforces` alone.
- Reject one-sided R4 splits: option A explicitly selects both zero and duplicate
  cases.
- Retain separate P4/R4 SWUs: either result can be evaluated without semantically
  merging the other; P4 remains valid if R4 fails.

## Recomposition Proof

The terminal join requires two Rule/edge/obligation/binding/test/receipt
identities and one identical frozen graph/source digest. This recomposes into
the narrow L1 repeatability question without implying general graph laws.

## First-Unit Narrowness

P4 is first because it has the strongest existing experimental substrate and is
the only unit that needs to reconcile and freeze shared source/graph bytes. R4
then becomes a smaller zero-graph-mutation consumer.

## Flag

The unit topology and semantic ceilings pass. Mutation-capable handoff remains
flagged because the source Design lacks validator-owned pass/selection evidence,
and the exact postimages still need independent review, explicit owner
acceptance, canonical apply, and readiness activation. These are activation and
lifecycle gates, not requests to change SWU semantics.

The package classifies the complete shared-gap and W0-W3 wave denominator,
redirects its four stale members, and exact-ref preserves the one truthfully
deferred member. Candidate validation must reject a set mismatch, unclassified
member, or contradictory current-looking EVF gap or wave surface.

## Deferred Complexity

C0, Datalog, Alloy, TLC, Cedar, broader graph laws, breadth, consumer proof,
release, publication, deployment, and production are excluded.

## Balancer Reconciliation

The independent topology audit returned `flag` and required exactly two
serialized proof SWUs, graph reconciliation inside P4, R4 zero graph/source
mutation, and C0 exclusion. This candidate follows that shape. Exact validator
commands and finite target paths are now named; review/acceptance/apply remain
open.
