# Canvas architecture and performance review

Date: 2026-09-18. Scope: documentation website client architecture, implementation, and performance tests. Status: scrolling repair verified in isolated production builds; publication and deployment remain separate.

## Finding

The reported reload-like behavior was reproduced as excessive rendering and unintended viewport movement. The measured canvas nodes did not remount. Each card scroll called the top-level workspace setter. The resulting render rebuilt node data, callbacks, and edges, defeating card memoization and reparsing all open guides. An effect then serialized the whole workspace into synchronous session storage.

In the repeated baseline, 10 of 12 runs also changed the viewport during the measured scroll. The fixed variant had zero such changes. The exact browser wheel/viewport chain behind every baseline drift is not separately isolated; the source-level fan-out and its removal are directly measured.

## Before and after

The table uses the five-card desktop scenario, three repeats per build. Each repeat sends the same 32 native wheel events. Counts cover the measured scroll phase, including its persistence settlement.

| Work during a scroll | Before | After |
| --- | ---: | ---: |
| Application renders | 32–33 | 0 |
| Card renders | 305–320 | 0 |
| Markdown parses | 305–320 | 0 |
| Session-storage writes | 31–32 | 2 |

All 12 reduced-motion post-fix scenarios passed structural budgets. All 4 additional normal-motion scenarios passed, with zero scroll-triggered renders/parses and three batched writes per run. The full-page return and drag phases passed in both post-fix runs. Dragging did not reparse Markdown or rerender peer cards.

Frame-time and navigation latency observations remain in the JSON. The shared host showed variable load, so this review does not infer a portable FPS or percentage-speedup claim. The primary acceptance result is elimination of irrelevant render work and viewport changes while preserving actual scrolling and reading state.

## Implemented changes

- Reading offsets now live in a dedicated persistence controller rather than React graph state.
- Storage writes coalesce after 250 ms idle, have a 1-second maximum delay, and flush at navigation, page-hide, and hidden-document boundaries.
- Node projection reuses unaffected nodes and document data. Stable event handlers use current committed state.
- Document rendering is memoized independently of card position and graph controls.
- Edge projection depends on lens/motion and component-document relationships.
- Duplicate opens, unchanged positions, and unchanged selection/viewport reports return the prior state.
- Programmatic viewport operations explicitly capture their completed value, so restoration does not depend solely on pointer move events.
- Tests await the saved state matching the visible scene rather than assuming a synchronous write or relying on a short fixed sleep.
- Functional tests now build and serve an isolated production bundle by default, avoiding the shared development server and hot-reload interference.

## Architecture coverage and remaining work

The [architecture and performance contract](../../../workspace/experiments/are-documentation/PERFORMANCE.md) contains the data-flow diagram, per-layer findings, sources, commands, and budgets. The review covers the app shell, routes, canvas projection and focus, card interaction, Markdown, search, persistence, content projection, animation lifecycles, and test methodology. The engine runtime, benchmark datasets, live model traffic, and server security are outside this client review.

Remaining work, in priority order:

1. Split the landing animation and full-document loading from the initial canvas bundle. The current JS bundle still exceeds Vite's 500 kB advisory threshold.
2. Stop scheduling the landing animation loop when paused, hidden, offscreen, or complete. Its cleanup already stops it when leaving the introduction; it was not active in the canvas scroll workload.
3. Establish device/browser performance budgets and field-oriented load/interaction measurements on controlled hardware.
4. Precompute/index search when the public corpus expands, and deduplicate identical route notifications.

These findings are recorded gaps, not hidden passes. The current repair preserves the canvas interaction, multiple cards, full-document reading, and local workspace recovery. No new runtime dependency was introduced.

## Evidence and reproducibility

- [Baseline results](../../../workspace/experiments/are-documentation/evidence/performance/before.json): expected FAIL against the new performance contract.
- [Fixed results](../../../workspace/experiments/are-documentation/evidence/performance/after.json): PASS, 12 scenarios, including article/drag phases.
- [Normal-motion results](../../../workspace/experiments/are-documentation/evidence/performance/after-motion.json): PASS, 4 additional scenarios.
- [Source receipt](../../../workspace/experiments/are-documentation/evidence/performance/source-receipt.json).
- [Functional browser results](../../../workspace/experiments/are-documentation/evidence/canvas-docs/results.json).
- [Baseline canvas bundle](../../../workspace/experiments/are-documentation/evidence/performance/baseline-canvas-dist.tar.gz): original instrumented HTML, JS, CSS, and favicon. Unused introduction images are omitted; this is sufficient for the declared canvas workload, not a full historical site distribution.
- [Benchmark script](../../../workspace/experiments/are-documentation/scripts/benchmark-canvas.mjs).
- [Persistence tests](../../../workspace/experiments/are-documentation/scripts/workspace-persistence.test.mjs).

Run `npm run benchmark:canvas` and `npm run test:canvas` from the site directory. The benchmark verifies instrumentation before measuring and records ERROR if its harness fails. An exploratory attempt to include article/drag interactions in the old baseline timed out on a non-visible reader action; it was not counted as a successful baseline comparison. The retained baseline rerun uses the same scroll workload with `--scroll-only`, while the fixed build additionally passes the new interactions.

The initial functional rerun also exposed a viewport-capture gap and timing assumptions about synchronous persistence; both were corrected. A later development-server startup timeout motivated isolating functional tests from that shared server. Earlier implementation receipts remain historical; this review owns the current performance evidence.

## Construction and operational boundaries

Current product frontier: the scrolling defect, dedicated persistence controller, and production performance regression suite. Local implementation and the scoped measurements are complete: the final production browser suite passes 32 checks, and nine state/persistence tests pass. Remaining product work is the prioritized list above. Production hosting, release approval, and public-manual publication are separate operational tasks owned by the product/deployment owners and are not prerequisites for this local repair. No ontology runtime records or selectors are required by this UI work.

## Open Questions

The unresolved performance budgets, field telemetry policy, and loading/search architecture decisions are owned by [PERFORMANCE.md](../../../workspace/experiments/are-documentation/PERFORMANCE.md#open-questions). Full public-manual coverage remains tracked in [IMPLEMENTATION.md](IMPLEMENTATION.md).
