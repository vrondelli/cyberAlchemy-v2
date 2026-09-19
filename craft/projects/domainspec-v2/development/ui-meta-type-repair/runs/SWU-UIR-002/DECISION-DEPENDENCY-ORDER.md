---
decision_id: DEC-UIR-002-ORDER
status: resolved
scope: SWU-UIR-002 and SWU-UIR-003 dependency order
created: 2026-07-11
---

# SWU-UIR-002 Dependency Decision

## Question

Which task should own and land the normative violation registry before
`attribute-nonempty/v1` parity is claimed?

## Options

### 1. Run SWU-UIR-003 Before SWU-UIR-002 - Recommended

- Benefit: preserves existing ownership; the registry and strict unknown-rule
  behavior exist before parity work consumes them.
- Cost/risk: changes W0 execution order and makes SWU-002 depend on 003.
- Choose when: clean dependency direction matters more than original row order.
- Downstream: `001 -> 003 -> 002`; W1 begins after both pass.
- Reversibility: high; planning/status change only before SWU-002 mutation.

### 2. Move Registry Ownership Into SWU-UIR-002

- Benefit: keeps `001 -> 002 -> 003` order and puts parity plus codes together.
- Cost/risk: broadens SWU-002 and leaves SWU-003 with only duplicate/conflict
  preflight; task contracts and recomposition maps must be rewritten.
- Choose when: atomic parity implementation is preferred over smaller SWUs.
- Downstream: SWU-002 becomes larger and more coupled.
- Reversibility: medium after code lands.

### 3. Use Provisional Codes In SWU-UIR-002

- Benefit: fastest route to the nonempty predicate.
- Cost/risk: violates the one-normative-registry contract and creates migration
  churn; parity evidence would not be final.
- Choose when: only a disposable experiment is wanted.
- Downstream: SWU-002 remains `flag`, then SWU-003 rewrites its evidence.
- Reversibility: low for persisted receipts.

### Explain / More Context

Non-committal. Expand code-path examples, plan changes, and migration risk, then
present the same three options again.

## Recommendation

Option 1. It fixes the dependency without moving ownership or weakening the
accepted strict-registry decision.

## Resolution

- Selected: Option 1, run SWU-UIR-003 before SWU-UIR-002.
- Source: user selection `1` on 2026-07-11.
- Rationale: preserves existing ownership and ensures parity consumes one
  normative registry rather than provisional codes.
- Consequence: W0 order is `001 -> 003 -> 002`; SWU-UIR-002 now depends on 003.
- Remaining blockers: none for starting SWU-UIR-003.
