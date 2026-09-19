# LongMemEval diagnostic completion audit

This diagnostic is complete. The dual-benchmark campaign remains open.

The frozen four-task comparison produced eight answers and eight native-rubric judgments, with no missing outcomes, retries, or unknown usage. Baseline scored 3/4; scope policy scored 4/4. The sole discordance was fish-count abstention. Both arms passed the earlier recommendation case, so the preference-scope hypothesis remains **inconclusive**.

| Requirement | Verified evidence |
| --- | --- |
| Fixed tasks and source integrity | LIVE-REVIEW.json; all 770 live-freeze.json bindings intact |
| Two workers | LIVE-POSTRUN-REVIEW.json records peak overlap of two request intervals for generation and judging |
| 8,000-token admission | Maximum measured input plus reserved output: 3,748 |
| Complete accounting | LIVE-RESULTS.json: 21,943 generation + 2,508 judge = 24,451 tokens; unknown usage zero |
| Evaluation isolation | Generation sealed before judging; gold excluded from generator |
| Independent review | LIVE-POSTRUN-REVIEW.json approves result integrity and explicitly denies campaign completion |
| Research method | Prospective hypotheses, experiment, and continuity freeze; post-run observation, decision, registration, and DAG |
| Task lifecycle | LIVE-RESEARCH-WORK-STATE.json closes five diagnostic tasks with verified evidence |

Scope used 147 more generation tokens. Including judges, it used 77 fewer tokens (0.63%), which does not meet 15%. These arms share projected evidence; this comparison does not replace the earlier ingestion-versus-retrieval comparison. D08 task reconciliation is retrospective, not a claim of historical task preregistration.

Run `node close-live-work.mjs --check` from this directory to verify the evidence-bound lifecycle state. The independent review and its bound plan remain unchanged; closure events and state are separate artifacts.

## Open questions

Does the abstention difference replicate? Does the scope policy help unseen preference questions and long histories? Can ARE preserve quality while reducing full-task tokens by at least 15% separately on both benchmarks? ContextBench live integration and measurement remain outstanding.
