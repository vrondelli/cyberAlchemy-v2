# Patch-contract v4 live validation — 2026-09-07

Completed 6 of 6 predeclared trials. Joint repair-and-continuity passes: 1/6. No tuning or failure replacement occurred.

| Soft limit | Policy | Repair | Recycling exercised | Continuity | Both | Mean model calls | Median time |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8000 | clear-v1 | 0/1 | 1/1 | 0/1 | 0/1 | 4.0 | 37.0s |
| 8000 | recent-observations-v2 | 0/1 | 1/1 | 0/1 | 0/1 | 4.0 | 23.8s |
| 10000 | clear-v1 | 1/1 | 1/1 | 1/1 | 1/1 | 6.0 | 44.4s |
| 10000 | recent-observations-v2 | 1/1 | 0/1 | 0/1 | 0/1 | 5.0 | 38.7s |
| 12000 | clear-v1 | 1/1 | 0/1 | 0/1 | 0/1 | 5.0 | 38.1s |
| 12000 | recent-observations-v2 | 1/1 | 0/1 | 0/1 | 0/1 | 5.0 | 38.8s |

Repair requires all eight oracle checks. Continuity separately requires the prescribed reads and delivery, actual recycling, and archive recovery after recycling. A repair without recycling does not exercise continuity. One trial per group is only a smoke test, not evidence of reliable superiority.

## All outcomes

| Trial | Rep | Soft limit | Policy | Repair | Recycles | Continuity | Model/tokenizer calls | Outcome |
| --- | ---: | ---: | --- | --- | ---: | --- | --- | --- |
| [trial-00](trial-00/checked-report.json) | 1 | 8000 | clear-v1 | False | 2 | False | 4/7 | recycling.fresh-context-too-large |
| [trial-01](trial-01/checked-report.json) | 1 | 8000 | recent-observations-v2 | False | 1 | False | 4/6 | recycling.fresh-context-too-large |
| [trial-02](trial-02/checked-report.json) | 1 | 10000 | recent-observations-v2 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-03](trial-03/checked-report.json) | 1 | 10000 | clear-v1 | True | 1 | True | 6/7 | Joint pass |
| [trial-04](trial-04/checked-report.json) | 1 | 12000 | clear-v1 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-05](trial-05/checked-report.json) | 1 | 12000 | recent-observations-v2 | True | 0 | False | 5/5 | Continuity not demonstrated |

## Usage and validation

Recorded attempts: 29 model, 35 tokenizer. Known input/output tokens: 107809/3580; unknown-usage trials: 0/0. Median arm time 38.4s; range 23.8–44.4s.

The pre-freeze suite passed 353/354 tests; the sole failure referenced a missing historical /tmp run ([log](prior-tests.tap)). All 22 report tests, including that check, subsequently passed against a new live run ([log](report-tests.tap)). Together these cover all 354 distinct checks. The [plan](PLAN.md), [manifest](manifest.json) and [driver](driver.py) record the predeclared schedule. Source hashes matched before and after each arm and at aggregation. Runtime/prompt/oracle remained frozen; task manifests matched across limits and repetitions. Each arm allowed 12 model/24 tokenizer calls and 580 seconds. Aggregate caps were 72/144. No automatic retry or failure replacement occurred.

All actual dispatches had positive headroom under their assigned soft limit, including output reserve 2048 and token margin 256. Hard limit remained 16384. This verifies ARE request admission and observed recycling, and cannot establish whether the provider internally compacted a request. Defaults remain unchanged.

Checked reports verify recorded integrity/policy/accounting bindings, not cryptographic authenticity or a fresh oracle replay. Repairs were evaluated in isolated copies. Visible exports exclude raw message history and provider reasoning. Complete private report inputs remain under /tmp/are-glm-patch-contract-2026-09-07; exported subsets are not complete report inputs. Authority effect none.

## Implementation and decision

The opt-in patch-contract-v4 reminder lists allowed top-level and change-item
keys, requires authority_effect="none", and puts rationale at the top level.
It appears after all allowlisted files have executed reads or at the existing
forced final boundary, without claiming delivery or skipping recovery.
Existing policies and defaults retain their prompt behavior. Parser rejection
now includes candidate_validation with exact reason codes in agent results and
checked reports. Malformed candidates are never rewritten, retried or applied.

All four final answers were valid envelopes and passed all eight repair checks.
The two 8K trials never reached final answers: both stopped with
recycling.fresh-context-too-large. This is not evidence of six successful
outputs or of reliable improvement over v3. Extra reminder content increases
prompt size; an exact paired occupancy test is needed to isolate its contribution.
The 10K clear trial passed meaningful post-recycle recovery and repair; the
other three successful repairs did not exercise recycling. Keep v4 opt-in.

Next construction frontier: reduce duplicate contract text under an explicit
prompt-size budget, then test exact final-request admission near 8K before
another frozen live comparison. The longer 12K continuity task remains a
separate fixture/oracle construction. These samples are fresh trials on the
existing task, not held-out task evaluation. No failures were replaced.

[Validation](validation.json) records the interrupted environment's missing
historical input and the successful report-test rerun on newly generated data.
The [working trial](trial-03/checked-report.json) is the complete repair-and-
continuity example. Its candidate and visible trace are under trial-03/arm-0.

## Open Questions

- Do observed differences persist with more repetitions and additional tasks?
- How can archive recovery and repair improve without using the evaluation samples for tuning?
- Which failures are caused by model behavior versus provider availability?
- What evidence would justify changing the default soft limit or retention policy?
