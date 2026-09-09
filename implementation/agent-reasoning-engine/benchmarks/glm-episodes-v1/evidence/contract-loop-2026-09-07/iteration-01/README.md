# Compact contract iteration 01

Completed 6 of 6 predeclared trials. Joint repair-and-continuity passes: 5/6. No tuning or failure replacement occurred.

| Soft limit | Policy | Repair | Recycling exercised | Continuity | Both | Mean model calls | Median time |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8000 | clear-v1 | 2/3 | 3/3 | 3/3 | 2/3 | 6.3 | 52.4s |
| 8000 | recent-observations-v2 | 3/3 | 3/3 | 3/3 | 3/3 | 6.0 | 47.3s |

Repair requires all eight oracle checks. Continuity separately requires the prescribed reads and delivery, actual recycling, and archive recovery after recycling. A repair without recycling does not exercise continuity. Three repetitions per group cannot establish reliable superiority.

## All outcomes

| Trial | Rep | Soft limit | Policy | Repair | Recycles | Continuity | Model/tokenizer calls | Outcome |
| --- | ---: | ---: | --- | --- | ---: | --- | --- | --- |
| [trial-00](trial-00/checked-report.json) | 1 | 8000 | clear-v1 | False | 2 | True | 7/9 | episodes.oracle-failed |
| [trial-01](trial-01/checked-report.json) | 1 | 8000 | recent-observations-v2 | True | 1 | True | 6/7 | Joint pass |
| [trial-02](trial-02/checked-report.json) | 2 | 8000 | recent-observations-v2 | True | 1 | True | 6/7 | Joint pass |
| [trial-03](trial-03/checked-report.json) | 2 | 8000 | clear-v1 | True | 2 | True | 6/8 | Joint pass |
| [trial-04](trial-04/checked-report.json) | 3 | 8000 | clear-v1 | True | 2 | True | 6/8 | Joint pass |
| [trial-05](trial-05/checked-report.json) | 3 | 8000 | recent-observations-v2 | True | 1 | True | 6/7 | Joint pass |

## Usage and validation

Recorded attempts: 37 model, 46 tokenizer. Known input/output tokens: 133422/5274; unknown-usage trials: 0/0. Median arm time 48.2s; range 44.2–56.2s.

All 362 local tests passed before freezing ([log](prior-tests.tap)). The [plan](PLAN.md), [manifest](manifest.json) and [driver](driver.py) record the predeclared schedule. Source hashes matched before and after each arm and at aggregation. Runtime/prompt/oracle remained frozen; task manifests matched across limits and repetitions. Each arm allowed 12 model/24 tokenizer calls and 580 seconds. Aggregate caps were 72/144. No automatic retry or failure replacement occurred.

All actual dispatches had positive headroom under their assigned soft limit, including output reserve 2048 and token margin 256. Hard limit remained 16384. This verifies ARE request admission and observed recycling, and cannot establish whether the provider internally compacted a request. Defaults remain unchanged.

Checked reports verify recorded integrity/policy/accounting bindings, not cryptographic authenticity or a fresh oracle replay. Repairs were evaluated in isolated copies. Visible exports exclude raw message history and provider reasoning. Complete private report inputs remain under /tmp/are-glm-contract-loop-01; exported subsets are not complete report inputs. Authority effect none.

## Open Questions

- Do observed differences persist with more repetitions and additional tasks?
- How can archive recovery and repair improve without using the evaluation samples for tuning?
- Which failures are caused by model behavior versus provider availability?
- What evidence would justify changing the default soft limit or retention policy?
