---
decision_id: DEC-GCP-005
status: selected
created: 2026-08-20
target: financial-settlement-r4-proof-contract
owner: user
authority_effect: none
---

# Decision: What Exact R4 Contract Must The Second L1 SWU Prove?

## Owner Selection

On 2026-08-20 the owner responded `A` after requesting and receiving the
expanded truth-table explanation. This selects
`EVF-R4-A-ISOLATED-PURE-DECISION`.

Given every non-duplicate makeup precondition is fixed at an
otherwise-eligible value, the exact R4 decision is:

- zero existing same-date `MAKEUP_APPLIED` records implies
  `shouldCreateMakeupAppliedEvent = true`;
- one or more existing same-date `MAKEUP_APPLIED` records implies
  `shouldCreateMakeupAppliedEvent = false`.

The selected contract proves only this Boolean decision boundary. It does not
claim that a transaction is written, an event is emitted, every broader
settlement precondition is satisfied, or P3, P4, or R5 is proved.

## Why This Decision Was Required

`DEC-GCP-004` now selects both Financial Settlement rule routes as distinct,
ordered SWUs. P4 is exact. R4 is not: current sources agree that a second
same-date `MAKEUP_APPLIED` must be blocked, but they do not say whether the
zero-existing case is a positive pure-decision obligation or remains
unspecified.

This choice changes the authored predicate, fixture denominator, mutations,
done criteria, and maximum receipt claim. It cannot be inferred from the shared
operation or from P4/R5 evidence.

## Question

Choose the exact pure R4 contract:

### A. Isolated two-sided pure decision — recommended

Given all non-duplicate makeup preconditions are held at an otherwise-eligible
value:

- zero existing same-date `MAKEUP_APPLIED` records implies
  `shouldCreateMakeupAppliedEvent = true`;
- one or more existing same-date `MAKEUP_APPLIED` records implies
  `shouldCreateMakeupAppliedEvent = false`.

The SWU proves only this pure decision truth table. It does not claim that a
transaction is written or an event emitted.

- Benefit: covers both sides of the duplicate boundary and matches the current
  R4 binding shape without importing unrelated preconditions.
- Cost/risk: requires an explicit otherwise-eligible fixture capsule so `true`
  is not misread as an unconditional effect requirement.
- Downstream: author positive, duplicate, other-date, other-type, stale-binding,
  predicate-tamper, observation-tamper, and receipt-tamper cases.

### B. Rejection-only one-way guard

Prove only that one or more existing same-date `MAKEUP_APPLIED` records forces
`shouldCreateMakeupAppliedEvent = false`. Leave the zero-existing result
unspecified.

- Benefit: mirrors only the literal “block a second” canonical sentence.
- Cost/risk: weaker repeatability evidence; it cannot detect an implementation
  that always rejects makeup creation.
- Downstream: terminal claim is one-way duplicate rejection only.

### E. Defer

Preserve the selected two-rule scope, but keep composite L1 planning and
execution blocked.

### F. Stop R4

Do not close the selected composite L1 tranche. P4 may remain a separately
planned candidate, but C0 does not open through the composite route.

### Explain / more context

Non-committal. Expand the fixture truth table, mutation burden, and claim ceiling,
then ask the same decision again.

## Structurally Rejected

- Actual MAKEUP_APPLIED write/event trace: that is a separately owned effect
  contract such as P3, not the R4 Boolean rule.
- Reuse P4 or R5: those own PAYOUT semantics, not MAKEUP_APPLIED.

## Recommendation

Choose `A`. It is still a pure, bounded rule proof, but unlike rejection-only
coverage it kills the always-false implementation and demonstrates a complete
isolated duplicate boundary. The “otherwise eligible” premise prevents claim
inflation into an unconditional write or event obligation.

## Decision Record

- Selected option: `EVF-R4-A-ISOLATED-PURE-DECISION`
- Source of decision: direct user response `A`, 2026-08-20, after the requested
  explanation
- Admissibility receipt:
  `DEC-GCP-005-r4-proof-contract.admissibility-receipt.json`
- Request digest:
  `8f93869d723706b48561fd0e0c40564253b4b451a50d49ff1894a64f057fe1ff`
- Remaining blockers in this decision: 0
- Assumptions: none
- Next route: resume `invoke:plan` in proposal-only mode for the ordered P4 then
  R4 L1 tranche
