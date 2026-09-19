# N06 Complexity Example Ladder

All scenarios are hypothetical. The invariant is one uniform rule for a
same-dimension directed `owns` cycle over two or more distinct Entities.
`decision_effect: none`.

## Low Complexity — Two-Entity Lifecycle Cycle

Scenario: `AccountA --[owns_lifecycle]--> AccountB` and
`AccountB --[owns_lifecycle]--> AccountA`.

- **A — Reject:** classify the two-edge cycle as invalid; the same rejection would govern every admitted dimension.
- **B — Allow:** admit the two-edge cycle without requiring one; the same allowance would govern every admitted dimension.
- **C — Defer:** leave behavior unresolved and keep Design blocked.
- **D — Stop:** terminate without longer-cycle behavior authority.

Demonstrates: the exact reject/allow consequence on one minimal longer cycle. Does
not prove mandatory ownership, transitivity, or mixed-dimension behavior.

## Medium Complexity — Three-Entity Cycle And Acyclic Chain

Added complexity: lifecycle has `A -> B -> C -> A`, while custody has an acyclic
`Keeper -> Branch -> Copy` chain.

- **A — Reject:** reject the lifecycle cycle while leaving the acyclic custody chain unaffected; rejection remains the uniform rule.
- **B — Allow:** allow the lifecycle cycle while the custody chain remains valid; allowance remains the uniform rule if a custody cycle later appears.
- **C — Defer:** preserve both structures but block cycle-sensitive admission.
- **D — Stop:** end the route without changing either structure.

Demonstrates: cycle-specific behavior separated from acyclic ownership. Does not
authorize per-dimension exceptions or infer closure.

## Complex — Cross-Feature Cycle, Registry Evolution, And Excluded Paths

Added complexity: four cross-feature Entities form one write-responsibility cycle; a
future D29 dimension is admitted; a separate closed path changes dimension between
edges; and a direct self-edge is also proposed.

- **A — Reject:** reject the same-dimension four-edge cycle and any later same-dimension cycle under the new ID; route the self-edge to N04 rejection and leave the mixed path unresolved.
- **B — Allow:** allow the same-dimension four-edge cycle and later same-dimension cycles under the new ID; N04 still rejects the self-edge and the mixed path remains unresolved.
- **C — Defer:** keep current and future same-dimension cycle behavior blocked; N04 and mixed-path boundaries remain unchanged.
- **D — Stop:** terminate without behavior authority; prior selections remain intact.

Demonstrates: uniform evolution and preservation of adjacent boundaries. Does not
prove representation, runtime enforcement, transitivity, closure, or packet acceptance.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is hypothetical.
- Recommendation preserved: A, reject longer cycles uniformly.
- Decision effect: none.
