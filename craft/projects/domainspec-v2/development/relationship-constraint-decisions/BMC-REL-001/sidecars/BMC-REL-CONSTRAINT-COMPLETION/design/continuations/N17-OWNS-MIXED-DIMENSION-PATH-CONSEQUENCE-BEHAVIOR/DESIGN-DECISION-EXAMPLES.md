# N17 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
topology-admitted canonical `owns` path with distinct endpoints that uses at least
two exact admitted D29 dimensions. Every rung compares the same choices without
authoring edges, collapsing dimensions, or choosing an option.

## Low Complexity

Hypothetical path: `Catalog --[owns:lifecycle]--> Listing
--[owns:custody]--> Copy`.

- **A — Direct facts only:** Catalog has direct lifecycle responsibility for
  Listing; Listing has direct custody responsibility for Copy; no Catalog-to-Copy
  consequence is derived.
- **B — Trace-preserving reachability:** the same facts remain canonical, and
  Catalog additionally has a non-authoritative reachability result to Copy with
  trace `[lifecycle, custody]`; it is not a dimension-free ownership fact.
- **C — Defer:** keep the two facts and leave the mixed-path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates direct facts versus trace-preserving mixed reachability. It does
not prove a real responsibility model, closed-path self-reachability, naming,
storage, or implementation.

## Medium Complexity

Added complexity: a longer path and a second mixed route. Hypothetical facts are
`Catalog -lifecycle-> Listing -custody-> Copy -write-responsibility-> Condition`
plus `Catalog -write-responsibility-> Ledger -custody-> Copy`.

- **A — Direct facts only:** only the five authored dimension-bearing facts have
  consequences; neither mixed route adds endpoint responsibility.
- **B — Trace-preserving reachability:** Catalog reaches Copy through traces
  `[lifecycle,custody]` and `[write-responsibility,custody]`, and reaches Condition through
  `[lifecycle,custody,write-responsibility]`; results remain non-authoritative and
  trace-distinct without replacing direct facts.
- **C — Defer:** preserve the direct facts and keep multi-route mixed consequences
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple dimension traces to an endpoint. It does not
choose result coalescence, provenance retention, completeness proof, naming, or
representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, incomplete
visibility, and a separate mixed closed path. Hypothetical paths are
`Portfolio -lifecycle-> Account -write-responsibility-> Balance` and
`Portfolio -custody-> Ledger -write-responsibility-> Balance`; a separate
`A -lifecycle-> B -custody-> A` path closes, and external outgoing facts may be
unseen.

- **A — Direct facts only:** consequences remain on each observed direct fact;
  reconvergence, missing external adjacency, and the separate closed path create no
  derived endpoint or self-reachability result.
- **B — Trace-preserving reachability:** Portfolio has non-authoritative reachability
  to Balance under traces `[lifecycle,write-responsibility]` and
  `[custody,write-responsibility]`; the closed A-to-A path remains outside N17, and
  incomplete-evidence semantics remain separate.
- **C — Defer:** preserve the graph and the closed-path exclusion while leaving
  distinct-endpoint mixed consequences unresolved.
- **D — Stop:** terminate before mixed-path behavior, self-reachability,
  completeness, naming, provenance, or representation authority.

This adds branches, boundaries, uncertainty, and an adjacent excluded closed path.
It does not select closed-path self-reachability, partial-view verdicts,
cross-feature restrictions, canonical transitive edges, or implementation.

## Coverage

Low, medium, and complex rungs preserve the same distinct-endpoint mixed-dimension
comparison. A, B, C, and D appear once per rung with equivalent depth. Unsupported
claims: zero; all scenario details are explicitly hypothetical.
`decision_effect: none`.
