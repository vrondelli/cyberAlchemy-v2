# Challenge closure policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D2 selection in
  [`ENGINE-CLOSURE-GATE.md`](../ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** effective; owner/boundary review passed
- **Effective time:** `2026-07-22T18:56:19-03:00`
- **Selector:** every required challenge lane and every admitted late material
  defeater for `semantic-judgment-evaluator@1`
- **Revision route:** reopen D2 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `DEC-ARE-G6-SCHEMA-SELECTION`, `G-ARE-POLICY`,
  `BLK-ARE-CHAL-001`
- **Boundary review:**
  [`TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md`](session-evidence/TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md)

## Rules

1. The frozen plan supplies `deadline_at` and a positive integer
   `attempt_limit` for each required challenge lane. The evaluator uses the
   frozen `as_of` value and recorded attempt count; it does not read a mutable
   clock.
2. A missing, malformed, or non-positive required limit returns `InvalidInput`.
3. An unresolved required lane at `as_of >= deadline_at` or
   `attempt_count >= attempt_limit` returns `Deferred.Insufficient` with zero
   effect calls. Equality is terminal timeout or exhaustion.
4. Required-lane failure returns `Deferred.Insufficient` with zero effect
   calls.
5. A material dispute unresolved by frozen deterministic policy returns
   `EscalateOwner`.
6. An admitted material defeater before the exact-effect gate cancels the
   pending recommendation and requires reevaluation.
7. A defeater admitted after an effect attempt produces `Invalidated` under a
   new current-revalidation run and opens an incident owner route.
8. Historical receipts remain immutable, and late defeat never triggers
   automatic compensation.

## Examples

- A required fraud-check lane that times out makes a refund evaluation
  `Deferred.Insufficient`.
- A required lane without `deadline_at`, or with `attempt_limit: 0`, returns
  `InvalidInput`.
- A lane still unresolved exactly at its deadline or attempt ceiling returns
  `Deferred.Insufficient`.
- Conflicting admissible fraud records that have no frozen resolution rule
  return `EscalateOwner`.
- A fraud hold discovered after a test marker produces a new invalidation and
  incident record; it does not erase the earlier receipt.

## G6 boundary

This policy changes no intent-schema admission and supplies no anti-bias or
general reasoning-engine efficacy claim.
