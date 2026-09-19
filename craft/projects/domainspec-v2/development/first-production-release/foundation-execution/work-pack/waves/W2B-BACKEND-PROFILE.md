---
wave: W2B
owner_node: FPR-02B
layer: L1
status: decision-in-progress
---

# W2B: Backend First-Release Profile

## Decision

After this lane, we know whether one exact backend profile and Body War pilot
boundary can serve as the nonempty first-release denominator.

## Order

1. `SWU-FPR02-001` — finish the four remaining backend/profile/pilot decisions.
2. `SWU-FPR02-002` — emit machine contracts and a stable backend profile digest.
3. `SWU-FPR02-003` — kill the fail-closed backend negative matrix.

## Entry and exit

- Entry: FPR-01 ratification and resolved lane-separation decision.
- Exit: one validator consumes every declared backend/pilot artifact, two runs
  yield the same digest, and every declared negative fails distinctly.

## Independence

`FPR-02U` completion is not an entry, exit, validation, or promotion condition.
The lane rejects UI IDs because they are outside its profile, not because the UI
lane is incomplete.
