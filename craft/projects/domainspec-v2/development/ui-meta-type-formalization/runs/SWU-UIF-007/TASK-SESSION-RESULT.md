---
task_reference: SWU-UIF-007
parent_task: TASK-UIF-ADJUDICATE
result: pass
completed: 2026-07-11
runtime: local-manual
adapter: none
subagent_closeout: n/a
---

# Task Session Result: SWU-UIF-007

## Result

- Task: join W1 evidence and assign one provisional outcome per label.
- Result: PASS.
- Decisions: no blocker decisions; deterministic lane outcomes retained.
- Context pack: 11 sources, 21 selector groups, full obligation coverage.
- Runtime: local/manual.
- Gate verdict: coverage, shape, evidence, residue, and authority gates pass.
- Experiment harness: W1 evidence joined; hardening/replication pending.

## Outputs

- [Machine verdicts](../../adjudication/verdicts.yml)
- [Verdict matrix](../../adjudication/VERDICT-MATRIX.md)
- [Gap ledger](../../adjudication/GAP-LEDGER.md)
- [Context pack](CONTEXT-PACK.md)

## Outcome Census

- `candidate-schema-ready`: 9.
- `merge-candidate`: 1 - Adapter to Mapping.
- `split-candidate`: 1 - State Indicator.
- Other outcomes: 0.
- Missing/duplicate labels: 0.
- Active/promoted outcomes: 0.

## Validation

- Eleven unique machine results: pass.
- Protocol/result-contract versions: uniform.
- Determinism and promotion-false guards: pass.
- Correction route and residue coverage: pass.
- Earlier attacker disagreements: retained.
- DS-D8 endpoint-as-authority use: absent.

## Follow-Up

UIF-008 may draft candidate twins only for the nine schema-ready labels.
Adapter and State Indicator remain outside candidate authoring.
