# TASK-UOC-006 — Focus And Trace

- SWU: `SWU-UOC-006`
- Primary behavior: search/select one object and emphasize only its real connected
  trace while naming missing hops.
- Independent acceptance: Rule trace follows explicit candidate alignment,
  applicable constraint/property, matching supplied fact, and exact finding;
  name-only links never appear; clear focus restores prior transform/visibility.
- Split analysis: search and selection are entry mechanisms to the same focused
  trace result; detail inspection remains 007.
- Dependencies: closed 005 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/QUERIES.md#findcanvastrace`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#interaction-model`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-006-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-006-REFRESH-RECEIPT.json`.
- Done criteria: focus/search actions and missing-hop state implemented;
  `focus` mode added; `static` and `visibility` still pass.
- Failure posture: inferred edge, wrong profile path, lost prior state, or missing
  gap explanation fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode focus`.
- Acceptance evidence: focused node/edge ID sets and missing-hop selectors.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 007 becomes eligible only.
