# TASK-OEW-HARDEN-001 — Maintenance, Scale, and Packaging

Layer/wave: L3 / W3
Dependencies: G-OEW-L1; code context optional

## Implementation Detail

Preserve all earlier contracts while proving upstream update mechanics,
measured performance, and reproducible local packaging. No public release or
production deployment is included.

## Smallest Working Units

### SWU-OEW-018 — Verify an Upstream Update Candidate

- Primary behavior: compare a proposed immutable upstream pin to the accepted
  pin and prove or reject overlay compatibility without changing the active pin.
- Dependencies: 014.
- Target inventory:
  - `.../scripts/check-upstream-update.mjs`
  - `.../test/upstream-update.test.mjs`
  - `.../generated/upstream/update-candidate/compatibility-receipt.json`
- Algorithm: fetch candidate metadata → diff locked contracts/dependencies →
  apply overlay in disposable cache → build/test → record compatible/block;
  never update active lock automatically.
- Validation: `npm run check:upstream-update`.
- Expected handle: `oew-upstream-compatibility/v1`.
- Split analysis: update compatibility is independent of performance/package.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-018/receipt.json`.

### SWU-OEW-019 — Measure and Bound Large-Graph Behavior

- Primary behavior: establish measured graph/load/search/layout thresholds and
  only then apply bounded optimizations.
- Dependencies: 014.
- Target inventory:
  - `.../fixtures/large-graph/manifest.json`
  - `.../scripts/benchmark-workbench.mjs`
  - `.../test/performance-budget.test.mjs`
  - `.../generated/runs/SWU-OEW-019/performance-receipt.json`
- Done: declared hardware/browser/data-size and p50/p95 load/search/layout/memory
  results; regressions fail; any optimization retains parity/accessibility.
- Validation: `npm run benchmark:workbench`.
- Expected handle: `oew-performance-budget/v1`.
- Split analysis: measured performance has its own thresholds and does not own
  packaging.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-019/receipt.json`.

### SWU-OEW-020 — Build a Reproducible Local Viewer Package

- Primary behavior: package pinned viewer, overlay, adapter CLI, license, and
  exact manifests into one local artifact.
- Dependencies: 018, 019.
- Target inventory:
  - `.../scripts/package-viewer.mjs`
  - `.../packaging/README.md`
  - `.../packaging/MANIFEST.json`
  - `.../generated/packages/ontology-evidence-workbench.tgz`
  - `.../generated/packages/package-receipt.json`
- Done: clean unpack/run Poker smoke succeeds with no LLM/API key/outbound
  runtime; package digest/inventory/license/source pin recorded.
- Validation: `npm run verify:package`.
- Expected handle: `oew-local-package/v1`.
- Split analysis: packaging is one distribution/reproduction decision and
  cannot claim human UX, release, or production.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-020/receipt.json`.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
