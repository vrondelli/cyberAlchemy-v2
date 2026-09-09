# Page adherence v13 — targeted results

Completed 4/4. Repairs 3/4; completion gate 3/4; continuity 3/4. Predeclared target met: False.

| Trial | Window | Retention | Repair | Gate | Continuity | Reasons |
| --- | ---: | --- | --- | --- | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | 8000 | clear-v1 | True | True | True |  |
| [trial-01](targeted/trial-01/checked-report.json) | 8000 | recent-observations-v2 | False | False | False | glm.deadline-exceeded |
| [trial-02](targeted/trial-02/checked-report.json) | 8000 | recent-observations-v2 | True | True | True |  |
| [trial-03](targeted/trial-03/checked-report.json) | 8000 | clear-v1 | True | True | True |  |

All 393 local tests passed ([log](tests.tap)). Live calls: 64 model, 84 tokenizer. Minimum soft headroom: 275; maximum observed tokenizer underestimate: 231 tokens across 63 known receipts, 1 unknown receipts excluded.

The opt-in page-adherence-v13 policy retains bounded-reads-v1, v8 completion requirements, 512 tokenizer margin, 2048 output reserve, 256 soft reserve, and an explicit 16 model/32 tokenizer cap at 8K (12/24 at larger windows). read-file offers optional UTF-16 offset; large results contain at most 4000 units at 8K (5500 at larger windows) with exact next_offset and full/page hashes. Unicode boundaries are preserved. Confirmed pages must reconstruct gap-free original text and match the pinned whole-file hash before satisfying required delivery. EOF or execution alone cannot satisfy it. One final response is reserved. Archive recovery remains an independent requirement after recycling.

Existing full observations remain unchanged for small files. Complete paged requirement files are assembled and hash-verified before projecting exact JSON requirement strings with all source page call IDs; partial files remain omitted; mutation and completion checks remain strict. No new shared-runtime paging API or adaptive token sizing is claimed: this candidate selects a character cap and call budget by window size, checks known remaining page turns, and retains existing token admission; it does not implement token-adaptive page search. Very large or token-dense pages may still block.

Tests cover Unicode bounds, unknown/missing/gapped coverage, overlap consistency, forged assembled content, native message mismatch, opt-in argument schema, premature final rejection, resume, and independently implemented report reconstruction. All live reports checked. Sources matched before/after each arm and at aggregation; task manifests match the previous v8 long workload exactly. No fixture, request, oracle, retry, replacement, or default changes.

The [plan](PLAN.md) and [manifest](targeted/manifest.json) declared the scope and four-arm schedule before calls. This is targeted tuning evidence, not reliability or unseen-task validation. Raw report inputs remain in /tmp/are-glm-page-adherence; visible exports omit raw messages and provider reasoning. Reports check recorded oracle evidence, not fresh oracle execution. Observable recycling does not prove absence of provider-internal compaction.

V13 adds explicit offset zero for new files and one exact next-read instruction after current observations. Once required delivery and recovery are satisfied, it asks for the patch. It never rewrites model arguments or treats skipped pages as delivered.

Compared with [v12](../budgeted-paging-2026-09-08/README.md), the same four-cell schedule and task manifests yielded 3/4 repairs versus 1/4. This is a small sequential tuned comparison, not a causal or reliability estimate. The only v13 failure was a final-attempt deadline; the all-four gate/continuity criterion still failed. No retries or replacements occurred.

All four traces contain 14 file-page reads, zero repeated page requests, zero nonzero starting offsets, and one archive read. The timed-out response cannot confirm delivery of its final supplied archive result. The other three passed complete delivery, recovery and all eight repair checks. See [adherence evidence](construction-result.json).

The next frontier is final-response deadline behavior and a larger fixed validation, keeping failed attempts visible. Defaults remain unchanged.

## Open Questions

Owned by the [construction plan](PLAN.md#open-questions).
