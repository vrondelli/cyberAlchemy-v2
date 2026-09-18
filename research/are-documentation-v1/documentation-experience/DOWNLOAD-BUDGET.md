# Initial download reduction and enforced targets

Status: implemented and verified locally; no deployment claim.

## Objective and construction boundary

Reduce the initial download after expanding the guide set and add an enforceable performance target. Authorization: the owner's request to implement the proposed improvement and add a target. Route: `CA2-ROUTE-IMPLEMENT`, under the existing CAV2-D65 native construction boundary. This report records local implementation evidence, not governance admission.

## Implementation

[CanvasGraph](../../../workspace/experiments/are-documentation/src/CanvasGraph.tsx) now owns the React Flow imports and graph rendering behind a lazy page boundary. The introduction's animation code and CSS also load only when needed. Workspace state, stable actions, and scroll persistence retain their existing owner and lifecycle. Loading status text covers asynchronous page loading.

[The budget](../../../workspace/experiments/are-documentation/performance-budget.json) applies to all initial JavaScript and CSS for each route, including shared dependencies and the selected lazy page. Assets are counted once per cold route. Compression uses gzip level 9 consistently. Images, fonts, HTML, API traffic, and later navigation are excluded; this is not a whole-page transfer or load-time promise.

| Page | Previous gzip | Current gzip | Reduction | Gzip ceiling | Decoded ceiling |
| --- | --- | --- | --- | --- | --- |
| Introduction | 203.6 KiB | 147.5 KiB | 27.5% | 180 KiB | 550 KiB |
| Documentation | 203.6 KiB | 96.3 KiB | 52.7% | 140 KiB | 450 KiB |
| Canvas | 203.6 KiB | 156.4 KiB | 23.2% | 180 KiB | 550 KiB |

The targets preserve headroom for reviewed additions but remain below the original combined download. They must not be raised merely to make a failing change pass. The existing scroll target remains zero App/card rerenders, zero Markdown reparses, no remount or viewport movement, and at most three storage writes in the specified workload.

## Enforcement and evidence

`npm run build` includes manifest dependency traversal, asset hashing, size accounting, and budget enforcement. Missing dependencies, missing/invalid limits, empty routes, or exceeded limits fail. New lazy route entries must be reflected in the declared route roots.

`npm run test:downloads` verifies the budget checker and cold browser requests. The browser proof compares actual JS/CSS responses against the complete declared asset set and tests documentation-to-introduction-to-canvas navigation. `npm run test:canvas` includes that proof.

- Production build, TypeScript, and documentation freshness passed.
- Nine workspace/persistence tests and three budget tests passed. Budget tests cover dependency deduplication, missing roots, both size limits, and invalid/empty declarations.
- [44 browser behavior checks](../../../workspace/experiments/are-documentation/evidence/canvas-docs/results.json) passed.
- [All three cold-route asset checks](../../../workspace/experiments/are-documentation/evidence/performance/download-browser.json) passed.
- [Six scrolling scenarios](../../../workspace/experiments/are-documentation/evidence/performance/download-split-scroll.json) passed, one repetition each, including nine cards on desktop and mobile. All had zero App/card renders and Markdown parses, two storage writes, no remount, and no viewport movement. Full-page return and drag checks passed.
- [Baseline sizes](../../../workspace/experiments/are-documentation/evidence/performance/download-before.json) and [current asset sizes/hashes](../../../workspace/experiments/are-documentation/evidence/performance/download-current.json) are retained.

No dependency was added. The build no longer reports a JavaScript chunk above Vite's 500 kB advisory threshold. Route totals, rather than individual chunk size alone, determine the new budget result.

## Open Questions

- When should guide bodies be fetched separately? They remain in the shared entry and count against the budget.
- Which real devices and network conditions should define a load-time target? Shared-host headless timings are not a stable field-performance gate.
- What whole-page budgets should cover introduction images and fonts beyond this code-download scope?
- How should deployments retain old hashed chunks across upgrades for visitors with an already-open page?
