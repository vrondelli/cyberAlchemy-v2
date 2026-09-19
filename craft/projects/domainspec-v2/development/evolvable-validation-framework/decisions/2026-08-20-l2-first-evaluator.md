---
decision_id: DEC-GCP-003
status: accepted
created: 2026-08-20
resolved_at: 2026-08-20T17:22:42Z
target: TASK-GCP-GRAPH-LAWS
owner: user
decision_gate: pass
implementation_gate: block
authority_effect: none
---

# Decision: EVF L2 Evaluator Family And Ordering

## Decision

Use both Datalog and Alloy for the eventual EVF L2 graph-law proof, with
separate roles behind one provider-neutral request boundary:

1. **C0 — neutral contract and extractor:** define one graph-law request,
   deterministic normalized facts, exact input and extractor digests, and
   provider-specific receipt envelopes.
2. **C1 — Datalog primary:** evaluate recursive reachability, cycle, and closure
   relations over the actual extracted repository graph.
3. **C2 — Alloy secondary:** consume the same normalized fact digest and search
   an explicit finite scope for structural counterexamples.
4. **C3 — non-inflating join:** retain both receipts and compare only through a
   property-specific mapping. Disagreement is `unresolved`; it is never voted
   into a pass.

The user selected this dual direction by stating `authorize both` on
2026-08-20. No further Datalog-versus-Alloy preference decision remains.

## Claim Boundary

The two providers are complementary, not interchangeable:

- Datalog may claim only the result of a declared finite relation query over
  one exact extracted corpus snapshot.
- Alloy may claim only the result of the declared command inside its recorded
  scope. A counterexample is valid evidence; no counterexample is not an
  unbounded proof.
- A joined receipt may claim only property-specific consistency over the shared
  facts digest. It cannot strengthen either provider's claim.

TLC is deferred until EVF has an authored temporal transition-system question,
such as retry, revocation, stale-receipt, or promotion ordering. Cedar is
deferred until EVF has an authorization question expressed through principal,
action, resource, and context. Neither belongs in the current static graph-law
slice.

## Execution Block

This decision selects direction; it does not admit implementation.

The current canonical work-pack makes S3/L2 depend on S2/L1 and marks
`TASK-GCP-GRAPH-LAWS` `blocked-on-L0/L1`. Canonical planning still exposes L0,
while the completed `SWU-GCP-001` receipt is explicitly
`candidate-local-fast-lane` with `release_admission: not-granted`. The current
implementation also has no provider-neutral graph request, extractor, or
provider receipt contract.

Tool readiness is asymmetric:

- the repository-owned Alloy 6.2.0 runner is locally executable and its jar
  matches recorded SHA-256
  `6b8c1cb5bc93bedfc7c61435c4e1ab6e688a242dc702a394628d9a9801edb78d`;
- no Souffle or other approved Datalog runtime is currently available;
- TLC 2.19 is available but is not the selected evaluator for this property;
- Cedar is unavailable and is not the selected evaluator for this property.

Before C0 implementation, an owner must choose and authorize the exact route:

1. reconcile the candidate-local L0 result into the canonical lifecycle, then
   complete S2/L1 before S3/L2; or
2. accept an explicit work-pack replan that lawfully introduces C0 and preserves
   the required L1 evidence boundary.

Before C1 execution, an owner must also approve a pinned Datalog runtime and its
acquisition route. This record does not authorize external downloads or system
installation.

## Formal-Tower Caveat

The existing Alloy/TLA tower contains runnable raw evidence, but its current
claim surfaces disagree: run summaries report executed checks while
`CLAIM-LEDGER.md` and `examples/README.md` still describe the examples as
unvalidated. EVF may inspect the raw Alloy runner but must not treat the tower as
a clean reusable dependency until that documentation state is reconciled.

## Decision-Gate Evidence

- Admissibility request:
  `2026-08-20-l2-first-evaluator.admissibility-request.json`
  - file SHA-256:
    `b5d3ab938d9da3ab8fcb9f2aa6f56b097a4f386b5dcf684f4ff184f7d85acb26`
  - canonical request digest:
    `9b9a2991a2001623f1b192acafa65c9bd38590247952fea2d2cc1213c511fa7e`
- Admissibility receipt:
  `2026-08-20-l2-first-evaluator.admissibility-receipt.json`
  - file SHA-256:
    `f4c67bab272d3f0665f2393dce7c4a075414bbd9da68bb88f5a24d9e99495a6e`
  - outcome: `gate`
  - selected option: `EVF-L2-C-DUAL-DATALOG-ALLOY`

## Decision Record

- Selected option: C, ordered Datalog plus Alloy after prerequisites
- Source of decision: direct user statement `authorize both`
- Provider preference blockers: 0
- Implementation blockers: canonical L0/L1 admission; neutral-contract replan;
  pinned Datalog runtime acquisition
- Mutations authorized by this record: decision artifacts only
- Mutations not authorized: implementation, tool installation, canonical
  planning or ledger apply, promotion, publication, release, or deployment
- Assumptions: `both` refers to the two complementary static-graph providers,
  Datalog and Alloy, as stated in the immediately preceding EVF recommendation
