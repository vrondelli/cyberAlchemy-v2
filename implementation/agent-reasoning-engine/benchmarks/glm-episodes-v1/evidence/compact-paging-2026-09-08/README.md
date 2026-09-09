# Compact paging v10 — targeted results

Completed 6/6. Repairs 0/6; completion gate 4/6; continuity 2/6. Predeclared target met: False.

| Trial | Window | Retention | Repair | Gate | Continuity | Reasons |
| --- | ---: | --- | --- | --- | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | 8000 | clear-v1 | False | False | False | recycling.fresh-context-too-large |
| [trial-01](targeted/trial-01/checked-report.json) | 8000 | recent-observations-v2 | False | False | False | recycling.fresh-context-too-large |
| [trial-02](targeted/trial-02/checked-report.json) | 10000 | clear-v1 | False | True | True | episodes.oracle-failed |
| [trial-03](targeted/trial-03/checked-report.json) | 10000 | recent-observations-v2 | False | True | False | episodes.oracle-failed |
| [trial-04](targeted/trial-04/checked-report.json) | 12000 | clear-v1 | False | True | True | episodes.oracle-failed |
| [trial-05](targeted/trial-05/checked-report.json) | 12000 | recent-observations-v2 | False | True | False | episodes.oracle-failed |

All 386 local tests passed ([log](tests.tap)). Live calls: 59 model, 69 tokenizer. Minimum soft headroom: 684; maximum observed tokenizer underestimate: 119 tokens across 59 known receipts, 0 unknown receipts excluded.

The opt-in compact-paging-v10 policy retains bounded-reads-v1, v8 completion requirements, 512 tokenizer margin, 2048 output reserve, 256 soft reserve, and 12 model/24 tokenizer caps. read-file offers optional UTF-16 offset; large results contain at most 5500 units with exact next_offset and full/page hashes. Unicode boundaries are preserved. Confirmed pages must reconstruct gap-free original text and match the pinned whole-file hash before satisfying required delivery. EOF or execution alone cannot satisfy it. One final response is reserved. Archive recovery remains an independent requirement after recycling.

Existing full observations remain unchanged for small files. Partial files are omitted from repeated source/requirements attachments; mutation and completion checks remain strict. No new shared-runtime paging API or adaptive token sizing is claimed: this candidate uses a fixed character cap plus existing token admission. Very large or token-dense pages may still block.

Tests cover Unicode bounds, unknown/missing/gapped coverage, overlap consistency, forged assembled content, native message mismatch, opt-in argument schema, premature final rejection, resume, and independently implemented report reconstruction. All live reports checked. Sources matched before/after each arm and at aggregation; task manifests match the previous v8 long workload exactly. No fixture, request, oracle, retry, replacement, or default changes.

The [plan](PLAN.md) and [manifest](targeted/manifest.json) declared the scope and six-arm schedule before calls. This is targeted tuning evidence, not reliability or unseen-task validation. Raw report inputs remain in /tmp/are-glm-compact-paging; visible exports omit raw messages and provider reasoning. Reports check recorded oracle evidence, not fresh oracle execution. Observable recycling does not prove absence of provider-internal compaction.

## Open Questions

Owned by the [construction plan](PLAN.md#open-questions).
