# T3 — Falsify superficial repairs and false-success evidence

Layer/slice: L2/S2. DAG: G, H. Complexity: high.

## Objective

Calibrate the assurance mechanism with isolated controls spanning subject code,
oracle, denominator, evidence and execution behavior.

## SWUs and algorithm

- SWU-T3-01: define each mutation, expected affected obligation and expected
  non-pass; freeze source patches/adapters and the control manifest.
- SWU-T3-02: execute controls in fresh isolated attempts, independently derive
  outcomes from raw evidence, join them with T2, and explain the comparison.

For each control: copy or adapt the frozen candidate; apply exactly one declared
change; verify its digest; run only the minimum evidence needed to expose it;
classify without trusting stored pass fields; retain raw output; compare actual
with expected. A surviving control blocks promotion and is investigated rather
than removed.

Minimum controls: destination-tail ordering, absent placement metadata, valid
merge rejection, weakened order/member/success oracle, wrong assertion,
missing/duplicate/cross-run case, stale/tampered/contradictory evidence, launch
failure, timeout after pipe EOF, overflow, interruption and recovery.

Write scope: mutation definitions and new isolated evidence paths only. No
accepted candidate, baseline freeze or previous attempt mutation.

Done evidence: every frozen control has a typed outcome; expected controls are
non-pass; disagreements and residual gaps appear in the L2 assessment.

## Open Questions

Owned by [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).

