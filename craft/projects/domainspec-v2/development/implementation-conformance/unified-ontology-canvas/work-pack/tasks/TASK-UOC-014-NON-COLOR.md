# TASK-UOC-014 — Non-Color Meaning

- SWU: `SWU-UOC-014`
- Primary behavior: every status and relation family has text plus shape/icon/dash
  or other non-color distinction with acceptable focus visibility.
- Independent acceptance: automated DOM/CSS assertions find required names and
  patterns for maturity, coverage, candidate status, evaluation, semantic versus
  structural edges, focus, and hidden/dim states.
- Split analysis: all cases enforce one “color is not the sole carrier” rule;
  recomposed journey remains 015.
- Dependencies: closed 013 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#accessibility-contract`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  selectors `.legend`, `.legend-item`, `.edge`, `.edge-label`, `.graph-node`,
  and `[data-status]`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-014-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-014-REFRESH-RECEIPT.json`.
- Done criteria: non-color tokens/labels and exact mode; earlier modes pass.
- Failure posture: any acceptance-critical state/relation distinguishable only by
  color or invisible focus fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode non-color`.
- Acceptance evidence: semantic label/pattern matrix and computed-style checks.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 015 becomes eligible only.
