# T1 — Complete the partial-knowledge evidence mechanism

Layer/slice: L2/S1. DAG: D, E. Complexity: high.

## Objective and contract

Implement only the current gaps in R00-R08 of the existing
`crabs-partial-knowledge-move-candidate-v1/implementation-repair-plan.md`.
That plan owns schemas, algorithms, exact implementation surface and V01-V17
requirements.

## SWUs

- SWU-T1-01: close R00-R04—raw-derived validation, CBMC classification,
  exact source/tool/command closure, immutable candidate construction and
  truthful readiness.
- SWU-T1-02: close R05-R08—streaming supervision, bounded output, process-group
  cleanup, interruption/finalization/recovery, retained per-merge observations,
  independent parsing and integrated scheduling.

Inputs: T0 disposition and freeze. Outputs: implementation diff, new schemas and
fixtures where the existing plan requires them, exact tests, raw validation
evidence and updated candidate identity.

Failure modes: false pass from trusted summary fields, honest counterexample
rejected as invalid evidence, lost CBMC target failure, orphan child, unbounded
pipe/output, duplicate finalization, cross-attempt row, or unexplainable boolean
observation. Each must have an explicit regression.

Write scope and algorithms: exactly the allowlist and rules in the existing
repair plan section 12; preserve v1 history and add successor epochs.

Done evidence: applicable V01-V17 checks pass against current bytes, adversarial
fixtures behave as specified, and T0's frozen obligations remain unchanged.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).

