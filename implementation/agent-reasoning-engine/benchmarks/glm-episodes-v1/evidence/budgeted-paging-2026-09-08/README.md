# Budgeted paging v12 — targeted results

Completed 4/4. Repairs 1/4; completion gate 1/4; continuity 1/4. Predeclared target met: False.

| Trial | Window | Retention | Repair | Gate | Continuity | Reasons |
| --- | ---: | --- | --- | --- | --- | --- |
| [trial-00](targeted/trial-00/checked-report.json) | 8000 | clear-v1 | False | False | False | glm.page-turn-budget-insufficient |
| [trial-01](targeted/trial-01/checked-report.json) | 8000 | recent-observations-v2 | False | False | False | glm.deadline-exceeded |
| [trial-02](targeted/trial-02/checked-report.json) | 8000 | recent-observations-v2 | True | True | True |  |
| [trial-03](targeted/trial-03/checked-report.json) | 8000 | clear-v1 | False | False | False | glm.page-turn-budget-insufficient |

All 391 local tests passed ([log](tests.tap)). Live calls: 59 model, 77 tokenizer. Minimum soft headroom: 454; maximum observed tokenizer underestimate: 173 tokens across 58 known receipts, 1 unknown receipts excluded.

The opt-in budgeted-paging-v12 policy retains bounded-reads-v1, v8 completion requirements, 512 tokenizer margin, 2048 output reserve, 256 soft reserve, and an explicit 16 model/32 tokenizer cap at 8K (12/24 at larger windows). read-file offers optional UTF-16 offset; large results contain at most 4000 units at 8K (5500 at larger windows) with exact next_offset and full/page hashes. Unicode boundaries are preserved. Confirmed pages must reconstruct gap-free original text and match the pinned whole-file hash before satisfying required delivery. EOF or execution alone cannot satisfy it. One final response is reserved. The 8K client cap is explicitly raised from 12 to 16 model responses and from 24 to 32 tokenizer attempts; the tool-call cap remains 24. The cap participates in client identity, checkpoint scope, and report checks. A pre-dispatch lower-bound check blocks when known remaining page reads, required archive recovery and finalization cannot fit remaining responses. Unknown file sizes can still invalidate an earlier estimate. Archive recovery remains an independent requirement after recycling.

Existing full observations remain unchanged for small files. Complete paged requirement files are assembled and hash-verified before projecting exact JSON requirement strings with all source page call IDs; partial files remain omitted; mutation and completion checks remain strict. No new shared-runtime paging API or adaptive token sizing is claimed: this candidate selects a character cap and call budget by window size, checks known remaining page turns, and retains existing token admission; it does not implement token-adaptive page search. Very large or token-dense pages may still block.

Tests cover Unicode bounds, unknown/missing/gapped coverage, overlap consistency, forged assembled content, native message mismatch, opt-in argument schema, premature final rejection, resume, and independently implemented report reconstruction. All live reports checked. Sources matched before/after each arm and at aggregation; task manifests match the previous v8 long workload exactly. No fixture, request, oracle, retry, replacement, or default changes.

The [plan](PLAN.md) and [manifest](targeted/manifest.json) declared the scope and four-arm schedule before calls. This is targeted tuning evidence, not reliability or unseen-task validation. Raw report inputs remain in /tmp/are-glm-budgeted-paging; visible exports omit raw messages and provider reasoning. Reports check recorded oracle evidence, not fresh oracle execution. Observable recycling does not prove absence of provider-internal compaction.

The [working 8K recent-retention trial](targeted/trial-02/checked-report.json) passed all eight repair oracle cases, complete delivery and recycling continuity. The other three trials ended with two page-turn budget blocks and one provider deadline. No fresh-context size block or measured input-reservation overrun occurred. This demonstrates feasibility at a higher bounded call cost, not reliable completion. The predeclared 3/4 target failed.

The first turn-budget failure followed an initial read at offset 1000, leaving a gap; the other consumed too many turns before the final file. [Detailed read sequences](construction-result.json) remain recorded. Next work should make new-file offset zero explicit and measure tolerance for extra/repeated reads before another reliability claim. Token-adaptive page search remains unimplemented.

## Open Questions

Owned by the [construction plan](PLAN.md#open-questions).
