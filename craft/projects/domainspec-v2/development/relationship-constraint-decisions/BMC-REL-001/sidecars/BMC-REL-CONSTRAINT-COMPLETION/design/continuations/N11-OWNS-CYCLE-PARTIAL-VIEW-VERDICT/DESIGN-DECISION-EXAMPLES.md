# N11 Complexity Example Ladder

All examples use the same question: when no prohibited same-dimension longer cycle
is visible but relevant closure evidence is absent, what verdict applies?

## Low Complexity

One visible fact is `A --owns_lifecycle--> B`; the view does not prove that all
relevant outgoing `lifecycle` facts are present.

- **A — Not evaluated:** report `not-evaluated-incomplete-closure`; no cycle is visible, but global cycle-freedom is unproved.
- **B — Observed-subgraph-only pass:** report that the one-edge observed subgraph is cycle-free, explicitly without a whole-boundary claim.
- **C — Defer:** retain the unresolved verdict and block work that depends on it.
- **D — Stop:** end the route without choosing a partial-view verdict.

## Medium Complexity

The view contains `A --owns_custody--> B --owns_custody--> C`, but facts outside the
loaded feature boundary might include `C --owns_custody--> A`.

- **A — Not evaluated:** withhold the positive verdict until the relevant closure proof is available.
- **B — Observed-subgraph-only pass:** pass only the visible two-edge subgraph and record that the missing edge could change the global result.
- **C — Defer:** keep the evaluator contract unresolved and block dependent generation.
- **D — Stop:** preserve evidence and end the Design continuation.

## Complex

Several features expose visible `write-responsibility` paths and a separate mixed-
dimension closed path. The visible same-dimension partitions contain no N06 cycle,
but the validation envelope lacks the relevant population or adjacency closure.

- **A — Not evaluated:** report incomplete closure for each unproved same-dimension cycle-freedom claim; the N07 mixed-dimension path remains allowed.
- **B — Observed-subgraph-only pass:** pass only each visible same-dimension partition, preserving an explicit non-global claim ceiling and N07 separately.
- **C — Defer:** retain the unresolved per-facet contract while preserving N04 through N10 unchanged.
- **D — Stop:** terminate without a partial-view selection or downstream authorization.

## Coverage

Each rung holds the topology predicate, dimension partition, missing-evidence state,
and claim ceiling constant while varying only the verdict. Complexity changes graph
size and boundary interaction, not option meaning. `decision_effect: none`.
