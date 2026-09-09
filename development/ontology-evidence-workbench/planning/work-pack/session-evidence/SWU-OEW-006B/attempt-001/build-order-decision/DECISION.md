# Decision Gate — DG-OEW-006B-BUILD-ORDER

Status: **RESOLVED — A**

## Question

How should the Plan repair the L1 source-to-build ordering so an immutable build
handle actually binds the feature overlay that browser acceptance will run?

## Why This Blocks

`SWU-OEW-006B` requires an overlay manifest and patch as inputs, but both are
absent and owned by dependent successor `SWU-OEW-007`. Even if a placeholder
overlay were invented, 007–013 would mutate overlay source after the immutable
006B build handle was emitted. No later SWU rebuilds and independently verifies
those final bytes before 014.

No implementation file was mutated.

## Options

### A — Split provisioning from final build

Make 006B a clean toolchain/materializer bootstrap that proves exact Node,
pnpm, lock, workroot, and patch mechanics without claiming the final feature
build. Add a post-013 build-and-verifier SWU whose immutable handle is consumed
by 014 and 014V.

### B — Move the complete build after feature source

Let 007 own the source/validation registry seam, keep 008–013 as feature
mutations, and move the complete clean materialization plus independent
verification unit immediately before 014.

### C — Rebuild and independently verify after every feature SWU

Treat the build handle as a versioned chain where 007–013 each produce and
verify a successor handle. This gives the strongest incremental evidence but
adds substantial runtime and receipt cost.

### D — Stop at L0

Retain the verified native-viewer prototype and make no L1 implementation
mutation.

## Recommendation

Option A. It preserves early proof that the exact isolated toolchain works
while placing final immutable build evidence after the feature bytes exist.

## Decision

Selected: **A — Split provisioning from final build**

Selection source: direct user response `A` on 2026-07-27.

Invoke Refresh owns the exact replacement graph. The consumed
`SWU-OEW-006B` selector remains historical; the refresh must use new selectors
for the provisioner and final build/verifier, invalidate the active L1
selection, and route the repaired graph through a fresh exact-unit selection.

## Boundaries

Any A/B/C choice changes graph ownership and acceptance dependencies. It
requires Invoke Refresh, Plan-owner approval, a fresh selection, and a new
Task Session chain. L2, authority, publication, release, and production remain
unauthorized.
