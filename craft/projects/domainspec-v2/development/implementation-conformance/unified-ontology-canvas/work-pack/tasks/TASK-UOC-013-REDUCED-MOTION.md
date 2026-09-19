# TASK-UOC-013 — Reduced Motion

- SWU: `SWU-UOC-013`
- Primary behavior: honor reduced-motion preference across focus, transform,
  popup, and semantic-zoom transitions without removing state feedback.
- Independent acceptance: reduced-motion emulation disables nonessential
  transition/animation durations and retains deterministic final states.
- Split analysis: motion policy is independently testable; color/shape meaning is
  separate in 014.
- Dependencies: closed 012 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#accessibility-contract`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  transition declarations for `.nav-drawer`, `.drawer`, `.graph-node .node-rect`,
  and `.toast`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-013-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-013-REFRESH-RECEIPT.json`.
- Done criteria: reduced-motion CSS/behavior and exact mode; earlier modes pass.
- Failure posture: nonessential animation remains or final state differs under
  preference.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode reduced-motion`.
- Acceptance evidence: emulated media state, computed durations, final selectors.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 014 becomes eligible only.
