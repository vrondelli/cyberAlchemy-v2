# TASK-UOC-005 — Visibility Projections

- SWU: `SWU-UOC-005`
- Primary behavior: family, maturity/coverage, profile-emphasis, relation, and
  explicit hide/show filters derive visibility over one unchanged graph.
- Independent acceptance: the explicit prototype graph ID stays constant across every filter;
  hidden versus dimmed is explicit; Python/Rust emphasis cannot activate
  TypeScript fixture/finding paths; clear restores all identities.
- Split analysis: filter kinds share one visibility reducer contract; selection,
  trace calculation, search, and focus emphasis remain 006.
- Dependencies: closed 004P receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/STATES.md#canvasinteractionlifecycle`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#profile-and-fixture-compatibility`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-005-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-005-REFRESH-RECEIPT.json`.
- Done criteria: reducer inputs/outputs named; profile fields rendered/tested;
  `visibility` mode added without weakening `static`.
- Failure posture: graph ID change, provenance activation mismatch, or
  irrecoverable hidden state fails.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode visibility`.
- Acceptance evidence: graph IDs before/after each filter and profile-path audit.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 006 becomes eligible only.
