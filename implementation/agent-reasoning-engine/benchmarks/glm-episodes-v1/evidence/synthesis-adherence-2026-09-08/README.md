# Final synthesis v15 — fixed paired evaluation

Completed 8/8. Target met: False. More v15 repairs than paired v14: False.

| Policy | Repairs | Completion gates | Continuity / recycled trials | Invalid candidates |
| --- | ---: | ---: | ---: | ---: |
| final-latency-v14 | 3/4 | 3/4 | 1/1 | 1 |
| synthesis-adherence-v15 | 1/4 | 1/4 | 1/1 | 3 |

| Trial | Task | Window | Retention | Candidate | Repair | Reasons / failed checks |
| --- | --- | ---: | --- | --- | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | retention-long-window | 10000 | recent-observations-v2 | final-latency-v14 | False | glm.candidate-invalid, patch-set.authority-effect-invalid |
| [trial-01](targeted/trial-01/checked-report.json) | retention-long-window | 10000 | recent-observations-v2 | synthesis-adherence-v15 | False | glm.candidate-invalid, patch-set.schema-version-invalid |
| [trial-02](targeted/trial-02/checked-report.json) | archive-slice-bounds | 8000 | recent-observations-v2 | synthesis-adherence-v15 | False | glm.candidate-invalid, patch-set.schema-version-invalid |
| [trial-03](targeted/trial-03/checked-report.json) | archive-slice-bounds | 8000 | recent-observations-v2 | final-latency-v14 | True |  |
| [trial-04](targeted/trial-04/checked-report.json) | archive-slice-bounds | 10000 | clear-v1 | final-latency-v14 | True |  |
| [trial-05](targeted/trial-05/checked-report.json) | archive-slice-bounds | 10000 | clear-v1 | synthesis-adherence-v15 | True |  |
| [trial-06](targeted/trial-06/checked-report.json) | archive-slice-bounds | 12000 | recent-observations-v2 | synthesis-adherence-v15 | False | glm.candidate-invalid, patch-set.schema-version-invalid |
| [trial-07](targeted/trial-07/checked-report.json) | archive-slice-bounds | 12000 | recent-observations-v2 | final-latency-v14 | True |  |

All 398 local tests passed ([log](tests.tap)). Calls: 66 model, 68 tokenizer. Minimum soft headroom 493; maximum tokenizer underestimate 37 tokens across 66 known receipts; 0 unknown receipts excluded.

V15 inherits v14 paging, delivery gates, token reservations and deadlines. Once delivery/recovery is satisfied, or at the final reserved turn, a last user message asks for a requirement-by-requirement check and supplies the exact patch structure with verified hashes. Generic compact and final reminders are replaced in that branch. The template is advisory: malformed candidates remain rejected, missing evidence remains a gate failure, no response normalization or extra attempt is added. Requirements remain exact inspected source fields, not oracle answers.

Tests cover the final message position after recovery/resume, exact hashes and fields, escaped paths, unchanged scope, and all existing strict parsing and admission checks. Sources checked before/after every arm and at aggregation. Raw reports independently checked. The selected cases are the four previous v14 failures, each rerun under both policies with alternating order. One pair per case does not establish reliability or isolate prompt causality from provider variation. Previous failures remain retained and are not pooled into this comparison. Fixtures, oracles, defaults and provider call budgets are unchanged. No retries or failure replacement.

Raw report inputs remain at /tmp/are-glm-synthesis-adherence. Visible exports omit raw message history and provider reasoning. Report checking verifies recorded oracle evidence, not fresh oracle execution. Observable continuity is distinct from absence of provider-internal compaction. See [plan](PLAN.md), [manifest](targeted/manifest.json) and [summary](summary.json).

## Open Questions

See [plan](PLAN.md#open-questions).

Decision: retain v15 only as an unsuccessful experimental candidate. In this selected sample it passed 1/4 repairs against 3/4 for v14; all three v15 failures omitted schema_version. Both recycled trials (one per policy) passed continuity. There were no transport failures. This small sequential comparison does not establish a general causal regression, but provides no basis to select v15. Next investigation: generation-time schema constraints and their exact provider support; no such support or activation is claimed here.
