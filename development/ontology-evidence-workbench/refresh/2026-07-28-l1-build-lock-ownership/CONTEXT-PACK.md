# Context Pack — OEW 013B Build-Lock Ownership Refresh

- Mode: Invoke Refresh / strict / apply-approved
- Activation: direct user
- Scope: one private 013B input-ownership repair plus retry bookkeeping
- Files selected: 9
- Obligation coverage: 6 of 6
- Implementation execution: excluded

## Intent

Resolve the zero-mutation `SWU-OEW-013B` preflight blocker without changing the
feature source, package registry, browser work, or authorized selector series.
The refresh must admit one exact final-build lock, make the frontier validator
suffix-aware, revalidate an unselected current frontier, and then reselect 013B
for a fresh Task Session preflight.

## Boundaries

- Attempt 001 and its closeout remain immutable historical evidence.
- The only new implementation path is `upstream/L1-BUILD.lock.json`.
- `package.json`, upstream archives, overlay/source bytes, 014/014V
  implementation, L2, Arcanum, authority, publication, release, and production
  remain outside mutation scope.
- Increasing the session budget from four to five accounts for the blocked
  attempt; it does not add a selector or expand the approved series.

## Result

Strict coverage passes. The refresh may author and apply exact staged bytes,
but it cannot claim a final build, verifier pass, browser acceptance, or
working prototype.
