---
task_reference: SWU-UIF-004
mode: standard
status: complete
result: blocker-found
created: 2026-07-11
---

# Context Pack: SWU-UIF-004

## Scope

Execute the composition lane for Page, Layout, and Component, stopping before
fixture or result mutation if the shared W1 machine contract is absent or
contradictory.

## Controlling Sources

| Source | Selected context | Obligation |
| --- | --- | --- |
| [WORK-PACK](../../WORK-PACK.md) | SWU manifest; gate checks | Execute one bounded lane, preserve shared contracts, validate result records. |
| [W1](../../work-pack/waves/W1.md) | parallel lanes; entry evidence | All lanes consume one E0-approved protocol and do not edit the shared result schema. |
| [Lane task](../../work-pack/tasks/TASK-UIF-LANES.md) | shared algorithm; UIF-004 | Emit three provisional results with malformed, neighbor, graph, and portability evidence. |
| [Protocol](../../experiments/protocol.yml) | run policy; pairs; stop conditions | Preserve `ui-formalization.v0.1`; do not mutate frozen E0 after execution. |
| [Result schema](../../experiments/result.schema.yml) | required fields; allowed IDs | Machine validation currently permits only E0 Form and Adapter records. |
| [Experiment plan](../../EXPERIMENTS.md) | E1-E4; result contract | W1 requires per-label records and selected provisional outcomes beyond E0. |
| [Layering](../../IMPLEMENTATION-LAYERING.md) | L1; non-regression guardrails | Preserve E0 rules/schema unless a versioned repair invalidates and reruns evidence. |
| [Execution pack](../../EXECUTION-PACK.md) | merge rules; runtime handoff | Lane workers may edit only assigned fixture/result paths. |
| [Hypothesis matrix](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) | Page/Layout/Component rows | Candidate hypotheses are frozen; outcomes remain unselected before execution. |
| [UIF-003 receipt](../SWU-UIF-003/TASK-SESSION-RESULT.md) | E0 closure | E0 is deterministic and complete; W1 entry dependency is satisfied. |

## Coverage

- Sources: 10.
- Selector groups: 15.
- Task contract, dependencies, write scope, done criteria, validation surface,
  source hypotheses, authority boundary, and synchronization surface: covered.
- Runtime handoff: none; local Task Session.
- Strict delegated coverage: n/a.

## Hard Constraints

1. Do not edit E0 protocol, schema, runner, fixtures, or results from a W1 lane.
2. Do not emit a record that cannot pass the declared result-schema check.
3. Do not select provisional outcomes before registered expectations and
   fixtures exist.
4. Keep Page/Layout/Component fixture and result paths disjoint from sibling
   lanes.
5. Do not mutate canonical DS-D1 or DS-D8 authority.

## Blocker

`experiments/result.schema.yml` requires `pair_id` and permits only
`UIF-E0-FORM-COMPONENT` / `UIF-E0-ADAPTER-MAPPING`; its candidate allowlist is
only Form / Adapter and its E0 rules require `not-adjudicated`. UIF-004 instead
must emit Page, Layout, and Component records with an L1 provisional outcome.

The lane cannot repair this inside its write scope because W1 explicitly
forbids shared-schema edits. Running would either produce invalid records or
silently bypass the validation contract. The shared W1 contract evolution must
be decided before any lane executes.

## Gate Result

- Dependency gate: pass.
- Source/context coverage: pass.
- Write-scope gate: pass.
- Machine-contract gate: block.
- Consequential mutation: not started.
- Decision record: [W1 result-contract evolution](DECISION-W1-RESULT-CONTRACT.md).
