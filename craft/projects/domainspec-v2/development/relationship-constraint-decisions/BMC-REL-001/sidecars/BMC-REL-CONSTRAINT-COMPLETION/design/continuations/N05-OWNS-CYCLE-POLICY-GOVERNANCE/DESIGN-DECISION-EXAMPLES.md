# N05 Complexity Example Ladder

All scenarios are hypothetical. The invariant is policy partitioning for cycles over
two or more distinct Entities; no example selects whether such cycles are valid.
`decision_effect: none`.

## Low Complexity — One Lifecycle Cycle Candidate

Scenario: `AccountA --[owns_lifecycle]--> AccountB` and
`AccountB --[owns_lifecycle]--> AccountA`.

- **A — Uniform:** route this candidate to one future cycle rule that must also govern every other admitted D29 dimension.
- **B — Dimension-specific:** route this candidate to a future lifecycle-only cycle decision; custody and write-responsibility remain independently unresolved.
- **C — Defer:** leave the governance shape unresolved and keep Design blocked.
- **D — Stop:** terminate this continuation without cycle-policy governance authority.

Demonstrates: the difference between one shared future rule and one dimension-local
future rule. Does not prove whether the lifecycle cycle is accepted or rejected.

## Medium Complexity — Two Dimensions On The Same Entities

Added complexity: the same Entity pair has separate lifecycle and custody cycle
candidates.

- **A — Uniform:** both candidates must later receive the same cycle behavior because one rule spans every admitted dimension.
- **B — Dimension-specific:** lifecycle and custody may receive different future owner decisions, each explicit and independently validated.
- **C — Defer:** both candidates remain blocked with no governance partition selected.
- **D — Stop:** end the route; neither candidate gains cycle behavior.

Demonstrates: uniformity reduces policy surfaces while dimension-specific governance
preserves axis independence. Does not authorize different outcomes or mandatory facts.

## Complex — Evolving Registry And Mixed-Dimension Residue

Added complexity: a three-Entity write-responsibility cycle exists, lifecycle is
acyclic, and a separate closed path changes dimension between its edges. A future
Definitions owner may add another admitted dimension.

- **A — Uniform:** one future rule must cover lifecycle, custody, write-responsibility, and any newly admitted dimension; the mixed-dimension path remains outside the rule.
- **B — Dimension-specific:** each active or newly admitted dimension requires its own explicit future cycle decision; the mixed-dimension path still remains separate.
- **C — Defer:** registry evolution and every cycle candidate remain blocked on this governance choice.
- **D — Stop:** terminate without governing current or future dimension cycle policy.

Demonstrates: policy evolution, validation cost, and the mixed-dimension boundary.
Does not prove transitivity, closure, representation, runtime behavior, or cycle validity.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; all domain details are labelled hypothetical.
- Recommendation preserved: B, dimension-specific governance.
- Decision effect: none.
