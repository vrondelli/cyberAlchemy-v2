# N10 Complexity Example Ladder

All scenarios are hypothetical. The invariant is that `owned-by` remains a generated,
non-authoritative, dimension-preserving reverse projection of canonical `owns`.
`decision_effect: none`.

## Low Complexity — One Canonical Fact

Scenario: `TeamA --[owns_lifecycle]--> AccountB` is the sole canonical fact.

- **A — Compute on demand:** derive `AccountB --[owned-by_lifecycle]--> TeamA` from the canonical fact whenever reverse navigation is requested.
- **B — Materialize rebuildably:** permit the same reverse result as derived projection state carrying provenance to that canonical fact and a rebuild contract.
- **C — Defer:** leave materialization unresolved and keep Design blocked.
- **D — Stop:** terminate without selecting a generated-projection materialization policy.

Demonstrates: the smallest state-location difference. It does not select a store,
schema, serialization, cache, API, or implementation.

## Medium Complexity — Canonical Fact Changes

Added complexity: the lifecycle owner changes from `TeamA` to `TeamC` after the old
canonical fact is removed and a new fact is admitted.

- **A — Compute on demand:** the next reverse lookup reflects only current canonical facts; no separate projection refresh contract is introduced.
- **B — Materialize rebuildably:** derived state must be deterministically refreshed or rebuilt, preserve source provenance, and expose stale/drift failure rather than becoming authority.
- **C — Defer:** preserve canonical change semantics while leaving projection-state behavior unresolved.
- **D — Stop:** end the route without changing canonical authority or N09 dimension preservation.

Demonstrates: state change and drift obligation. It does not decide refresh timing,
transaction boundaries, cache invalidation, or failure-recovery implementation.

## Complex — Multiple Dimensions, Features, And Rebuild Failure

Added complexity: several current/later dimensions cross feature boundaries, a target
has distinct owners by dimension, and a projection rebuild can fail part-way while
canonical facts remain valid.

- **A — Compute on demand:** every reverse result is derived from the current canonical dimension-bearing set, leaving query execution and availability behavior for later Design.
- **B — Materialize rebuildably:** every projection row remains provenance-bound and non-authoritative; incomplete or stale rebuild output must fail closed under a later separately designed recovery contract.
- **C — Defer:** retain N04-N09 policies and canonical facts while leaving materialization and recovery obligations unresolved.
- **D — Stop:** terminate with generated-only authority and all prior policies unchanged.

Demonstrates: cross-boundary state, provenance, drift, and failure-path pressure. It
does not prove availability, consistency level, storage layout, runtime cardinality,
partial-view completeness, or packet acceptance.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is hypothetical.
- Recommendation preserved: A, compute from canonical `owns` when navigation is requested.
- Decision effect: none.
