# TASK-ARE-READINESS-001 — precision completion gate

Status: **PASS — SELECTION ADMITTED**
Opened: `2026-07-23T00:02:39-03:00`
Source context: [`session-evidence/2026-07-22-TASK-ARE-READINESS-001-CONTEXT.md`](session-evidence/2026-07-22-TASK-ARE-READINESS-001-CONTEXT.md)

## Blocker question

Which finite edge-semantics profile completes the three selected first-witness
policies without widening their authority?

## Options

### A — complete the selected typed fail-closed profile (recommended)

- Precedence uses only explicit acyclic catalog edges; no specificity, order,
  or consensus precedence is inferred. Unresolved conflict or a precedence
  cycle returns `EscalateOwner`.
- A fresh catalog is usable only when status is active, revocation is absent,
  and `as_of < expires_at` when expiry exists. Equality is expired. Malformed
  time is `InvalidInput`; unresolved/stale authority or catalog posture is
  `EscalateOwner`; missing mandatory evidence remains
  `Deferred.Insufficient`.
- Every required challenge lane must carry a frozen `deadline_at` and positive
  `attempt_limit`; missing/invalid values are `InvalidInput`. An unresolved lane
  at `as_of >= deadline_at` or `attempt_count >= attempt_limit` returns
  `Deferred.Insufficient`.
- The only test target is
  `test://semantic-judgment-evaluator/effect-log`. Exact `pass` produces one
  marker; `flag`, `block`, `defer`, missing data, or digest mismatch produces
  zero; identical redelivery remains one total; changed content under the same
  key produces `IdempotencyConflict` and zero new markers.

Short term: completes deterministic fixtures with moderate rule-table work.
Long term: preserves distinct repair routes and auditable boundaries. Risk is
low; maintenance requires keeping explicit policy tables versioned.

### B — escalate every ambiguous edge state

Unknown/stale time, precedence ambiguity, missing challenge limits, and timeout
all return `EscalateOwner`; the exact test target and zero/one matrix remain as
in A.

Short term: fewer reducer branches. Long term: high human review volume and
less distinction between malformed inputs, missing evidence, and governance
ambiguity. Safest when human review capacity is intentionally abundant.

### C — defer policy completion

Make no policy changes and keep `G-ARE-POLICY` blocked.

Short term: zero mutation risk. Long term: `SWU-ARE-001` cannot begin and the
work-pack remains at pre-L0. Choose when the owner wants a separate policy
design cycle.

### Explain / more context

Non-committal. Expand the exact-boundary examples and consequences, then
re-present A–C. It never counts as consent.

## Current result

- **Selected:** A — complete the selected typed fail-closed profile.
- **Source:** explicit user selection `A` in the active Task Session.
- **Rationale:** the user selected the recommended completion profile; no
  additional rationale was asserted.
- **Recorded:** `2026-07-23T00:09:18-03:00`.
- Decisions resolved: 1.
- Blockers remaining: 0 policy choices; boundary validation remains required.
- Result: **PASS** for decision completion.
- Next step: amend and boundary-review the three owner records.
