# Example fields v20 — broader fixed validation

Completed 4/4. Repairs 3/4; completion gates 3/4; continuity 2 across 3 trials that recycled. Predeclared target met: False.

| Trial | Task | Window | Retention | Repair | Gate | Recycles | Continuity | Reasons |
| --- | --- | ---: | --- | --- | --- | ---: | --- | --- |
| [trial-00](broader/trial-00/checked-report.json) | retention-long-window | 8000 | clear-v1 | False | False | 4 | False | glm.request-failed |
| [trial-01](broader/trial-01/checked-report.json) | retention-long-window | 8000 | recent-observations-v2 | True | True | 5 | True |  |
| [trial-02](broader/trial-02/checked-report.json) | exact-json-scoring | 8000 | clear-v1 | True | True | 2 | True |  |
| [trial-03](broader/trial-03/checked-report.json) | retention-tool-pairs | 12000 | recent-observations-v2 | True | True | 0 | False |  |

All 414 local tests passed ([log](tests.tap)). Calls: 47 model, 58 tokenizer. Minimum soft headroom 259; maximum tokenizer underestimate 0 tokens across 46 known receipts; 1 unknown receipts excluded.

V20 inherits native v16 at low reasoning and preserves exact inspected example interpretation and explanation fields for final submission. The projection is bounded at 1536 serialized bytes with exact selectors, hashes and source call IDs. No oracle reads or generated summaries are added. Once projected delivery/recovery is satisfied, or on the final reserved turn, it offers submit_patch_candidate as the sole tool. Its schema is measured with the request. Client identity binds native submission and its 60-second final deadline. Native arguments pass the existing strict parser and completion gate; terminal evidence preserves the original assistant call without fabricated tool observations. Submission never reaches the filesystem tool executor. Malformed, mixed, premature and scope-drift proposals remain rejected. No default, fixture, oracle, retry or output-normalization changes.

Sources checked before/after every arm and at aggregation; reports independently checked, including terminal native call/candidate equality. This is a fixed complementary selection including both long 8K policies, scoring and retention pairs, not a replicated reliability claim. Raw report inputs remain at /tmp/are-glm-example-broader; exports omit provider reasoning and raw history messages. Recorded oracle checks are independently validated by the report, not rerun by it. Observable continuity does not establish absence of provider-internal compaction.

See [plan](PLAN.md), [manifest](broader/manifest.json), and [summary](summary.json).

## Open Questions

See [plan](PLAN.md#open-questions).
