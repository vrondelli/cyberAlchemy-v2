---
taskId: TASK-GCP-CONTRACT
layer: L0
slice: S0
status: blocked-on-GCP-B-005
complexity: medium
---

# Task GCP Contract

## Objective

Freeze the candidate fields, ID rules, digest rules, and receipt proof boundary
for the first composability slice without changing canonical authority.

## Source Contracts

- [DEFINE.md](../../DEFINE.md)
- [DESIGN.md](../../DESIGN.md)
- [TRACEABILITY.md](../shared/TRACEABILITY.md)

## Smallest Working Unit

No mutation-capable SWU is selected from this task. Its contract review is a
dependency of `SWU-GCP-001`.

## Done Criteria

- Every L0 object has an ID, source anchor, and digest rule.
- The v1 operations/interface adapter mapping is reviewed and its deferred
  aspects are explicit.
- Receipt separates structural, execution, evaluator, and residue fields.
- Authority split and non-goals are recorded.

## Validation

Review the contract table against `types.ts`, `rules/index.ts`, emitters, and
the receipt implementation; run `git diff --check`.
