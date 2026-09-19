---
task: SWU-BTE-001
mode: standard
status: block
createdAt: 2026-07-20T15:20:43-03:00
trigger: DEC-CAV2-IOLM-00C-B-CROSS-FEATURE-001
---

# Context Pack — SWU-BTE-001 readiness audit

## Context Pack Summary

- Task: `SWU-BTE-001` — extract the shared YAML criterion kernel.
- Mode: standard, local execution.
- Files selected: 7.
- Obligation coverage: 4 of 5 obligations covered; readiness selection is contradictory.
- Strict coverage: `block`.
- Runtime handoff: none.
- Prototype/compiler mutation: none.

## Obligation matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| O-01 | Select exactly one dependency-ready SWU. | `WORK-PACK.md` manifest plus task and wave contracts. | **block** — the manifest marks 001 blocked and 002 ready, while the controlling contracts require the reverse order. |
| O-02 | Confirm W0 owner gate is closed. | `work-pack/waves/W0-OWNER-GATE.md`; `work-pack/shared/DECISIONS.md`. | covered |
| O-03 | Preserve the exact task write scope. | `work-pack/tasks/TASK-BTE-CONTRACT.md#SWU-BTE-001`. | covered |
| O-04 | Preserve the accepted proof order. | `DISTILL-VALIDATION.md`; `work-pack/waves/W1-SHARED-KERNEL.md`; `work-pack/waves/W2-ALL-BACKEND-KINDS.md`. | covered |
| O-05 | Retain runnable completion validation. | Four commands in `TASK-BTE-CONTRACT.md`. | covered |

## Controlling evidence

1. `WORK-PACK.md#SWU Manifest` marks `SWU-BTE-001` as `blocked` and `SWU-BTE-002` as `ready-after-selection`.
2. `TASK-BTE-CONTRACT.md#Dependencies and blockers` says 001 is the first executable unit after W0 and says 002 is blocked by the profile/mapping gates.
3. `DISTILL-VALIDATION.md#Smallest coherent unit` names 001 as the smallest independently executable unit.
4. `W1-SHARED-KERNEL.md` orders 001 before the node adapter; `W2-ALL-BACKEND-KINDS.md` admits 002 only after the W1 kernel and adapter evidence passes.
5. W0 records the FPR-02B owner decision as accepted, but does not itself repair the contradictory manifest statuses.

## Gate verdict

`BLOCK`. Task Session may not infer that the manifest status is a typo or select 001 against an authoritative `blocked` row. Selecting 002 would also violate its stated dependencies and the accepted proof order.

The exact unblock action is an Invoke Refresh of this BTE package that reconciles the SWU manifest, control fields, and execution dispatch so exactly one dependency-ready unit is named. A later Task Session must then build a fresh context pack before any implementation mutation.

## Boundary

This audit creates session evidence only. It does not edit the criterion evaluators, compiler, schemas, tests, profile, IOLM prototype, authority, production, or public Arcanum.
