# Experiment storage retention

After independent scoring and final review, `storage-closeout.mjs` plans and removes
only the explicitly enumerated `base/` and `work/` clones for completed ContextBench
cells in this study. It uses the existing completed-cell storage lifecycle helper.
Every completed/result hash is checked before deletion; both raw accounting audits
must pass before and after. The plan and per-cell cleanup receipts remain saved.

Keep receipts, snapshots, actual prompt/response captures, timing logs, scorer
results, native evaluator worktrees, configurations, hypotheses, freezes and all
original/amended outputs. Shared repository/scorer caches remain intact, including
the repaired ref that makes the pinned Svelte commit cloneable. LongMemEval files
are retained in full.

Raw accounting and native research record checks do not need disposable clones.
Source-projection replay that needs Git must recreate the pinned source checkout
from the retained cache using the task's `repository_cache` and `base_commit` in
`contextbench/config.json`. Recreate it at the recorded cell location or use a
separate replay directory; preserve archived snapshots and never redispatch model
calls merely to reconstruct evidence. Native scoring results are already sealed.

`STORAGE-CLEANUP.json` reports measured allocated file bytes removed. It does not
claim that Windows immediately shrank the WSL virtual disk. The original snapshots
and evidence, rather than disposable working copies, are the retained research record.

## Open Questions

Future iterations should score and release completed pairs promptly and use both
host and guest free-space guards. Native evaluator worktrees can be removed later
through their Git registration after verifying the retained scorer cache; this
closeout deliberately preserves them.
