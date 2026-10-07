# G02 exposed NodeBB cross-layer diagnostic

The fixed four-task G02 candidate failed quality on the already exposed NodeBB chat-permissions task `09eb0d6d`. Its archived ARE receipts contained a pinned-base read of `src/views/admin/settings/user.tpl`, but the final model selection omitted it. An additive, opt-in [task-anchored selector](../../../../benchmarks/contextbench-v1/component-packet-selection.mjs) retained all six selected reads and added one previously delivered, base-projectable settings-template read. The default selector and frozen pair remain unchanged.

The [offline prediction](prediction.json) was exported from the sealed ARE result without a new model call and scored with the pinned native ContextBench scorer. Native File-F1 rose from **0.25000 to 0.35294**, above the frozen DSH value **0.33333**. Span-F1 rose from **0.35624 to 0.36245**, still below DSH **0.43701**. This is an exposed-task diagnostic, not a prospective ARE win, and its token/time costs are inherited from the original run rather than remeasured. The [selection receipt](selection.json) records the added read; the [native score](native-score.json) records the result.

A separate bounded [source-only hint selector](../../../../benchmarks/contextbench-v1/cross-layer-source-hints.mjs) uses task-stated identifiers and account-settings language to propose at most four one-per-layer source reads. On the pinned, already exposed NodeBB base it proposed the settings OpenAPI schema, admin settings view, client account settings, and account settings controller—without reading benchmark gold. These are **hints, not delivered evidence**; no accuracy claim can be made from them until a new episode reads, presents, and receipt-binds the source. Six focused tests pass across the selectors and ranker builder.

That delivery was subsequently tested in the [live exposed-task diagnostic](../g02-cross-layer-nodebb-live-diagnostic-r4/RESULT-NOTE.md). The live result supersedes the delivery question here, but does not turn this exposed task into a prospective benchmark win.

The diagnostic workspace is `/opt/are/evolution-runtime/g02-cross-layer-nodebb-diagnostic-r1` on the GLM VPS. It is intentionally separate from the frozen `/opt/are-benchmark-runs/g02-nodebb-09eb-r1` pair.

## Open Questions

- Will the combined acquisition and selector treatment beat a fresh matched DSH control on untouched settings/UI/API tasks without losing its efficiency advantage?
