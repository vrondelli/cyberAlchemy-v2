# N13 Complexity Example Ladder

All scenarios are hypothetical. The invariant is whether future same-dimension path
behavior has one shared policy surface or one per admitted D29 dimension. No rung
selects direct-only or derived-reachability behavior.

## Low Complexity

Two separate length-two paths exist, one in `lifecycle` and one in `custody`.

- **A — Uniform policy:** one later behavior decision governs both paths.
- **B — Dimension-specific policy:** lifecycle and custody receive separate later behavior decisions.
- **C — Defer:** preserve the unresolved governance partition and block dependent progress.
- **D — Stop:** end the route without choosing a policy surface.

This demonstrates the governance split. It does not prove any path consequence.

## Medium Complexity

The same two dimensions have paths crossing feature boundaries, and
`write-responsibility` adds another same-dimension path.

- **A — Uniform policy:** one later behavior decision covers all three current dimensions across features.
- **B — Dimension-specific policy:** each dimension retains an independent later behavior gate despite shared feature boundaries.
- **C — Defer:** keep the same partition unresolved as dependencies increase.
- **D — Stop:** preserve evidence and terminate the continuation.

This adds a dimension and feature boundaries. It does not select feature-scope or path behavior.

## Complex

Many paths span several features, and a later Definitions Governance decision may add
a fourth dimension whose path semantics could differ from current dimensions.

- **A — Uniform policy:** the one future rule also governs the later-added dimension unless fresh authority changes it.
- **B — Dimension-specific policy:** the new dimension requires its own later behavior decision and registry-digest review.
- **C — Defer:** retain the unresolved governance shape without inventing a default for registry evolution.
- **D — Stop:** terminate without governance or behavior authority.

This adds registry evolution and dependent authority. It does not authorize a new dimension or choose any behavior.

## Coverage

Each rung holds the same-dimension acyclic path classifier constant while varying only
the governance partition. A, B, C, and D appear once per rung. Unsupported claims: zero.
`decision_effect: none`.
