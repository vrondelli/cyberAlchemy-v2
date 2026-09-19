# TASK-UOC-VERIFY — Product-Read-Only Recomposition Verification

- Mutation SWU: exempt closure task.
- Dependencies: closed 001-015 and Refresh receipts.
- Product write scope: none; all ontology-experiment files are read-only.
- Task Session receipt write scope:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/TASK-UOC-VERIFY-RESULT.md`.
- Lifecycle receipt:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/TASK-UOC-VERIFY-REFRESH-RECEIPT.json`.
- Source anchors:
  exact result paths `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-001-RESULT.md`
  through `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-015-RESULT.md`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/shared/closeout-inventory.md`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#source-contracts-and-evidence-ceiling`.
- Done criteria: rediscover and record active Node/Playwright/browser paths;
  run exact commands below; record scoped diff and evidence ceiling; stop any
  task-local server.
- Failure posture: failure reopens the narrowest owning SWU; verifier makes no
  opportunistic product fix.
- Exact validation:
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs --mode projection`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode nodes`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-layout.mjs --mode edges`;
  `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode journey`.
- Acceptance evidence: exact commands/exits/stdout, environment paths/versions,
  source/product digests, request/error audit, server cleanup, scoped diff, claim
  ceiling, blockers/residue.
- Execution owner: Task Session verification owner.
- Terminal handoff: Invoke Refresh writes the exact lifecycle receipt and updates
  the planning inventory; no successor, release, or promotion.
