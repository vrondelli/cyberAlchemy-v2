# Artifact durability and admission policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D4 selection in
  [`ENGINE-CLOSURE-GATE.md`](ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** selected; evidence pending
- **Effective time:** `2026-07-22T19:45:01-03:00`
- **Selector:** private candidate reasoning receipts and journals
- **Revision route:** reopen D4 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `G-ARE-L2`, `GAP-ARE-ART-001`, `SWU-ARE-006`

## Rules

1. Records are immutable, content-addressed, private, and local.
2. Publish through temp-write, byte sync, atomic publish, parent sync, and
   digest verification.
3. Quarantine partial, corrupt, digest-mismatched, and unknown-version objects.
4. Recover only complete immutable records whose bytes match their digest.
5. Persistence grants no canonical, public, semantic, or authority status.
6. Retain admitted gate evidence through review; deletion requires an owner
   decision and deletion receipt.

## Examples

- A crash before atomic publish leaves a quarantined partial object.
- A byte mutation after publish causes digest failure and quarantine.
- A valid local receipt remains candidate evidence, not canonical truth.
