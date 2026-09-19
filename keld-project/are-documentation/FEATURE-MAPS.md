# Connected feature maps

Historical selected-feature implementation. Superseded by the complete graph in
[ENGINE-EXPLORER-ARCHITECTURE.md](ENGINE-EXPLORER-ARCHITECTURE.md). Earlier results
below describe that stage, not the current product candidate.

## Objective

Documentation links must show a feature and its connections before opening reading content.

The implementation adds nine feature maps with 88 parts and 95 labeled connections. These are explanatory views of the reviewed guides. They do not show live execution or grant permission to run a feature.

## Reader behavior

- “Explore feature graph” goes to Explore the engine and focuses the selected feature in its shared canvas.
- Reading-path links open the same maps.
- Links from capability overviews also open feature maps.
- The feature selector changes the expanded feature in the same graph. The eight engine components remain present. Dashed “feature detail” links connect them to the feature.
- Related-feature links connect a part to its supporting feature map.
- “Read full guide” opens the article. “Return to canvas” restores the originating feature map.
- Parts can move. Positions and viewport remain available during in-page navigation. Reload restores the initial map layout.
- “Read all feature connections” provides a text alternative.
- Guide cards and the guide picker remain available while a feature is expanded.

No feature route creates a guide card. Existing guide cards remain in the same graph and in the saved engine workspace. Legacy `guide` URLs now select feature maps. The explicit `card` route and existing component routes retain guide-card access.

## Content and architecture

[featureMaps.ts](src/featureMaps.ts) owns the parts and labeled relationships. Each map uses its corresponding reviewed guide in [the content projection](src/generated/documentation.json): concepts, working memory, gateway, configuration, compatibility, workflows, interaction learning, privacy, and operations.

[CanvasGraph](src/CanvasGraph.tsx) owns the only ReactFlow canvas. It combines engine nodes, saved guide cards, and the selected feature expansion. [FeatureGraph](src/FeatureGraph.tsx) supplies only the feature node renderer. Feature selection does not replace the canvas element. Feature positions remain in page memory; reading cards retain their existing session storage contract. Dashed feature links describe documentation relationships, not runtime calls.

The maps retain the documented limits. Interaction learning remains a prototype and off by default. Gateway transport compatibility does not imply support for every agent. Unknown outcomes remain blocked. Research recommendations do not activate behavior.

## Validation

- The map test requires coverage of all nine guides, valid edge endpoints, a connected map, and valid related-feature targets.
- [Browser checks](evidence/feature-maps/results.json) cover all nine documentation-to-map routes, absence of automatic guide cards or modals, related-feature links, dragging, full-guide return, legacy links, unknown routes, and mobile use.
- Existing [card checks](evidence/canvas-docs/results.json) and [reader checks](evidence/manual-reader/results.json) remain separate.
- [Download checks](evidence/performance/download-current.json) include the complete graph module within the existing 180 KiB gzip canvas target.
- [Scrolling checks](evidence/performance/explorer-layout-scroll.json) test the retained guide-card behavior after integration.

The download browser proof now accounts for the site's `/are/` base path. The introduction budget also counts its current animation worker. Missing declared worker assets fail the budget check. These corrections do not raise the targets.

## Recorded results

The production build passes. All 32 feature-map browser checks pass, including the shared graph, engine-to-feature links, and navigation without replacing the canvas. The existing card suite passes 45 checks, and the reader suite passes 18 checks. All three cold-route download checks pass.

The canvas requires 166.5 KiB gzip against the unchanged 180 KiB target. All six guide-card scrolling scenarios pass with zero App/card rerenders and zero Markdown reparses. This is one run per scenario on the local headless host.

## Explorer space and navigation

The explorer uses the remaining viewport below the measured header. A compact title,
feature toolbar, and footer leave more height for the canvas. Hide navigation expands
the canvas without replacing it. The navigation panel scrolls vertically and contains
its scroll at both ends. Mobile navigation has a bounded height rather than a wide
horizontal strip. The guide picker shares the sidebar scroll instead of nesting
another scrolling list.

The four workflow groups reuse `readingPaths` from the documentation catalog. Their
steps cover all nine feature maps and open them in the same engine canvas. The eight
engine lenses remain available under “What matters to you?”.

[Layout checks](evidence/explorer-layout/results.json) cover 1906, 1440, and 390 pixel
widths. Targets: no page overflow, graph height at least 75% of the space below the
header on desktop and 48% on mobile with navigation open, and no App rerender,
canvas replacement, or viewport movement when the sidebar scrolls. Hiding navigation
must increase graph area. Existing download targets remain unchanged.

## Open Questions

- Which maps need more detailed subfeatures after reader review?
- Should moved feature layouts persist after a browser reload?
- Which diagrams would benefit from authored placement beyond the current grid and directional edge routing?
