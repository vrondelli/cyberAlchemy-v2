# T2 — Freeze and execute the complete CRABS attempt

Layer/slice: L2/S2. DAG: F. Complexity: high.

## Objective

Produce one immutable, bounded attempt for the repaired mechanism and actual
CRABS commit selected by T0.

## SWUs and ordered procedure

- SWU-T2-01: bind source, tools, command templates, property, case denominator,
  CBMC bounds and candidate digest; verify drift and create a fresh attempt.
- SWU-T2-02: generate cases; compile via repository `tools/toolchain/run`;
  execute exactly 48 native and 48 sanitizer cases; execute both CBMC
  representatives; normalize from raw evidence; finalize once.

No network occurs during providers. Each row retains exact command, tool/input
identity, timing, output hashes, termination, observations and typed outcome.

Failure modes: unavailable provider, tool epoch mismatch, timeout, overflow,
missing/duplicate case, sanitizer diagnostic, implementation invariant failure,
counterexample, interruption or stale source. Each is a valid recorded outcome
and blocks a success claim; no automatic retry overwrites it.

Write scope: one new attempt directory and append-only run index selected by the
execution authorization. Frozen candidate and all earlier evidence are read-only.

Done evidence: denominator audit proves 48/48/2 terminal records, raw hashes and
normalization recompute, resource limits are recorded, and the report states the
actual subject result without expanding the claim.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).

