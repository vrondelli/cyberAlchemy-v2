# Latency boundary inspection 001

Current verification: **blocked**. After initial checks passed, the shared
`evolution-runtime/index.mjs` changed relative to frozen WRL-001. The final
combined run had 13 passes and one predecessor-drift failure. Saved progress
and HTML are historical candidate outputs, not current verified completion.
The six selected timing sources still verify. See `EVIDENCE.json`; do not refresh
the predecessor digest or overwrite another writer's changes to manufacture PASS.

Product-construction task: `latency.inspect`. This source-bound inspection
completes only `timing-boundary-report`; it does not select a repair or run an
experiment. The parent WRL-001 and CC006 artifacts remain unchanged.

## Findings

1. Cold IPC handshake includes both status IPC and a subsequent animation-frame
   wait. It cannot isolate IPC cost.
2. Native setup attempts bridge prewarm before frontend connection. The connect
   path may spawn on an empty cell, but the observation does not establish that
   this branch ran. Prewarm failure is not recorded as a distinct receipt.
3. Bridge/proxy startup, initialize, thread creation and buffered event delivery
   lack separate durations in the inspected functions.
4. Connect-to-ready starts at the frontend call, excluding earlier native
   prewarm; readiness can arrive through replay. It is not desktop cold-start
   duration.
5. Projection/paint mix Node and frontend wall-clock timestamps; the paint
   boundary is a requestAnimationFrame callback, not witnessed presentation.

`report.json` binds seven boundaries to six exact source files and line-located
selectors. Its missing measurements are questions, not proven causes. Existing
budgets must remain unchanged; future diagnostic spans supplement rather than
redefine the acceptance metrics.

## Verification and progress

```sh
node cyberAlchemy-v2/workspace/experiments/control-center/research-learning/latency-inspect-001/inspect.mjs --check-saved
node --test cyberAlchemy-v2/workspace/experiments/control-center/research-learning/latency-inspect-001/inspect.test.mjs
```

The criterion verifier checks exact source bytes, required selectors and the
complete inspected report against the defined mapping. It is not an automatic
semantic proof of causality. Completion is replayed against the original plan;
`latency.hypothesize` becomes ready. `host.qualify` remains a separate operational
task owned by the test operator. No current host qualification is inferred.

`view.html` is a standalone read-only successor work view, not embedded in Tauri
or browser-visually validated. The original view still shows original progress.

## Open questions

- How much of the handshake interval is IPC versus frame scheduling?
- Was prewarm successful, and how long did ready events wait for attachment?
- Which process-local phase dominates a qualified launch?

Next construction: declare competing hypotheses and their falsifiers. Native
runs, instrumentation implementation, host remediation, approval and publication
are outside this inspection. CC006 remains failed/inconclusive for repair benefit.
