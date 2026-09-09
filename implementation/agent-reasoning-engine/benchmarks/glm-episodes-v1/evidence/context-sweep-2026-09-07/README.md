# Frozen context-size sweep — 2026-09-07

Completed 18 of 18 predeclared trials. Joint repair-and-continuity passes: 8/18. No tuning or failure replacement occurred.

| Soft limit | Policy | Repair | Recycling exercised | Continuity | Both | Mean model calls | Median time |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8000 | clear-v1 | 2/3 | 2/3 | 2/3 | 2/3 | 4.3 | 47.3s |
| 8000 | recent-observations-v2 | 3/3 | 3/3 | 3/3 | 3/3 | 7.0 | 56.5s |
| 10000 | clear-v1 | 3/3 | 3/3 | 3/3 | 3/3 | 6.0 | 43.2s |
| 10000 | recent-observations-v2 | 1/3 | 0/3 | 0/3 | 0/3 | 5.0 | 45.5s |
| 12000 | clear-v1 | 2/3 | 0/3 | 0/3 | 0/3 | 5.0 | 42.4s |
| 12000 | recent-observations-v2 | 2/3 | 0/3 | 0/3 | 0/3 | 5.3 | 47.5s |

Repair requires all eight oracle checks. Continuity separately requires the prescribed reads and delivery, actual recycling, and archive recovery after recycling. A repair without recycling does not exercise continuity. Three repetitions per group cannot establish reliable superiority.

## All outcomes

| Trial | Rep | Soft limit | Policy | Repair | Recycles | Continuity | Model/tokenizer calls | Outcome |
| --- | ---: | ---: | --- | --- | ---: | --- | --- | --- |
| [trial-00](trial-00/checked-report.json) | 1 | 8000 | clear-v1 | True | 2 | True | 6/8 | Joint pass |
| [trial-01](trial-01/checked-report.json) | 1 | 8000 | recent-observations-v2 | True | 1 | True | 8/9 | Joint pass |
| [trial-02](trial-02/checked-report.json) | 1 | 10000 | recent-observations-v2 | False | 0 | False | 5/5 | glm.candidate-invalid |
| [trial-03](trial-03/checked-report.json) | 1 | 10000 | clear-v1 | True | 1 | True | 6/7 | Joint pass |
| [trial-04](trial-04/checked-report.json) | 1 | 12000 | clear-v1 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-05](trial-05/checked-report.json) | 1 | 12000 | recent-observations-v2 | True | 0 | False | 6/6 | Continuity not demonstrated |
| [trial-06](trial-06/checked-report.json) | 2 | 10000 | recent-observations-v2 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-07](trial-07/checked-report.json) | 2 | 10000 | clear-v1 | True | 1 | True | 6/7 | Joint pass |
| [trial-08](trial-08/checked-report.json) | 2 | 12000 | clear-v1 | False | 0 | False | 5/5 | glm.candidate-invalid |
| [trial-09](trial-09/checked-report.json) | 2 | 12000 | recent-observations-v2 | False | 0 | False | 5/5 | glm.candidate-invalid |
| [trial-10](trial-10/checked-report.json) | 2 | 8000 | recent-observations-v2 | True | 1 | True | 6/7 | Joint pass |
| [trial-11](trial-11/checked-report.json) | 2 | 8000 | clear-v1 | False | 0 | False | 1/2 | glm.secret-resolution-failed |
| [trial-12](trial-12/checked-report.json) | 3 | 12000 | clear-v1 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-13](trial-13/checked-report.json) | 3 | 12000 | recent-observations-v2 | True | 0 | False | 5/5 | Continuity not demonstrated |
| [trial-14](trial-14/checked-report.json) | 3 | 8000 | recent-observations-v2 | True | 1 | True | 7/8 | Joint pass |
| [trial-15](trial-15/checked-report.json) | 3 | 8000 | clear-v1 | True | 2 | True | 6/8 | Joint pass |
| [trial-16](trial-16/checked-report.json) | 3 | 10000 | clear-v1 | True | 1 | True | 6/7 | Joint pass |
| [trial-17](trial-17/checked-report.json) | 3 | 10000 | recent-observations-v2 | False | 0 | False | 5/5 | glm.candidate-invalid |

## Usage and validation

Recorded attempts: 98 model, 109 tokenizer. Known input/output tokens: 380477/15522; unknown-usage trials: 0/0. Median arm time 46.4s; range 12.9–63.6s.

All 346 local tests passed before freezing ([log](prior-tests.tap)). The [plan](PLAN.md), [manifest](manifest.json) and [driver](driver.py) record the predeclared schedule. Source hashes matched before and after each arm and at aggregation. Runtime/prompt/oracle remained frozen; task manifests matched across limits and repetitions. Each arm allowed 12 model/24 tokenizer calls and 580 seconds. Aggregate caps were 216/432. No automatic retry or failure replacement occurred.

All actual dispatches had positive headroom under their assigned soft limit, including output reserve 2048 and token margin 256. Hard limit remained 16384. This verifies ARE request admission and observed recycling, and cannot establish whether the provider internally compacted a request. Defaults remain unchanged.

Checked reports verify recorded integrity/policy/accounting bindings, not cryptographic authenticity or a fresh oracle replay. Repairs were evaluated in isolated copies. Visible exports exclude raw message history and provider reasoning. Complete private report inputs remain under /tmp/are-glm-context-sweep-2026-09-07; exported subsets are not complete report inputs. Authority effect none.

## Findings and next experiment

The five unsuccessful trials comprise four patch-contract violations and one
credential-resolution failure (trial 11); none were replaced. All four invalid
candidates were syntactically valid JSON. Three misplaced `rationale` inside a
change object; one added `replacement_sha256`. One also omitted the required
`authority_effect`. The read-only [candidate diagnostics](candidate-diagnostics.json)
retain exact parser reasons without repairing or reclassifying these outcomes.

Within this sweep, 8K/v2 and 10K/clear each passed repair and continuity 3/3.
The 12K groups repaired 4/6 overall but never recycled. These small samples do
not support a default change. The proposed next DAG is: preserve granular
candidate rejection reasons → reinforce the existing output contract at final
submission → test malformed-envelope rejection → freeze a new candidate →
evaluate on held-out trials. Separately, construct a longer continuity task
that reaches recycling at every tested limit; freeze its new fixture and oracle
before evaluating it. Do not silently change this task's acceptance predicate.

This sweep has its own source freeze. Compared with the earlier repeatability
manifest, runner.mjs and the pre-existing integrated-context.mjs differ; see
[validation.json](validation.json). Do not pool these experiments as identical
source versions. No frozen source changed during this sweep.

## Open Questions

- Do observed differences persist with more repetitions and additional tasks?
- How can archive recovery and repair improve without using the evaluation samples for tuning?
- Which failures are caused by model behavior versus provider availability?
- What evidence would justify changing the default soft limit or retention policy?
