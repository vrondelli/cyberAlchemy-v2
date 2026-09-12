# Accounting implemented; complete real-task evaluation obtained

The [planned accounting candidate](PLAN.md) is implemented and tested. Every measured historical and new live request fits its corrected input reservation. The real Svelte episode completed through two context transitions and returned a model patch. The isolated benchmark evaluator scored that patch, but the task remains unresolved.

## What changed

[accounting.mjs](accounting.mjs) reserves reasoning tokens for exact assistant-message occurrences included in each request, using provider usage bound to a hash of the full message. Evidence is retained in the transport's existing receipt ledger. Archived messages contribute zero, duplicate occurrences count separately, and unknown or changed reasoning fails closed. Missing reasoning-token usage falls back to the response's total output count. The policy is included in transport identity, preventing silent reuse of a ledger from the older policy.

The [adapter diff](transport-change.diff) shows the isolated transport changes. The existing512-token margin,12K recycling threshold,16,384 hard context limit,2,048 output reservation, response guards and request timeouts remain unchanged. Historical evidence and serving defaults remain unchanged. The inherited pressure-adapter header describes its earlier provenance; this candidate's additional accounting changes are defined here and in the diff.

## Verification

- **9 tests passed**, including exact-message binding, duplicates, missing usage, invalid evidence, a real HTTP loopback transport, ledger restoration and reasoning removal during recycler transitions. [Tests](accounting.test.mjs), [check receipt](evidence/offline-checks.json).
- **46/46 historical requests with reported usage fit the new bound**, across47 captured attempts. One timed-out request has unknown usage. No retained-message evidence was missing. Three historical requests would trigger earlier recycling under the candidate; replay does not simulate their later trajectories. [Replay script](replay.mjs), [report](replay.json), [input hashes recorded during audit](evidence/replay-inputs.json).
- **12/12 new live responses fit their reservations**. The independent post-run audit reconstructed all14 tokenizer measurements from the exact included messages and prior receipts. Reasoning reservation peaked at604 tokens and returned to zero after context transitions. [Assessment](assessment.json).

This is evidence for the bounded candidate, not a universal guarantee of future provider token accounting. Reserving reasoning that a tokenizer already counts may cause conservative early recycling.

## Live task and scored outcome

The unchanged task is `SWE-bench-Live/MultiLang`, `sveltejs__svelte-16666`, using the pinned public task and container image. The previous labelled synthetic-pressure condition remains part of the development experiment; no solution hints, reference patch or hidden test metadata were supplied to the model.

| Measure | Result |
| --- | --- |
| Model / tokenizer calls | 12 / 14; all HTTP200 |
| Automatic retries | 0 |
| Context transitions | 2 |
| Maximum admitted input + output reservation | 11,784, below12,000 |
| Source reads after first transition | 7, including3 rereads |
| Archive reads | 0; model used source navigation |
| Patch proposal | Submitted on final turn |
| Repair checks | **65/67 passed** |
| Regression checks | **5,120/5,120 passed** |
| Missing expected test labels | 0 |
| Task resolved | **No** |
| Container cleanup | Verified for rollout, export review and both evaluator attempts |

The same two baseline failures remain: `async-reference-in-snippet (dom)` and `(hydrate)`. The model changed snippet hoisting in `SnippetBlock.js`, but that did not resolve the issue. [Failure comparison](evidence/failure-comparison.json), [scored evaluator report](evidence/evaluation-attributed/report.json).

The episode took118.817 seconds and recorded51,993 input and1,843 output tokens. Existing list-price arithmetic estimates USD0.008720; this is not an invoice. This one development task and adapted executor are not an official leaderboard score or GLM qualification.

## Export defect discovered and contained

The original exporter included dependency changes already present in the benchmark image because it returned whole-worktree `git diff`. The first evaluation failed at patch application and remains preserved. A fresh isolated replay reproduced the exact original diff, verified the model-targeted source file was initially clean, and verified all unrelated image changes remained untouched. It then exported only the exact submitted model edit for the second evaluation. No model edit was rewritten, no tests selected its contents, and no further model call was made.

[Export verifier](export-model-patch.mjs), [attribution receipt](evidence/export-review/report.json), [model-only patch](evidence/export-review/prediction-model-only.patch), and [evaluation review](EVALUATION-REVIEW.md) document this post-run correction. The frozen live exporter still needs this attribution check integrated before a larger evaluation cohort. The original global diff is not a scope-clean model patch.

Both evaluations used the existing resource-adapted test command and conservative full-name matching described in the parent result.37 expected labels have multiple full-name matches; all matches must pass. The score is a custom-harness result, not an unmodified official score. A shell pipeline exit code alone is not used as test success.

## Completion and next frontier

The accounting implementation, regression/replay checks and one bounded live validation are complete. [Research DAG](research-result.json) keeps broader effectiveness inconclusive. The next frontier is reliable patch attribution in the runner and better task diagnosis—not another fixed token-margin increase. Improving the model's repair requires a separately frozen experiment; the current patch's failure must remain visible.

## Open Questions

How conservative is reasoning reservation across other tasks and models? What request conditions explain provider counting differences? How should the runner export deltas when the image is already dirty in a model-targeted file? What diagnostic feedback helps GLM distinguish the actual async-reference defect from its unsuccessful hoisting hypothesis? [PLAN.md](PLAN.md) owns the accounting candidate's remaining questions.
