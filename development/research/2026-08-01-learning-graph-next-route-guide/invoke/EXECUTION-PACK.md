# Execution Pack: Learner Projection And Next-Route Guide

## Planning Control Fields

| Field | Value |
| --- | --- |
| planningGateStatus | pass |
| executionAdmissionStatus | block-learner-view-mutation-admission-and-selection |
| complexity | medium |
| baselineWave | W0 |
| activePlanRef | `WORK-PACK.md` |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| specRef | `SPEC.md` |
| activeLayerWindow | L0 |
| readinessProfile | pilot |
| selectedSwu | none |

## Serial Wave Plan

| Wave | Layer | SWUs/tasks | Gate |
| --- | --- | --- | --- |
| W0 | admission/baseline | learner-view mutation admission, exact source/product baseline | no mutation until pass |
| W1 | L0 | SWU-LGP-001 | structural contract receipt |
| W2 | L0 | SWU-LGP-002 -> 003 -> 004 | exact replay, positive ceiling, then gap response |
| W3 | L1 | SWU-LGP-005 -> 006 | current reader then semantic DOM |
| W4 | L1 | SWU-LGP-007 -> 008 -> 009 | presentation, parity, then keyboard |
| W5 | L2 | SWU-LGP-010 -> TASK-LGP-VERIFY | browser evidence then independent closure |

## Parallelization Boundary

No mutation SWUs run in parallel. Compiler artifacts, generated data, host HTML,
reader code, styles, and acceptance tests form overlapping sequential
baselines. Read-only independent review may run only after a wave receipt and
cannot mutate product or plan artifacts.

## Handoff Rule

Task Session consumes exactly one selected SWU, its task contract, the current
W0/predecessor baseline, and execution-time Context Builder pack. Invoke does
not pre-generate the runtime pack and no wave auto-selects its successor.
Task Session writes session evidence only; the lifecycle owner independently
writes the owner receipt under `work-pack/owner-evidence/<SWU-ID>/`.
