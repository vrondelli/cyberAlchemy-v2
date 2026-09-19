# Stage 2 CB1 output-cap failure

The sealed CB1 treatment stopped because its twentieth model call exhausted the
**2,048-token output cap**, not because source provenance validation rejected a
selection. The last receipt reports HTTP 200, `finish_reason: length`, 3,954 input
tokens and 2,048 output tokens. The provider reports 2,047 of those output tokens
as reasoning tokens; no reasoning content was inspected. That failed call's 6,002
tokens are included in the 50,093-token treatment total.

The native transport raises `glm.incomplete-output` before returning a captured
public response. There are 20 dispatched model receipts but 19 successful public
response captures. Consequently the available evidence establishes output-budget
exhaustion, but does **not** establish whether the unfinished public response was
JSON, a tool call or another form. It would be incorrect to diagnose malformed
JSON from the preceding successful response.

`finalizing` was false and the frozen `incomplete_output_corrections` limit was
zero, so the episode ended immediately. This is separate from edited-source
provenance rejection and from terminal evidence disappearing after recycling.
The paired control selected valid context after 25 calls and 60,703 tokens.
Treatment's lower token count therefore does not establish preserved-completion
efficiency. [STAGE2-OUTPUT-FAILURE.json](STAGE2-OUTPUT-FAILURE.json) binds the exact
receipts and source paths.

A general successor hypothesis is bounded handling of incomplete outputs, or a
stronger brief-action output contract, within the same request and cumulative
budgets. Every failed and recovery call must count. The competing null is that
recovery repeats the failure or consumes the proposed savings. No recovery,
cap change, rerun, provider call or frozen-file modification was made here.

## Storage cleanup advice after final audit

Do not delete anything until native scoring, independent source reconstruction,
failure analysis and final audit are complete. Preserve task/configuration and
source hashes, results, completed receipts, snapshots, captured requests,
responses, timing logs, scorer results and the retained repository/scoring caches.
The repaired commit reference must remain available for later reconstruction.

The existing
[`storage-lifecycle.mjs`](../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs)
exports `cleanupCellSourceTrees({cellRoot, requireCompleted:true})`, which removes
only a sealed cell's `base/` and `work/`, retains evidence and writes a
`storage-cleanup.json` receipt. Apply it only to explicitly enumerated control and
treatment cells under this experiment's original Stage 1, supplementary first
exposure and Stage 2 directories. Verify each `completed.json` result hash against
`result.json` first. Do not call it on retained caches or unrelated historical runs.
`pruneCompletedCellSourceTrees(pairRunDirectory)` is the corresponding per-pair
wrapper; it does not handle native evaluator worktrees.

For `native-worktrees/`, identify each actual run-owned Git worktree, confirm its
Git metadata points into the retained scoring cache, then use
`git -C <worktree> worktree remove --force <same-worktree>` and preserve a cleanup
receipt. This removes the disposable sparse checkout and its worktree registration
without deleting the shared cache. Remove only now-empty run-owned parent
directories afterward. Do not recursively delete scoring-cache roots or snapshots.

The approximately 1.3 GB estimate is a planning input, not a measured reclaimed
amount. No cleanup was executed by this analysis.

## Open Questions

- Can a bounded corrective turn finish reliably without negating token savings?
- Would concise-action instructions prevent output-cap exhaustion across tasks?
- When the final audit is sealed, what measured bytes do the enumerated disposable
  checkouts occupy and reclaim?
