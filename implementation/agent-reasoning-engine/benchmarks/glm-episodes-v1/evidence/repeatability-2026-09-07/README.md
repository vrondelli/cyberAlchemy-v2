# Frozen repeatability benchmark — 2026-09-07

Completed 12 of 12 predeclared trials. Joint repair-and-continuity passes: 8/12. No tuning or failure replacement occurred.

| Task | Policy | Repair | Continuity | Both | Mean model calls | Median arm time |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| retention-tool-pairs | clear-v1 | 2/3 | 2/3 | 2/3 | 5.7 | 44.4s |
| retention-tool-pairs | recent-observations-v2 | 0/3 | 2/3 | 0/3 | 8.0 | 62.0s |
| exact-json-scoring | clear-v1 | 3/3 | 3/3 | 3/3 | 7.3 | 45.1s |
| exact-json-scoring | recent-observations-v2 | 3/3 | 3/3 | 3/3 | 6.3 | 39.9s |

A repair pass means all eight independent oracle checks passed. Continuity is
assessed separately and requires all prescribed reads/delivery and meaningful
archive recovery after recycling. Three repetitions per group are too few to
establish reliable superiority; no default policy was changed.

## Interpretation

The scorer passed 6/6 across both policies, but the retention task passed only
2/6. Clearing achieved 5/6 joint passes overall; V2 achieved 3/6. This small sample
favors retaining clearing as the existing default, but does not establish reliable
superiority or production readiness. V2 was cheaper on the scorer and less
successful on retention, so a single overall token average hides task differences.

The four failures were two invalid candidate responses, one strict context
admission block, and one oracle-rejected patch. No provider or credential failures
occurred. Further context-size tests should keep this candidate frozen so they
measure context effects separately from tuning.

## All trial outcomes

| Trial | Rep | Task | Policy | Repair | Continuity | Model/tokenizer calls | Outcome |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| [trial-00](trial-00/checked-report.json) | 1 | retention-tool-pairs | recent-observations-v2 | Fail | Fail | 10/10 | glm.candidate-invalid |
| [trial-01](trial-01/checked-report.json) | 1 | retention-tool-pairs | clear-v1 | Pass | Pass | 7/9 | Joint pass |
| [trial-02](trial-02/checked-report.json) | 1 | exact-json-scoring | clear-v1 | Pass | Pass | 10/12 | Joint pass |
| [trial-03](trial-03/checked-report.json) | 1 | exact-json-scoring | recent-observations-v2 | Pass | Pass | 6/7 | Joint pass |
| [trial-04](trial-04/checked-report.json) | 2 | exact-json-scoring | recent-observations-v2 | Pass | Pass | 6/7 | Joint pass |
| [trial-05](trial-05/checked-report.json) | 2 | exact-json-scoring | clear-v1 | Pass | Pass | 6/8 | Joint pass |
| [trial-06](trial-06/checked-report.json) | 2 | retention-tool-pairs | clear-v1 | Fail | Fail | 4/7 | recycling.fresh-context-too-large |
| [trial-07](trial-07/checked-report.json) | 2 | retention-tool-pairs | recent-observations-v2 | Fail | Pass | 8/10 | episodes.oracle-failed |
| [trial-08](trial-08/checked-report.json) | 3 | retention-tool-pairs | recent-observations-v2 | Fail | Pass | 6/7 | glm.candidate-invalid |
| [trial-09](trial-09/checked-report.json) | 3 | retention-tool-pairs | clear-v1 | Pass | Pass | 6/8 | Joint pass |
| [trial-10](trial-10/checked-report.json) | 3 | exact-json-scoring | clear-v1 | Pass | Pass | 6/8 | Joint pass |
| [trial-11](trial-11/checked-report.json) | 3 | exact-json-scoring | recent-observations-v2 | Pass | Pass | 7/8 | Joint pass |

## Cost and latency

Recorded attempts: 82 model and 101 tokenizer calls. Known input/output tokens: 288115/7518. Trials with unknown input/output usage: 0/0.
Arm wall times range from 24.9s to 71.6s (median 44.7s). Timing includes model/tokenizer latency and local execution; no monetary price estimate is inferred.

Per-task/policy token usage, latency and every arm’s counters are in
[summary.json](summary.json). All failures are counted; none were replaced.

## Frozen setup and evidence

The [plan](PLAN.md) and [manifest](manifest.json) were written before live calls.
The same final candidate, task bytes, fixtures and policies were used throughout.
Source hashes matched before and after each arm and at final aggregation. The
previous 340-test local suite was not rerun because its sources were unchanged;
its [log](prior-tests.tap) is included. There were no code or prompt changes.

Each independent arm used explicit-finalization-v3, bounded-reads-v1 and
inspected-mutation-v1 with its assigned retention policy. Order alternated across
repetitions as recorded in the manifest. Each arm retained 12 model/24 tokenizer
attempts and 580 seconds of execution; total attempt caps were144/288. Calls
were not automatically retried. Individual arm failures did not replace or cancel
other predeclared arms. Every report passed recorded integrity/policy/accounting
checks and tasks remained identical across repetitions.

All actual dispatches remained below the 8000 soft token limit, including the
2048 output reserve and256 margin; hard limit16384. Headroom and recycle counts
are in summary.json. This measures ARE admission and observable recycling, not
provider-internal compaction. Patches were verified in isolated copies only;
original fixtures remained unchanged. No product patch was applied.

Checked reports validate recorded receipts, not cryptographic authenticity or a
fresh oracle replay. Exports include visible traces/candidates but exclude raw
message history and provider reasoning. Complete private report inputs remain
under /tmp/are-glm-repeatability-2026-09-07; these exports are not complete
reportRun inputs. Authority effect none; defaults, publication and deployment
remain unchanged.

The exact one-off [driver](driver.py) and [aggregation script](summarize.py) are
retained for audit. Their paths refer to this experiment and are not a reusable
production CLI.

## Open Questions

- Will these results hold with more independent repetitions and broader tasks?
- What changes across context-window sizes on this same frozen candidate?
- Which failures come from model behavior versus provider/credential availability?
- What evidence would justify changing the default policy?
