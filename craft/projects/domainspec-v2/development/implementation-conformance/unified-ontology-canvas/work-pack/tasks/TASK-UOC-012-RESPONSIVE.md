# TASK-UOC-012 — Responsive And Zoom Reflow

- SWU: `SWU-UOC-012`
- Primary behavior: preserve information/actions/order at mobile widths and
  200%/400% browser zoom through focus view and navigator.
- Independent acceptance: no critical control/popup clipping; every object remains
  reachable; band meaning/order survives; mobile does not claim all labels are
  simultaneously readable.
- Split analysis: viewport width and browser zoom are two inputs to one reflow
  contract; motion and color meaning remain 013/014.
- Dependencies: closed 011 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#responsive-semantics`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-012-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-012-REFRESH-RECEIPT.json`.
- Done criteria: media/reflow rules and `responsive` mode at named viewport/zoom
  cases; earlier modes pass.
- Failure posture: clipped critical action, unreachable object, changed semantic
  order, or focus loss fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode responsive`.
- Acceptance evidence: viewport/zoom matrix, bounding boxes, reachable ID count.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 013 becomes eligible only.
