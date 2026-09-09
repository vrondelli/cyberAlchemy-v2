# Retention v2: two-threshold live smoke

Authority effect: none. Product approval: not requested. No default activation.
See the [plan](../RETENTION-V2-PLAN.md) and [209 passing tests](../retention-v2-tests.json).

V2 preserves the newest complete exchange, masks older result bodies, and
measures only an empty-history fallback after overflow. It makes at most two
measurements per turn. Existing clearing and v1 policies are unchanged.

| Soft threshold | Policy | Outcome | Model calls | Tokenizer calls | File reads | Recycles | Input / output tokens |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 5,000 | Clearing | Model-call limit | 12 | 22 | 15 | 10 | 28,699 / 1,168 |
| 5,000 | V2 | Model-call limit | 12 | 23 | 19 | 11 | 29,077 / 1,047 |
| 8,000 | Clearing | Invalid patch candidate | 8 | 13 | 9 | 5 | 19,224 / 847 |
| 8,000 | V2 | Passed all seven patch tests and recycling checks | 5 | 7 | 5 | 2 | 12,976 / 633 |

All original fixtures remained unchanged. Every dispatch passed complete-request
admission, including the output reservation. All four runs exercised recycling,
read the required files, and retrieved archived evidence after recycling. Only
the final arm produced a verified patch. The clearing failure at 8,000 is the
reported candidate-validation failure; the receipts do not establish its exact
textual cause.

## Interpretation

V2 removed the premature tokenizer-exhaustion failure: the 5,000-token run
reached all 12 allowed model calls using 23 tokenizer calls. That is a bounded
mechanism improvement, but the task still failed at that threshold and rereads
increased. Measurement efficiency alone did not solve evidence starvation.

The 8,000-token v2 arm succeeded in 37.2 seconds of model-request latency, using
five reads over four files. This is a promising candidate configuration.
The previous clearing smoke passed at 5,000 whereas this one failed, illustrating
substantial run variation. There is only one run per arm here; do not infer a
general success rate or claim a causal gain from these outcomes.

Both retention shape and exploration budget changed in v2. Comparisons within
each threshold hold the task, fixture, output reservation, hard window, model,
and caps fixed. Trace IDs and histories differ; prompts are not byte-identical.
Arm order is clearing then v2, and threshold order is 5,000 then 8,000. Larger
soft thresholds change usable active history; the provider hard window remained
16,384. This does not test different provider context-window sizes or prove
absence of hidden provider compaction.

Keep clearing as the default and v2 opt-in. The next evaluation should repeat
the 8,000 comparison on independent coding tasks and vary arm order, with exact
expected outputs and budgets fixed before calls. Preserve malformed final
outputs as bounded, redacted evidence to support model-fitting diagnosis.
Actual Kite integration and prompt optimization remain later stages.

## Evidence and bounds

[Manifest](manifest.json) pins runtime sources and the four-arm envelope.
[Summary](summary.json) records total use: 37 model calls, 65 tokenizer calls,
360.7 seconds wall time, within ceilings of 48, 96, and 2,400 seconds.
[Analysis](analysis.json) includes per-arm correctness, continuity, usage,
read counts and headroom. Each threshold directory contains the pair manifest,
started/completed receipts, and full pair result. Billing dollars are unknown.

Each arm had the same 580-second cancellation deadline, with verification time
reserved separately. There were no automatic retries, commits, deployment, or
Kite calls. Raw receipt paths refer to the original temporary runs; these copied
receipts are durable local evidence.

## Open Questions

- Does v2 at 8,000 repeat across independent coding tasks and varied run order?
- How much benefit comes from retention versus the additional evidence room?
- Can instruction/progress overhead be reduced without losing constraints?
- What malformed final-answer patterns cause candidate rejection?
- How should tokenizer billing and provider-internal compaction be observed?
