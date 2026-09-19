---
task_id: TASK-SGRM-SYNC
feature_code: SGRM
layer: L3
status: completed
---

# TASK-SGRM-SYNC: Reconcile Current Guidance And Plans

## Objective

Remove active Saga claims from current projections and cancel executable
hardening routes without rewriting historical evidence.

## Inputs

- SGRM-002..005 receipts
- ../../ACTIVE-SURFACE-CENSUS.md
- current README, discovery, taxonomy, learning order, and governance tag docs
- ds-d1-improvement-plan current work-pack/task/wave/dispatch
- r3-l2-relationship-hardening current work-pack/task/wave/design
- meta-type-formalization current status/projection docs

## Reconciliation Rules

1. Update current product/taxonomy language to Workflow with explicit scope.
2. Update counts by deriving from active registries, not prose arithmetic.
3. Mark DEC-DSD1-SAGA-FORK selected and the collapse branch executed only to
   the level proven by receipts.
4. Mark SWU-DSD1-008 cancelled/not-selected.
5. Link SWU-DSD1-009 to SGRM-001 and later receipts; do not claim complete
   migration before SGRM-008.
6. Cancel/supersede TASK-R3H-SAGA-LAWS and SWU-R3H-006/007 in active execution
   views. Preserve their files as historical planning evidence with explicit
   superseded status.
7. Remove Saga hardening from active waves and promotion gates.
8. Update Inventory summaries that otherwise route future work to hardening.
9. Do not rewrite completed research, decisions, refresh reports, or receipts.

## SWU-SGRM-006

- Goal: make every current guidance/execution surface agree with completed
  authority and implementation receipts.
- Dependencies: SGRM-005.
- Write scope: current docs/projections and active plan/read-model files named
  by the live manifest.
- Done criteria: no active current claim treats Saga as a type or runnable
  hardening target; history is intact.
- Acceptance evidence: classified diff, current-plan status table, receipt.
- Validation: validate:docs, current-plan Saga scan, JSON/YAML parse, git diff.
- Owner: local-fallback with plan-owner review.
- Handoff: select receipts, manifest current-plan rows, and current docs only;
  return standard SWU receipt.

## Failure Modes

- A plan is deleted instead of marked superseded: block.
- A work-pack claims migration complete without a receipt: block.
- Historical research prose is normalized to the new decision: block.
- Inventory points only to old neutral/hardening route: block closeout.
