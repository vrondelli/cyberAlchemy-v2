---
module: graph-composability-evidence-spine
version: post-l0-l1-proposal
status: canonical-planning-applied-awaiting-readiness-activation
updatedAt: 2026-08-20
docType: work-pack
workPackGateStatus: block
complexity: high
outputMode: split
executionPackRef: EXECUTION-PACK.md
layeringArtifactRef: IMPLEMENTATION-LAYERING.md
dispatchTechniqueTrace: inline
distillValidationStatus: flag
swuAtomicityStatus: pass
firstUnitNarrownessStatus: pass
closeoutSyncStatus: pass
admissionTiming: selected-unit-at-task-session
executionEntryState: blocked
allowedRoutesDigest: 59136610ef6397f8420dc81cfde4b86362d11f9ae1778250a705b018a1ee1cf8
activeLayerWindow: L1
readinessProfile: pilot
authorityEffect: none
---

# WORK-PACK: EVF L1 Repeatability

## Objective Summary

- Objective: demonstrate candidate-local repeatability of the EVF graph-to-
  receipt path over two distinct Financial Settlement
  `Rule --enforces--> GenerateSettlement` slices.
- Primary inputs: the exact L0 validation receipt, existing EVF Design, accepted
  `DEC-GCP-004`, selected `DEC-GCP-005` option A, Financial Settlement source,
  generated graph/source manifest, experimental P4 evidence, and current
  implementation source.
- Success condition: strict P4 and isolated R4 each produce independent typed
  receipts over one frozen graph/source digest; an independent composite
  verifier confirms identity separation, digest continuity, mutation coverage,
  and claim ceilings.

## Current Gate And Scope

This exact canonical postimage is bound to the unchanged `DESIGN.md` SHA-256
`87634374e9316ea4a8aebbc8fa35cfa1ee53d46025241832f3c263e390733464` and the
passing `DESIGN-SELECTION-RESULT.json` result digest
`853f762796c9bcd9fc8cc66859f12c4936988f4706855cd7c9673fb4c7777778`.
Design activation is resolved. These bytes describe the state after fresh
independent review, exact-byte owner acceptance, material handoff, and canonical
apply have completed for one recomposed 20-target digest. Their non-recursive
receipts remain external lifecycle evidence. The Work Pack gate and execution
entry remain blocked only pending Work Pack Readiness / Implementation Readiness
validation and a separately accepted activation transition. Invoke does not
execute either SWU.

The exact Plan package classifies the complete shared-gap and W0-W3 wave
denominator. It replaces stale GAPS, W0, W1, and W2 surfaces with compatibility
redirects and exact-ref preserves the truthfully deferred W3. A missing,
unclassified, or contradictory member fails
`STALE_CANONICAL_PLANNING_SURVIVOR` before acceptance.

The live L0 receipt is PASS only in `candidate-local-fast-lane` mode and states
`release_admission: not-granted`. This Work Pack preserves that ceiling. It does
not call L0 lifecycle-admitted and does not open L2.

## Work-Pack Execution Policy

The machine projection is [work-pack/EXECUTION-ENTRY.json](work-pack/EXECUTION-ENTRY.json).
Its exact route projection owns the canonical digest shown in the control fields.
Current state is `blocked` with no selected unit, route, or next owner.

After a later accepted activation, only `SWU-GCP-002-P4` may become the first
frontier. P4 closeout may expose R4 as the unique successor, but cannot execute
it in the same Task Session.

## Delivery Slices And Wave

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S2A | reconcile two distinct source-owned Rules/edges, freeze one graph/source digest, prove strict P4 | L1 | [W2](work-pack/waves/W2-L1-REPEATABILITY.md) | exact L0 receipt; accepted/applied plan | graph regeneration, obligation equality, effect observation, mutation, replay |
| S2B | prove option A R4 against the unchanged graph/source digest | L1 | [W2](work-pack/waves/W2-L1-REPEATABILITY.md) | P4 terminal PASS and closeout | truth table, independent observation, mutation, replay |
| S2V | independently join the two bounded receipts without semantic merge | L1 | Verify | P4 + R4 terminal PASS | identity/digest/ceiling composite check |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Wave | Source | Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TASK-GCP-L1-REPEATABILITY](work-pack/tasks/TASK-GCP-L1-REPEATABILITY.md) | execute serialized P4 then R4 proofs | L1 | high | W2 | PLAN, decisions, exact inventory | blocked-on-readiness-activation | not-started |
| [TASK-GCP-L1-VERIFY](work-pack/tasks/TASK-GCP-L1-VERIFY.md) | independently close the composite receipt | L1 | medium | Verify | both terminal receipts | blocked-on-P4-R4 | not-started |

## SWU Atomicity Review

| SWU | Primary behavior | Independent boundary | Candidate splits considered | Retained-boundary rationale | Verdict |
| --- | --- | --- | --- | --- | --- |
| `SWU-GCP-002-P4` | freeze the only graph/source postimage that both units consume, then prove the strict P4 effect implication | P4 receipt can remain valid if R4 later fails | graph-only reconciliation; source vs derivation; predicate vs effect | graph-only evidence is not L1 repeatability, and splitting source from effect would allow a structurally green but semantically empty P4 result | pass |
| `SWU-GCP-003-R4` | prove the option A pure duplicate boundary against the frozen graph | R4 receipt has its own truth table and mutations | positive vs duplicate; predicate vs binding; receipt-only | either split would omit one side of the selected Boolean boundary or break the causal proof chain | pass |

The composite verifier is a closure task with the template's verification
exemption; it creates no new product behavior and cannot repair either receipt.

## SWU Execution Handoff

| SWU | Parent | Source anchors | Related context | Dependencies | Write scope | Done criteria | Acceptance evidence | Validation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SWU-GCP-002-P4` | [repeatability task](work-pack/tasks/TASK-GCP-L1-REPEATABILITY.md#swu-gcp-002-p4) | Financial Settlement `SPEC.md`; `feature.json`; Payout Rule node; generated graph/source manifest; source proposal P4; effect adapter and GenerateSettlement use case | DESIGN views; PLAN P4 boundary; shared context/decisions/gaps/traceability | exact L0 receipt; exact plan/apply/readiness receipts | exact P4 row in `target-inventory.l1.json`; no directory wildcard | both Rule nodes/edges are source-owned; generated graph freezes one handle; `O_spec = O_gen`; exact write then event; all P4 mutants killed; zero hidden residue | source-graph snapshot, obligation, binding, execution, mutation, EVF and terminal validation receipts | exact commands in `validation-contract.l1.json#units/SWU-GCP-002-P4` | task-session | blocked |
| `SWU-GCP-003-R4` | [repeatability task](work-pack/tasks/TASK-GCP-L1-REPEATABILITY.md#swu-gcp-003-r4) | frozen P4 graph/source handle; NoDuplicate Rule node; DEC-GCP-005; settlement pure decision and legacy binding | PLAN R4 boundary; P4 terminal receipt; shared context/decisions/gaps/traceability | P4 terminal PASS and closeout; unchanged graph/source digest | exact R4 row in `target-inventory.l1.json`; graph/source targets excluded | zero case true, same-date duplicate false, other-date/type controls discriminate; all R4 mutants killed; same frozen handle; zero hidden residue | obligation, binding, truth-table execution, mutation, EVF and terminal validation receipts | exact commands in `validation-contract.l1.json#units/SWU-GCP-003-R4` | task-session | blocked |

## Task Session Closeout Sync Contract

Shared receipt topology and owner/schema refs are defined in
[work-pack/CLOSEOUT-CONTRACT.md](work-pack/CLOSEOUT-CONTRACT.md).

| SWU | Owner route | Terminal source receipt | Declared target inventory | Baseline binding | Allowed deltas | Owner validation | Expected owner receipt | Successor policy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SWU-GCP-002-P4` | `invoke:refresh:apply-approved` | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-002-P4-PRECLOSEOUT-EXECUTION-RECEIPT.json` | `target-inventory.l1.json#/closeout_targets/SWU-GCP-002-P4` | exact pre-mutation baselines plus fresh pre-closeout hashes | evidence_added, blocker_opened, blocker_resolved, status_changed, route_changed | P4 validation receipt, target-result inventory, exact refs, scoped whitespace and replay | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/closeout/SWU-GCP-002-P4-REFRESH-RECEIPT.json` | expose R4 selection-ready only after terminal PASS; return cursor; never execute successor |
| `SWU-GCP-003-R4` | `invoke:refresh:apply-approved` | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/results/SWU-GCP-003-R4-PRECLOSEOUT-EXECUTION-RECEIPT.json` | `target-inventory.l1.json#/closeout_targets/SWU-GCP-003-R4` | exact P4 post-closeout baselines plus frozen graph/source handle | evidence_added, blocker_opened, blocker_resolved, status_changed, route_changed | R4 validation receipt, target-result inventory, exact refs, scoped whitespace and replay | `arcanum/arcana/task-session/development/work-packs/evf-l1-repeatability/closeout/SWU-GCP-003-R4-REFRESH-RECEIPT.json` | route to independent composite verification; never execute C0 or a provider |

## Blockers

| ID | Scope | Description | Owner | Next action |
| --- | --- | --- | --- | --- |
| GCP-L1-B-000 | design activation (resolved) | exact unchanged Design has validator-owned `design-validator-pass` and selected binding | Invoke Design validator / owner | preserve the exact binding; reopen and regenerate this Plan if Design or selection inputs change |
| GCP-L1-B-001 | planning (resolved) | fresh independent review completed for the exact installed package digest; Review 003 and Review 004 remain historical for their superseded bytes | independent reviewer | preserve the external exact receipt; reopen on any postimage or package-digest change |
| GCP-L1-B-002 | lifecycle (resolved) | exact-byte owner acceptance, material handoff, and canonical apply completed for the installed package digest | user then Invoke Refresh | preserve the external exact receipts; reopen on any byte, baseline, scope, or digest drift |
| GCP-L1-B-003 | readiness | current execution entry intentionally states `blocked` | Work Pack Readiness / Implementation Readiness | validate applied bytes and author a separately accepted activation transition |
| GCP-L1-B-004 | L2 | composite L1 receipt does not exist; C0 and providers are not admitted | later owner gate | keep C0, Datalog, Alloy, TLC, and Cedar outside this Work Pack |

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation | Status |
| --- | --- | --- | --- |
| sequence | P4 -> P4 closeout -> R4 -> R4 closeout -> verify | no parallel proof or same-session successor | pass |
| scu_swu_reduction | two proof boundaries | each unit owns one meaningful semantic result | pass |
| recomposition_proof | units -> L1 claim | two identities and one frozen graph/source handle | pass |
| validation_loop | positive, negative, replay, regression | every exit claim has discriminating evidence | pass |
| owner_boundary_check | Invoke -> review/apply/readiness/Task Session | proposal does not imply mutation or authority | pass |
| execution_receipt_handoff | Task Session -> Invoke closeout -> terminal receipt | P/O/T receipts remain non-recursive and owner-specific | pass |
| residue_ledger | blockers and claim ceilings | L2, release, and broader semantics stay explicit | pass |

## Distill Validation

| Check | Result | Evidence or gap |
| --- | --- | --- |
| Smallest coherent units | pass | P4 effect and R4 decision are independently meaningful |
| Atomicity and split analysis | pass | graph-only and seam splits would create vacuous evidence |
| First-unit narrowness | pass | P4 has the strongest existing substrate and alone owns shared graph freeze |
| Recomposition | pass | terminal join requires two IDs/edges/obligations/bindings/tests/receipts and one handle |
| Hidden acceptance-critical gaps | flag | Work Pack Readiness and a separately accepted activation transition remain open |
| Deferred complexity | pass | L2/provider/tool/release work excluded |
| Navigation | pass | task, wave, inventory, validation, execution-entry, and closeout artifacts are linked |

## Maximum Honest Claim

If both SWUs and the composite verifier pass, the result supports only:

> The candidate-local EVF path repeated across key-door and two distinct,
> owner-selected Financial Settlement `Rule --enforces--> GenerateSettlement`
> slices: strict one-way P4 and isolated option A R4, over one frozen
> graph/source digest.

It does not prove full Financial Settlement semantics, P4 converses, P3, R5,
general graph laws, Datalog/Alloy correctness or readiness, IOLM, lifecycle or
release admission, publication, deployment, or production readiness.

## Navigation

1. Read [shared context](work-pack/shared/CONTEXT.md) and
   [cross-task decisions](work-pack/shared/CROSS-TASK-DECISIONS.md).
2. Review [the W2 wave](work-pack/waves/W2-L1-REPEATABILITY.md).
3. Inspect [the repeatability task](work-pack/tasks/TASK-GCP-L1-REPEATABILITY.md),
   [target inventory](work-pack/target-inventory.l1.json), and
   [validation contract](work-pack/validation-contract.l1.json).
4. Do not select a unit while [EXECUTION-ENTRY.json](work-pack/EXECUTION-ENTRY.json)
   remains blocked.
