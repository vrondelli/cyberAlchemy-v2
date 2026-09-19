---
module: graph-composability-evidence-spine
version: current
status: candidate-awaiting-task-session
updatedAt: 2026-07-20
docType: work-pack
workPackGateStatus: block
complexity: high
outputMode: split
executionPackRef: EXECUTION-PACK.md
layeringArtifactRef: IMPLEMENTATION-LAYERING.md
dispatchTechniqueTrace: DISPATCH-SPEC.json
distillValidationStatus: pass-with-flags
swuAtomicityStatus: pass
firstUnitNarrownessStatus: pass
activeLayerWindow: L0
readinessProfile: pilot
---

# WORK-PACK: Graph Composability Evidence Spine

## Objective Summary

- **Objective:** prove one `Rule --enforces--> Operation` composition through
  graph, obligation, test, binding, evaluator, and receipt artifacts.
- **Primary inputs:** [DESIGN.md](DESIGN.md),
  [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md), source findings,
  and the existing relationship/test-engine contracts.
- **Success condition:** a Task Session can replay the positive and negative
  cases from source digests and produce typed receipts without hidden skips,
  invented expected values, or authority mutation.

## Gate And Scope

This work-pack is planning-complete but not execution-authorized. `ready-after-
selection` means a Task Session may select exactly one SWU after reviewing its
context. It does not permit implementation from Invoke.

`DEC-GCP-002` is accepted: the executable core and private IOLM consumer are two
independently closable proof lanes. The IOLM run is an external handoff, not a
new EVF implementation task and not a dependency of the L0 verdict.

## Delivery Slices And Waves

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S0 | freeze contracts and evidence boundary | L0 | [W0](work-pack/waves/W0-CONTRACTS.md) | define/design | contract review |
| S1 | one positive/negative `enforces` receipt | L0 | [W1](work-pack/waves/W1-ENFORCES.md) | S0 | replay and mutation checks |
| S1C | independent IOLM consumption of the exact successful S1 handle | L0C, sibling lane | external IOLM work-pack | S1 + IOLM candidate substrate | fresh narrow IOLM receipt with identity, parity, and overlay negatives |
| S2 | repeatable second admitted slice | L1 | [W2](work-pack/waves/W2-GRAPH-LAWS.md) | S1 | digest comparison |
| S3 | bounded graph-law evaluator | L2 | [W2](work-pack/waves/W2-GRAPH-LAWS.md) | S2 | independent graph receipts |
| S4 | breadth and consumer handoff | L3 | [W3](work-pack/waves/W3-BREADTH.md) | S3 | BTE/consumer evidence |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Wave | Source | Gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [TASK-GCP-CONTRACT](work-pack/tasks/TASK-GCP-CONTRACT.md) | make artifact contracts and receipt fields explicit | L0 | medium | W0 | DEFINE, DESIGN | blocked-on-GCP-B-005 | not-started |
| [TASK-GCP-ENFORCES](work-pack/tasks/TASK-GCP-ENFORCES.md) | execute one end-to-end `enforces` proof | L0 | medium | W1 | findings, DESIGN | blocked-on-GCP-B-005 | not-started |
| [TASK-GCP-GRAPH-LAWS](work-pack/tasks/TASK-GCP-GRAPH-LAWS.md) | add bounded graph evaluator | L2 | high | W2 | DESIGN, findings | blocked-on-L0/L1 | not-started |
| [TASK-GCP-BREADTH](work-pack/tasks/TASK-GCP-BREADTH.md) | hand off breadth and consumer coverage | L3 | high | W3 | BTE plan | blocked-on-L2 | not-started |
| [TASK-GCP-VERIFY](work-pack/tasks/TASK-GCP-VERIFY.md) | independently close receipts and residue | L1-L3 | medium | W1-W3 | all receipts | ready-after-proof | not-started |

## SWU Atomicity Review

| SWU | Primary behavior | Independent boundary | Candidate splits considered | Retained-boundary rationale | Verdict |
| --- | --- | --- | --- | --- | --- |
| `SWU-GCP-001` | one `enforces` edge traverses all required artifact boundaries | positive and typed-negative receipts exist and replay from digests | split at graph, derivation, binding, test, evaluator, or receipt | each split would hide the causal chain; the unit is the smallest meaningful trust proof | pass |

## SWU Execution Handoff

| SWU | Parent | Source anchors | Related context | Dependencies | Write scope | Done criteria | Acceptance evidence | Validation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `SWU-GCP-001` | [TASK-GCP-ENFORCES](work-pack/tasks/TASK-GCP-ENFORCES.md) | `findings.md` structural witness; `relationships.md` `enforces`; test-engine `types.ts`, `rules/index.ts`, `emit/tests.ts`, `residue/receipt.ts`; key-and-door fixture | DESIGN views 1-6; shared CONTEXT; GAPS; TRACEABILITY | S0 contract review; DEC-GCP-001 formal-source decision | `projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/`; any existing test edits only after Task Session confirms | positive and negative receipts; stable IDs/digests; no hidden skip/todo; independent evaluator verdict | source graph JSON, normalized graph digest, obligation JSON, binding JSON, generated test result, evaluator JSON, receipt JSON, negative mutation receipt | existing relationship validator; test-engine tests; composability checker fixture; `git diff --check` | task-session/local-fallback | blocked-on-GCP-B-005 |

## Blockers And Gaps

| ID | Scope | Description | Owner | Next action |
| --- | --- | --- | --- | --- |
| GCP-B-001 | L0 | end-to-end binding/evaluator/receipt path is not implemented | Task Session | execute only `SWU-GCP-001` |
| GCP-B-002 | L1+ | current IR has closed node/edge unions | DomainSpec implementer | design admission extension after L0 |
| GCP-B-003 | L2 | cross-graph evaluator and independent oracle are missing | research/implementation | keep graph-law task blocked |
| GCP-B-004 | L3 | broad BTE and consumer proof remains separate | backend lane owner | hand off after L2 |
| GCP-B-005 | L0 | key-and-door Rule has no authored formal predicate or fixture-input source, so a real assertion cannot be derived honestly | user / Task Session | resolve [DEC-GCP-001](decisions/2026-07-20-key-and-door-formal-source.md) |
| GCP-B-006 | L0C external | IOLM candidate substrate lacks the upstream cross-feature-support receipt required before its consumer run | IOLM / DomainSpec owner route | preserve the L0 verdict; resume the IOLM lane only after its own receipt gate passes |

## External Consumer Handoff

After a successful `SWU-GCP-001`, the EVF verifier returns one immutable handle
set containing graph, obligation, TestCase, binding, evaluator, execution,
mutation, and receipt identities/digests. The private IOLM owner consumes that
set through `SWU-IOLM-DSC-A` and returns a fresh independent receipt. EVF may
reference that receipt but cannot author, repair, or substitute it.

The IOLM cross-feature/support state gates this external handoff only. S1 may
close and S2 may begin without an IOLM receipt. The stronger combined claim
remains blocked until both exact receipts exist.

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation | Status |
| --- | --- | --- | --- |
| sequence | define -> design -> plan -> Task Session | downstream artifacts use explicit refs | pass |
| artifact_contract_bridge | object contracts -> tasks/SWU | every boundary has a named artifact | pass |
| owner_boundary_check | source, derived, execution, evidence planes | no authority or release promotion | pass |
| scu_swu_reduction | task board -> one first SWU | exactly one narrow unit selected | pass |
| recomposition_proof | L0 receipt -> full architecture | first proof maps to all six views | pass |
| validation_loop | positive, negative, regression checks | each slice has evidence | pass |
| execution_receipt_handoff | Task Session -> receipt | execution remains outside Invoke | pass |
| residue_ledger | gaps, skips, needs_formal | incomplete claims remain visible | pass |

## Distill Validation

See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md). The first unit passes
atomicity and narrowness; later graph-law and breadth tasks carry explicit flags.

## Navigation

1. Read [work-pack/shared/CONTEXT.md](work-pack/shared/CONTEXT.md).
2. Review [TASK-GCP-ENFORCES](work-pack/tasks/TASK-GCP-ENFORCES.md).
3. Select only `SWU-GCP-001` in a Task Session.
4. Return its receipt to [TASK-GCP-VERIFY](work-pack/tasks/TASK-GCP-VERIFY.md).
