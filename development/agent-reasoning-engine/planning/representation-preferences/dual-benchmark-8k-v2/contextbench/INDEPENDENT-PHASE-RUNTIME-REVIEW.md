# Phase runtime initial review

Not approved yet. All six supplied tests pass; additional synthetic probes expose accounting gaps.

- An unreserved unknown receipt gets zero conservative reservation. Two unknown receipts under one 1,100-token pending reservation retain only 1,100. Reserve unmatched possible attempts separately.
- A non-dispatched receipt reporting 30 input + 5 output tokens loses all known cost. Preserve contradictory positive usage and uncertainty.
- Receipt-prefix corruption throws without latching failure; restoring bytes can permit later reserve. Corruption must stop this arm permanently and preserve prior accounting/evidence.

Fixed phase sums, cumulative admission and global receipt indices otherwise match the candidate contract. Phase completion remains an explicit caller assertion; transport integration and resume are not claimed. No provider calls or implementation edits occurred.

## Open Questions

INDEPENDENT-PHASE-RUNTIME.md owns these corrections and later transport/evidence integration. Add regressions for the reported cases before approval.
