---
task_id: TASK-UIF-LANES
feature_code: UIF
layer: L1
status: completed
gate_status: completed
updatedAt: 2026-07-11
---

# TASK-UIF-LANES: Run All-Label Experiments

## Objective

Apply the frozen protocol to all 11 labels through three disjoint write scopes.
The lanes are scheduling groups, not candidate ontology categories.

## Shared Algorithm

For each assigned label: select provenance-bearing specimens, freeze expected
outcomes, run constructibility, malformed-negative, neighbor, graph-coherence,
and initial portability checks, rerun for determinism, then emit one result
record and correction route. Do not draft candidate schemas yet.

## Smallest Working Units

### SWU-UIF-004 - Composition lane

- Labels: Page, Layout, Component.
- Dependencies: UIF-003.
- Source anchors: `SPEC.md` candidate rows; `relationships.yml` signatures
  `renders`, `wraps`, `composes`, `consumes`, `displays`.
- Related context: UI11 Page/Layout/Component collapse attacks.
- Write scope: only assigned fixtures/results.
- Done: three complete provisional result records.
- Acceptance: every label has malformed and neighbor outcomes, correction route,
  and framework-style note.
- Validation: lane command, result-schema check, deterministic rerun.
- Execution owner: subagent.
- Handoff: do not edit shared runner or other lane paths.

### SWU-UIF-005 - Data and interaction lane

- Labels: View Model, Form, Action, State Indicator.
- Dependencies: UIF-003.
- Source anchors: `derives`, `displays`, `shapes`, `submits`, `contracts`,
  `reflects` signatures and SPEC candidate rows.
- Related context: Value Object/Query/Component/State Machine neighbors.
- Write scope: only assigned fixtures/results.
- Done: four complete provisional result records.
- Acceptance: Form and Action are not collapsed by shared event-handler prose;
  State Indicator records split pressure explicitly.
- Validation: lane command, result-schema check, deterministic rerun.
- Execution owner: subagent.
- Handoff: relationship gaps become requests, not direct edits.

### SWU-UIF-006 - Integration and control lane

- Labels: Hook, Guard, Binding, Adapter.
- Dependencies: UIF-003.
- Source anchors: `consumes`, `protects`, `mirrors`, `fetches`, `mutates`,
  `shapes` signatures and SPEC candidate rows.
- Related context: Rule, Mapping, Query, Operation, and framework-vocabulary
  boundaries.
- Write scope: only assigned fixtures/results.
- Done: four complete provisional result records.
- Acceptance: Hook portability, Binding node-versus-relation, and Adapter versus
  Mapping are explicitly adjudicable.
- Validation: lane command, result-schema check, deterministic rerun.
- Execution owner: subagent.
- Handoff: do not treat framework names or edge presence as formation proof.

## Parallel Join

All three SWUs may run in parallel after UIF-003. They must share the frozen
protocol version, write disjoint paths, and return receipts before UIF-007.

[`DEC-UIF-W1-RESULT-CONTRACT`](../../runs/SWU-UIF-004/DECISION-W1-RESULT-CONTRACT.md)
is resolved with a [versioned sibling W1 contract](../../experiments/w1/protocol.yml).
The lane write scopes remain disjoint and the E0 contract remains immutable.
