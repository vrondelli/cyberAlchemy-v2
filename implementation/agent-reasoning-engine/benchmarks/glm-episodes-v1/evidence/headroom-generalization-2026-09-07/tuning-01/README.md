# tuning-01 results

Completed 4/4 trials. Repairs 4, continuity 2; minimum measured headroom 3 tokens.

| Trial | Task | Policy | Soft | Repair | Continuity | Recycles | Headroom | Reasons |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| [trial-00](trial-00/checked-report.json) | retention-tool-pairs | clear-v1 | 8000 | True | True | 1 | 3 |  |
| [trial-01](trial-01/checked-report.json) | retention-tool-pairs | recent-observations-v2 | 8000 | True | False | 0 | 54 |  |
| [trial-02](trial-02/checked-report.json) | retention-tool-pairs | recent-observations-v2 | 8000 | True | False | 0 | 31 |  |
| [trial-03](trial-03/checked-report.json) | retention-tool-pairs | clear-v1 | 8000 | True | True | 1 | 83 |  |

[Manifest](manifest.json) froze sources and schedule. All recorded reports passed integrity checks. No failures replaced; no source changes during the batch. Source hashes matched at aggregation. Oracle receipts are recorded checks, not a fresh replay. Complete private raw report inputs remain in the driver’s /tmp location; visible exports omit provider reasoning. See [parent plan](../PLAN.md) for experiment scope and operational residue.

## Open Questions

Owned by the [parent plan](../PLAN.md#open-questions).
