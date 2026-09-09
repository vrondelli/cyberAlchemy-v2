# Expanded v8 validation results

Completed 48/48. Repairs: 39; completion gate passes: 40; continuity: 18 across 25 recycled trials. Pilot criteria met: False.

| Task | Window | Repairs | Continuity |
| --- | ---: | ---: | ---: |
| archive-slice-bounds | 8000 | 4/4 | 2/4 |
| archive-slice-bounds | 10000 | 4/4 | 0/4 |
| archive-slice-bounds | 12000 | 4/4 | 0/4 |
| exact-json-scoring | 8000 | 4/4 | 4/4 |
| exact-json-scoring | 10000 | 4/4 | 2/4 |
| exact-json-scoring | 12000 | 4/4 | 0/4 |
| retention-long-window | 8000 | 0/4 | 0/4 |
| retention-long-window | 10000 | 0/4 | 0/4 |
| retention-long-window | 12000 | 3/4 | 4/4 |
| retention-tool-pairs | 8000 | 4/4 | 4/4 |
| retention-tool-pairs | 10000 | 4/4 | 2/4 |
| retention-tool-pairs | 12000 | 4/4 | 0/4 |

| Predeclared criterion | Passed |
| --- | --- |
| all_48_valid | True |
| at_least_44_repairs | False |
| each_task_window_3_of_4 | False |
| all_accepted_candidates_pass_gate | True |
| zero_input_reservation_overruns | True |
| positive_admitted_headroom | True |
| four_long_12k_continuity | True |

Calls: 269 model, 314 tokenizer. Minimum admitted soft headroom: 307 tokens. Maximum measured tokenizer underestimate: 110 across 267 paired receipts; 2 unknown usage receipts excluded.

| Trial | Repair | Continuity | Gate | Reasons |
| --- | --- | --- | --- | --- |
| [trial-00](trial-00/checked-report.json) | True | True | True |  |
| [trial-01](trial-01/checked-report.json) | True | True | True |  |
| [trial-02](trial-02/checked-report.json) | True | True | True |  |
| [trial-03](trial-03/checked-report.json) | True | False | True |  |
| [trial-04](trial-04/checked-report.json) | True | False | True |  |
| [trial-05](trial-05/checked-report.json) | True | False | True |  |
| [trial-06](trial-06/checked-report.json) | True | True | True |  |
| [trial-07](trial-07/checked-report.json) | True | True | True |  |
| [trial-08](trial-08/checked-report.json) | True | False | True |  |
| [trial-09](trial-09/checked-report.json) | True | True | True |  |
| [trial-10](trial-10/checked-report.json) | True | False | True |  |
| [trial-11](trial-11/checked-report.json) | True | False | True |  |
| [trial-12](trial-12/checked-report.json) | True | True | True |  |
| [trial-13](trial-13/checked-report.json) | True | False | True |  |
| [trial-14](trial-14/checked-report.json) | True | False | True |  |
| [trial-15](trial-15/checked-report.json) | True | False | True |  |
| [trial-16](trial-16/checked-report.json) | True | False | True |  |
| [trial-17](trial-17/checked-report.json) | True | False | True |  |
| [trial-18](trial-18/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-19](trial-19/checked-report.json) | False | False | False | glm.deadline-exceeded |
| [trial-20](trial-20/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-21](trial-21/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-22](trial-22/checked-report.json) | True | True | True |  |
| [trial-23](trial-23/checked-report.json) | True | True | True |  |
| [trial-24](trial-24/checked-report.json) | False | True | True | episodes.oracle-failed |
| [trial-25](trial-25/checked-report.json) | True | True | True |  |
| [trial-26](trial-26/checked-report.json) | False | False | False | glm.deadline-exceeded |
| [trial-27](trial-27/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-28](trial-28/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-29](trial-29/checked-report.json) | False | False | False | recycling.fresh-context-too-large |
| [trial-30](trial-30/checked-report.json) | True | False | True |  |
| [trial-31](trial-31/checked-report.json) | True | False | True |  |
| [trial-32](trial-32/checked-report.json) | True | False | True |  |
| [trial-33](trial-33/checked-report.json) | True | False | True |  |
| [trial-34](trial-34/checked-report.json) | True | True | True |  |
| [trial-35](trial-35/checked-report.json) | True | False | True |  |
| [trial-36](trial-36/checked-report.json) | True | False | True |  |
| [trial-37](trial-37/checked-report.json) | True | False | True |  |
| [trial-38](trial-38/checked-report.json) | True | False | True |  |
| [trial-39](trial-39/checked-report.json) | True | True | True |  |
| [trial-40](trial-40/checked-report.json) | True | True | True |  |
| [trial-41](trial-41/checked-report.json) | True | True | True |  |
| [trial-42](trial-42/checked-report.json) | True | False | True |  |
| [trial-43](trial-43/checked-report.json) | True | False | True |  |
| [trial-44](trial-44/checked-report.json) | True | True | True |  |
| [trial-45](trial-45/checked-report.json) | True | False | True |  |
| [trial-46](trial-46/checked-report.json) | True | True | True |  |
| [trial-47](trial-47/checked-report.json) | True | True | True |  |

Source hashes matched before and after each trial and at aggregation. No retries, replacement arms, or runtime/fixture/default changes. Local checks: 378 passed, zero failed, one optional report-input test skipped; every live report was checked. The [manifest](manifest.json) and [plan](PLAN.md) froze the schedule and criteria before calls. Raw report inputs remain in /tmp/are-glm-expanded-validation; visible exports omit raw message history and provider reasoning. Reports verify recorded oracle evidence, not a fresh oracle replay.

These four tasks were previously used for tuning. This is expanded repeatability evidence, not unseen-task generalization. Trials without recycling provide no recycling coverage. Observable admission and recovery cannot prove absence of provider-internal compaction. No pilot or default activation was performed.

The three smaller tasks passed 36/36 repairs. Long-workload repairs were 0/4 at 8K, 0/4 at 10K, and 3/4 at 12K. Its eight smaller-window failures comprise six fresh-context size blocks and two deadlines. The incorrect 12K patch failed the reordered-results oracle case (7/8 passed). See [diagnosis](diagnosis.json). The next candidate should fit large observations through budget-aware paging while preserving confirmed coverage and reservations; investigate patch ordering separately.

## Open Questions

See the [predeclared plan](PLAN.md#open-questions). Any failed criteria require diagnosis before a pilot recommendation.
