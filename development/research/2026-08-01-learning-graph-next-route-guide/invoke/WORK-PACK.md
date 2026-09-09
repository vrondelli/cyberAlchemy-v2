---
module: learner-projection-next-route-guide
version: candidate-v1
status: plan-validated
updatedAt: 2026-08-01
docType: work-pack
lifecycle_owner: learner-view-navigation-owner
selected_swu: none
authority_effect: none
---

# WORK-PACK: Learner Projection And Next-Route Guide

## Purpose

Provide the canonical executable plan for a deterministic learner projection
and its candidate integration into the existing ontology view, while keeping
Plan completeness, learner-view mutation admission, SWU selection, implementation evidence,
human evidence, and promotion separate.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass | Planning shape and contracts pass; this is not execution authorization. |
| executionAdmissionStatus | block-learner-view-mutation-admission-and-selection | DG-001 and A-002 must close before mutation. |
| complexity | medium | Ten serial mutation SWUs, multiple artifact families, existing-host mutation, browser acceptance. |
| outputMode | split | Tasks, waves, shared contracts, and execution pack are separate. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Required medium-complexity companion. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0 active. |
| dispatchTechniqueTrace | [PLAN-DISPATCH-TECHNIQUE-TRACE.md](PLAN-DISPATCH-TECHNIQUE-TRACE.md) | Full route in `INVOKE-DISPATCH.json`. |
| distillValidationStatus | pass | [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md) |
| swuAtomicityStatus | pass | Ten units, zero task-shaped units. |
| firstUnitNarrownessStatus | pass | SWU-LGP-001 is structural only and unselected. |
| closeoutSyncStatus | pass | Every mutation SWU has exact targets, baseline, validation, receipt, and successor. |
| activeLayerWindow | L0 | Later layers require predecessor owner receipts. |
| firstCandidateSwu | SWU-LGP-001 | Candidate only. |
| selectedSwu | none | Invoke never selects or executes. |
| readinessProfile | pilot | Candidate mechanics only. |

## Objective Summary

- Objective: compile exact ontology/profile/fact/finding/session/gap records
  into a deterministic generated projection and, after learner-view mutation admission, render
  it in the existing host with explicit abstention and a display-only route
  suggestion.
- Primary inputs: [SPEC.md](SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md),
  [UX-PLAN.md](UX-PLAN.md), [WITNESS-CONTRACTS.md](WITNESS-CONTRACTS.md),
  [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md).
- Success condition: L0–L2 candidate receipts pass and preserve every proof
  ceiling; learner-view owner then decides revise, hold, or route to separate
  human research.
- Evidence ceiling: Plan structure only; no implementation witness has run.

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-001 | structural projection contract | L0 | [W1](work-pack/waves/W1.md) | W0 mutation admission | schema and negative fixtures |
| S-002 | exact source binding and canonical replay | L0 | [W2](work-pack/waves/W2.md) | SWU-LGP-001 | current/stale/missing/replay checks |
| S-003 | `MaxAmountRule` positive-fixture ceiling | L0 | [W2](work-pack/waves/W2.md) | SWU-LGP-002 | LGP-FIX-001 and positive-claim mutants |
| S-004 | `LegacyLimitRule` abstention/question/suggestion response | L0 | [W2](work-pack/waves/W2.md) | SWU-LGP-003 | LGP-FIX-002, 005, 006, 008, 014 |
| S-005 | current/stale projection reader in existing host | L1 | [W3](work-pack/waves/W3.md) | L0 pass | reader unit/DOM checks |
| S-006 | semantic orientation/evidence rail | L1 | [W3](work-pack/waves/W3.md) | SWU-LGP-005 | semantic DOM checks |
| S-007 | responsive, non-color presentation | L1 | [W4](work-pack/waves/W4.md) | SWU-LGP-006 | layout and label checks |
| S-008 | focus/view/inspector parity | L1 | [W4](work-pack/waves/W4.md) | SWU-LGP-007 | LGP-FIX-009, 012–013 |
| S-009 | keyboard interaction | L1 | [W4](work-pack/waves/W4.md) | SWU-LGP-008 | LGP-FIX-011 and no-trap checks |
| S-010 | reproducible browser mechanics evidence | L2 | [W5](work-pack/waves/W5.md) | SWU-LGP-009 | pinned browser receipt and closure |

## Task Status Board

| Task | Goal | Layer | Waves | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| [TASK-LGP-CONTRACT](work-pack/tasks/TASK-LGP-CONTRACT.md) | freeze schema and structural validator | L0 | W1 | blocked until admission/selection | not-started |
| [TASK-LGP-COMPILER](work-pack/tasks/TASK-LGP-COMPILER.md) | exact replay and bounded derivations | L0 | W2 | dependency-bound | not-started |
| [TASK-LGP-HOST](work-pack/tasks/TASK-LGP-HOST.md) | owner-admitted host reader and learner surface | L1 | W3–W4 | owner/dependency-bound | not-started |
| [TASK-LGP-ACCEPTANCE](work-pack/tasks/TASK-LGP-ACCEPTANCE.md) | candidate browser evidence | L2 | W5 | dependency-bound | not-started |
| [TASK-LGP-VERIFY](work-pack/tasks/TASK-LGP-VERIFY.md) | independent recomposition and ceiling audit | L2 | W5 | ready after mutation | not-started |

## SWU Atomicity Review

| SWU | Primary behavior | Independent acceptance boundary | Candidate child units | Retained-boundary rationale | Verdict |
| --- | --- | --- | --- | --- | --- |
| SWU-LGP-001 | reject structurally invalid projection contracts | valid and three negative fixtures pass before compiler work | schema; validator; negative fixtures | validator without fixtures cannot prove fail-closed boundary; fixtures without validator are inert | pass |
| SWU-LGP-002 | bind exact sources and emit canonical normalized snapshot | replay is byte-identical; stale/missing inputs block | resolver; canonical writer; receipt | all three form one exact-binding output boundary | pass |
| SWU-LGP-003 | derive only the `MaxAmountRule` positive-fixture ceiling | exact no-reported-finding result and ceiling pass; stronger-claim mutants block | result; ceiling; mutants | one independently reviewable positive branch | pass |
| SWU-LGP-004 | derive the `LegacyLimitRule` evidence-gap response | abstention, exact four-premise question, and display-only package pass; admission-substitution mutants block | abstention; question; suggestion | one coherent response to one closed evidence gap, independent of the positive branch | pass |
| SWU-LGP-005 | load current snapshot and suppress stale/invalid state in host | reader returns typed current data or diagnostic only | loader; validity reducer | one currentness boundary before UI semantics | pass |
| SWU-LGP-006 | render semantic orientation/evidence structure | DOM exposes exact layers, proof tiers, abstention, revision, suggestion; no action control | orientation; evidence stack; suggestion section | one static semantic contract; interaction/layout are separate | pass |
| SWU-LGP-007 | make presentation usable without color or wide viewport | narrow/wide non-color layout checks pass | CSS; breakpoint; overflow | one presentation-only boundary | pass |
| SWU-LGP-008 | synchronize focus, views, and inspector | same IDs/classes/tiers in Graph/Outline/Table and inspector | focus; view parity; inspector | one parity-state contract without keyboard behavior | pass |
| SWU-LGP-009 | provide the declared keyboard path | search-to-suggestion path is reachable, visible, and trap-free | focus movement; announcements | one keyboard interaction boundary over accepted parity | pass |
| SWU-LGP-010 | produce reproducible browser mechanics receipt | pinned input/runtime, zero errors/outbound/workflow events, regression and teardown | harness; run; receipt | harness is not accepted without its exact run/receipt | pass |

## SWU Execution Handoff

| SWU | Parent | Source anchors | Dependencies | Exact write scope | Done | Acceptance | Validation owner | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-LGP-001 | [Contract](work-pack/tasks/TASK-LGP-CONTRACT.md) | SPEC invariants; WITNESS 003–006, 008 | W0 admission | task section `Exact Write Scope` | structural contract fails closed | schema/fixture receipt | learner-view owner + Task Session | candidate |
| SWU-LGP-002 | [Compiler](work-pack/tasks/TASK-LGP-COMPILER.md) | Operations rules 1–4, 8–9 | 001 | task section `SWU-LGP-002` | canonical exact-binding replay | digest/pointer/replay receipt | same | dependency-bound |
| SWU-LGP-003 | [Compiler](work-pack/tasks/TASK-LGP-COMPILER.md) | positive-fixture contract; WITNESS 001 | 002 | task section `SWU-LGP-003` | exact positive ceiling and mutants | positive derivation receipt | same | dependency-bound |
| SWU-LGP-004 | [Compiler](work-pack/tasks/TASK-LGP-COMPILER.md) | Mappings; WITNESS 002, 005, 006, 008, 014 | 003 | task section `SWU-LGP-004` | exact abstention/route response and mutants | gap-response receipt | same | dependency-bound |
| SWU-LGP-005 | [Host](work-pack/tasks/TASK-LGP-HOST.md) | Architecture interfaces/validity | 004 + mutation admission | task section `SWU-LGP-005` | current or diagnostic-only host read | DOM/unit receipt | learner-view owner | dependency-bound |
| SWU-LGP-006 | [Host](work-pack/tasks/TASK-LGP-HOST.md) | UX journey/semantic rules | 005 | task section `SWU-LGP-006` | semantic rail without actions | DOM receipt | learner-view + UX owners | dependency-bound |
| SWU-LGP-007 | [Host](work-pack/tasks/TASK-LGP-HOST.md) | UX non-color/layout | 006 | task section `SWU-LGP-007` | responsive/non-color presentation | layout receipt | UX owner | dependency-bound |
| SWU-LGP-008 | [Host](work-pack/tasks/TASK-LGP-HOST.md) | WITNESS 009, 012–013 | 007 | task section `SWU-LGP-008` | focus/view/inspector parity | parity receipt | learner-view owner | dependency-bound |
| SWU-LGP-009 | [Host](work-pack/tasks/TASK-LGP-HOST.md) | UX keyboard; WITNESS 011 | 008 | task section `SWU-LGP-009` | keyboard path without side effects | interaction receipt | learner-view + UX owners | dependency-bound |
| SWU-LGP-010 | [Acceptance](work-pack/tasks/TASK-LGP-ACCEPTANCE.md) | Validation strategy; WITNESS 010 | 009 | task section `Exact Write Scope` | exact browser evidence bundle | browser receipt plus lifecycle-owner receipt | learner-view owner with browser evidence reviewer | dependency-bound |

Context Builder generates execution-time packs only after one SWU is selected.

## Task Session Closeout Sync Contract

The shared receipt shape and baseline rules are fixed in
[CLOSEOUT-CONTRACT.md](work-pack/shared/CLOSEOUT-CONTRACT.md). Exact inventories
are owned by task-local headings.

| SWU | Lifecycle route | Target inventory | Baseline | Allowed deltas | Owner validation | Expected owner receipt | Successor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-LGP-001 | learner-view mutation admission -> selected Task Session -> lifecycle owner validation | [001 scope](work-pack/tasks/TASK-LGP-CONTRACT.md#exact-write-scope) | exact SHA or `ABSENT` | product + session evidence | schema/structural fixtures | `work-pack/owner-evidence/SWU-LGP-001/owner-receipt.json` | 002 eligible only |
| SWU-LGP-002 | same | [002 scope](work-pack/tasks/TASK-LGP-COMPILER.md#exact-write-scope-swu-lgp-002) | exact SHA or `ABSENT` | product + session evidence | exact binding/stale/replay | `work-pack/owner-evidence/SWU-LGP-002/owner-receipt.json` | 003 eligible only |
| SWU-LGP-003 | same | [003 scope](work-pack/tasks/TASK-LGP-COMPILER.md#exact-write-scope-swu-lgp-003) | predecessor owner receipt | product + session evidence | positive ceiling/mutants | `work-pack/owner-evidence/SWU-LGP-003/owner-receipt.json` | 004 eligible only |
| SWU-LGP-004 | same | [004 scope](work-pack/tasks/TASK-LGP-COMPILER.md#exact-write-scope-swu-lgp-004) | predecessor owner receipt | product + session evidence | gap response, exact premises, LGP-FIX-014 | `work-pack/owner-evidence/SWU-LGP-004/owner-receipt.json` | 005 eligible only after mutation-admission recheck |
| SWU-LGP-005 | same | [005 scope](work-pack/tasks/TASK-LGP-HOST.md#exact-write-scope-swu-lgp-005) | current host and predecessor receipt | product + session evidence | reader/validity checks | `work-pack/owner-evidence/SWU-LGP-005/owner-receipt.json` | 006 eligible only |
| SWU-LGP-006 | same | [006 scope](work-pack/tasks/TASK-LGP-HOST.md#exact-write-scope-swu-lgp-006) | predecessor owner receipt | product + session evidence | semantic DOM checks | `work-pack/owner-evidence/SWU-LGP-006/owner-receipt.json` | 007 eligible only |
| SWU-LGP-007 | same | [007 scope](work-pack/tasks/TASK-LGP-HOST.md#exact-write-scope-swu-lgp-007) | predecessor owner receipt | product + session evidence | layout/non-color checks | `work-pack/owner-evidence/SWU-LGP-007/owner-receipt.json` | 008 eligible only |
| SWU-LGP-008 | same | [008 scope](work-pack/tasks/TASK-LGP-HOST.md#exact-write-scope-swu-lgp-008) | predecessor owner receipt | product + session evidence | focus/view/inspector parity | `work-pack/owner-evidence/SWU-LGP-008/owner-receipt.json` | 009 eligible only |
| SWU-LGP-009 | same | [009 scope](work-pack/tasks/TASK-LGP-HOST.md#exact-write-scope-swu-lgp-009) | predecessor owner receipt | product + session evidence | keyboard/no-trap checks | `work-pack/owner-evidence/SWU-LGP-009/owner-receipt.json` | 010 eligible only |
| SWU-LGP-010 | selected Task Session -> browser evidence review -> learner-view lifecycle owner | [010 scope](work-pack/tasks/TASK-LGP-ACCEPTANCE.md#exact-write-scope) | predecessor/runtime baseline | harness + session evidence | browser run/teardown plus owner ceiling review | `work-pack/owner-evidence/SWU-LGP-010/owner-receipt.json` | none; owner decision |

No successor is selected automatically.

## Blockers And Admission Conditions

| ID | Scope | Description | Owner | Repair |
| --- | --- | --- | --- | --- |
| A-001 | host and product mutation | learner-view mutation admission absent | learner-view owner | admit exact scope, ceiling, validation, supersession policy; receipt is not semantic evidence |
| A-002 | execution | no SWU selected | user after mutation admission | select exactly one eligible SWU |
| A-003 | evidence | all Plan witnesses are unexecuted | per-SWU Task Session | execute serially and return owner receipts |
| A-004 | L3 | human/accessibility protocols are separate and absent | human research + accessibility owners | new governed work-pack after L2 owner decision |
| A-005 | real source | native adapter and owner-resolved semantic-admission evidence absent | `TypeScript adapter owner` remains a candidate string only | separate destination-owner identity/admission and verification request; never automatic |

A-001 and A-002 block mutation, not Plan completeness.

## Dispatch Technique Trace

See [PLAN-DISPATCH-TECHNIQUE-TRACE.md](PLAN-DISPATCH-TECHNIQUE-TRACE.md) and
`INVOKE-DISPATCH.json`.

## Distill Validation

| Check | Result | Evidence |
| --- | --- | --- |
| smallest coherent first unit | pass | SWU-LGP-001 freezes only structural fail-closed behavior |
| atomicity/split analysis | pass | ten primary behaviors; positive/gap derivations and parity/keyboard are separate |
| first-unit narrowness | pass | no compiler or UI behavior in 001; unselected |
| recomposition | pass | [TRACEABILITY.md](work-pack/shared/TRACEABILITY.md) maps loop and invariants |
| hidden acceptance gaps | pass | mutation admission, semantic evidence, destination-owner admission, and human/accessibility evidence remain explicit |
| deferred complexity | pass | real adapter, personal data, generic graph, execution, promotion excluded |
| navigation | pass | first candidate -> Contract task -> W1 |

## Required Links

- [Execution pack](EXECUTION-PACK.md)
- [SWU manifest](work-pack/SWU-MANIFEST.json)
- [Shared context](work-pack/shared/CONTEXT.md)
- [Gaps](work-pack/shared/GAPS.md)
- [Decisions](work-pack/shared/DECISIONS.md)
- [Traceability](work-pack/shared/TRACEABILITY.md)
- [Closeout contract](work-pack/shared/CLOSEOUT-CONTRACT.md)
- waves [W0](work-pack/waves/W0.md), [W1](work-pack/waves/W1.md),
  [W2](work-pack/waves/W2.md), [W3](work-pack/waves/W3.md),
  [W4](work-pack/waves/W4.md), [W5](work-pack/waves/W5.md)

## Gate Checks

1. Plan shape, links, Design fixed point, layers, task detail, SWU atomicity,
   dispatch, Distill, and closeout contracts pass.
2. Mutation remains blocked while A-001 or A-002 is open.
3. Every SWU is serial; overlapping host/compiler files are never concurrent.
4. A predecessor receipt makes one successor eligible, never selected.
5. Any stale binding, killed vocabulary, identity inference, authority effect,
   view divergence, unexpected request/event, or undeclared mutation blocks.
6. Browser mechanics never open a human-comprehension or accessibility claim.
7. Task Session and lifecycle-owner receipts have disjoint write scopes and
   producers; neither can self-issue the other's evidence.

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-08-01 | Initial Invoke Plan | Invoke |
| 2026-08-01 | Independent-review repair: split admissions and expand to ten atomic SWUs | Invoke |
