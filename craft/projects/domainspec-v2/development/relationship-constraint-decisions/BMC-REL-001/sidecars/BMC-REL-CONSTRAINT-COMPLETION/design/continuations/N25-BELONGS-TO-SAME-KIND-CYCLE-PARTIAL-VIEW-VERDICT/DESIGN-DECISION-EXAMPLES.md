# N25 Complexity-Aligned Decision Examples

All scenarios are hypothetical. The invariant is: observed N20/N22 violations remain
invalid, while the current evidence shows no prohibited same-kind cycle and lacks
relevant closure. Decision effect: `none`.

## Low — One Open Chain Fragment

Scenario: the visible `classification` facts are `Reply-A -> Reply-B`; no return edge
is visible, but outgoing adjacency completeness is unknown.

- A: return `not-evaluated-incomplete-closure` for same-kind cycle freedom.
- B: pass only the observed subgraph and label the result non-global.
- C: leave the open-view verdict unresolved.
- D: end the continuation without changing the facts.

Demonstrates absence of a visible cycle versus proof of cycle freedom. It does not
choose how closure is proven.

## Medium — Hidden Cross-Feature Adjacency Is Possible

Added complexity: the visible same-kind chain crosses a feature boundary, and another
feature may supply an outgoing edge. A mixed-kind closed path is also visible.

- A: keep same-kind cycle freedom not evaluated; preserve the N23 mixed-kind path.
- B: pass only the visible same-kind subgraph; preserve the N23 path and non-global ceiling.
- C: retain the verdict blocker without treating mixed-kind closure as an N22 violation.
- D: stop without changing cross-feature or mixed-kind facts.

Demonstrates feature-boundary uncertainty and topology separation. It does not define
cross-feature closure metadata or derived reachability.

## Complex — Observed Violation Beside An Open Clean Region

Added complexity: one `home-assignment` region contains an observed N22 cycle, while a
different classification region has no visible cycle but incomplete closure; duplicate
authorship was already repaired under N24.

- A: mark the observed home-assignment cycle invalid and the open classification region not evaluated.
- B: mark the observed cycle invalid and pass only the observed classification subgraph with a non-global ceiling.
- C: preserve observed invalidity while leaving only the clean-region absence verdict unresolved.
- D: terminate without weakening the observed invalidity or admitting the open region globally.

Demonstrates simultaneous invalid and incomplete evidence states. It does not choose
closure proof shape, aggregate kinds, or authorize implementation.

## Coverage

- Rungs: `3/3`
- Options per rung: A, B, C, D with equivalent depth
- Unsupported claims: `0`
- Unequal option coverage: `false`
- Decision effect: `none`
