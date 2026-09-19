---
decision_id: DEC-DSV2-ORODI-OWNER-BINDING-AUTHORITY
status: resolved
decision_class: blocker
target_scope: ORODI-OWNER-BINDING-PACKET-001 Wave-0 coordination authority
source: invoke-plan-20260824T165443Z-orodi-v1
timestamp: 2026-08-24T17:44:31Z
resolved_at: 2026-08-24T17:58:56Z
selected_option_id: ORODI-COORD-INITIATING-OWNER
coordinator: Vlad Rondelli — initiating DomainSpec v2 project owner
---

# ORODI Owner-Binding Coordination Decision

## Decision question

Who should hold packet-level coordination responsibility for Wave 0 while every semantic, profile, evaluator, evidence, infrastructure, deployment, promotion and release field remains separately accepted by its own owner?

This decision does not assign those downstream owner roles. It decides only how `ORODI-OWNER-BINDING-PACKET-001` is assembled, checked for completeness, and presented for field-level acceptance.

## Admissibility

The deterministic prefilter admitted all four real options. The user then selected an action option and supplied the exact coordinator identity and role, so this decision is closed. The standing “Explain / more context” route remained non-committal and did not count as consent.

## Option 1 — Initiating owner coordinates Wave 0 (recommended)

Stable ID: `ORODI-COORD-INITIATING-OWNER`

The current initiating DomainSpec project owner explicitly accepts a limited coordinator role. The coordinator owns packet integrity, field inventory, routing, and completeness only. Each field owner still accepts only its own binding.

- Benefit: smallest coordination overhead and a clear accountable assembler.
- Cost/risk: the coordinator boundary must be enforced so coordination cannot become semantic, profile, deployment, promotion, or release authority.
- Reversibility: reversible before any owner-binding packet is accepted.
- Choose when: the initiating owner is willing to name themselves and accept only this narrow role.
- Downstream: author a field-level owner-binding request; no later wave opens until all required owner receipts exist.

## Option 2 — Distributed field-owner assembly

Stable ID: `ORODI-COORD-DISTRIBUTED-FIELD-OWNERS`

No person holds packet-wide decision authority. A named non-authoritative scribe assembles separately accepted field-owner receipts, and the packet closes only when the complete set is present.

- Benefit: strongest separation of authority and least concentration risk.
- Cost/risk: more coordination, more receipts, and no single owner can resolve incomplete routing.
- Reversibility: reversible before the field-owner assembly contract is accepted.
- Choose when: governance separation is more important than coordination speed.
- Downstream: first name the scribe and every field owner, then obtain one receipt per field before assembly.

## Option 3 — Defer

Stable ID: `ORODI-COORD-DEFER`

Keep the existing Define, Design and non-executing Plan unchanged and leave `BLK-DSV2-ORODI-LIVE-BINDINGS` active.

- Benefit: no new authority or coordination commitment.
- Cost: profile/tool admission and Invoke Refresh cannot start.
- Downstream: none until this decision is reopened.

## Option 4 — Stop

Stable ID: `ORODI-COORD-STOP`

End this continuation after the completed non-executing Plan.

- Benefit: clean terminal state with no further work or authority implication.
- Cost: the operational integration remains a planning model only.
- Downstream: none unless a future owner starts a new continuation.

## Recommendation

Choose Option 1 if the initiating project owner is prepared to state their exact identity and accept the narrow coordinator scope. It is the shortest route to field-level owner binding while preserving all downstream owner gates. Choose Option 2 when the project requires packet-wide authority to remain fully distributed.

## Selection

- Selected option: `ORODI-COORD-INITIATING-OWNER`
- Coordinator: Vlad Rondelli — initiating DomainSpec v2 project owner
- Source of decision: explicit user selection of Option 1 followed by the exact identity and role
- Rationale: Vlad Rondelli explicitly selected the initiating-owner option and accepted its stated limited coordinator scope; no additional rationale was supplied
- Decision result: `PASS`
- Remaining decision blockers: 0
- Decision effect: Vlad Rondelli accepts packet integrity, field inventory, routing and completeness responsibility for Wave 0 only
- Next step: assemble the field-level owner-binding request and collect separate acceptances for its exact subject, environment and owner fields
- Execution, admission, infrastructure, deployment, promotion and release authority: unchanged and absent

## Remaining ORODI blockers

This Decision Gate has no remaining decision blocker, but ORODI remains `plan` / `block` pending:

- exact subject, environment, and stable-versus-candidate artifact classes;
- distinct field-owner identities and field-limited acceptances;
- ontology, directional crosswalk, profile, tool, policy, evaluator, receipt-schema, expiry, and invalidation admissions;
- C17-C20/M14-M17 admit-or-defer decisions;
- infrastructure target, protected-effect authorities, rollback inventory, and digest-current dry witness validation.

Only after those prerequisites may the route reach `invoke:refresh`. No Task Session route exists now.
