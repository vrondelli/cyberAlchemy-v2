# Fresh episodes followed by bounded feedback

Run a closed four-trial v20 plan through `fixed-evaluation.py`, then run the explicit container feedback stage on that completed evidence directory:

```sh
/path/to/node-26.8.1 public-feedback-run.mjs \
  /path/to/credential-reference.json /path/to/initial-results \
  /path/to/fresh-feedback-results /tmp/fresh-private-state --fresh-four
```

`--fresh-four` requires a completed four-trial initial run, unique trial IDs/indices and valid gate/repair fields. It preserves all four trials, including those without submissions. No-submission trials receive `NO_SUBMISSION` and zero corrective attempts; no candidate is invented for them. At most four corrective requests are allowed, one per submitted proposal. The existing six-retained-proposal mode retains its two-request cap.

First-pass results remain immutable. Final verification requires both an accepted feedback-stage result (`UNCHANGED` or `REPAIRED`) and a passing separate oracle. A blocked stage cannot be counted as final success merely because its returned candidate later passed an oracle. The aggregate reports first-pass repairs, final verified proposals, verified corrections and unsubmitted trials separately. `COMPLETED` describes schedule completion, not target success.

The [current plan](evidence/fresh-feedback-2026-09-08/PLAN.md) fixes four new model runs on existing fixtures at 8K/12K. The explicit v3 correction stage uses disposable public-validation workers and immediate readiness checks. Hidden oracle results never enter model feedback; only public checks do. Both phases freeze their source lists, and the outer orchestration snapshot binds the scripts and schedule across phases.

## Open Questions

Owned by the [plan](evidence/fresh-feedback-2026-09-08/PLAN.md#open-questions): repeated runs, unseen tasks, broader windows and whether correction improves reliability remain empirical questions. Fresh executions of existing fixtures are not held-out task evidence.

The explicit `--fresh-matrix` mode accepts exactly twelve completed trials covering each of the four registered task IDs at 8000, 10000 and 12000 soft limits once. Duplicate or missing task/window combinations reject. Every trial remains in the denominator, and the corrective cap is twelve model/twenty-four tokenizer attempts. The [matrix plan](evidence/matrix-feedback-2026-09-08/PLAN.md#open-questions) owns its scope and open questions.
