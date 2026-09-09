# TASK-OEW-UPSTREAM-001 — Immutable Understand-Anything Build

Layer/wave: L0 / W0
Dependencies: SWU-OEW-004
External action: network fetch/build; requires Task Session confirmation of the
exact repository and commit.

## Implementation Detail

Create a lock manifest from `design/UPSTREAM-BASELINE.md`. The preparation
script must fetch into an OEW-local generated cache, checkout the exact commit,
verify repository URL, commit, MIT license digest, and inspected file digests,
install from the upstream lockfile, build the unmodified viewer, and record the
artifact digest/toolchain. No floating branch/tag/latest is allowed.

## Smallest Working Units

### SWU-OEW-005 — Build the Unmodified Pinned Viewer

- Primary behavior: turn the immutable upstream pin into a verified local
  viewer artifact.
- Dependencies: 004.
- Target inventory:
  - `.../package.json`
  - `.../contracts/upstream-lock.schema.json`
  - `.../upstream/UPSTREAM.lock.json`
  - `.../upstream/LICENSE`
  - `.../scripts/prepare-upstream.mjs`
  - `.../test/upstream-lock.test.mjs`
  - `.../generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/source.tar.gz`
  - `.../generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/viewer-dist.tar.gz`
  - `.../generated/upstream/2cda14e89535049e49120198886bc0b82e9e630f/build-receipt.json`
- Done: exact pin/license/files verify, upstream tests/build pass, viewer
  artifact digest is recorded; wrong/floating pin fails.
- Validation: `npm run verify:upstream`.
- Expected handle: `oew-upstream-viewer-build/v1`.
- Execution owner: Task Session manual/network-aware local fallback.
- Split analysis: lock verification and build jointly prove one reproducible
  upstream artifact. Serving and Poker behavior are independent in 006.
- Closeout: shared contract; resumed-attempt receipt
  `session-evidence/SWU-OEW-005/attempt-002/receipt.json`. The original
  `session-evidence/SWU-OEW-005/receipt.json` remains the terminal historical
  block that triggered Decision Gate `DG-OEW-005-UPSTREAM-OUTPUT-SCOPE`.
- Handoff: viewer artifact path/digest; preserve upstream source cache as
  generated evidence, never authority.

The user selected Decision Gate option A on 2026-07-27. The source and viewer
archives are deterministic retained evidence targets; clone, install, and
intermediate build directories remain temporary residue and must be removed.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
