---
task_id: TASK-DSD1-VERIFY
feature_code: DSD1
layer: L3
status: not-started
gate_status: ready-after-sync
updatedAt: 2026-07-03
---

# TASK-DSD1-VERIFY: Final Recomposition Check

## Objective

Verify that the executed DS-D1 improvement recomposes into one coherent state:
definitions, schemas, validators, projections, Craft, Inventory, and residue
all agree.

## Source Anchors

- Completed Task Session receipts.
- `projects/domainspec-v2/development/ds-d1-improvement-plan/WORK-PACK.md`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/EXECUTION-PACK.md`
- `projects/domainspec-v2/definitions/`
- `projects/domainspec-v2/impl/`
- `projects/domainspec-v2/CRAFT.md`

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-016 | Final verification and closeout result. | Result artifact only. | after SWU-DSD1-015 |

## Implementation Notes

- Separate completed scope from deferred scope in the final result.
- A failed optional branch is not a failure if the residue is explicit and the
  executed branch validates.
- Do not mark the whole plan complete while the UI owner decision or backend
  hardening remains open; SGRM-001..008 migration closeout is complete.

## Acceptance Evidence

- Relevant validation commands pass or have scoped, explained residue.
- Work-pack status matches actual execution receipts.
- Final result names the next task-session route if any residue remains.
