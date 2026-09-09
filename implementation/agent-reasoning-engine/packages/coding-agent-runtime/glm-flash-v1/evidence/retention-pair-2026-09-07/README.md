# Paired GLM retention smoke result

Date: 2026-09-07. Authority effect: none. Product approval: not requested.

The source-pinned pair completed. Both arms used the same request, fixture,
16,384 hard context limit, 5,000 recycle threshold, 2,048 output reserve,
256 tokenizer margin, and per-arm limits of 12 model / 24 tokenizer calls.
The order was clearing then retention, one run each. This is a smoke comparison,
not a statistical estimate or a held-out result.

| Policy | Result | Model calls | Tokenizer calls | File reads | Recycles | Input / output tokens |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `clear-v1` | Passed all seven queue tests | 8 | 13 | 9 | 5 | 19,123 / 1,000 |
| `recent-observations-v1` | Blocked at tokenizer limit | 7 | 24 | 11 | 6 | 16,514 / 485 |

Both original fixtures remained unchanged, and all dispatched requests fit
their complete-request reservations. Minimum soft headroom was 26 tokens for
clearing and 102 for retention. Retention completed the required inspections
and post-recycle evidence read, but produced no patch candidate before blocking.
Its lower token total is not an efficiency win: it failed the task.

## Diagnosis and next experiment

Each completed retention recovery required four measurements: the initial
projection, two retained-history candidates, and the empty-history fallback.
All completed recovery turns ultimately dispatched the empty-history fallback.
The final attempted recovery consumed two more measurements, then hit the
24-call ceiling before another model dispatch.

At this threshold, measured input must be strictly below 2,696 tokens after
allowing 2,048 output and the 256 tokenizer margin. For example, even one recent
exchange measured 2,773 tokens on the fifth turn and did not fit. Thus the
candidate spent extra measurement calls while repeatedly ending up with the
same clearing behavior. Exact per-turn counts are in [analysis.json](analysis.json).

Keep `clear-v1` as the default. The next construction candidate should budget
candidate exploration itself, reserve a measurement for a safe fallback, and
test fewer projections per turn. Then compare context policies that leave
enough room for useful observations. Do not increase tokenizer limits merely
to hide the failure. These are proposed experiments, not measured improvements.

The separate [six-task live QA pilot](../../../../../benchmarks/glm-fitting-v1/evidence/live-training-pilot-2026-09-07.json)
passed, but supplied-evidence profile questions do not measure active recovery.
Actual Kite integration and prompt optimization remain later DAG stages.

## Evidence

- [Manifest](manifest.json): task identities, runtime and bridge source pins,
  context policy, finite aggregate limits, and arm order.
- [Pair result](pair-result.json): both arm receipts and complete accounting.
- [Analysis](analysis.json): outcomes, measurement sequences, and claim limits.
- Started/completed arm records preserve attempted work independently of the
  pair summary. Absolute temporary paths in raw receipts identify original
  run directories; the copied receipts here are the durable evidence.

The pair used 15 model and 37 tokenizer calls in 143.3 seconds total wall time.
Together with QA, this work used 21 model and 43 tokenizer calls. Dollar billing
was not available. No hidden retries, runtime activation, or commits occurred.

## Open Questions

- How many recent observations fit under a less restrictive soft threshold?
- Can a one-candidate recovery policy finish without exhausting measurements?
- Will results repeat across independent coding tasks and repeated trials?
- How should end-to-end cost account for paid tokenizer operations and cache
  effects when the provider does not expose dollar billing?
- What provider evidence can establish absence of internal compaction?
