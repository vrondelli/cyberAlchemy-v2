# TASK-UOVA-03 — Proven Fallback and Spatial Renderer

Goal: prove complete linear/index access first, then admit a spatial adapter only when it renders the semantic scene faithfully.

Write scope: OEW overlay index/linear, graph/adapter components and styles, their focused tests, approved source/lock manifests when preflight-bound, generated build evidence, and SWU receipts. No Body War source or minified bundle writes.

## SWU-UOVA-011 — Full Index and linear projection

Primary behavior: all admitted nodes and relations remain reachable before the graph adapter is allowed to activate.

Algorithm: derive canonical node and relation row sets from SourceGraph, not the visible scene; maintain total count separately from filtered count; apply deterministic query/sort/filter; link rows to exact inspector records and, when possible, bounded focus scenes; provide relation sentences and portal/Path summaries in linear order; surface adapter-unavailable status without losing records.

Independent acceptance: exact 276 + 301 rows on the Body War fixture, stable sort/search, no hidden denominator loss, keyboard access, renderer-unavailable operation, and `FULL_INDEX_NOT_TOTAL` negative. Dependencies: 003, 006–009. Closeout synchronizes 011, this task, W2, and Work Pack; select 012. Expected result: complete-fallback receipt with row identity/count evidence and UI-contract conformance IDs.

## SWU-UOVA-012 — React Flow adapter conformance

Primary behavior: render one actual spatial path for every scene relation ID using controlled node/edge arrays.

Algorithm:

1. Run the versioned capability handshake before adapter activation: multiedges, compound groups, edge labels, markers, patterns, DOM addressability, supplied geometry, keyboard hooks, viewport, reduced motion, forced colors, and export.
2. Map exact source node IDs and relation IDs directly to controlled React Flow records. Never load ontology relations through `addEdge()`.
3. Consume canonical ELK coordinates; do not let the renderer change membership, predicates, direction, or Path.
4. Render an addressable SVG path, marker, exact-predicate label, pattern, and hit target per relation ID. Offset parallel paths without merging them.
5. Emit only versioned semantic intents; resolve selection/evidence in the controller.
6. Require the passing SWU-011 fallback receipt before activation. If any mandatory capability or geometry check fails, keep that proven linear/index projection active and record the adapter failure. Do not auto-activate Cytoscape.

Independent acceptance:

- one DOM/SVG path per scene relation ID and zero cards/pills substituting for relations;
- nonzero path geometry with separately addressable label and marker;
- two same-endpoint relations remain distinct through selection;
- exact predicate text/color/pattern/direction and node icon/text resolve;
- `RELATION_GEOMETRY_MISSING`, `DIRECTION_MARKER_MISSING`, and mapping failures are caught;
- upstream typed build succeeds with React Flow `12.10.1`, ELK `0.9.3`, Node `22.12.0`, pnpm `10.6.2`, and the pinned lock digest.

Dependencies: 007, 010–011. Validation: focused component tests, OEW root regression, `build:l1`, `verify:l1-build`, DOM/SVG fixture checks, scoped whitespace. Closeout synchronizes 012, this task, W2, and Work Pack; select 013. Expected result: adapter capability receipt, materialized build handle, relation-ID geometry counts, failure evidence, proven fallback handle, ceiling `candidate-local spatial adapter`.
