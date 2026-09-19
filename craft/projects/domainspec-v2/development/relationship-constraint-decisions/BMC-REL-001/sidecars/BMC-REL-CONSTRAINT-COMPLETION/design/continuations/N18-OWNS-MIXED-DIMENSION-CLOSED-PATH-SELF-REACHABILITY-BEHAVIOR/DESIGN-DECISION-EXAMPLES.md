# N18 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
topology-admitted canonical `owns` closed path of length at least two that uses at
least two exact admitted D29 dimensions and returns to its starting Entity. Every
rung compares the same choices without authoring a self-edge, collapsing dimensions,
or choosing an option.

## Low Complexity

Hypothetical path: `Catalog --[owns:lifecycle]--> Listing
--[owns:custody]--> Catalog`.

- **A — No derived self-reachability:** the two direct dimension-bearing facts keep
  their consequences; Catalog receives no derived Catalog-to-Catalog result.
- **B — Trace-preserving self-reachability:** the same facts remain canonical, and
  Catalog additionally receives a non-authoritative self-reachability result with
  trace `[lifecycle, custody]`; it is not `owns_d(Catalog,Catalog)`.
- **C — Defer:** keep the facts and leave closed-path self-reachability unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates no derived result versus trace-preserving self-reachability. It
does not prove a real responsibility model, trace storage, or implementation.

## Medium Complexity

Added complexity: a longer closed path and a second return route. Hypothetical facts
are `Catalog -lifecycle-> Listing -custody-> Copy -write-responsibility-> Catalog`
plus `Catalog -write-responsibility-> Ledger -custody-> Catalog`.

- **A — No derived self-reachability:** only the five authored facts have
  consequences; neither closed route adds a Catalog-to-Catalog result.
- **B — Trace-preserving self-reachability:** Catalog receives non-authoritative
  self-reachability under traces `[lifecycle,custody,write-responsibility]` and
  `[write-responsibility,custody]`; the results remain trace-distinct and do not
  replace the direct facts.
- **C — Defer:** preserve the direct facts and keep both closed-path consequences
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple closed dimension traces. It does not choose trace
coalescence, rotation equivalence, provenance, completeness, naming, or
representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, incomplete external
visibility, and an adjacent distinct-endpoint path. Hypothetical admitted routes are
`Portfolio -lifecycle-> Account -write-responsibility-> Portfolio` and
`Portfolio -custody-> Ledger -write-responsibility-> Balance -lifecycle-> Portfolio`;
`Portfolio -custody-> Ledger -write-responsibility-> Balance` has distinct endpoints,
and external outgoing facts may be unseen.

- **A — No derived self-reachability:** consequences remain on observed direct facts;
  neither admitted closed route yields a Portfolio-to-Portfolio result, while the
  distinct-endpoint route remains governed by N17 A.
- **B — Trace-preserving self-reachability:** Portfolio receives non-authoritative
  self-reachability under traces `[lifecycle,write-responsibility]` and
  `[custody,write-responsibility,lifecycle]`; N17 A still prevents an endpoint result
  for Portfolio-to-Balance, and incomplete-evidence semantics remain separate.
- **C — Defer:** preserve the graph, N17 boundary, and uncertainty while leaving
  closed-path self-reachability unresolved.
- **D — Stop:** terminate before self-reachability, trace-equivalence, completeness,
  naming, provenance, representation, or implementation authority.

This adds branches, boundaries, uncertainty, and an adjacent excluded path. It does
not select partial-view verdicts, trace rotation/coalescence, cross-feature rules,
canonical self-edges, or implementation.

## Coverage

Low, medium, and complex rungs preserve the same mixed closed-path comparison. A, B,
C, and D appear once per rung with equivalent depth. Unsupported claims: zero; all
scenario details are explicitly hypothetical. `decision_effect: none`.
