# Native reasoning v17 — broader fixed validation

Completed 4/4. Repairs 1/4; completion gates 3/4; continuity 1 across 1 trials that recycled. Predeclared target met: False.

| Trial | Task | Window | Retention | Repair | Gate | Recycles | Continuity | Reasons |
| --- | --- | ---: | --- | --- | --- | ---: | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | retention-long-window | 10000 | recent-observations-v2 | False | False | 0 | False | glm.deadline-exceeded |
| [trial-01](targeted/trial-01/checked-report.json) | archive-slice-bounds | 8000 | recent-observations-v2 | False | True | 0 | False | episodes.oracle-failed |
| [trial-02](targeted/trial-02/checked-report.json) | archive-slice-bounds | 10000 | clear-v1 | False | True | 1 | True | episodes.oracle-failed |
| [trial-03](targeted/trial-03/checked-report.json) | archive-slice-bounds | 12000 | recent-observations-v2 | True | True | 0 | False |  |

All 408 local tests passed ([log](tests.tap)). Calls: 31 model, 32 tokenizer. Minimum soft headroom 542; maximum tokenizer underestimate 0 tokens across 30 known receipts; 1 unknown receipts excluded.

Native v17 inherits v16 and changes reasoning effort only on the final native submission to high; inspection remains low. Budgets, prompts and gates stay the same. Once projected delivery/recovery is satisfied, or on the final reserved turn, it offers submit_patch_candidate as the sole tool. Its schema is measured with the request. Client identity binds native submission and its 60-second final deadline. Native arguments pass the existing strict parser and completion gate; terminal evidence preserves the original assistant call without fabricated tool observations. Submission never reaches the filesystem tool executor. Malformed, mixed, premature and scope-drift proposals remain rejected. No default, fixture, oracle, retry or output-normalization changes.

Sources checked before/after every arm and at aggregation; reports independently checked, including terminal native call/candidate equality. This is a fixed selection of four previous failures, not a replicated reliability claim. Raw report inputs remain at /tmp/are-glm-native-reasoning; exports omit provider reasoning and raw history messages. Recorded oracle checks are independently validated by the report, not rerun by it. Observable continuity does not establish absence of provider-internal compaction.

See [plan](PLAN.md), [manifest](targeted/manifest.json), and [summary](summary.json).

## Open Questions

See [plan](PLAN.md#open-questions).
