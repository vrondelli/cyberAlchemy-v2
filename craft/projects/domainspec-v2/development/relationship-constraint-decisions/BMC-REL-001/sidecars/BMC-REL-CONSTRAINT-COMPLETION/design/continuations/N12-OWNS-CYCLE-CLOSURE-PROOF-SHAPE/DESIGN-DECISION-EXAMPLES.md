# N12 Complexity Example Ladder

All examples ask which D02 evidence is enough to evaluate whole-boundary N06
same-dimension cycle-freedom. Scenario details are hypothetical; option semantics
and evidence boundaries remain fixed.

## Low Complexity

A declared boundary contains exactly Entities `A` and `B`. Its population, placement,
and all outgoing canonical `owns` adjacency are complete; incoming closure is absent.

- **A — Outgoing plus population:** the cycle predicate is evaluable because no eligible Entity or outgoing cycle edge can be omitted.
- **B — Symmetric adjacency:** report N11 `not-evaluated-incomplete-closure` until incoming adjacency is also closed.
- **C — Defer:** retain the unresolved proof threshold and block dependent progress.
- **D — Stop:** end the route without choosing a closure proof.

This demonstrates the one-axis difference. It does not prove a representation or implementation.

## Medium Complexity

A cross-feature boundary contains `A`, `B`, and `C`; population and placement are
complete. All outgoing `custody` facts are present, while incoming closure evidence
from one loader is unavailable.

- **A — Outgoing plus population:** evaluate the same-dimension cycle predicate from the complete directed outgoing graph.
- **B — Symmetric adjacency:** remain not evaluated until the missing incoming evidence is supplied.
- **C — Defer:** preserve the same unresolved threshold despite the additional feature boundary.
- **D — Stop:** preserve evidence and terminate the continuation.

This adds a feature boundary and missing evidence provider. It does not decide `feature_scope` or loader APIs.

## Complex

A multi-feature boundary contains many Entities and facts in all admitted dimensions.
The one Entity population and placement scope are complete, and all outgoing `owns`
adjacency is closed; independently sourced incoming evidence is complete for two
dimensions but unavailable for one.

- **A — Outgoing plus population:** evaluate each same-dimension N06 predicate using the complete relation-level outgoing graph, while N07 remains separate.
- **B — Symmetric adjacency:** all cycle-freedom claims remain not evaluated until relation-level incoming evidence is complete.
- **C — Defer:** keep the proof subset unresolved without inventing per-dimension closure metadata.
- **D — Stop:** terminate without proof-shape or downstream authority.

This adds dimensions, providers, and an incomplete axis. It does not authorize
per-dimension metadata, transitivity, mandatory ownership, or runtime behavior.

## Coverage

Each rung holds boundary identity, complete population and placement, complete
outgoing adjacency, and missing incoming evidence constant while varying only the
proof threshold. A, B, C, and D appear once per rung. Unsupported claims: zero.
`decision_effect: none`.
