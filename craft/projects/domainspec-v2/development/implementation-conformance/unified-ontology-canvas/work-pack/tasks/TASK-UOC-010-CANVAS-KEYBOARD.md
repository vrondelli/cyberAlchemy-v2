# TASK-UOC-010 — Canvas Keyboard Model

- SWU: `SWU-UOC-010`
- Primary behavior: one roving canvas focus target supports deterministic spatial
  neighbor and typed-relation traversal without node-per-tab flooding.
- Independent acceptance: one tab entry, arrow spatial navigation, documented
  modified relation traversal, visible focus, selection parity, and escape/clear;
  only after pass may application semantics be exposed.
- Split analysis: spatial and relation commands are the complete custom keyboard
  model; popup focus composition remains 011.
- Dependencies: closed 009 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#accessibility-contract`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/tasks/TASK-UOC-009-NAVIGATOR.md#task-uoc-009--structured-navigator-equivalence`
  accepted navigator-to-graph ID-set contract.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-010-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-010-REFRESH-RECEIPT.json`.
- Done criteria: roving model/help copy/accessible names and
  `canvas-keyboard` mode; earlier modes pass.
- Failure posture: excessive tab stops, nondeterministic target, focus loss, or
  inaccessible relation direction fails; keep `role="application"` absent.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode canvas-keyboard`.
- Acceptance evidence: active-element/key/selected-ID trace and tab-stop count.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 011 becomes eligible only.
