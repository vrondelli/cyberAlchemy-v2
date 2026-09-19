# TASK-UOC-004 — Static Unified Render

- SWU: `SWU-UOC-004`
- Primary behavior: render the accepted graph/layout once in the existing SVG.
- Independent acceptance: all five families/bands and every model node/edge bind
  exactly once; all identities remain present; default Rule emphasis does not
  remove unrelated nodes; graph/source objects are not mutated.
- Split analysis: model-to-DOM/SVG binding is one render behavior. Browser harness
  scaffold is its acceptance code, not a separate product capability.
- Dependencies: closed 003 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  selector `#ontology-canvas`, symbols `renderCanvas`, `render`, `buildGraph`,
  and `[data-view]` lens controls;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#view-2-high-level-structure`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-004-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-004-REFRESH-RECEIPT.json`.
- Done criteria: old lens buttons no longer reconstruct graph; harness discovers
  shared Playwright, serves the exact directory on loopback, runs one named mode,
  audits requests/errors, and stops its server.
- Failure posture: count/ID mismatch, external request, console/page error, or
  server cleanup failure fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode static`.
- Acceptance evidence: command/exit, Playwright/browser binding, selectors/counts,
  request/error audit, server cleanup.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 005 becomes eligible only.
