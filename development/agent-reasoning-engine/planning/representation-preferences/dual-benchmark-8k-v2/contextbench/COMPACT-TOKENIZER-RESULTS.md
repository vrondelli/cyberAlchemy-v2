# Complete matched recovery input measurement

All 97 paired boundaries completed using the actual GLM tokenizer. Demand-driven entry measured **12.32% less input** than the repaired eager catalog: **233,095 versus 265,849 tokens**, a difference of **32,754**. Every pair was smaller under demand entry. This supports the predeclared input-size hypothesis, not perfect benchmark quality or 15% cumulative model-token savings.

| Retained history | Pairs | Eager input | Demand input | Reduction |
|---|---:|---:|---:|---:|
| ContextBench 1 | 31 | 79,042 | 68,012 | 13.95% |
| ContextBench 2 | 29 | 78,471 | 68,278 | 12.99% |
| ContextBench 3 | 10 | 33,542 | 29,856 | 10.99% |
| ContextBench 4 | 27 | 74,794 | 66,949 | 10.49% |
| Total | 97 | 265,849 | 233,095 | 12.32% |

## What was measured

The fixed original request histories were unchanged except for the recovery surface. Eager visibility used the corrected populated catalog, compact cursor and freshness notice. Demand visibility used an unopened recovery entry point. Both retained the same task text, source/tool output and unrelated tool schemas. No new model response or recovery-opening behavior was simulated.

There were 214 successful tokenizer requests: 194 complete paired requests and 20 page-sizing requests. All counts are known. No model-generation calls occurred. The tokenizer count plus each original output reservation stayed within 8K for all 194 paired requests; live retained-reasoning admission still needs its normal checks.

The previous failed stage remains retained: 35 successful tokenizer responses and one interrupted attempt with unknown token count, 12/97 completed pairs and no model generation. Those partial observations were not substituted into this new result. The compact successor completed a fresh measurement with unchanged 256-token page and 1024-byte page limits.

## What remains unproved

These are measured inputs on four exposed development histories, not newly executed full trajectories. Opening turns, output/reasoning changes, actual recovery use, discovery quality and final Span-F1/File-F1 were not measured. The unopened-entry assumption is an optimistic visibility scenario, not a prediction of model behavior. Even its observed input reduction is below 15%; it cannot by itself establish the campaign's stricter cumulative-token target.

The useful result is now concrete: a populated recovery catalog can fit the existing budget after the cursor repair, and delayed visibility reduces measured input on every assigned boundary. The next experiment must determine whether recovery improves discovery/continuity enough to preserve perfect quality and reduce total work. Compact final evidence persistence and complete live integration are still prerequisites.

Evidence: [terminal report](recovery-tokenizer-compact-r1/RESULTS.json), [prospective protocol](RECOVERY-TOKENIZER-COMPACT-PROTOCOL.md), [launch review](RECOVERY-TOKENIZER-COMPACT-LIVE-REVIEW.json), [retained failed-stage review](RECOVERY-TOKENIZER-R1-REVIEW.json). [Independent terminal review](RECOVERY-TOKENIZER-COMPACT-R1-REVIEW.json) reproduced all requests and rows. [Native observation, decision, DAG and work records](RECOVERY-TOKENIZER-COMPACT-R1-POSTRUN.json) are registered.

## Open questions

Does the model open or refresh recovery at the right time? Can better evidence availability reduce redundant exploration without losing required coverage? How much of the input reduction survives opening and output costs? Does the result generalize beyond these histories? Full-trajectory and untouched confirmation evidence are still required.
