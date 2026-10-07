# G02 focused-hint R2b exposed development screen

Status: **task 3 passed; joint two-task screen failed** on 2026-09-26.
[Prospective manifest](../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/g02-ranked-focus-r2b/RUN-MANIFEST.json).

| Task | Native Span-F1 | Native File-F1 | Known model tokens | Calls | Screen |
| --- | ---: | ---: | ---: | ---: | --- |
| ContextBench 3 | **0.5239497752** | **1.0** | **225,745** | 53 | Pass: exceeded DSH 0.512536/0.8 with fewer than 261,037 tokens |
| ContextBench 2 | — | — | **463,191** | 83 | Fail: token-budget stop, 2,015 over its 461,176 ceiling, no native export |

The source-only focused hints were exposed in 52 recorded task-3 requests.
The model read `view.go`, `http.go` and `view_test.go`; the bounded terminal
closure added one delivered, provenance-valid adjacent test read to the final
selection. Its native export contains those three files. The maximum measured
task-3 request input was 5,621 tokens, so this is **not** evidence of an
occupied 1M-token window. Task 2 used the same candidate code, with a writable
private `/tmp` tmpfs that repaired R2's EROFS failure. Its external screen
stopped before another dispatch only after an admitted call had crossed the
ceiling. Its internal episode budget still allowed 4 million tokens, so no
reserve-triggered finalization occurred before the worker stop. Do not infer
task-2 quality from its partial trajectory.

All dispatched model requests in both runs have known usage, with no automatic
retries. The [generation archive](generation-receipts-v1.tar.gz) preserves the
exact overlays, manifest, source sessions, full journals and results (SHA-256
`211346c10e26768226de5ebd66fe61d2c664eadf505529210224133e8796bed7`).
Task-3 [native score](task3-score/native-score.json) and
[screen](task3-score/screen.json), plus the task-2 [failed screen](task2-screen/screen.json),
are local. Original generation evidence remains at
`/opt/are-benchmark-runs/g02-ranked-focus-r2b/` on the VPS. R2c is a separately
labeled task-2 development candidate that reuses the exact task-3 row and
tests an opt-in 25,000-token finalization reserve; it does not erase this
failed task-2 cost or constitute fresh matched confirmation.

## Open Questions

Can task-2 terminal review finish before the screen ceiling and preserve its
prior perfect native Span/File-F1? Does the focused-hint acquisition mechanism
transfer to an untouched cohort and a genuinely occupied large window?
