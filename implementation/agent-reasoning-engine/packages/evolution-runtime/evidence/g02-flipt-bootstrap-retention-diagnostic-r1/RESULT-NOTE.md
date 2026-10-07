# G02 broad history retention diagnostic r1

## Result

On the already-exposed Flipt bootstrap task `SWE-Bench-Pro__go__maintenance__bugfix__b91d5788`, enabling the runtime's existing two-recent-exchange history projection reduced ARE cost to **98,329 tokens** and **170.332 seconds**, but native quality fell to **0.39316 Span-F1** and **0.70588 File-F1**. The earlier unprojected matched ARE arm scored 0.51582 / 0.84211 at 276,627 tokens and 231.874 seconds; matched DSH scored 0.43040 / 0.75000. Broad projection therefore fails the quality requirement and is rejected.

The diagnostic completed a valid final context selection in 19 calls. All 19 prompts received a history projection, with 746,041 cumulative JSON bytes removed across projections. Full receipts remain at `/opt/are-benchmark-runs/g02-cross-layer-flipt-bootstrap-retention-diag-r1/`, including the frozen profile hash, events, prediction, and native score. This exposed ARE-only diagnostic is not a matched win.

## Open Questions

- Can a selective projection preserve source reads and edits while removing only older search-only exchanges, saving the roughly 12,000-token gap without reducing quality?
