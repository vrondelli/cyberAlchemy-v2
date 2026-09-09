# Decision Gate — G-OEW-L1-SPLIT-BUILD-SELECTION

Status: **PENDING**

## Question

Should the new eleven-unit split-build L1 frontier execute one Task Session at
a time until its first blocker, or should OEW remain at the verified L0
prototype?

## Evidence

- Build-order option A is resolved and the staged graph passes dependency and
  target-ownership checks.
- `SWU-OEW-006P` is the only dependency-ready candidate.
- Historical 007 and 006B selections do not bind this graph.
- No L1 implementation mutation has occurred.

## Options

### A — Select the repaired L1 frontier

Select `SWU-OEW-006P` first and authorize the finite frontier
`006P → 007–013 → 013B → 014 → 014V`, one fresh Task Session per selector,
stopping at the first blocker or after 014V.

### D — Remain at L0

Keep the verified native-viewer prototype and make no L1 implementation
mutation.

## Recommendation

Option A. The split now has owner-complete inputs and places immutable final
build evidence after all feature bytes.

## Boundaries

This gate selects a bounded L1 execution series only. Every selector still
requires Task Session preflight, exact target enforcement, validation, and
owner closeout. L2 source access, authority, publication, deployment, release,
and production remain unauthorized.
