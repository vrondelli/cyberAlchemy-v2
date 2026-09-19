# N07 Complexity Example Ladder

All scenarios are hypothetical. The invariant is whether cross-axis closure alone
invalidates a directed canonical `owns` path using at least two admitted D29
dimensions. `decision_effect: none`.

## Low Complexity — Two Entities, Two Dimensions

Scenario: `A --[owns_lifecycle]--> B` and `B --[owns_custody]--> A`.

- **A — Allow:** do not reject these two independently classified facts merely because their combined cross-axis path closes; no path is required.
- **B — Reject:** classify the two-edge mixed-dimension closed path as invalid even though the two responsibilities differ.
- **C — Defer:** leave mixed-dimension closure unresolved and keep Design blocked.
- **D — Stop:** terminate without mixed-dimension closed-path authority.

Demonstrates: the smallest cross-axis closure. Does not prove transitivity,
mandatory ownership, representation, or same-dimension behavior.

## Medium Complexity — Three Entities And An Acyclic Projection

Added complexity: `A --[lifecycle]--> B --[custody]--> C
--[write-responsibility]--> A`, while each dimension considered alone is acyclic.

- **A — Allow:** preserve all three cross-axis facts because closure appears only after dimensions are combined.
- **B — Reject:** reject the combined three-edge closed path despite every single-dimension projection being acyclic.
- **C — Defer:** preserve the unresolved diagnostic without admitting either behavior.
- **D — Stop:** end the route without changing the three facts.

Demonstrates: combined closure versus acyclic per-dimension projections. Does not
authorize dimension-sequence exceptions or derived edges.

## Complex — Cross-Feature Path, Adjacent Violations, And Registry Evolution

Added complexity: four cross-feature Entities close a path using all current D29
dimensions plus a later admitted dimension; a separate same-dimension cycle and a
direct self-edge are also proposed.

- **A — Allow:** do not reject the mixed-dimension path solely for closure, including the later dimension; independently reject the same-dimension cycle under N06 and the self-edge under N04.
- **B — Reject:** reject the mixed-dimension closed path uniformly while independently preserving the N06 and N04 rejections.
- **C — Defer:** keep only mixed-dimension closure unresolved; prior rejections and registry governance remain active.
- **D — Stop:** terminate without N07 authority; N04 through N06 remain intact.

Demonstrates: cross-boundary preservation and adjacent-policy separation. Does not
prove per-fact storage, transitivity, runtime enforcement, or packet acceptance.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is hypothetical.
- Recommendation preserved: A, do not reject a mixed-dimension path merely because it closes.
- Decision effect: none.
