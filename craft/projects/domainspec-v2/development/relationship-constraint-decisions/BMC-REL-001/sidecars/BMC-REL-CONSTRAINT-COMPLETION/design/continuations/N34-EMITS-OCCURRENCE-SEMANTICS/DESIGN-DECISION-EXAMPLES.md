# N34 Complexity Example Ladder

All scenarios are hypothetical and preserve one invariant: canonical `emits` is an
authored Entity-to-Event **concept relationship**, while any runtime Event instances
are separate. B and C are continuation states, not product behavior. The examples do
not choose an option. `decision_effect: none`.

## Low Complexity — One Concept, Several Runtime Instances

The model authors `PaymentTransaction --[emits]--> PaymentCompleted`. During product
operation, several `PaymentCompleted` instances may occur.

- **A — concept-level:** the occurrence facet classifies the one authored concept
  relationship; the runtime instances are not canonical relationship occurrences.
- **B — defer:** keep the authored fact unchanged and leave the facet unresolved.
- **C — stop:** end this route without interpreting either the fact or instances.

Demonstrates: concept fact versus runtime instances. Limits: does not prove runtime
identity, count, payload equality, Event Sourcing, delivery behavior, or storage.

## Medium Complexity — Several Concept Facts and Retries

The model authors `Invoice --[emits]--> InvoiceSettled` and
`Invoice --[emits]--> InvoiceRejected`. At runtime, delivery of an `InvoiceSettled`
instance is retried.

- **A — concept-level:** the two authored Entity-to-Event concept facts remain the
  occurrence-semantics units; retry attempts do not add canonical emits facts.
- **B — defer:** preserve both facts and the unresolved facet; make no claim about the
  retry.
- **C — stop:** terminate this continuation without changing the model or interpreting
  the retry.

Added complexity: multiple Event concepts plus delivery retries. Limits: does not
select runtime occurrence identity, retry policy, ordering, causal chains, or bounds.

## Complex — Multiple Entities, Replays, and Equal Payloads

Several Entity concepts each author emits facts to several Event concepts. Runtime
processing includes replayed events, repeated payloads, and multiple delivery
attempts across environments.

- **A — concept-level:** evaluate occurrence semantics only for each exact authored
  Entity-to-Event concept fact; replays, payload equality, deliveries, and environments
  do not create or merge those canonical facts.
- **B — defer:** keep all authored facts unchanged and preserve the unresolved facet;
  do not infer semantics from the runtime observations.
- **C — stop:** close the route without classifying the runtime observations or
  changing the authored model.

Added complexity: multiple concept facts and several runtime identity pressures.
Limits: does not prove Event-Sourcing streams, runtime completeness, cross-feature
rules, numeric bounds, representation, storage, or implementation.

## Coverage

- Rungs: `3/3`
- Presented options: A, B, and C exactly once per rung
- Explain standing choice: available, non-committal, and not a decision answer
- Shared invariant preserved: yes
- Unsupported claims: `0`; scenario details are hypothetical
- Decision effect: `none`
