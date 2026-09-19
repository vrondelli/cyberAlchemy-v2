# N29 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
acyclic path containing only canonical `belongs-to` facts of exact active D30 kind
`home-assignment`. Every rung compares the same behavior choices without authoring
new edges or choosing an option.

## Low Complexity

Hypothetical path: `Draft-42 --[belongs-to:home-assignment]--> Editorial-Desk
--[belongs-to:home-assignment]--> Publishing-Branch`.

- **A — Direct-only:** Draft-42 is assigned directly to Editorial-Desk, and
  Editorial-Desk is assigned directly to Publishing-Branch; no
  Draft-42-to-Publishing-Branch
  home-assignment consequence is derived.
- **B — Derived reachability:** the same direct facts remain canonical, and
  Draft-42 additionally has a non-authoritative derived home-assignment
  reachability consequence to Publishing-Branch.
- **C — Defer:** keep the two direct facts and leave the path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates the direct-versus-derived distinction. It does not prove a real
domain home-assignment model, storage shape, or implementation.

## Medium Complexity

Added complexity: one longer chain and one direct shortcut. Hypothetical facts are
`Draft-42 -> Editorial-Desk -> Publishing-Branch -> Global-Publishing` plus a direct
home-assignment fact `Draft-42 -> Publishing-Branch`.

- **A — Direct-only:** only the four authored direct facts have home-assignment
  consequences; the longer paths add no first-to-last home-assignment.
- **B — Derived reachability:** Draft-42 reaches Publishing-Branch both directly
  and by a length-two path, and reaches Global-Publishing through the chain; those path
  results remain non-authoritative and do not duplicate or replace direct facts.
- **C — Defer:** preserve the direct facts and keep shortcut-versus-chain consequence
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple routes to one endpoint. It does not choose result
coalescence, path provenance, closure proof, or representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, and incomplete
visibility. Hypothetical home-assignment facts form `Draft -> Local-Desk ->
Publishing-Group` and `Draft -> Remote-Desk -> Publishing-Group`; one branch crosses
a feature boundary, and evidence may
omit outgoing facts outside the observed boundary.

- **A — Direct-only:** home-assignment consequences remain on each observed authored
  fact; reconvergence and missing external adjacency create no derived result.
- **B — Derived reachability:** Draft has a non-authoritative home-assignment
  reachability consequence to Publishing-Group through either complete
  observed path; whether absence of another result is evaluable under incomplete
  evidence remains a later evidence decision.
- **C — Defer:** preserve the graph and evidence uncertainty without selecting a
  path consequence.
- **D — Stop:** terminate before behavior, completeness, or representation authority.

This adds branching, boundaries, and evidence uncertainty. It does not select
partial-view verdicts, cross-feature restrictions, path provenance, materialization,
classification behavior, or canonical transitive edges.

## Coverage

Low, medium, and complex rungs preserve the same home-assignment-only comparison. A,
B, C, and D appear once per rung with equivalent depth. Unsupported claims: zero;
all scenario details are explicitly hypothetical. `decision_effect: none`.
