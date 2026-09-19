# N31 Complexity Example Ladder

Every Entity name and arrangement is hypothetical. The invariant is one
topology-admitted canonical `belongs-to` closed path with equal endpoints, length at
least two, and at least two exact active D30 kinds. Direct D30 meanings remain fixed.

## Low Complexity

Hypothetical path: `Draft --[classification]--> Content-Item
--[home-assignment]--> Draft`.

- **A — No derived self-reachability:** Draft remains directly classified under/by
  Content-Item, and Draft is directly assigned as Content-Item's home or placement
  context; no Draft-to-Draft reachability consequence is derived.
- **B — Trace-preserving self-reachability:** the same direct meanings remain, and
  Draft additionally has a non-authoritative Draft-to-Draft reachability result with
  trace `[classification, home-assignment]`; it is not a canonical self-edge.
- **C — Defer:** preserve both direct facts and leave self-reachability unresolved.
- **D — Stop:** retain the evidence and terminate this continuation.

This shows the self-reachability distinction. It does not prove a real content model,
canonical self-membership, storage, or implementation.

## Medium Complexity

Added complexity: a longer closed path. Hypothetical facts are
`Reply -classification-> Discussion-Item -home-assignment-> Forum
-classification-> Reply`.

- **A — No derived self-reachability:** only the three exact direct facts have their
  D30 meanings; the closed route adds no Reply-to-Reply consequence.
- **B — Trace-preserving self-reachability:** Reply gains only a non-authoritative
  self-reachability result with ordered trace
  `[classification, home-assignment, classification]`.
- **C — Defer:** preserve the three facts and leave the consequence unresolved.
- **D — Stop:** preserve evidence and end without a behavior policy.

This adds path length. It does not decide repeated-kind trace normalization,
provenance, completeness, naming, or representation.

## Complex

Added complexity: two closed routes, reconvergence, a boundary, and incomplete
visibility. Hypothetical routes are
`Draft -classification-> Content-Item -home-assignment-> Draft` and
`Draft -home-assignment-> Intake-Queue -classification-> Draft`; external adjacency
may be unseen.

- **A — No derived self-reachability:** all direct facts keep exact D30 meanings;
  multiple routes and missing adjacency add no derived Draft-to-Draft result.
- **B — Trace-preserving self-reachability:** Draft has non-authoritative
  self-reachability under two distinct ordered traces; coalescence and incomplete-view
  semantics remain later decisions.
- **C — Defer:** preserve both routes and evidence uncertainty without selecting behavior.
- **D — Stop:** terminate before self-reachability, coalescence, completeness,
  provenance, or representation authority.

This adds multiple traces, a boundary, and uncertainty. It does not select canonical
self-membership, partial-view verdicts, cross-feature restrictions, or implementation.

## Coverage

All three rungs cover A, B, C, and D once with equivalent depth. Unsupported claims:
zero; all scenario details are hypothetical. Recommendation remains A.
`decision_effect: none`.
