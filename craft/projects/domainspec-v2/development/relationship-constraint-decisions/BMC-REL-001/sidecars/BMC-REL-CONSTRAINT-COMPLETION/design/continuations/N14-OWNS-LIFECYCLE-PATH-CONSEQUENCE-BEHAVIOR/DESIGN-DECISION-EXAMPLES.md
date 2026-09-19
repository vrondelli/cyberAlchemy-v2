# N14 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
acyclic path containing only canonical `owns` facts in exact dimension `lifecycle`.
Every rung compares the same behavior choices without authoring new edges or choosing
an option.

## Low Complexity

Hypothetical path: `Portfolio --[owns:lifecycle]--> Account
--[owns:lifecycle]--> Entry`.

- **A — Direct-only:** Portfolio has direct lifecycle responsibility for Account;
  Account has direct lifecycle responsibility for Entry; no Portfolio-to-Entry
  lifecycle responsibility consequence is derived.
- **B — Derived reachability:** the same direct facts remain canonical, and Portfolio
  additionally has a non-authoritative derived lifecycle responsibility reachability
  consequence to Entry.
- **C — Defer:** keep the two direct facts and leave the path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates the direct-versus-derived distinction. It does not prove a real
domain ownership model, storage shape, or implementation.

## Medium Complexity

Added complexity: one longer chain and one direct shortcut. Hypothetical facts are
`Portfolio -> Account -> Entry -> Revision` plus direct lifecycle fact
`Portfolio -> Entry`.

- **A — Direct-only:** only the four authored direct facts have lifecycle
  responsibility consequences; the longer paths add no upstream responsibility.
- **B — Derived reachability:** Portfolio reaches Entry both directly and by a
  length-two path, and reaches Revision through the chain; those path results remain
  non-authoritative and do not duplicate or replace direct facts.
- **C — Defer:** preserve the direct facts and keep shortcut-versus-chain consequence
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple routes to one endpoint. It does not choose path
provenance, result coalescence, closure proof, or representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, and incomplete
visibility. Hypothetical lifecycle facts form `Root -> Left -> Leaf` and
`Root -> Right -> Leaf`; one branch crosses a feature boundary, and evidence may omit
outgoing facts outside the observed boundary.

- **A — Direct-only:** lifecycle consequences remain on each observed authored fact;
  reconvergence and missing external adjacency create no derived responsibility.
- **B — Derived reachability:** Root has a conceptual non-authoritative lifecycle
  reachability consequence to Leaf through either complete observed path; whether
  absence of another result is evaluable under incomplete evidence remains a later
  evidence decision.
- **C — Defer:** preserve the graph and evidence uncertainty without selecting a path
  consequence.
- **D — Stop:** terminate before behavior, completeness, or representation authority.

This adds branching, boundaries, and evidence uncertainty. It does not select
partial-view verdicts, cross-feature restrictions, path provenance, materialization,
or canonical transitive edges.

## Coverage

Low, medium, and complex rungs preserve the same lifecycle-only comparison. A, B, C,
and D appear once per rung with equivalent depth. Unsupported claims: zero; all
scenario details are explicitly hypothetical. `decision_effect: none`.
