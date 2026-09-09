# Working native completion candidate — v20

V20 passed **9/10 live repairs** across the four repository workloads. The remaining trial failed in transport before final submission; it remains counted. All nine native proposals passed strict parsing, delivery gates and the independent eight-check task oracle.

| Fixed batch | Repairs | Gates | Continuity / recycled trials | Target |
| --- | ---: | ---: | ---: | --- |
| [Prior-failure cases](TARGETED.md) | 4/4 | 4/4 | 1/1 | Passed |
| [Broader screening](BROADER.md) | 3/4 | 3/4 | 2/3 | Missed: request failure |
| [Both long 8K policies repeated](REPEAT.md) | 2/2 | 2/2 | 2/2 | Passed |

The long 8K workload completed correctly with both clear-v1 and recent-observations-v2, including recycling and bounded archive recovery. Both repetitions used 16 model/21 tokenizer calls. Scoring and archive repairs also demonstrated continuity. Trials that never recycled provide repair evidence only. Overall continuity was 5/6 recycled trials; the interrupted trial did not complete recovery and remains a continuity failure.

## What changed

The opt-in policy `example-fields-v20` submits its final patch through one native submit_patch_candidate call. Native submission is offered after projected delivery/recovery or on the final reserved turn, is measured within the context budget, and is bound to client identity. Original native terminal evidence is persisted without fabricated tool observations. The existing strict parser, exact scope hashes, completion gates and transactional proposal check remain; the submission is never routed to the filesystem tool executor. Mixed, premature and invalid proposals are rejected. Terminal resume remains blocked.

Final synthesis preserves the exact inspected mutation source, top-level requirements and deduplicated interpretation/explanation strings from fully inspected JSON examples. The new example projection is capped at 1536 serialized bytes, includes source hashes, call IDs and exact JSON selectors, and reports omissions. It performs no oracle reads, generated summarization or output repair. Low reasoning is retained; final native calls have the existing opt-in 60-second deadline, with ordinary calls at 30 seconds. Defaults remain unchanged.

## Validation

All 414 local tests passed ([log](tests.tap)), including full 16-turn pause/resume, premature submission rejection, exact native terminal handling, source selectors, alias selection, corruption rejection and bounded omission. Every live raw report checked independently, including native candidate/message equality. Task manifests matched across all five targeted candidate versions; v20 source manifests matched across all three batches and current bytes at consolidation. No fixture, request, oracle or default changes, retries or failure replacement occurred.

Calls for v20: 112 model and 134 tokenizer attempts. Minimum soft headroom: 259 tokens, including the configured 256-token reserve. One failed request has unknown usage; known samples stayed within the 512-token input margin. Hard limit 16384, output reserve 2048 and window-based call/page budgets remain.

## Preserved iterations

| Candidate | Targeted repairs | Outcome |
| --- | ---: | --- |
| [native-submission-v16](../native-runtime-2026-09-08/summary.json) | 3/4 | Target missed |
| [native-reasoning-v17](../native-reasoning-2026-09-08/summary.json) | 1/4 | Target missed |
| [minimal-repair-v18](../minimal-repair-2026-09-08/summary.json) | 2/4 | Target missed |
| [case-evidence-v19](../case-evidence-2026-09-08/summary.json) | 2/4 | Target missed |
| [example-fields-v20](../example-fields-2026-09-08/summary.json) | 4/4 | Target passed |

Earlier candidates are not pooled into the v20 score. These are sequentially tuned, small existing-task samples; 9/10 does not establish production reliability or an unseen-task success rate. The broader all-pass target remains missed even though both long 8K policies subsequently passed. Observable local admission and recovery do not prove provider-internal compaction never occurs. Raw report inputs remain in /tmp/are-glm-example-fields, /tmp/are-glm-example-broader and /tmp/are-glm-example-repeat; visible exports omit provider reasoning and full message history. Reports validate recorded oracle evidence, not fresh oracle execution.

A stale ARE receipt was explicitly rejected before the v20 provider batch. The route was re-evaluated through the current registry and returned the same IMPLEMENT contract; the rejection and predecessor are preserved here. No routing fallback or authority promotion occurred.

See [construction result](construction-result.json), [targeted plan](PLAN.md), [broader plan](broader/PLAN.md) and [repetition plan](repeat/PLAN.md).

## Open Questions

Larger fixed replications and unseen tasks remain necessary before activation. Provider transport failure handling remains observable and non-retrying. Provider-internal compaction cannot be inferred from these tests. The [plan](PLAN.md#open-questions) owns the remaining construction questions.
