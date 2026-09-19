# Acquisition and final-selection loss

Retrospective analysis of the reviewed schema-agreement run. No provider calls.
Sources and SHA256 bindings are in [the machine report](SELECTION-LOSS-ANALYSIS-R1.json).
Reproduce with `python3 analyze-selection-loss-r1.py` from this directory.
Two consecutive executions produced identical output; decomposition invariants
and review-to-score digest checks passed for all four valid tasks.

| Task | Never acquired | Acquired but dropped | Final recall | Ideal selection-only F1 ceiling |
| --- | ---: | ---: | ---: | ---: |
| 1 | 92.14% | 7.86% | 0.00% | 14.58% |
| 2 | 0.00% | 23.57% | 76.43% | 100.00% |
| 3 | 69.70% | 0.00% | 30.30% | 46.51% |
| 4 | 71.77% | 0.00% | 28.23% | 44.03% |

Mean missing recall from acquisition: 58.40%.
Mean recall dropped by final selection: 7.86%.
Even ideal selection over already acquired evidence has a mean F1 ceiling of
51.28%. This assumes perfect precision and
arbitrary span selection; real handle constraints can lower the ceiling.
Selection-only work cannot achieve the objective on this run's acquired evidence.

## Next hypothesis candidates

- Incremental: preserve useful evidence through final selection. Predict less
  acquired-but-dropped recall without lower final precision; acquisition should
  remain comparable. Register thresholds before launch.
- Radical: replace repeated local query exploration with an explicit coverage
  frontier across task-derived concepts and repository structure, with a
  deterministic visited-evidence ledger. Predict greater union recall per total
  model token and less repeated evidence. The frontier must come from the task
  and observed source, never benchmark answers. Register the mechanism and
  thresholds separately from incremental changes.

Prioritize acquisition for the next live candidate: three tasks cannot reach
perfect quality through selection alone. Analyze prompt/trace behavior before
choosing the exact implementation. Path-scoped retrieval remains an alternative
local repair; do not label it a radical architecture change by itself.

Both branches retain fixed tasks, 8K envelope, two shared workers, complete model
token accounting and native scoring. No new control runs. Result review approves
integrity, not quality: four valid tasks, zero perfect tasks. Original token
reduction and untouched confirmation requirements remain unproven.

## Open Questions

Union acquisition does not prove simultaneous visibility or model retention.
Why did exploration miss relevant source, and why did selection drop acquired
source? Does redundancy reflect wasted effort or necessary verification? Can
improvements generalize beyond these exposed tasks? Native retrospective result
registration and prospective experiment records are still required before launch.
