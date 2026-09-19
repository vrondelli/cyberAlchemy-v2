---
task_id: TASK-UIF-ADJUDICATE
feature_code: UIF
layer: L1/L2
status: completed
gate_status: completed
updatedAt: 2026-07-11
---

# TASK-UIF-ADJUDICATE: Select Provisional Outcomes

## Objective

Join parallel results into exactly one provisional outcome per label without
discarding disagreements, failed hypotheses, or corpus limits.

## SWU-UIF-007

- Dependencies: UIF-004, UIF-005, UIF-006.
- Source anchors: all lane receipts, `SPEC.md#Experiment Outcomes`,
  `EXPERIMENTS.md#Acceptance Thresholds`.
- Related context: accepted UI11 review and node non-collapse findings.
- Write scope: synthesis, verdict matrix, and gap ledger only.
- Algorithm:
  1. Validate result shape and protocol version.
  2. Reject incomplete records into `defer-evidence-gap` with repair route.
  3. Compare constructibility, discrimination, portability, graph, and
     repeatability evidence.
  4. Apply the decision flow in order.
  5. Record disagreements and source limitations.
  6. Assign one provisional outcome and next owner to every label.
- Edge cases: one label may split; a relation gap may coexist with node failure;
  synthetic-only success cannot become schema-ready for promotion.
- Done: 11-row verdict matrix with evidence and residue.
- Acceptance: no missing or duplicate label, no `active` outcome, no DS-D8
  endpoint-as-authority reasoning.
- Validation: coverage check, result parse, manual authority review.
- Execution owner: manual.
- Handoff: only `candidate-schema-ready` labels route to UIF-008.
