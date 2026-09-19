---
decision_id: DEC-GCP-004
status: selected-composite
created: 2026-08-20
target: evf-l1-repeatability-slice
owner: user
authority_effect: none
---

# Decision: Which Exact Step Opens EVF After The Candidate-Local L0 Proof?

## Owner Selection

On 2026-08-20 the owner responded `1 and 2`. This selects both action routes,
not a merged rule:

1. `PayoutEligibilityRule` with exactly the one-way P4 contract; then
2. `NoDuplicateMakeupRule` with a fresh R4 contract and proof.

The normalized composite route is
`EVF-L1-AB-ORDERED-DISTINCT-RULES`. Its structural prefilter receipt is
`DEC-GCP-004-options-1-and-2.admissibility-receipt.json` with request digest
`749a57f5b1382274e485d1fee35985d4d96eb61f7ea990f61f9fc2c4fb0ed5e3`.
The two Rules keep distinct IDs, predicates, bindings, tests, receipts, and
claim ceilings. They may share `GenerateSettlement` as their target, but their
semantics must never be merged.

## Remaining Blocked Consequential Work

The current EVF plan requires L1 repeatability before L2 graph laws. The future
L2 direction remains a neutral C0 contract and extractor, then Datalog, Alloy,
and a non-inflating joined receipt. That decision does not change the layer
order or enter the present Work Pack.

`DEC-GCP-005` now selects option A for the R4 pure-decision truth table. The
ordered two-SWU tranche is semantically complete for proposal-only planning.
Canonical planning apply, executable L1 SWUs, C0 implementation, provider
installation, and L2 implementation remain blocked on exact plan review,
owner acceptance, apply, and readiness gates.

## Question

Which exact step should open the post-L0 EVF frontier?

## Admissible Options

### 1. `PayoutEligibilityRule` with exactly P4 — recommended

Admit the generated
`PayoutEligibilityRule --enforces--> GenerateSettlement` edge with one exact
meaning: `totalPayout > 0` and no existing `PAYOUT` for `endDate` implies one
ordered `PAYOUT` write followed by one `PayoutCreated` event, both with matching
amount and date. Author one `SWU-GCP-002` that proves the EVF graph-to-receipt
path can repeat without key-door identities and compares exact digests to L0.

- Benefit: exercises a real, different feature with existing graph, semantic,
  binding, replay, and mutation material.
- Cost/risk: canonical `SPEC.md` names `NoDuplicateMakeupRule`, so the Plan must
  reconcile that identity conflict. Your choice admits only P4's one-way
  implication for bounded EVF candidate-local reuse; it does not admit zero or
  duplicate-payout converses, R5, promotion, or release.
- Downstream: finish L1, then open C0 -> Datalog -> Alloy -> joined receipt.

### 2. Canonical `NoDuplicateMakeupRule` with a fresh R4 proof

Keep the canonical
`NoDuplicateMakeupRule --enforces--> GenerateSettlement` edge and define its
exact duplicate-`MAKEUP_APPLIED` guard in a new owner-approved semantic capsule.
The existing R4 binding is substrate, not accepted proof; the minted graph,
fixtures, effect boundary, and EVF receipt must be authored fresh.

- Benefit: preserves the canonical feature name and stated rule intent.
- Cost/risk: has materially less reusable admitted evidence than option 1 and
  requires more new semantics and fixtures before execution can begin.
- Downstream: finish that L1 receipt, then open C0 -> Datalog -> Alloy -> join.

### 3. Replan C0 before L1 repeatability

Explicitly change the Work-Pack ordering so the provider-neutral request,
deterministic extractor, and provider-receipt contract are built as enabling
work before choosing/executing the second-slice proof.

- Benefit: establishes the neutral boundary earlier and lets later Datalog and
  Alloy share one fact digest.
- Cost/risk: it adds abstraction before repeatability evidence and still leaves
  the exact L1 slice unresolved. Datalog and Alloy remain blocked.
- Downstream: author C0 as a narrow reversible unit, return to this L1 choice,
  then continue to C1/C2/C3.

### 4. Defer

Keep the plan at `owner-prerequisite`. Preserve L0 and DEC-GCP-003, but author no
mutation-capable continuation.

### 5. Stop

End EVF continuation at the current candidate-local L0 proof.

### Explain / more context

Non-committal. Expand the exact contracts, write scopes, and validation burden,
then ask the same decision again.

## Structurally Rejected Options

- Another key-door copy: it would not demonstrate a second admitted slice.
- Start Datalog now: C0 is absent, L1 is unresolved, and no Datalog runtime is
  installed.
- Merge options 1 and 2 into one Rule: P4 is a PAYOUT effect implication while
  R4 is a duplicate MAKEUP_APPLIED guard.
- Implement both in one SWU or in parallel: they have independent acceptance
  boundaries but share source/graph generation targets, so they must be
  serialized.

## Recommendation

The owner selected both recommended P4 and fresh R4 routes. Execute P4 first
because it has the stronger existing candidate substrate, but author the
additive two-rule source/graph postimage before either proof so both receipts
bind one stable graph digest. Complete R4 second; a valid P4 receipt remains
valid if R4 fails, but composite L1 closure remains blocked.

## Decision Record

- Selected option: `EVF-L1-AB-ORDERED-DISTINCT-RULES`
- Source of decision: direct user response `1 and 2`, 2026-08-20
- Order: `SWU-GCP-002-P4` then `SWU-GCP-003-R4`
- L1 terminal rule: both independent receipts pass against the same reconciled
  graph digest; no vote or semantic merge
- Remaining semantic blockers in this decision: 0
- Next gate: independent review of the exact proposal-only Plan postimages
- Assumptions: none
