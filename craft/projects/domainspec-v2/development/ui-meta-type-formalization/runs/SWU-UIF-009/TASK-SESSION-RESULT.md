---
task_reference: SWU-UIF-009
parent_task: TASK-UIF-CANDIDATES
result: pass
completed: 2026-07-11
runtime: local-fallback
adapter: none
subagent_closeout: n/a
---

# Task Session Result: SWU-UIF-009

## Result

- Task: total rule-map evidence and candidate instance round trip.
- Result: PASS.
- Decisions: no blocker decisions; no new validator rule required.
- Context pack: 9 sources, 17 selector groups, full obligation coverage.
- Runtime: local fallback.
- Gate verdict: rule totality, generation, validation, mutation, and boundary gates pass.
- Experiment harness: pass for candidate instance round trip.

## Outputs

- [Rule-map projection](../../candidate-meta-types/ui/validation/rule-map.yml)
- [Round-trip harness](../../candidate-meta-types/ui/round-trip-candidates.ts)
- [Round-trip results](../../candidate-meta-types/ui/validation/round-trip-results.json)
- Generated instances: `candidate-meta-types/ui/__generated__/instances/`
- Targeted mutations: `candidate-meta-types/ui/__generated__/mutations/`
- [Context pack](CONTEXT-PACK.md)

## Validation

- Rule vocabulary: 7/7 classified by existing shared authority.
- Candidate rule kinds: 2/2 supported; unknown rules: 0.
- Generated instances: 9/9 accepted.
- Targeted separating-attribute mutations: 9/9 rejected.
- Focused non-collapse tests: 7/7 passed.
- Shared content/instance/non-collapse tooling mutation: none.
- Canonical meta-type installation: none.

## Residue

Independent second-corpus replication and adversarial review remain required.
Candidate artifacts remain non-promotional even after round-trip success.
