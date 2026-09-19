# LongMemEval scope-policy diagnostic result

The scope-policy arm answered **4/4 correctly** under the frozen native judge;
the same-evidence baseline answered **3/4 correctly**. Both arms completed every
assigned answer. This is a four-task exposed development diagnostic, not full
LongMemEval qualification or achievement of the campaign's perfect-score goal.

| Metric | Baseline | Scope policy |
| --- | ---: | ---: |
| Assigned answers | 4 | 4 |
| Completed answers | 4 | 4 |
| Native-judge correct | 3 | 4 |
| Generation input + output tokens | 10,898 | 11,045 |
| Judge input + output tokens | 1,366 | 1,142 |
| Combined tokens | 12,264 | 12,187 |

Total study cost: **24,451 model tokens**, including all generation and judging;
unknown usage: **zero**. Both arms used the same projected evidence and model,
with two workers. Eight answer calls and eight judge calls completed. Input and
output reservations remained within8,000; the independently frozen maximum
combined budget was122,880.

The scope arm used147 more generation tokens (1.35%) and77 fewer tokens after
including judges (0.63% reduction). This is not15% savings. It cannot be combined
with the previous68.28% figure to manufacture a fresh full-task result: that
previous comparison used sequential note ingestion as control, while both arms
here use identical archive retrieval.

The only score difference was the abstention question about the number of fish
in a30-gallon tank. Both arms passed the earlier recommendation/preference case.
Thus the observed score improvement does not isolate the proposed preference-scope
mechanism; the reviewed native observation is **inconclusive** about that mechanism.
The first automated accuracy-delta classification is retained separately under
classification-amendment-r1; the reviewed current records preserve the actual
scores and correctly avoid mechanism promotion.

Evidence: [LIVE-RESULTS.json](LIVE-RESULTS.json), [frozen protocol](LIVE-PROTOCOL.md),
[pre-run review](LIVE-REVIEW.json), [native observations](LIVE-OBSERVATIONS.json),
and exact requests/receipts in live/. No assigned failure was retried, replaced or
removed. The judge is the declared GLM native-rubric evaluator, not independent
proof of factual truth.

## Next decision

Keep the campaign goal open. Review replication or untouched long-task confirmation
before adopting the scope instruction as a proven general improvement. ContextBench
requires separate discovery and input-retention work; its latest live savings remain
9.41%. Static history replay is engineering evidence, not a new ContextBench score.

## Open questions

Is the abstention difference reproducible? Does the policy improve recommendation
scope on unseen histories? Can the combined ARE mechanism preserve quality while
meeting at least15% full-task savings on both benchmarks? These remain open.
