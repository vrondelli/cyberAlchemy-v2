# Test-only exact-effect policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D3 selection in
  [`ENGINE-CLOSURE-GATE.md`](../ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** effective; owner/boundary review passed
- **Effective time:** `2026-07-22T19:42:02-03:00`
- **Selector:** the L0 `SWU-ARE-001` effect-boundary test double only
- **Revision route:** reopen D3 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `DEC-ARE-G6-SCHEMA-SELECTION`, `G-ARE-POLICY`,
  `BLK-ARE-EFFECT-001`
- **Boundary review:**
  [`TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md`](session-evidence/TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md)

## Fixed envelope

- **Action:** `record_test_recommendation`
- **Target:** `test://semantic-judgment-evaluator/effect-log`
- **Scope:** one run ID, reasoning-receipt digest, authority-snapshot digest,
  and fixed-envelope digest
- **Authority basis:** a one-run exact-effect `pass` bound to identical digests
- **Risk:** synthetic test marker only; no external effect
- **Rollback/compensation:** none; fixture reset occurs outside engine semantics

## Rules

1. Only `RecommendedUnderSnapshot`, a persisted receipt, and an exact matching
   gate `pass` may call the test double.
2. Non-pass, missing, or mismatched data produces zero calls.
3. The idempotency key is SHA-256 over canonical JSON containing action,
   target, run ID, receipt digest, authority digest, and envelope digest.
4. Identical redelivery returns the prior logical result without a second
   marker.
5. The same key with changed content returns `IdempotencyConflict` and creates
   no marker.
6. This policy authorizes no real effect adapter.

## Examples

- An exact positive result plus gate pass appends one marker.
- Gate verdicts `flag`, `block`, and `defer` each produce zero markers.
- Missing receipt data, a subject mismatch, or any digest mismatch produces
  zero markers.
- Repeating identical input leaves the marker count at one.
- Changing the receipt while reusing the key returns an idempotency conflict.

## G6 boundary

The synthetic marker does not promote the intent schema, evaluator, or engine.
