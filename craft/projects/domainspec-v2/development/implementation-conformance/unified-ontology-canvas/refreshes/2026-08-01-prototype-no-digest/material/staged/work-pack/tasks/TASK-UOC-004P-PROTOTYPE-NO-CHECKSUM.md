# TASK-UOC-004P — Browser-Executable Prototype Without Checksums

- SWU: `SWU-UOC-004P`
- Primary behavior: produce one browser-executable local static ontology canvas
  without Node-only modules or generated checksum fields.
- Independent acceptance: projection, node layout, edge routing, and static
  rendering preserve their structural behavior; the model and layout expose
  fixed prototype IDs plus `verification_status: "prototype-unverified"`; the
  browser receipt contains no generated digest keys.
- Split analysis: the observed blocker crosses the model, layout, renderer, and
  their validators. Separating those edits would leave no independently
  executable browser witness. Interaction behavior remains in 005 and later.
- Dependencies: closed 003 receipt; historical 004 BLOCK result; direct-user
  Invoke Refresh selecting 004P.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/SPEC.md#local-prototype-evidence-boundary`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#unified-graph-contract`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-004-RESULT.md#blocker-and-smallest-unblock-route`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`.
- Task Session receipt write scope:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-004P-RESULT.md`.
- Lifecycle receipt:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-004P-REFRESH-RECEIPT.json`.
- Done criteria: remove `node:crypto`, `createHash`, generated
  `source_digests`, `graph_digest`, `node_layout_digest`, and `layout_digest`;
  retain source-provided raw metadata; use fixed `unified-canvas:prototype` and
  `unified-layout:prototype`; prove repeated structural equality; emit a static
  browser receipt with 95 unique nodes, 147 unique edges, five bands, no
  external requests/errors, and successful server cleanup.
- Failure posture: any Node-only import or generated digest symbol, structural
  replay drift, missing/duplicate identity, source mutation, browser/page/console
  error, external request, failed response, or server cleanup failure blocks.
- Exact validation:
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode nodes`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode edges`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode static`;
  scoped forbidden-symbol and whitespace checks.
- Acceptance evidence: commands/exits, structural replay equality, counts and
  identity uniqueness, fixed IDs/status, absent digest keys/imports, Playwright
  and Chromium binding, request/error audit, and server cleanup.
- Execution owner: Task Session local implementation.
- Handoff: stop after required Invoke Refresh; 005 becomes eligible only.
