# N35 Complexity Example Ladder

All scenarios are hypothetical and preserve one invariant: canonical `emits` is an
authored Entity-to-Event concept fact with no source-backed order identity. B and C
are continuation states, not product behavior. The examples do not choose an option.
`decision_effect: none`.

## Low Complexity — Two Event Concepts

The model authors `Invoice --[emits]--> InvoiceIssued` and
`Invoice --[emits]--> InvoiceAdjusted`. A file happens to list `InvoiceIssued` first.

- **A — not applicable:** neither authored fact has a semantic position; file order
  cannot establish which Event concept is first.
- **B — defer:** preserve both facts and leave ordering unresolved; infer no sequence.
- **C — stop:** end this route without interpreting the file order.

Demonstrates: authored facts versus incidental source order. Limits: does not prove
runtime emission time, causality, delivery, numeric bounds, or storage order.

## Medium Complexity — Different Serializers and Runtime Delivery

Two tools serialize the same authored emits facts in different array orders. Runtime
delivery later observes Event instances in yet another order.

- **A — not applicable:** array and delivery positions are outside the authored
  concept-fact semantics and cannot create an emits sequence.
- **B — defer:** leave ordering unresolved and make no semantic claim from either
  serialization or delivery observation.
- **C — stop:** terminate this continuation without changing the facts or interpreting
  the observations.

Added complexity: multiple serializations and runtime delivery. Limits: does not
select delivery guarantees, retries, replays, timestamps, Event Sourcing, or payload
semantics.

## Complex — Multiple Entities, Replays, and Stream Positions

Several Entity concepts each author emits facts to several Event concepts. Runtime
systems attach timestamps and stream positions, replay Event instances, and deliver
them across environments in different orders.

- **A — not applicable:** none of those runtime or serialization positions becomes an
  authored ordering relation among the canonical emits facts.
- **B — defer:** keep all facts unchanged and preserve the unresolved facet; derive no
  order from timestamps, streams, replays, or environments.
- **C — stop:** close the route without classifying the observations or changing the
  authored model.

Added complexity: multiple concepts plus several incidental ordering pressures.
Limits: does not prove causal order, runtime completeness, stream semantics, payload
equality, numeric constraints, representation, storage, or implementation.

## Coverage

- Rungs: `3/3`
- Presented options: A, B, and C exactly once per rung
- Explain standing choice: available, non-committal, and not a decision answer
- Shared invariant preserved: yes
- Unsupported claims: `0`; scenario details are hypothetical
- Decision effect: `none`
