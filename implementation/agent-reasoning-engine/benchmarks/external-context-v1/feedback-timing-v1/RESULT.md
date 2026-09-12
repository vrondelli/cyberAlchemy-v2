# GLM small-window feedback comparison

The fixed 12-episode development cohort is complete. Early feedback: **3/6** repeat-verified repairs. Delayed feedback: **3/6**. These are three observed Svelte tasks with two repetitions, not fresh holdout qualification.

Infrastructure-incomplete pairs limit the comparison.

| Episode | Outcome | Model calls | Recycles | Invalid syntax candidates |
| --- | --- | --- | --- | --- |
| 16309-early-r1 | full pass twice | 17 | 3 | 0 |
| 16309-delayed-r1 | full pass twice | 7 | 0 | 0 |
| 16417-early-r1 | run_error | 10 | 1 | 0 |
| 16417-delayed-r1 | unable_to_repair | 24 | 4 | 0 |
| 16542-early-r1 | run_error | 22 | 5 | 0 |
| 16542-delayed-r1 | unable_to_repair | 24 | 5 | 0 |
| 16542-delayed-r2 | unable_to_repair | 24 | 6 | 0 |
| 16542-early-r2 | unable_to_repair | 24 | 5 | 0 |
| 16417-delayed-r2 | full pass twice | 16 | 1 | 0 |
| 16417-early-r2 | full pass twice | 22 | 2 | 0 |
| 16309-delayed-r2 | full pass twice | 11 | 0 | 0 |
| 16309-early-r2 | full pass twice | 20 | 3 | 0 |

## Evidence and limits

[Closeout](closeout.json) contains all paired outcomes, scores, costs, feedback timing, archive integrity and recovery evidence. [Research records](research-result.json) bind H1 to the measured result. [Offline controls](controls/report.json) demonstrate retained invalid detection and valid acceptance; a syntax-valid ineffective patch fails the independent benchmark scorer.

The direct API runner invokes no host compactor. Every audited admitted bound is below 12K. Provider-internal compaction is unobservable; this does not prove it never occurs. Per-episode recovery verdicts distinguish passed, incomplete and not exercised. Preserved archives and objective/workflow continuity do not establish perfect semantic recall.

## Follow-up and Open Questions

Interpret the per-task and paired outcomes before selecting another intervention. Recovery budgeting and evidence retention remain separate hypotheses. Non-coding, other models and larger windows remain deferred after this chapter. Any generalization needs its own comparison.

Which failures remain attributable to feedback timing? Which are knowledge, investigation or budget bottlenecks? Does any benefit survive fresh tasks and models?
