# TASK-UOC-011 — Popover Focus And Inertness

- SWU: `SWU-UOC-011`
- Primary behavior: Explore, Details, and Help share correct focus entry, trap or
  nonmodal behavior, hidden-surface inertness, escape, and opener restoration.
- Independent acceptance: each surface has one explicit modality; hidden controls
  leave tab order; focus restores exact opener/graph object.
- Split analysis: all three surfaces share one shell-level focus/inert contract;
  responsive geometry remains 012.
- Dependencies: closed 010 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#surfaces`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  selectors `#navigation-drawer`, `#inspector`, `#help-modal`, and symbols
  `setNavigationOpen`, `openNavigation`, `openHelp`, `closeHelp`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-011-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-011-REFRESH-RECEIPT.json`.
- Done criteria: focus/inert modality contract implemented; `popovers` mode;
  earlier modes pass.
- Failure posture: hidden focusability, lost opener, unescapable trap, or wrong
  modal semantics fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode popovers`.
- Acceptance evidence: tab sequence and active-element traces for all surfaces.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 012 becomes eligible only.
