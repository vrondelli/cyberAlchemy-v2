# Complexity examples — BMC-REL-NUMERIC-EMITS-01

- Mode: comparative.
- Invariant: count distinct authored canonical Entity-to-Event concept facts; runtime occurrences remain excluded.
- All scenarios are hypothetical.
- Decision effect: none.

## Low

Scenario: `Order --[emits]--> OrderPlaced`.

- A: valid; one outgoing and one incoming fact fit the tuple.
- B: remains unresolved; no numeric verdict is added.
- C: the route terminates without changing the fact.

Demonstrates one ordinary subject fact. It does not distinguish optionality or many-valued outgoing degree.

## Medium

Added complexity: optional Entity participation, multiple Event concepts, and one operation-only Event.

Scenario: `Order` emits `OrderPlaced`, `OrderCancelled`, and `OrderShipped`; `ReconciliationFinished` has no Entity subject.

- A: valid; outgoing degree is unbounded, and target participation is optional.
- B: remains unresolved; the graph has no numeric conformance verdict.
- C: the route terminates and the packet stays unresolved.

Demonstrates why `source_min=0`, `source_max=unbounded`, and `target_min=0` are useful. It does not test responsibility conflict.

## Complex

Added complexity: two Entities would otherwise share one generic Event concept.

Scenario: both `Order` and `Payment` point to `StatusChanged`; alternatively they use `OrderStatusChanged` and `PaymentStatusChanged`.

- A: rejects the shared `StatusChanged` subject facts because incoming degree is two; accepts the responsibility-specific Event concepts.
- B: leaves the responsibility conflict without a numeric verdict.
- C: terminates the route without resolving the conflict.

Demonstrates the `target_max=1` responsibility boundary. It does not define payloads, runtime publishers, or delivery behavior.

Coverage: 3/3 rungs, A/B/C covered evenly, unsupported claims 0, decision effect none.
