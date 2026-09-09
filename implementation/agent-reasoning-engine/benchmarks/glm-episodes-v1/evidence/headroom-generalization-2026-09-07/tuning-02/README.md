# tuning-02 results

Completed 4/4 trials. Repairs 1, continuity 1; minimum measured headroom 426 tokens.

| Trial | Task | Policy | Soft | Repair | Continuity | Recycles | Headroom | Reasons |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| [trial-00](trial-00/checked-report.json) | retention-tool-pairs | clear-v1 | 8000 | True | True | 2 | 426 |  |
| [trial-01](trial-01/checked-report.json) | retention-tool-pairs | recent-observations-v2 | 8000 | False | False | 0 | 2708 | glm.deadline-exceeded |
| [trial-02](trial-02/checked-report.json) | retention-tool-pairs | recent-observations-v2 | 8000 | False | False | 0 | None | glm.request-failed |
| [trial-03](trial-03/checked-report.json) | retention-tool-pairs | clear-v1 | 8000 | False | False | 2 | 654 | glm.deadline-exceeded |

[Manifest](manifest.json) froze sources and schedule. All recorded reports passed integrity checks. No failures replaced; no source changes during the batch. Source hashes matched at aggregation. Oracle receipts are recorded checks, not a fresh replay. Complete private raw report inputs remain in the driver’s /tmp location; visible exports omit provider reasoning. See [parent plan](../PLAN.md) for experiment scope and operational residue.

## Open Questions

Owned by the [parent plan](../PLAN.md#open-questions).
