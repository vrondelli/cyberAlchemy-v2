# R1 full-trajectory attempt: inconclusive

The live experiment did not produce a quality score. Four of eight assigned arms completed generation. Task3 control then failed on a dispatched request-tokenizer timeout. The shared stop check missed that provider receipt type, allowing further work until the coordinator stopped the verified supervisor. No native evaluator or reference-answer access occurred.

Independent terminal review verified275frozen source bindings and reconciled the four pair records with seven dispatched arms' durable ledgers. The eighth arm remains recorded as not started. All local supervisor/worker processes and the worker group were absent after shutdown.

| Accounting | Result |
|---|---:|
| Assigned arms | 8 |
| Generation-complete arms | 4 |
| Model attempts | 154 |
| Known model tokens | 381,518 |
| Interrupted model calls with unknown usage | 2 |
| Unknown-token reserve | 16,000 |
| Conservative model-token total | 397,518 |
| Request-tokenizer attempts | 181 |
| Failed request-tokenizer attempts | 1 |
| Native scores | 0 |

This is infrastructure-inconclusive evidence. It neither supports nor rejects the recovery quality/efficiency hypothesis. Partial token comparisons cannot clear the target. The original hypothesis, perfect-quality and15%total-token gates, fixed denominator and all costs remain intact.

The additive provider-attempt health wrapper now covers model, request-tokenizer and index-tokenizer receipts. Independent review passed three test groups; replay classifies the four completed arms healthy and all three failed arms unhealthy. It prevents next arms and queued tasks from starting after these failures, while letting an already in-flight request settle under its existing bound. Frozen R1 sources are unchanged.

Native observation, learning decision and research DAG are in RECOVERY-TRAJECTORY-R1-POSTRUN.json. The decision is inconclusive; it preserves the enduring reusable ARE objective and original GLM8K milestone.

## Next work and open questions

1. Bind the reviewed shared health wrapper into a fresh successor worker.
2. Prospectively set the same120-second single-attempt tokenizer deadline for both arms, retaining the30-minute arm and150-minute generation deadlines. This tests an operational remedy; one30-second timeout does not establish its cause. Model request limits, prompts, scoring and token ceilings remain unchanged.
3. Preserve local-process settlement evidence independently when receipt reconciliation fails.
4. Register successor hypotheses/experiment/work DAG, obtain exact review and fresh storage admission, and run a fresh fixed eight-arm comparison. Retain R1 costs without retrying or overwriting its stage.
5. Score only after complete generation evidence and accounting; record the observation and next hypothesis from the actual result. Broader untouched LongMemEval confirmation remains open.
