# TASK-UOC-009 — Structured Navigator Equivalence

- SWU: `SWU-UOC-009`
- Primary behavior: Explore exposes a structured list/tree representation of the
  same graph objects and relationships.
- Independent acceptance: navigator ID set equals graph ID set; every row exposes
  family, statuses, incoming/outgoing typed relations, and selection; search can
  reach every object without SVG focus.
- Split analysis: equivalence/search/relation text together form one alternate
  representation; roving SVG focus remains 010.
- Dependencies: closed 008 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#accessibility-contract`;
  planned `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`
  `UnifiedCanvasGraph.indexes` (`by_id`, `by_family`, `incident_edge`,
  `profile`, and `trace`).
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-009-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-009-REFRESH-RECEIPT.json`.
- Done criteria: equivalent structured representation and `navigator` mode;
  earlier modes pass.
- Failure posture: missing/extra ID, missing relation direction/status, or
  unreachable object fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode navigator`.
- Acceptance evidence: compared ID sets and representative relation text.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 010 becomes eligible only.
