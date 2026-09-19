# TASK-UOC-007 — Exact Inspection

- SWU: `SWU-UOC-007`
- Primary behavior: inspect one selected node or edge with exact contract,
  provenance, statuses, relation direction, raw data, and claim ceiling.
- Independent acceptance: pointer and programmatic activation resolve the same ID;
  Details shows fixture/evaluation/constraint-origin profile fields; closing
  restores the originating object; no adapter-executed/authority overclaim.
- Split analysis: node/edge cases share one inspector schema and popup; viewport
  behavior remains 008.
- Dependencies: closed 006 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/QUERIES.md#inspectcanvasnode`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#surfaces`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-007-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-007-REFRESH-RECEIPT.json`.
- Done criteria: inspector schema/selectors/focus origin implemented; `inspect`
  mode added; earlier modes pass.
- Failure posture: missing provenance/status, wrong raw record, misleading copy,
  or failed focus restoration fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode inspect`.
- Acceptance evidence: exact inspected IDs/content selectors/active-element trace.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 008 becomes eligible only.
