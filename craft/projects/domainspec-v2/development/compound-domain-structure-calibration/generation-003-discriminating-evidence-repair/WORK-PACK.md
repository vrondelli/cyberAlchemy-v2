---
work_pack_id: WP-CDSC3-001
status: complete
work_pack_gate_status: pass
complexity: high
output_mode: split
active_layer: complete
next_owner: new-governed-package-only
next_swu: none
downstream_runtime_gate: resolved-by-DEC-CDSC3-011
mutation_authority: selected SWU write scope only
---

# Generation 3 Discriminating Evidence Repair Work Pack

## Objective

Produce one append-only generation that replaces compound substitution
coordinates with preregistered atomic targets, adds source-derived browser and
usefulness evidence, evaluates through unchanged v1 code, and independently
audits the result without authority inflation.

## Planning Sources

- [Specification](SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Implementation layering](IMPLEMENTATION-LAYERING.md)
- [Implementation plan](IMPLEMENTATION-PLAN.md)
- [Decisions](DECISION-LEDGER.md)
- [Gaps](GAP-LEDGER.md)
- [Execution pack](EXECUTION-PACK.md)

## Task Board

| Task | Layer | State | SWUs |
| --- | --- | --- | --- |
| [TASK-CDSC3-CONTRACTS](work-pack/tasks/TASK-CDSC3-CONTRACTS.md) | L0 | complete | 001-002 |
| [TASK-CDSC3-BASELINE](work-pack/tasks/TASK-CDSC3-BASELINE.md) | L0 | complete | 003 |
| [TASK-CDSC3-OBSERVATIONS](work-pack/tasks/TASK-CDSC3-OBSERVATIONS.md) | L1 | ready | 004-006 |
| [TASK-CDSC3-ADJUDICATION](work-pack/tasks/TASK-CDSC3-ADJUDICATION.md) | L2a | pending | 007 |
| [TASK-CDSC3-GENERATION](work-pack/tasks/TASK-CDSC3-GENERATION.md) | L2b | pending | 008 |
| [TASK-CDSC3-VERIFY](work-pack/tasks/TASK-CDSC3-VERIFY.md) | L3 | pending | 009 |

## SWU Manifest

| SWU | Parent Task | Dependencies | Layer | State | Owner |
| --- | --- | --- | --- | --- | --- |
| [SWU-CDSC3-001](work-pack/tasks/TASK-CDSC3-CONTRACTS.md#swu-cdsc3-001---protected-import-and-atomic-target-contract) | TASK-CDSC3-CONTRACTS | none | L0 | complete | local-fallback |
| [SWU-CDSC3-002](work-pack/tasks/TASK-CDSC3-CONTRACTS.md#swu-cdsc3-002---browser-runtime-and-observation-contract) | TASK-CDSC3-CONTRACTS | 001, DEC-CDSC3-011 | L0 | complete | local-fallback |
| [SWU-CDSC3-003](work-pack/tasks/TASK-CDSC3-BASELINE.md#swu-cdsc3-003---source-derived-browser-baseline) | TASK-CDSC3-BASELINE | 002 | L0 | complete | local-fallback |
| [SWU-CDSC3-004](work-pack/tasks/TASK-CDSC3-OBSERVATIONS.md#swu-cdsc3-004---permitted-browser-mutation) | TASK-CDSC3-OBSERVATIONS | 003 | L1 | complete | local-fallback |
| [SWU-CDSC3-005](work-pack/tasks/TASK-CDSC3-OBSERVATIONS.md#swu-cdsc3-005---breaking-browser-mutation) | TASK-CDSC3-OBSERVATIONS | 003, 004 serial | L1 | complete | local-fallback |
| [SWU-CDSC3-006](work-pack/tasks/TASK-CDSC3-OBSERVATIONS.md#swu-cdsc3-006---downstream-decision-differential) | TASK-CDSC3-OBSERVATIONS | 001, 005 serial | L1 | complete | local-fallback |
| [SWU-CDSC3-007](work-pack/tasks/TASK-CDSC3-ADJUDICATION.md#swu-cdsc3-007---atomic-adjudication-and-compatibility-projection) | TASK-CDSC3-ADJUDICATION | 004-006 | L2a | complete | local-fallback |
| [SWU-CDSC3-008](work-pack/tasks/TASK-CDSC3-GENERATION.md#swu-cdsc3-008---evaluate-and-append-generation-3) | TASK-CDSC3-GENERATION | 007 | L2b | complete | local-fallback |
| [SWU-CDSC3-009](work-pack/tasks/TASK-CDSC3-VERIFY.md#swu-cdsc3-009---independent-replay-and-closeout) | TASK-CDSC3-VERIFY | 008 | L3 | complete | manual |

All nine SWUs are complete. There is no selected successor route inside this
work-pack.

## Wave Index

| Wave | Layer | SWUs | Gate |
| --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 contracts/runtime | 001-002 | atomic target proof and approved browser runtime |
| [W1](work-pack/waves/W1.md) | L0 baseline | 003 | source-derived browser equivalence |
| [W2](work-pack/waves/W2.md) | L1 evidence | 004-006 | total observations and deterministic `D` |
| [W3](work-pack/waves/W3.md) | L2 adjudication/generation | 007-008 | deterministic projection, total result, exact append |
| [W4](work-pack/waves/W4.md) | L3 audit | 009 | fresh replay and authority audit |

## Global Done Contract

- Six target digests derive only from parent substitution text.
- Browser evidence runs only after approved runtime and baseline receipts.
- Savvy, UI repair, and generations 1/2 remain byte-identical.
- Mutation edit surfaces are disjoint and generated-package-local.
- `D` is deterministic and may be empty.
- The overlay has exactly 36 reviewed coordinates.
- The v1 projection and evaluator replay exactly.
- Generation 3 appends once after generation 2.
- Every SWU returns Task Session and observability receipts.
- No output claims identity, type, relationship, pattern, portability,
  candidate, activation, or promotion authority.

## Blockers

| ID | Affects | State | Resolution |
| --- | --- | --- | --- |
| `B-CDSC3-PLAYWRIGHT` | SWU002 onward browser path | resolved | `DEC-CDSC3-011` authorizes a pinned package-local Playwright/Chromium install during SWU002. |

The resolved blocker was consumed by completed SWU002. No human decision
remains open.

## Dispatch Technique Trace

| Technique | Applied To | Evidence |
| --- | --- | --- |
| `sequence` | predecessor -> targets -> browser -> observations -> adjudication -> generation -> audit | SWU dependencies and waves |
| `scu_swu_reduction` | nine bounded SWUs | one parent/write scope/receipt each |
| `recomposition_proof` | SWU outputs -> generation-3 objective | `DISTILL-VALIDATION.md` |
| `handle_handoff` | all cross-layer and UI imports | exact record/generation IDs |
| `artifact_contract_bridge` | schemas/direct validators/materializer | negative fixtures and parity tests |
| `validation_loop` | every layer | task verification surfaces |
| `concrete_path_evidence` | source and result claims | task source anchors |
| `owner_boundary_check` | calibration/UI/authority split | architecture interfaces and gates |
| `state_namespace_boundary` | protected/generated/result/audit roots | task write scopes |
| `execution_receipt_handoff` | every SWU transition | Task Session receipt requirement |
| `evidence_receipt_link` | UI-repair and browser evidence imports | stable handles only |
| `authority_split_gate` | final route | no result-to-promotion edge |

Full dispatch: `generation-003-discriminating-evidence-repair.dispatch.json`.

## Distill

Status: pass. SWU001 is the smallest coherent start: splitting schema from the
direct validator would permit unvalidated targets; adding browser bootstrap
would mix representation proof with a human runtime/download decision. All nine
SWUs recompose into one audited generation. See [DISTILL-VALIDATION.md](DISTILL-VALIDATION.md).

## Handoff

Close. The bounded suite recommendation may continue only through a new
governed `evidence-repair` package; never mutate authority directly.
