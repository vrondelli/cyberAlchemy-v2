# fixed-evaluation results

Completed 12/12 trials. Repairs 12, continuity 10; minimum measured headroom 389 tokens.

| Trial | Task | Policy | Soft | Repair | Continuity | Recycles | Headroom | Reasons |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| [trial-00](trial-00/checked-report.json) | exact-json-scoring | clear-v1 | 8000 | True | True | 2 | 397 |  |
| [trial-01](trial-01/checked-report.json) | exact-json-scoring | recent-observations-v2 | 8000 | True | True | 1 | 389 |  |
| [trial-02](trial-02/checked-report.json) | archive-slice-bounds | recent-observations-v2 | 8000 | True | False | 0 | 602 |  |
| [trial-03](trial-03/checked-report.json) | archive-slice-bounds | clear-v1 | 8000 | True | True | 1 | 564 |  |
| [trial-04](trial-04/checked-report.json) | retention-long-window | clear-v1 | 12000 | True | True | 1 | 562 |  |
| [trial-05](trial-05/checked-report.json) | retention-long-window | recent-observations-v2 | 12000 | True | True | 1 | 406 |  |
| [trial-06](trial-06/checked-report.json) | retention-long-window | recent-observations-v2 | 12000 | True | True | 1 | 433 |  |
| [trial-07](trial-07/checked-report.json) | retention-long-window | clear-v1 | 12000 | True | True | 1 | 389 |  |
| [trial-08](trial-08/checked-report.json) | archive-slice-bounds | clear-v1 | 8000 | True | True | 1 | 565 |  |
| [trial-09](trial-09/checked-report.json) | archive-slice-bounds | recent-observations-v2 | 8000 | True | False | 0 | 607 |  |
| [trial-10](trial-10/checked-report.json) | exact-json-scoring | recent-observations-v2 | 8000 | True | True | 1 | 389 |  |
| [trial-11](trial-11/checked-report.json) | exact-json-scoring | clear-v1 | 8000 | True | True | 2 | 516 |  |

[Manifest](manifest.json) froze sources and schedule. All recorded reports passed integrity checks. No failures replaced; no source changes during the batch. Source hashes matched at aggregation. Oracle receipts are recorded checks, not a fresh replay. Complete private raw report inputs remain in the driver’s /tmp location; visible exports omit provider reasoning. See [parent plan](../PLAN.md) for experiment scope and operational residue.

## Open Questions

Owned by the [parent plan](../PLAN.md#open-questions).
