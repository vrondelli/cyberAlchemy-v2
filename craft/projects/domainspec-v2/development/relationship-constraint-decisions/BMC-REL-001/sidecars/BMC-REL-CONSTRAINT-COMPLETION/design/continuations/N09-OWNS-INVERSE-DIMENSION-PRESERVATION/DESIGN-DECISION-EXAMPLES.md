# N09 Complexity Example Ladder

All scenarios are hypothetical. The invariant is that `owned-by` remains a generated,
non-authoritative reverse view of admitted dimension-bearing canonical `owns` facts.
`decision_effect: none`.

## Low Complexity — One Ownership Dimension

Scenario: `TeamA --[owns_lifecycle]--> AccountB` is the sole canonical fact.

- **A — Preserve dimension:** generate `AccountB --[owned-by_lifecycle]--> TeamA`, retaining `lifecycle` in the navigation contract.
- **B — Aggregate dimension-free:** generate `AccountB --[owned-by]--> TeamA` without exposing which dimension produced it.
- **C — Defer:** leave inverse dimension behavior unresolved and keep Design blocked.
- **D — Stop:** terminate without inverse dimension authority.

Demonstrates: the smallest information-preservation difference. It does not select
storage syntax, materialization, or authored inverse edges.

## Medium Complexity — Same Endpoints, Two Dimensions

Added complexity: `TeamA` owns `AccountB` for both lifecycle and custody as two
distinct canonical facts.

- **A — Preserve dimension:** generate two distinguishable reverse navigation facts, one for lifecycle and one for custody.
- **B — Aggregate dimension-free:** generate one dimension-free owner-target navigation pair because at least one dimension relates the endpoints.
- **C — Defer:** preserve both canonical facts while leaving their reverse projection unresolved.
- **D — Stop:** end the route without changing canonical fact identity or inverse authority.

Demonstrates: D29 distinction versus navigation aggregation. It does not decide
whether projections are stored, computed, or serialized as fields.

## Complex — Distinct Owners, Cross-Feature Facts, And Registry Evolution

Added complexity: lifecycle, custody, and write-responsibility for one target have
different owners across feature boundaries, a later admitted dimension is present,
and adjacent duplicate/topology diagnostics also exist.

- **A — Preserve dimension:** every generated reverse result retains its exact current or later admitted dimension, while N04-N08 rules remain independently enforced.
- **B — Aggregate dimension-free:** expose a dimension-free set of reverse owners, coalescing only identical navigation pairs while canonical dimension-bearing facts and prior rules remain unchanged.
- **C — Defer:** keep inverse projection unresolved without weakening registry evolution or prior selections.
- **D — Stop:** terminate with canonical facts, generated-only authority, and prior policy unchanged.

Demonstrates: multiple owners valid across distinct dimensions, registry evolution,
and adjacent-policy separation. It does not prove partial-view completeness, runtime
cardinality, inverse storage, or packet acceptance.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is hypothetical.
- Recommendation preserved: A, preserve the exact D29 dimension in generated reverse navigation.
- Decision effect: none.
