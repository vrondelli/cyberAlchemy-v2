# Shared Context

The controlling context is [PLANNING-CONTEXT.md](../../PLANNING-CONTEXT.md).

## Shared Invariants

- Craft owns continuation; this work-pack is an executable planning projection.
- Existing SGRM and FPR identities own lifecycle state.
- Historical proof may expire without becoming false.
- Canonical sources precede generated projections.
- `B`, authoritative `Spec`, projected `Sg`, local `G`, and UI graph are non-collapsible planes.
- Positive validation without a declared nonempty denominator is insufficient.
- Production remains unauthorized.
- `FPR-02B` and `FPR-02U` share FPR-01 inputs but have no cross-lane
  completion dependency.
- The backend release profile excludes UI; the UI development profile remains
  required-by-design and independently executable.

## Runtime Selection Rule

Task Session selects only the files and selectors named by the active SWU. It may expand once for a missing direct dependency, but must record the new selector and stop if the expansion changes authority or acceptance criteria.

## Read/Write Boundary

- Read: selected private DomainSpec v2 evidence and authority sources.
- Write: only the active SWU scope.
- Never write: public `arcanum/`, prior immutable receipts, frozen SGRM-001
  manifest, a predecessor's authority artifacts, or the sibling lane's state
  from a lane-local Task Session.
