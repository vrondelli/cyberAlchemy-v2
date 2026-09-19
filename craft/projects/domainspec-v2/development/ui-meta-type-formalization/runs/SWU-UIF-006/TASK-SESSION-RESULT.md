---
task_reference: SWU-UIF-006
parent_task: TASK-UIF-LANES
result: pass
completed: 2026-07-11
runtime: local-fallback
adapter: none
subagent_closeout: n/a
---

# Task Session Result: SWU-UIF-006

## Result

- Task: integration-control lane for Hook, Guard, Binding, and Adapter.
- Result: PASS.
- Decisions: no blocker decisions; four reversible expectations preregistered.
- Context pack: 11 sources, 20 selector groups, full obligation coverage.
- Runtime: local fallback; no subagent spawned.
- Gate verdict: all lane and E0-calibration gates pass.
- Experiment harness: pass for adapted W1 integration-control evidence.

## Outputs

- [Lane manifest](../../experiments/w1/lanes/integration-control/lane.yml)
- Fixture directory: `experiments/w1/lanes/integration-control/fixtures/`
- Run 1 and run 2: `experiments/w1/results/integration-control/`
- [Final summary](../../experiments/w1/results/integration-control/final/SUMMARY.md)
- [Comparison](../../experiments/w1/results/integration-control/final/comparison.yml)
- [Context pack](CONTEXT-PACK.md)

## Outcomes

| Label | Method outcome | Provisional outcome | Important residue |
| --- | --- | --- | --- |
| Hook | structural-separation-survives | candidate-schema-ready | Hook-Binding signature request pending |
| Guard | structural-separation-survives | candidate-schema-ready | component-target scope unresolved |
| Binding | structural-separation-survives | candidate-schema-ready | Hook-Binding signature request pending |
| Adapter | structural-collapse-observed | merge-candidate | merge target Mapping |

## Validation

- Two runs and recursive diff: pass; byte-identical.
- W1 schema and semantic/hash comparison: pass.
- Four labels, fixtures, and final records: pass.
- Hook two-style neutral portability: pass for adapted representations.
- Binding durable-record versus pure-relation discrimination: pass.
- Adapter/Mapping E0 collapse reproduction: pass.
- Round trip: not run; promotion eligibility: false.
- DS-D8 evidence: supporting-only.

## Residue

Independent corpus, round trip, and replication remain open. Guard and Binding
relationship gaps require owner-routed requests if their candidate laws survive
hardening. Adapter retains no distinct schema-ready route on current evidence.
