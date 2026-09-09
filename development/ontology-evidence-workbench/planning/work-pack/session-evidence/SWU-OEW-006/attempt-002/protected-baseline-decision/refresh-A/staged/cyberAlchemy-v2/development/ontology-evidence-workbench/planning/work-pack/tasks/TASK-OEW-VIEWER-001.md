# TASK-OEW-VIEWER-001 — Native Viewer and Local Boundary Proof

Layer/wave: L0 / W0
Dependencies: SWU-OEW-004 and 005

## Implementation Detail

Launch the pinned unmodified viewer against a staging directory containing only
the admitted `presentation-graph.json`. Bind loopback, require a one-time token,
and verify the Poker graph loads. Wrap launch only to bind exact artifact/run
digests and enforce allowlisted data roots; do not patch UI in L0.

## Smallest Working Units

### SWU-OEW-006 — Serve and Explore the Poker Adapter Run

- Primary behavior: serve one verified adapter run through the native pinned
  viewer inside the declared local/read-only boundary.
- Dependencies: 004, 005.
- Target inventory:
  - `.../package.json`
  - `.../scripts/serve-native-viewer.mjs`
  - `.../test/native-viewer-boundary.test.mjs`
  - `.../test/native-viewer-poker.test.mjs`
  - `.../generated/runs/SWU-OEW-006/native-viewer-receipt.json`
- Algorithm: verify adapter/upstream receipts → stage graph symlink/copy inside
  contained temp root → start loopback token server → probe endpoints/view →
  assert Poker IDs/edges → terminate → write receipt.
- Done: tokenized GET/HEAD and Poker smoke pass; POST, missing token, traversal,
  symlink escape, non-loopback, outbound request, and unverified run fail.
- Validation: `npm run test:native-viewer`.
- Expected handle: `oew-native-viewer-poker/v1`.
- Execution owner: Task Session local fallback.
- Split analysis: local serving boundary and native-viewer Poker load form the
  one L0 integration decision. Custom trust UI has separate semantic/UI
  falsifiers and starts at 007.
- Closeout: shared contract; resumed-attempt receipt
  `session-evidence/SWU-OEW-006/attempt-003/receipt.json`. Attempt 003 makes no
  viewer implementation mutation: it takes a fresh source-only protected
  snapshot, reruns the already materialized native-viewer validation, and
  requires an exactly equal after snapshot. The original
  `session-evidence/SWU-OEW-006/receipt.json` remains the terminal historical
  validation-entrypoint block; attempt 002 remains the technically passing
  implementation result that triggered
  `DG-OEW-006-PROTECTED-BASELINE`.
- Handoff: close G-OEW-L0 only; do not select L1.

The user selected Decision Gate option A on 2026-07-27. `package.json` is now
an explicit fifth target so the acceptance-critical
`npm run test:native-viewer` entrypoint can be added without exceeding scope.
The user then selected protected-baseline option A. Its bounded Invoke Refresh
defines a deterministic source/evidence-only proof contract. VCS metadata,
dependency trees, caches, and runtime residue are excluded; ordinary tracked
or untracked source/evidence remains protected.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
