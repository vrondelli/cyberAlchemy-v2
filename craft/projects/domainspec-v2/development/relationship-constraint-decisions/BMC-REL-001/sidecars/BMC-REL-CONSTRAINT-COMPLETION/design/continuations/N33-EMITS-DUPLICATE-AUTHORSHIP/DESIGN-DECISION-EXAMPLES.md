# N33 Complexity Example Ladder

All scenarios are hypothetical and preserve one invariant: distinct authored source
handles state the exact same canonical `Entity --[emits]--> Event` proposition in the
same admitted authority/feature context. They do not compare payloads, runtime event
occurrences, Event-Sourcing streams, or `produces`. `decision_effect: none`.

## Low Complexity — One Repeated Emits Fact

`PaymentTransaction --[emits]--> PaymentCompleted` is authored twice in one feature.

- **A — reject:** report both source handles and require one authored record to be
  removed before admission.
- **B — conditional coalescence:** admit one proposition only after a separate
  deterministic merge-provenance contract preserves both source handles.
- **C — defer:** retain the duplicate evidence and keep the policy unresolved.
- **D — stop:** end the route without changing either record.

Demonstrates: exact canonical edge duplication. Limits: does not prove equal Event
payloads, two runtime emissions, Event Sourcing, provenance storage, or product
behavior.

## Medium Complexity — Two Feature-Owned Fragments

Two independently owned fragments both author
`Invoice --[emits]--> InvoiceSettled` in the same admitted context. The Entity also
legitimately emits another Event.

- **A — reject:** report only the exact repeated proposition, preserve the distinct
  Event edge, and require the two owners to converge on one authored source.
- **B — conditional coalescence:** preserve the distinct edge and admit one repeated
  proposition only after deterministic owner/source retention is separately proven.
- **C — defer:** keep both repeated sources unresolved while leaving the distinct edge
  unchanged.
- **D — stop:** terminate this continuation without changing either fragment.

Added complexity: separate owners and a nearby valid edge. Limits: does not select
merge ownership, cross-feature storage, `produces`, stream identity, or runtime order.

## Complex — Concurrent Sources With Missing Provenance

Three fragments describe several Entities and Events. Two author the same
`Subscription --[emits]--> SubscriptionCancelled` fact, a third authors a distinct
emits fact, and one duplicate source handle is unavailable during review.

- **A — reject:** identify the exact repeated key, preserve distinct facts, and block
  until the competing authored sources are repaired.
- **B — conditional coalescence:** preserve the same distinctions but block
  coalescence until every handle is available and deterministic provenance is proven.
- **C — defer:** preserve incomplete evidence and keep the duplicate-sensitive route
  blocked.
- **D — stop:** close the route without interpreting the unavailable source.

Added complexity: concurrent owners, multiple valid facts, missing evidence, and an
authority boundary. Limits: does not prove distributed merging, partial-view policy,
runtime event delivery, Event-Sourcing semantics, representation, or implementation.

## Coverage

- Rungs: `3/3`
- Options: A, B, C, and D exactly once per rung
- Shared invariant preserved: yes
- Unsupported claims: `0`; scenario details are hypothetical
- Decision effect: `none`
