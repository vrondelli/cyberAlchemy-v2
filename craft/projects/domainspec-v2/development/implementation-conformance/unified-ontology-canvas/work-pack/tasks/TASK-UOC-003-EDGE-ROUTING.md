# TASK-UOC-003 — Deterministic Edge Routing

- SWU: `SWU-UOC-003`
- Primary behavior: compute stable typed ports, corridors, and edge paths.
- Independent acceptance: every edge routed once, no route crosses a node
  interior, parallel edges have stable offsets, and semantic/structural edge
  classes retain distinct text/pattern metadata.
- Split analysis: ports without complete paths cannot pass independently; SVG
  rendering remains separate in 004.
- Dependencies: closed 002 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#edge-ports-and-routing`;
  planned `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`
  export `ComputeDeterministicCanvasLayout` and its `UnifiedCanvasLayout` result.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-003-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-003-REFRESH-RECEIPT.json`.
- Done criteria: routes/ports added without changing accepted node coordinates;
  edge mode passes.
- Failure posture: missing/duplicate route, node-interior crossing, unstable
  offset, or collapsed relation class fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode edges`.
- Acceptance evidence: command/exit, route count, crossing count zero, digest.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 004 becomes eligible only.
