---
artifact: invoke-plan
status: proposal-blocked-on-design-validation
updatedAt: 2026-08-20
docType: plan
sourceDefine: DEFINE.md
sourceDesign: DESIGN.md
complexity: high
nextRoute: independent-plan-review
authorityEffect: none
---

# Plan: EVF Post-L0 Repeatability

## Outcome

Establish the next truthful EVF frontier after the candidate-local L0 proof.
The selected L1 tranche contains two distinct, serialized Financial Settlement
`Rule --enforces--> GenerateSettlement` slices:

1. `SWU-GCP-002-P4` proves the strict one-way eligible-payout effect contract.
2. `SWU-GCP-003-R4` proves the isolated two-sided duplicate-makeup Boolean
   decision selected in `DEC-GCP-005`.

Both receipts must bind one source-owned, regenerated Financial Settlement graph
and source-set digest. The Rules, edges, obligations, bindings, tests, mutations,
and receipts remain independent. A terminal composite verifier may close L1 only
after both receipts pass without changing that frozen graph/source digest.

## Current Evidence And Ceiling

- `SWU-GCP-001` has a PASS validation receipt in
  `candidate-local-fast-lane` mode with 16/16 mutants killed.
- That receipt states `release_admission: not-granted`; it is evidence, not a
  synchronized lifecycle, promotion, release, or production claim.
- Financial Settlement SFOL adoption evidence supplies a P4-shaped experimental
  substrate, but reports `formal_owner_approval: false` and does not admit R4.
- `DEC-GCP-004` selects two distinct ordered Rules. `DEC-GCP-005` selects the
  exact R4 option A truth table.
- The current `DESIGN.md` is authored candidate material, but no
  `DesignSelectionResult` or `design-validator-pass` exists. Normal Plan handoff
  is therefore blocked at its activation gate.
- The complete directly implicated canonical denominator is `shared/GAPS.md`
  plus W0 through W3. This package redirects stale GAPS, W0, W1, and W2;
  exact-ref classification preserves W3 unchanged because it remains truthfully
  deferred. The set-equality check prevents an omitted old frontier after apply.
- This proposal has no authority effect. It does not apply canonical targets or
  authorize Task Session mutation.

## Delivery Slices

| Slice | Layer | Outcome | Dependency | Exit evidence |
| --- | --- | --- | --- | --- |
| S2A graph freeze + P4 | L1 | additively reconcile both Rule nodes and unique `enforces` edges, regenerate one graph/source digest, then prove strict P4 | exact L0 receipt; accepted plan package | P4 validation receipt and immutable graph/source handle |
| S2B R4 | L1 | prove option A on the unchanged graph/source handle | P4 terminal PASS | R4 validation receipt with isolated truth-table and mutation evidence |
| S2V composite verify | L1 | prove two identities and two receipts share one frozen graph/source handle without semantic merge | P4 + R4 PASS | independent composite L1 receipt |
| S3 provider-neutral graph laws | L2 | C0 contract/extractor, then Datalog, Alloy, and non-inflating join | composite L1 receipt plus separate admission | not part of this Work Pack |

Graph reconciliation is a non-separable opening prerequisite inside
`SWU-GCP-002-P4`. A graph-only pass would be structural evidence, not an
independently meaningful L1 outcome. If it is ever allowed to close separately,
the tranche must be replanned as three SWUs and `DEC-GCP-004` refreshed.

## Exact Semantic Boundaries

### P4

Given `totalPayout > 0` and no existing `PAYOUT` for `endDate`, execution must
observe exactly one `PAYOUT` write followed by exactly one `PayoutCreated`
event, with matching amount and date. The Work Pack makes no claim about zero
payout, an already-existing same-date payout, R5, other settlement branches, or
full feature correctness.

### R4

With all non-duplicate makeup preconditions fixed at otherwise-eligible values:

- zero existing same-date `MAKEUP_APPLIED` records yields
  `shouldCreateMakeupAppliedEvent = true`;
- one or more yields `false`.

This is a pure Boolean decision proof. It does not require or claim a database
write, event emission, P3, P4, R5, or the full settlement precondition set.

## Validation Strategy

- Rehash all source, graph, manifest, registry, semantic, fixture, binding,
  implementation, and receipt refs before each unit.
- Run `npm --prefix projects/domainspec-v2/impl run validate:rels` and
  `npm --prefix projects/domainspec-v2/impl run validate:content` after graph
  regeneration.
- Run `npm --prefix projects/domainspec-v2/impl run build:sfol:financial-settlement`
  inside P4, then require `npm --prefix projects/domainspec-v2/impl run
  verify:sfol:financial-settlement` to pass without further writes.
- Compare independently authored `O_spec` with generated `O_gen`; the generator
  must not author its own denominator.
- P4 must kill missing-write, missing-event, wrong-amount, wrong-date,
  wrong-order, source/edge/binding freshness, and receipt-tamper mutants.
- R4 must cover zero, duplicate, other-date, and other-type cases and kill
  always-false, always-true, wrong-date, wrong-type, wrong-threshold,
  source/binding freshness, and receipt-tamper mutants.
- Require zero skip, todo, `needs_formal`, orphan, or unrunnable results in both
  selected slices.
- Run the exact focused Vitest, terminal verifier, JSON/schema, replay/digest,
  scoped whitespace, and execution-entry commands in
  `work-pack/validation-contract.l1.json`.
- Before owner acceptance, require an exact canonical-survivor set-equality scan
  proving all EVF Work Pack gap and wave surfaces are either explicitly
  redirected or exact-ref classified as truthfully unchanged. Failure is
  `STALE_CANONICAL_PLANNING_SURVIVOR`.

## Gates And Handoff

The staged Work Pack remains `block` and its execution entry remains `blocked`.
The next allowed sequence is:

1. obtain a validator-owned `design-validator-pass` and selected Design binding;
2. if Design bytes or meaning change, regenerate this Plan; otherwise run
   independent review of these exact postimages;
3. exact-byte owner acceptance;
4. separately authorized `invoke:refresh:apply-approved` canonical apply;
5. Work Pack Readiness / Implementation Readiness validation and a separately
   accepted activation transition;
6. one Task Session selecting `SWU-GCP-002-P4` only.

P4 closeout may expose R4 as the unique successor, but it must not execute R4.
R4 closeout routes to independent composite verification, not C0 execution.

## Explicit Non-Goals

No L2 request, Datalog runtime, Alloy run, TLC model, Cedar policy, provider
installation, broad graph-law claim, IOLM proof, release, publication,
deployment, or production admission belongs to this tranche.
