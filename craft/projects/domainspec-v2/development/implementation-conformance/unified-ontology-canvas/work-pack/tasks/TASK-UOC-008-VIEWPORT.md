# TASK-UOC-008 — Viewport Transform

- SWU: `SWU-UOC-008`
- Primary behavior: bounded pan, zoom, fit-all, fit-selection, and reset.
- Independent acceptance: transform remains finite/bounded; reset deterministic;
  fit-selection differs from fit-all; selection survives; page scrolling is not
  captured outside active canvas intent.
- Split analysis: operations are one reversible transform state contract;
  navigator representation remains 009.
- Dependencies: closed 007 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  symbols `state.gesture`, `state.transform`, `applyTransform`, `fitGraph`,
  `focusNode`, and `zoomBy`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/STATES.md#canvasinteractionlifecycle`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-008-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-008-REFRESH-RECEIPT.json`.
- Done criteria: named transform reducer and controls; `viewport` mode; prior
  modes pass.
- Failure posture: NaN/unbounded transform, lost selection, indistinguishable fit,
  or page-scroll trap fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode viewport`.
- Acceptance evidence: transform values, selection ID, page scroll assertions.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 009 becomes eligible only.
