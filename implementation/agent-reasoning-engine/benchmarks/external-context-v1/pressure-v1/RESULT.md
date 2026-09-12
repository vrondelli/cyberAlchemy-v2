# Controlled-pressure recovery: exercised successfully, task unresolved

Implemented the [plan](PLAN.md) and completed one real Svelte development episode. Eight pressure/recovery regressions passed. [Frozen sources](freeze.json) include the unchanged recovery controller and an isolated transport copy with one additional guard: synthetic pressure cannot enter a generation-zero model request. The source-copy regression verifies that imports and this guard are its only transport changes. Existing sources, defaults and prior evidence remain unchanged.

## Live result

The unchanged real task is `SWE-bench-Live/MultiLang`, `sveltejs__svelte-16666`. After turn2's successful source read, the harness inserted labelled synthetic ballast. The real tokenizer measured 20,690 input tokens on the pressure prompt; the recycler transitioned before model dispatch. The first post-transition admission was 3,914 tokens including output reservation, below the unchanged 12,000 threshold. This is artificial pressure on a real task, not a natural-pressure benchmark score.

| Measure | Result |
| --- | --- |
| Model / tokenizer attempts | 11 / 12; all returned HTTP200 |
| Automatic retries | 0 |
| Context transitions | 1, before model turn3 |
| Recovery handle | One stable digest throughout generation1 |
| Archive requests | 4; 3 valid pages and 1 oversized-page schema rejection |
| Delivered offsets | 0 → 1,024 → 2,048; final cursor3,072 |
| Duplicate pages | 0 |
| Work after archive retrieval | Searches and 2 successful source reads |
| Largest admitted input + output bound | 10,763 tokens |
| Terminal outcome | `input-reservation-exceeded` at turn11 |
| Accepted patch / hidden evaluation | None / not run |
| Cleanup | Verified |
| Episode duration | 100.374 seconds |

GLM corrected the oversized-page request, advanced through the archive with the stable digest, then resumed searches and read `SnippetBlock.js` and `AwaitBlock.js`. This supports the narrow recovery mechanism in this episode. It does not prove a correct repair, causal superiority over an unrepeated baseline, or general model qualification. Four archive requests must not be described as four delivered pages.

See [assessment](assessment.json), [received responses](evidence/live/responses.json), [tool events](evidence/live/events.json), [recovery state](evidence/live/recovery.json), [provider receipts](evidence/live/result.json), [checks](evidence/offline-checks.json), and [research DAG](research-result.json). The assessment script is a post-run replay audit, not a preregistered statistical evaluator.

## Newly isolated accounting issue

Turn11's tokenizer counted8,203 input tokens. The transport added its fixed512-token margin and reserved8,715. The chat response reported8,784 input tokens, exceeding that reservation by69. Even with the full2,048 output reservation, the observed total was10,832—below12,000. This was an estimate violation, not an observed context-window overflow or timeout. The transport rejected the response before exposing its message to the runner; its contents and proposed action are unknown.

The [receipt analysis script](diagnose-tokens.mjs) compares four retained external episodes without provider calls. In this pressure run, all9 measured post-transition tokenizer gaps exactly equal the accumulated prior reasoning-token counts; at turn11 the gap is581. An initial-generation counterexample prevents treating this as a universal formula. [Detailed diagnosis](token-diagnosis.json) retains both matches and exceptions.

Next bounded implementation: investigate request-scoped accounting for retained reasoning, replay it against all captured episodes and transition boundaries, then freeze a regression-backed policy before another live run. Increasing a fixed margin alone would leave the underlying discrepancy unexplained. Final-submission timeout behavior from the previous episode remains a separate open issue.

Recorded usage was37,088 input and1,448 output tokens; the unchanged list-price arithmetic estimates USD0.006287, not an invoice. The experiment used its frozen one-episode budget; no retries or replacement runs were launched.

## Open Questions

What exact request conditions cause retained reasoning to be included in chat usage but omitted from tokenizer counts? Can an accounting policy conservatively bound that discrepancy across context transitions? Can the model finish the real task once transport accounting is corrected? How does recovery perform across natural-pressure tasks and other models? [PLAN.md](PLAN.md) owns the broader pressure-test limitations.
