---
taskId: TASK-GCP-L1-REPEATABILITY
layer: L1
slice: S2A-S2B
status: blocked-on-plan-review-acceptance-apply-readiness
complexity: high
---

# Task GCP L1 Repeatability

## Objective

Prove two distinct Financial Settlement Rules through the EVF causal spine,
serially and without merging their semantics. P4 owns the shared source/graph
freeze; R4 consumes it unchanged.

## Source Contracts

- [PLAN.md](../../PLAN.md), sections “Exact Semantic Boundaries” and “Gates And Handoff”
- [DESIGN.md](../../DESIGN.md), source/derivation/execution/evidence views
- exact L0 receipt at
  `../../evidence/SWU-GCP-001/attempt-001/validation-receipt.json`
- `DEC-GCP-004` and `DEC-GCP-005` under the named post-L0 planning run
- Financial Settlement `SPEC.md`, `feature.json`, node sources,
  generated `graph.json` and `source-manifest.json`
- P4 source proposal/adoption evidence and actual settlement implementation
- [target inventory](../target-inventory.l1.json) and
  [validation contract](../validation-contract.l1.json)

## Dependencies And Gates

No SWU may start until exact postimages are independently reviewed, accepted,
canonically applied, and admitted by Work Pack Readiness and Implementation
Readiness. The execution entry currently blocks selection.

## Smallest Working Units

### SWU-GCP-002-P4

Primary behavior: additively reconcile the two selected Rule identities into
source-owned Financial Settlement inputs, regenerate and freeze one graph/source
handle, then prove only strict P4.

Independent acceptance boundary:

- `financial-settlement.PayoutEligibilityRule` and
  `financial-settlement.NoDuplicateMakeupRule` are distinct source nodes;
- each owns one unique `enforces` edge to
  `financial-settlement.GenerateSettlement`;
- generated artifacts are rebuilt from source, never hand-edited;
- independently authored P4 `O_spec` equals generated `O_gen`;
- `totalPayout > 0` and no same-date `PAYOUT` produces exactly one `PAYOUT`
  write followed by exactly one `PayoutCreated` event with matching amount/date;
- every declared P4 mutant is rejected and every exact ref replays;
- the receipt ceiling excludes zero/duplicate converses, R5, and full feature
  correctness.

Split analysis: a source/graph-only unit could pass without semantic execution;
splitting predicate from the effect trace would leave neither half sufficient to
establish `enforces`. Therefore reconciliation and P4 remain atomic.

Dependencies:

- exact candidate-local L0 receipt;
- selected `DEC-GCP-004` and `DEC-GCP-005`;
- applied planning package and mutation-admission receipt;
- exact baselines from `target-inventory.l1.json`.

Write scope: exactly the paths in
`target-inventory.l1.json#/units/SWU-GCP-002-P4/targets`. This includes the
source/graph reconciliation, both selected semantic capsules, shared L1
contract schemas, P4 fixtures/contracts, new `minted-project/l1` common/P4
modules and tests, and P4 evidence. It excludes existing S1 modules,
`impl/package.json`, the application runtime, R4 implementation/evidence, and
all L2/provider paths.

Acceptance evidence:

- exact source-graph inventory and frozen digest;
- distinct edge IDs and registry-valid signatures;
- independent P4 obligation and binding;
- real write/event observation envelope;
- aggregate mutation report and typed EVF L1 receipt;
- executor, target-result, precloseout, Invoke owner, and terminal receipts.

Validation: exact P4 command list and acceptance vector in
`validation-contract.l1.json`.

Owner and handoff: Task Session after readiness admission. Closeout returns a
continuity cursor; it may make R4 selection-ready but must not execute it.

### SWU-GCP-003-R4

Primary behavior: prove the selected isolated two-sided duplicate-makeup Boolean
decision on the unchanged P4 graph/source handle.

Independent acceptance boundary:

- all non-duplicate makeup preconditions are fixed otherwise eligible;
- zero same-date `MAKEUP_APPLIED` records yields `true`;
- one or more yields `false`;
- other-date and other-type controls remain `true` and discriminate the filter;
- independently authored R4 `O_spec` equals generated `O_gen`;
- all declared R4 mutants are rejected;
- no graph/source write occurs and the P4 frozen digest remains exact;
- receipt claims only the pure decision, never a write, event, P3, or full
  settlement result.

Split analysis: positive-only or duplicate-only units would not prove the
selected two-sided boundary. Predicate, binding, execution, and receipt seams
are one causal proof and cannot close independently.

Dependencies:

- terminal P4 PASS and completed P4 closeout;
- exact P4 source/graph handle and unchanged baselines;
- a fresh Task Session selection of R4.

Write scope: exactly the paths in
`target-inventory.l1.json#/units/SWU-GCP-003-R4/targets`. Source/graph and all P4
targets are explicitly absent from this scope. Composite-verifier code, tests,
and receipts are also excluded and belong to the closure-exempt verification
task.

Acceptance evidence:

- source-graph replay receipt binding P4's handle;
- independent R4 obligation, binding, truth-table observations, aggregate
  mutation report, and typed EVF L1 receipt;
- executor, target-result, precloseout, Invoke owner, and terminal receipts.

Validation: exact R4 command list and acceptance vector in
`validation-contract.l1.json`.

Owner and handoff: a fresh Task Session. Closeout routes to independent
composite verification and never executes C0 or a provider.

## Synchronization Rules

- P4 and R4 are serial and use distinct Task Session attempts.
- Shared graph/source targets are P4-only.
- R4 verifies rather than regenerates the frozen handle.
- Failed validation stops before closeout; cleanup cannot mask the first failure.
- Any undeclared write or claim expansion blocks terminal success.

## Completion Evidence

The task is complete only after both terminal Task Session receipts and the
independent composite L1 receipt exist and validate. P4 success alone is a valid
bounded result but not composite task completion.
