# GLM recovery reservation comparison

The fixed 8-episode development cohort is complete. Reserved construction: **1/4** repeat-verified repairs. Baseline: **1/4**. These are two observed Svelte tasks with two repetitions, not fresh holdout qualification.

Construction checkpoints did not satisfy the joint pilot repair/cost screen; retain counterevidence and investigate separately.

| Episode | Outcome | Model calls | Recycles | Invalid syntax candidates |
| --- | --- | --- | --- | --- |
| 16417-baseline-r1 | unable_to_repair | 24 | 4 | 0 |
| 16417-reserved-r1 | full pass twice | 11 | 1 | 0 |
| 16542-baseline-r1 | unable_to_repair | 24 | 6 | 0 |
| 16542-reserved-r1 | run_error | 22 | 4 | 0 |
| 16542-reserved-r2 | unable_to_repair | 15 | 3 | 0 |
| 16542-baseline-r2 | unable_to_repair | 23 | 5 | 0 |
| 16417-reserved-r2 | run_error | 16 | 2 | 0 |
| 16417-baseline-r2 | full pass twice | 10 | 1 | 0 |

## Evidence and limits

[Closeout](closeout.json) contains all paired outcomes, scores, costs, feedback timing, archive integrity and recovery evidence. [Research records](research-result.json) bind H1 to the measured result. [Policy controls](controls.json) verify checkpoints and unchanged baseline. Existing syntax/scoring controls are inherited with frozen source bindings.

The direct API runner invokes no host compactor. Every audited admitted bound is below 12K. Provider-internal compaction is unobservable; this does not prove it never occurs. Per-episode recovery verdicts distinguish passed, incomplete and not exercised. Preserved archives and objective/workflow continuity do not establish perfect semantic recall.

## Follow-up and Open Questions

Interpret the per-task and paired outcomes before selecting another intervention. Recovery budgeting and evidence retention remain separate hypotheses. Non-coding, other models and larger windows remain deferred after this chapter. Any generalization needs its own comparison.

Did earlier construction improve repairs? Which are knowledge, investigation or budget bottlenecks? Does any benefit survive fresh tasks and models?
