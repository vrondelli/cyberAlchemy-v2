# Assembled paging v11 — targeted results

Completed 4/4. Repairs 1/4; completion gate 3/4; continuity 2/4. Predeclared target met: False.

| Trial | Window | Retention | Repair | Gate | Continuity | Reasons |
| --- | ---: | --- | --- | --- | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | 10000 | clear-v1 | True | True | True |  |
| [trial-01](targeted/trial-01/checked-report.json) | 10000 | recent-observations-v2 | False | True | False | episodes.oracle-failed |
| [trial-02](targeted/trial-02/checked-report.json) | 12000 | clear-v1 | False | True | True | episodes.oracle-failed |
| [trial-03](targeted/trial-03/checked-report.json) | 12000 | recent-observations-v2 | False | False | False | glm.deadline-exceeded |

All 387 local tests passed ([log](tests.tap)). Live calls: 47 model, 52 tokenizer. Minimum soft headroom: 485; maximum observed tokenizer underestimate: 110 tokens across 46 known receipts, 1 unknown receipts excluded.

The opt-in assembled-paging-v11 policy retains bounded-reads-v1, v8 completion requirements, 512 tokenizer margin, 2048 output reserve, 256 soft reserve, and 12 model/24 tokenizer caps. read-file offers optional UTF-16 offset; large results contain at most 5500 units with exact next_offset and full/page hashes. Unicode boundaries are preserved. Confirmed pages must reconstruct gap-free original text and match the pinned whole-file hash before satisfying required delivery. EOF or execution alone cannot satisfy it. One final response is reserved. Archive recovery remains an independent requirement after recycling.

Existing full observations remain unchanged for small files. Complete paged requirement files are assembled and hash-verified before projecting exact JSON requirement strings with all source page call IDs; partial files remain omitted; mutation and completion checks remain strict. No new shared-runtime paging API or adaptive token sizing is claimed: this candidate uses a fixed character cap plus existing token admission. Very large or token-dense pages may still block.

Tests cover Unicode bounds, unknown/missing/gapped coverage, overlap consistency, forged assembled content, native message mismatch, opt-in argument schema, premature final rejection, resume, and independently implemented report reconstruction. All live reports checked. Sources matched before/after each arm and at aggregation; task manifests match the previous v8 long workload exactly. No fixture, request, oracle, retry, replacement, or default changes.

The [plan](PLAN.md) and [manifest](targeted/manifest.json) declared the scope and four-arm schedule before calls. This is targeted tuning evidence, not reliability or unseen-task validation. Raw report inputs remain in /tmp/are-glm-assembled-paging; visible exports omit raw messages and provider reasoning. Reports check recorded oracle evidence, not fresh oracle execution. Observable recycling does not prove absence of provider-internal compaction.

The [working 10K clear-retention trial](targeted/trial-00/checked-report.json) passed all eight repair checks, complete delivery, and recycling recovery in twelve model responses. The other outcomes were two incorrect patches and one provider deadline. This is a demonstrated example, not a reliable operating policy.

Prior adaptive stages remain preserved: [v9](../paged-delivery-2026-09-08/README.md) had 0/6 repairs and 0/6 gates; [v10](../compact-paging-2026-09-08/README.md) had 0/6 repairs and 4/6 gates. The complete construction used 16 trials, 170 model attempts and 194 tokenizer attempts across three different candidates. Do not pool those versions as a reliability estimate. [Construction result and failure cases](construction-result.json).

Remaining work: jointly budget tokens and page turns for 8K, test preservation of the full behavioral contract across recycling, and establish repair repeatability before any pilot. The 8K failure remains unresolved.

## Open Questions

Owned by the [construction plan](PLAN.md#open-questions).
