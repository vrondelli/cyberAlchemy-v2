# N36 Complexity Example Ladder

All scenarios are hypothetical. Shared invariant: a visible second distinct Entity
subject for the same Event concept violates `target_max = 1` under both action
options. The comparison concerns only a view with no visible violation and missing
relevant incoming closure. C and D are continuation states, not product behavior.
`decision_effect: none`.

## Low Complexity — One Visible Subject

The fragment shows `Invoice --[emits]--> InvoiceIssued`. It does not prove that all
incoming emits facts for `InvoiceIssued` were loaded.

- **A — not evaluated:** report incomplete closure; do not claim the responsibility
  bound passes for the whole boundary.
- **B — observed-subgraph pass:** report that this fragment contains no visible
  violation, explicitly without a global claim.
- **C — defer:** preserve the facts and leave the verdict unresolved.
- **D — stop:** end this route without interpreting the fragment.

Demonstrates: absence of a visible violation is weaker than a closed proof. Limits:
does not choose how closure is represented or prove another Entity fact exists.

## Medium Complexity — Two Feature Loaders

One loader contains `Invoice --[emits]--> InvoiceIssued`; another feature loader may
contain additional Entity-to-Event facts, but its incoming adjacency is not included.

- **A — not evaluated:** withhold whole-boundary conformance until the relevant
  incoming facts are proven complete.
- **B — observed-subgraph pass:** pass only the loaded fragment and require consumers
  to preserve the local scope label.
- **C — defer:** retain the unresolved decision across both loaders.
- **D — stop:** terminate the continuation without combining or judging them.

Added complexity: a second evidence boundary can hold omitted facts. Limits: does not
select feature-wide or project-wide closure, loader APIs, or packet representation.

## Complex — Incremental Merge and a Late Conflict

Several teams contribute fragments. An early view shows one Entity subject for an
Event. A later authoritative merge reveals a second distinct Entity subject, making
the selected responsibility bound invalid.

- **A — not evaluated:** the early view never claims conformance; the closed merge
  rejects the two visible subjects.
- **B — observed-subgraph pass:** the early local pass remains historically accurate
  only for that fragment; the later closed result rejects the combined graph.
- **C — defer:** no partial-view verdict is established; the later violation is still
  visible evidence under the selected maximum.
- **D — stop:** no continuation verdict is authored; the selected numeric policy
  remains separate from this stopped route.

Added complexity: multiple authorities, time, merge, and a late conflicting fact.
Limits: does not select merge precedence, source authority, closure serialization,
runtime Event behavior, or implementation.

## Coverage

- Rungs: `3/3`
- Presented options: A, B, C, and D exactly once per rung
- Explain standing choice: available, non-committal, and not a decision answer
- Shared invariant preserved: yes
- Unsupported claims: `0`; scenario details are hypothetical
- Decision effect: `none`
