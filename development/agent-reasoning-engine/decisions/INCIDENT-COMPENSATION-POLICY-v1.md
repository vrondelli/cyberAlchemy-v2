# Incident and compensation policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D5 selection in
  [`ENGINE-CLOSURE-GATE.md`](ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** selected; evidence pending
- **Effective time:** `2026-07-22T19:50:11-03:00`
- **Selector:** persistence failure, ambiguous delivery, late material defeat,
  and compensation requests
- **Revision route:** reopen D5 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `G-ARE-L2`, `BLK-ARE-INCIDENT-001`, `SWU-ARE-007`

## Rules

1. Receipt-persistence failure closes incomplete with zero effect calls.
2. Ambiguous delivery opens an incident and prohibits blind retry.
3. Late material defeat preserves history and creates a new current-state
   `Invalidated` result.
4. Compensation requires new intent, an exact effect envelope, a new owner
   gate, and a new idempotency key.
5. Missing incident ownership returns `EscalateOwner`.
6. No compensation is automatic.

## Examples

- An effect acknowledgement lost after dispatch opens an ambiguous-delivery
  incident; the engine does not resend.
- A late defeater after an effect creates an incident and a separate possible
  compensation request.
- A proposed compensation lacking a new gate performs no effect.
