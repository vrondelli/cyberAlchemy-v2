# Fixed v20 repeatability result

The frozen eight-trial evaluation completed, but its reliability target failed: **3/8 verified repairs, 6/8 completion gates, and 4/5 continuity passes among recycled trials**. The earlier 9/10 screening result did not repeat in this batch. These samples remain separate; no failure was replaced or retried.

| Condition, all at 8K | Repetition 1 | Repetition 2 |
| --- | --- | --- |
| Long context, clear | Secret resolution failure | Secret resolution failure after recycling |
| Long context, recent-v2 | Incorrect empty-history behavior | Duplicate-ID and result-order failures |
| Archive, recent-v2 | Pass | Start-boundary failure |
| Exact JSON scoring, clear | Pass with continuity | Pass with continuity |

Both secret failures occurred before dispatch of a tokenizer request (`dispatched: false`, no HTTP status); the receipts do not establish the underlying secret-bridge cause. These prevented completion and stay in the denominator. The second interrupted clear trial recycled but did not finish required recovery, accounting for the failed continuity result. Both long recent trials passed continuity while producing incorrect repairs. Archive trials did not recycle, so continuity is not applicable to them.

The retained proposals show concrete correctness gaps: trial 01 rejects a valid empty history with recentCount=1; trial 05 omits the interior-start surrogate check despite its rationale claiming preservation; trial 06 fails duplicate-ID and ordered-result checks. Valid native submission and delivered evidence do not guarantee semantic correctness.

The run used 76 model and 94 tokenizer attempts against caps of 128/256, finishing in 741.834 seconds. Minimum recorded admission headroom was 320 tokens. All 87 frozen source entries (runtime/episode sources, evaluator, report checker and schedule) still matched after completion. Per-episode task bindings matched across repetitions. No runtime policy, default, fixture or oracle changed during this task.

## Implementation and validation

The reusable [fixed evaluator](../../fixed-evaluation.py) validates closed schedules and derived budgets, freezes executable sources, records started trials durably, runs bounded arms without retries, checks their reports, exports visible evidence without raw message history, and separates schedule completion from target success. Harness errors stop the run; valid failed trials remain counted. See [usage and limits](../../FIXED-EVALUATION.md).

All five new evaluator tests passed ([test output](tests.txt)); no new full runtime-suite pass is claimed. The prior 414-test result belongs to the unchanged v20 implementation. The live batch exercised the complete runner/report/export path. The report checker verifies recorded integrity and consistency; repair scores come from the runner's independent fixture oracle, not a second oracle execution by the report checker.

Evidence: [plan](PLAN.md), [frozen schedule](schedule.json), [manifest](run/manifest.json), [aggregate](run/result.json), and per-trial checked reports, candidates and visible traces in `run/trial-00` through `run/trial-07`. Private raw protocol remains under `/tmp/are-glm-fixed-repeatability`; it is not copied into this package. ARE [context](context.json) and [effect](effect.json) retain the bounded construction assessment. This is CAV2-D65 candidate construction with no activation or authority effect.

## Open Questions

Why does the secret bridge fail intermittently before tokenizer dispatch? Can a generic repair-validation stage catch omitted edge cases without exposing hidden benchmark oracles? The next bounded investigation should diagnose the secret bridge and design that stage before another separately frozen evaluation. Do improvements transfer to unseen tasks and larger context windows? This batch covers three existing tasks and four conditions, not a full factorial study. Observable admission and recycling cannot prove that provider-internal compaction never occurs.

## Later diagnostic correction

The subsequent [public-validation investigation](../repair-validation-2026-09-08/README.md) distinguishes two semantic output mismatches from trial 06 oracle child-execution failures. That third proposal passes a separate unchanged-source recheck. The original 3/8 score remains intact; descriptions above of three incorrect repairs should be read with this correction. Open questions remain owned by the sections linked above.
