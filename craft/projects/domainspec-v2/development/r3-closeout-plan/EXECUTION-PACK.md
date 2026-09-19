---
module: r3-closeout-plan
feature_code: R3C
version: current
status: draft
updatedAt: 2026-07-02
docType: execution-pack
---

# Execution Pack: R3 Closeout Plan

Execution choreography for [WORK-PACK.md](WORK-PACK.md). This file schedules waves; it does not redefine
SWU contracts.

## Planning Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| planningGateStatus | flag | L0 selected SWU ready; full closeout has deferred owner gates. |
| complexity | medium | Split work-pack with cross-capability owner routes. |
| baselineWave | W0 | Dynamic DS-D8 code-tag enforcement. |
| activePlanRef | [WORK-PACK.md](WORK-PACK.md) | Source of truth for SWUs. |
| layeringArtifact | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | Layer decisions. |
| dispatchRef | [r3-closeout.dispatch.json](r3-closeout.dispatch.json) | Validated route shape target. |
| activeLayerWindow | L0 | |
| readinessProfile | pilot | |

## Wave Board

| Wave | Layer | Tasks | Entry Gate | Exit Evidence |
| --- | --- | --- | --- | --- |
| [W0](work-pack/waves/W0.md) | L0 | TASK-R3C-EDGE | R3A receipt present; DS-D8 active | Dynamic checker and tests green. |
| [W1](work-pack/waves/W1.md) | L1 | TASK-R3C-CORPUS, TASK-R3C-CARDS | W0 pass for corpus; cards may start now | Second corpus and card evidence linked. |
| [W2](work-pack/waves/W2.md) | L2 | TASK-R3C-FUTURE | W0 pass | Future candidates/category laws routed without authority mutation. |
| [W3](work-pack/waves/W3.md) | L3 | TASK-R3C-AUTHORITY, TASK-R3C-VERIFY | Relevant prior receipts | Ledger/observer synced; attestation route explicit. |

## Parallelization

- SWU-R3C-001 and SWU-R3C-005 may run in parallel: code-tag checker vs card evidence paths.
- SWU-R3C-004 waits for SWU-R3C-001 so the second corpus uses the new dynamic DS-D8 enforcement.
- SWU-R3C-007 and SWU-R3C-008 may run after SWU-R3C-001 because they are review packets, not implementation.
- SWU-R3C-009 waits for completed or explicitly deferred receipts.

## Receipt Rule

Every mutation-capable SWU returns:

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: task-session
receipt_kind: native-stage | local-fallback | blocked
receipt_artifact: <path or none>
files_touched:
  - <path>
validation:
  - <command or review check and result>
blockers:
  - <blocker or none>
residue:
  - <unresolved evidence or none>
reroute: <next owner or none>
handoff_note: <what the parent coordinator needs next>
```

## First Route

Recommended next route: `task-session` on `SWU-R3C-001`.
