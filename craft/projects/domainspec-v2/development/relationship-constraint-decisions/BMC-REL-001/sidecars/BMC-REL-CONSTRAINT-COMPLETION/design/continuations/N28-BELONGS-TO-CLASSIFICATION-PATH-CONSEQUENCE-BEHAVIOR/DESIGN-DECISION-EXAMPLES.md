# N28 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
acyclic path containing only canonical `belongs-to` facts of exact active D30 kind
`classification`. Every rung compares the same behavior choices without authoring
new edges or choosing an option.

## Low Complexity

Hypothetical path: `Invoice-42 --[belongs-to:classification]--> Invoice
--[belongs-to:classification]--> Financial-Document`.

- **A — Direct-only:** Invoice-42 is directly classified by Invoice, and Invoice is
  directly classified by Financial-Document; no Invoice-42-to-Financial-Document
  classification consequence is derived.
- **B — Derived reachability:** the same direct facts remain canonical, and
  Invoice-42 additionally has a non-authoritative derived classification
  reachability consequence to Financial-Document.
- **C — Defer:** keep the two direct facts and leave the path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates the direct-versus-derived distinction. It does not prove a real
domain classification model, storage shape, or implementation.

## Medium Complexity

Added complexity: one longer chain and one direct shortcut. Hypothetical facts are
`Invoice-42 -> Invoice -> Financial-Document -> Business-Record` plus a direct
classification fact `Invoice-42 -> Financial-Document`.

- **A — Direct-only:** only the four authored direct facts have classification
  consequences; the longer paths add no first-to-last classification.
- **B — Derived reachability:** Invoice-42 reaches Financial-Document both directly
  and by a length-two path, and reaches Business-Record through the chain; those path
  results remain non-authoritative and do not duplicate or replace direct facts.
- **C — Defer:** preserve the direct facts and keep shortcut-versus-chain consequence
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple routes to one endpoint. It does not choose result
coalescence, path provenance, closure proof, or representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, and incomplete
visibility. Hypothetical classification facts form `Root -> Left -> Category` and
`Root -> Right -> Category`; one branch crosses a feature boundary, and evidence may
omit outgoing facts outside the observed boundary.

- **A — Direct-only:** classification consequences remain on each observed authored
  fact; reconvergence and missing external adjacency create no derived result.
- **B — Derived reachability:** Root has a conceptual non-authoritative
  classification reachability consequence to Category through either complete
  observed path; whether absence of another result is evaluable under incomplete
  evidence remains a later evidence decision.
- **C — Defer:** preserve the graph and evidence uncertainty without selecting a
  path consequence.
- **D — Stop:** terminate before behavior, completeness, or representation authority.

This adds branching, boundaries, and evidence uncertainty. It does not select
partial-view verdicts, cross-feature restrictions, path provenance, materialization,
home-assignment behavior, or canonical transitive edges.

## Coverage

Low, medium, and complex rungs preserve the same classification-only comparison. A,
B, C, and D appear once per rung with equivalent depth. Unsupported claims: zero;
all scenario details are explicitly hypothetical. `decision_effect: none`.
