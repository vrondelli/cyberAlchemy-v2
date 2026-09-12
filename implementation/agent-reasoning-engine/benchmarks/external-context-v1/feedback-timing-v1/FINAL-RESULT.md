# GLM small-window chapter closeout

The fixed **12-episode** comparison is complete. Early feedback produced **3/6** repeat-verified repairs; delayed feedback produced **3/6**. The cohort contains three previously observed Svelte tasks with two repetitions each. It is development evidence, not broad GLM qualification.

**H1: inconclusive.** No syntax-invalid candidate occurred in the live cohort. Earlier invalid-code feedback was not exercised, so H1 remains inconclusive.

| Episode | Outcome | Model calls | Recycles |
| --- | --- | --- | --- |
| 16309-early-r1 | full pass twice | 17 | 3 |
| 16309-delayed-r1 | full pass twice | 7 | 0 |
| 16417-early-r1 | model_output_budget_exhausted | 10 | 1 |
| 16417-delayed-r1 | unable_to_repair | 24 | 4 |
| 16542-early-r1 | model_tool_protocol_failure | 22 | 5 |
| 16542-delayed-r1 | unable_to_repair | 24 | 5 |
| 16542-delayed-r2 | unable_to_repair | 24 | 6 |
| 16542-early-r2 | unable_to_repair | 24 | 5 |
| 16417-delayed-r2 | full pass twice | 16 | 1 |
| 16417-early-r2 | full pass twice | 22 | 2 |
| 16309-delayed-r2 | full pass twice | 11 | 0 |
| 16309-early-r2 | full pass twice | 20 | 3 |

## Benchmark and paired outcomes

Early wins: 0; delayed wins: 0; ties: 6; infrastructure-incomplete pairs: 0. Output-budget exhaustion and model tool-protocol failures count as non-completions in model-quality pairs. The [reviewed closeout](reviewed-closeout.json) preserves both this receipt-based classification and the frozen analyzer's broader run_error grouping. No attempt was retried, replaced or removed.

[Full score verification](reviewed-closeout.json) binds every evaluation and repetition to its patch and report. Every verified success passes all expected repair and regression labels, with no parsed failures in either fresh evaluation; skipped tests are reported separately.

## Context and cost

There were 35 ARE recycling events. All audited dispatch bounds stayed below 12,000 with the fixed output reservation and accounting margins. Archive hashes, objective/workflow restoration and subsequent responses/tool activity are recorded per event. This validates the observed mechanical continuity; it does not establish perfect semantic recall. All 35 observed recycling events passed mechanical continuation checks; two episodes never recycled.

This runner uses direct stateless API requests and has no host compactor. Provider-internal compaction is not observable, so absence of host events is not proof about provider internals.

Recorded model list-price estimate: USD 0.229139, within the USD 1.20 reserve. This is not a billing statement; tokenizer/checker billing is not inferred. Calls, input/output tokens, checker time and elapsed time are in the [reviewed closeout](reviewed-closeout.json).

## Interpretation and follow-up

[Candidate construction timing](construction-timing.json) shows five non-completing episodes with no staged candidate, and one syntax-valid candidate staged at call 22 whose public test failed at call 23. These are descriptive observations, not proof that forcing earlier edits would solve the tasks.

The [research DAG and learning decisions](reviewed-research-result.json) retain H1 and its alternatives. [Protocol notes](protocol-notes.json) identify the shared legacy recommendation to test immediately; neither arm was changed after freeze. [Offline controls](controls/report.json) establish narrow syntax detection and independent behavioral rejection, not a live repair-quality benefit.

This closes the fixed small-window research chapter with its successes and failures. Any recovery-budget change, evidence-retention change, wider-window evaluation, fresh task qualification, non-coding comparison or second-model experiment requires a separate plan. No engine feature was activated.

## Open Questions

Which remaining failures are best explained by late candidate construction, insufficient output allowance, lost evidence, or tool-protocol handling? How can feedback timing be tested when naturally generated candidates contain no syntax violations? Would clearer shared workflow wording change recovery? Does any supported mechanism transfer beyond these tasks and GLM?
