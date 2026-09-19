---
task_id: TASK-UIF-REPLICATE
feature_code: UIF
layer: L2
status: completed-with-repair-required
gate_status: accepted-review-zero-survivors
updatedAt: 2026-07-11
---

# TASK-UIF-REPLICATE: Portability And Non-Collapse Review

## SWU-UIF-010

- Objective: test surviving candidates against a second corpus/framework style
  and adversarially review vacuity, collapse, counterexamples, framework bias,
  and authority leakage.
- Dependencies: UIF-008 and UIF-009.
- Source anchors: candidate twins/results, `EXPERIMENTS.md#E4` and `#E6`,
  accepted UI11 attacks.
- Related context: dispatch strategy permits parallel evidence and skeptic roles
  only after explicit runtime approval.
- Write scope: second-corpus results and review artifacts only.
- Algorithm: freeze replication expectations; normalize second-style specimens;
  rerun without criterion edits; attack each survivor; verify attacks; reconcile
  original and replicated outcomes; demote disagreements that lack repair.
- Edge cases: framework-specific success becomes `framework-vocabulary`; absent
  real corpus prevents promotion-ready status; DS-D8 gap routes outward.
- Done: every survivor has replication and accepted review status.
- Acceptance: criteria remain stable or a versioned rerun invalidates earlier
  evidence; disagreements remain visible.
- Validation: repeat suite, review coverage audit, result parse.
- Execution owner: subagent strategy recommended; requires separate approval.
- Handoff: only replicated survivors route to UIF-011 as promotion candidates.

## Completion

- Final auditor verdict: ACCEPT.
- Reconciliation: 0 `replicated`, 0 `narrowed`, 0 `demoted`, 9 `deferred`.
- Primary repair: version nonempty presence criteria and rerun the evidence contract.
- Downstream: UIF-011 is blocked because no candidate is eligible for the promotion lane.
