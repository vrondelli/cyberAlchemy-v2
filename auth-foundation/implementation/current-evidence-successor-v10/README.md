# Auth v10 compiler-file-input candidate

The v10 verifier runs 15 fresh, isolated Cargo cells: normal builds and
default-feature all-target test builds for seven selected Auth roots, plus an
API trace-feature all-target test build. It pairs each current-invocation local
compiler artifact with its rustc dep-info file and checks listed local paths
and their post-build hashes against the reviewed v9 86-path source inventory.
It does not prove the exact bytes rustc read. It rejects changed,
missing, escaped, symlinked, ambiguous, or unreviewed inputs.

Run hostile parser controls with
`python3 auth-foundation/implementation/scripts/test-current-evidence-successor-v10.py`.
Probe one cell with `python3 .../validate-current-evidence-successor-v10.py
--probe-root authorization-ready-decision --probe-mode normal`. A complete
candidate is printed by `--print-expected`; the normal invocation compares
that replay with `binding.json`. The matrix is deliberately expensive and may
use `/dev/shm` for sequential temporary targets when enough space is free.

This is candidate technical evidence, not a runtime guarantee. The bounded
claim and remaining omissions are in [PLAN.md](PLAN.md). The v10 binding is
not selected until complete replay and independent review pass.

## Open Questions

- Will every fresh cell replay against the unchanged v9 inventory?
- What separate evidence closes non-file build inputs and all native
  decision-entrypoint no-call behavior?
