# Final latency v14 — broader fixed validation

Completed 12/12. Repairs 8/12; completion gates 10/12; continuity 5 across 5 trials that recycled. Predeclared target met: False.

| Trial | Task | Window | Retention | Repair | Gate | Recycles | Continuity | Reasons |
| --- | --- | ---: | --- | --- | --- | ---: | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | retention-long-window | 8000 | clear-v1 | True | True | 5 | True |  |
| [trial-01](targeted/trial-01/checked-report.json) | retention-long-window | 10000 | recent-observations-v2 | False | True | 0 | False | episodes.oracle-failed |
| [trial-02](targeted/trial-02/checked-report.json) | retention-long-window | 12000 | clear-v1 | True | True | 2 | True |  |
| [trial-03](targeted/trial-03/checked-report.json) | exact-json-scoring | 8000 | recent-observations-v2 | True | True | 0 | False |  |
| [trial-04](targeted/trial-04/checked-report.json) | exact-json-scoring | 10000 | clear-v1 | True | True | 1 | True |  |
| [trial-05](targeted/trial-05/checked-report.json) | exact-json-scoring | 12000 | recent-observations-v2 | True | True | 0 | False |  |
| [trial-06](targeted/trial-06/checked-report.json) | retention-tool-pairs | 8000 | clear-v1 | True | True | 2 | True |  |
| [trial-07](targeted/trial-07/checked-report.json) | retention-tool-pairs | 10000 | recent-observations-v2 | True | True | 0 | False |  |
| [trial-08](targeted/trial-08/checked-report.json) | retention-tool-pairs | 12000 | clear-v1 | True | True | 0 | False |  |
| [trial-09](targeted/trial-09/checked-report.json) | archive-slice-bounds | 8000 | recent-observations-v2 | False | True | 0 | False | episodes.oracle-failed |
| [trial-10](targeted/trial-10/checked-report.json) | archive-slice-bounds | 10000 | clear-v1 | False | False | 1 | True | glm.candidate-invalid |
| [trial-11](targeted/trial-11/checked-report.json) | archive-slice-bounds | 12000 | recent-observations-v2 | False | False | 0 | False | glm.candidate-invalid |

All 396 local tests passed ([log](tests.tap)). Calls: 109 model, 120 tokenizer. Minimum soft headroom 277; maximum tokenizer underestimate 0 tokens across 109 known receipts; 0 unknown receipts excluded.

V14 inherits v13 paging, required delivery, source preservation and token admission. Only tool-free model requests receive the opt-in 60000ms deadline; tool-enabled model and tokenizer requests retain 30000ms. Overall arm cap remains 580 seconds. Client identity and durable run scope bind the deadline, selected timeout is recorded in receipts, and v14 rejects a client missing its deadline. Pause/resume, ordinary-call timeouts, no retries and final-only deadline selection have local tests. Small-task early final answers can occur while tools are offered; these keep the ordinary deadline.

Extended deadline calls: [{"trial": 0, "latency_ms": 14775, "status": 200}, {"trial": 2, "latency_ms": 29488, "status": 200}]. A successful call longer than 30 seconds would demonstrate use of the extension; shorter successes do not establish a causal improvement.

Sources checked before/after each arm and at aggregation. Every raw report independently checked. Fixtures and oracles unchanged. This is a fixed screening matrix across four existing tasks and three windows, with alternating retention policies; it is not replicated or full factorial validation. No retries, replacement, defaults, activation or provider-internal compaction claims. Raw report inputs remain at /tmp/are-glm-final-latency; visible exports omit provider reasoning and raw message history. Reports verify recorded oracle evidence, not fresh execution.

See [plan](PLAN.md), [frozen manifest](targeted/manifest.json), and [summary](summary.json).

## Open Questions

See [plan](PLAN.md#open-questions).

Failure analysis: long 10K failed duplicate IDs, positional result order and empty history; archive 8K failed end-boundary and no-progress checks. Archive 10K omitted authority_effect; archive 12K omitted schema_version and used base_tree_sha256 instead of expected_base_tree_sha256. These candidates remain rejected without normalization. Next frontier is explicit requirement and patch-schema adherence during final synthesis.
