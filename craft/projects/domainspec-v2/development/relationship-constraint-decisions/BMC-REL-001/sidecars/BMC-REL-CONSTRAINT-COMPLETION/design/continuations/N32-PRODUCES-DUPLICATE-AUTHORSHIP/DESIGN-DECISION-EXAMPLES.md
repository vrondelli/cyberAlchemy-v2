# N32 Complexity Example Ladder

All scenarios are hypothetical and preserve one invariant: distinct authored source
handles state the exact same canonical `Operation --[produces]--> Event` proposition,
using the same admitted authority/feature context. The examples do not compare Event
payloads, runtime occurrences, or `emits`, and do not select an option.
`decision_effect: none`.

## Low Complexity — One Repeated Produces Fact

`ProcessPayment --[produces]--> PaymentCompleted` is authored twice in one feature.

- **A — reject:** report both source handles and require one authored record to be
  removed before admission.
- **B — conditional coalescence:** admit one proposition only after a separate
  deterministic merge-provenance contract preserves both source handles.
- **C — defer:** retain the duplicate evidence and keep the policy unresolved.
- **D — stop:** end the route without changing or interpreting either record.

Demonstrates: exact canonical edge duplication. Limits: does not prove payload
equality, two runtime `PaymentCompleted` occurrences, provenance storage, or product
behavior.

## Medium Complexity — Two Feature-Owned Fragments

Two independently owned fragments both author
`ApproveOrder --[produces]--> OrderApproved` in the same admitted context. A separate
Operation legitimately produces another Event.

- **A — reject:** report only the exact repeated proposition, preserve the distinct
  Event edge, and require the two owners to converge on one authored source.
- **B — conditional coalescence:** preserve the distinct edge and admit one repeated
  proposition only after deterministic owner/source retention is separately proven.
- **C — defer:** keep both repeated sources unresolved while leaving the distinct edge
  unchanged.
- **D — stop:** terminate this continuation without changing either fragment.

Added complexity: separate ownership boundaries and a nearby valid edge. Limits:
does not select merge ownership, cross-feature storage, `emits`, or runtime ordering.

## Complex — Concurrent Sources With Missing Provenance

Three fragments concurrently describe several Operations and Events. Two fragments
author the exact same `SettleInvoice --[produces]--> InvoiceSettled` fact, a third
authors a different produces fact, and one duplicate source handle is temporarily
unavailable during review.

- **A — reject:** identify the exact repeated key, preserve all distinct facts, and
  block until the competing authored sources are repaired.
- **B — conditional coalescence:** preserve the same distinctions but block
  coalescence until every source handle is available and deterministic provenance can
  be proven; no partial or silent merge is admitted.
- **C — defer:** preserve the incomplete evidence and keep duplicate-sensitive
  continuation blocked.
- **D — stop:** close the route without interpreting the unavailable source or
  selecting a policy.

Added complexity: concurrent owners, multiple valid facts, missing evidence, and an
authority boundary. Limits: does not prove distributed merging, partial-view policy,
runtime event delivery, representation, or implementation correctness.

## Coverage

- Rungs: `3/3`
- Options: A, B, C, and D exactly once per rung
- Shared invariant preserved: yes
- Unsupported claims: `0`; all scenario details are labelled hypothetical
- Decision effect: `none`
