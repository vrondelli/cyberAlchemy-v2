# N15 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
acyclic path containing only canonical `owns` facts in exact dimension `custody`.
Every rung compares the same behavior choices without authoring new edges or choosing
an option.

## Low Complexity

Hypothetical path: `Warehouse --[owns:custody]--> Cabinet
--[owns:custody]--> ArchiveBox`.

- **A — Direct-only:** Warehouse has direct custody responsibility for Cabinet;
  Cabinet has direct custody responsibility for ArchiveBox; no Warehouse-to-
  ArchiveBox custody consequence is derived.
- **B — Derived reachability:** the same direct facts remain canonical, and Warehouse
  additionally has a non-authoritative derived custody reachability consequence to
  ArchiveBox.
- **C — Defer:** keep the two direct facts and leave the path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates the direct-versus-derived distinction. It does not prove a real
domain custody model, storage shape, or implementation.

## Medium Complexity

Added complexity: one longer chain and one direct shortcut. Hypothetical facts are
`Warehouse -> Cabinet -> ArchiveBox -> Folder` plus direct custody fact
`Warehouse -> ArchiveBox`.

- **A — Direct-only:** only the four authored direct facts have custody consequences;
  the longer paths add no upstream responsibility.
- **B — Derived reachability:** Warehouse reaches ArchiveBox both directly and by a
  length-two path, and reaches Folder through the chain; those path results remain
  non-authoritative and do not duplicate or replace direct facts.
- **C — Defer:** preserve the direct facts and keep shortcut-versus-chain consequence
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple routes to one endpoint. It does not choose path
provenance, result coalescence, closure proof, naming, or representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, and incomplete
visibility. Hypothetical custody facts form `Depot -> LeftStore -> Parcel` and
`Depot -> RightStore -> Parcel`; one branch crosses a feature boundary, and evidence
may omit outgoing facts outside the observed boundary.

- **A — Direct-only:** custody consequences remain on each observed authored fact;
  reconvergence and missing external adjacency create no derived responsibility.
- **B — Derived reachability:** Depot has a conceptual non-authoritative custody
  reachability consequence to Parcel through either complete observed path; whether
  absence of another result is evaluable under incomplete evidence remains a later
  evidence decision.
- **C — Defer:** preserve the graph and evidence uncertainty without selecting a path
  consequence.
- **D — Stop:** terminate before behavior, completeness, naming, provenance, or
  representation authority.

This adds branching, boundaries, and evidence uncertainty. It does not select
partial-view verdicts, cross-feature restrictions, path provenance, materialization,
write-responsibility behavior, lifecycle behavior, or canonical transitive edges.

## Coverage

Low, medium, and complex rungs preserve the same custody-only comparison. A, B, C,
and D appear once per rung with equivalent depth. Unsupported claims: zero; all
scenario details are explicitly hypothetical. `decision_effect: none`.
