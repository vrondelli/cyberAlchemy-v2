# TASK-UOC-002 — Deterministic Node Layout

- SWU: `SWU-UOC-002`
- Primary behavior: compute stable five-band node coordinates and graph bounds.
- Independent acceptance: identical graph yields byte-identical positions; every
  node has one band/position; canonical fixture has zero node overlaps and exact
  documented ordering.
- Split analysis: band bounds and coordinates are one layout result; edge routes
  are independently acceptable and remain 003.
- Dependencies: closed 001 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#five-deterministic-bands`;
  planned `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`
  export `BuildUnifiedCanvasProjection`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-002-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-002-REFRESH-RECEIPT.json`.
- Done criteria: pure layout export, stable sorting, bands/bounds/positions, no
  routing or DOM behavior, passing node mode.
- Failure posture: unknown band, missing position, overlap, or nondeterminism
  fails the validator.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode nodes`.
- Acceptance evidence: command/exit, stable snapshot digest, overlap count zero.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 003 becomes eligible only.
