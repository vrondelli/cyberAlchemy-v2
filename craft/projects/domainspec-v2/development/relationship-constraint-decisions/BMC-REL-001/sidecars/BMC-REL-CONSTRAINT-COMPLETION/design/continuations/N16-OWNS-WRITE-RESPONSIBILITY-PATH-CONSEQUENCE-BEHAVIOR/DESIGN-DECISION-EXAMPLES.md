# N16 Complexity Example Ladder

All Entity names and arrangements below are hypothetical. The invariant is one
acyclic path containing only canonical `owns` facts in exact dimension
`write-responsibility`. Every rung compares the same behavior choices without
authoring new edges, turning runtime actors into owners, or choosing an option.

## Low Complexity

Hypothetical path: `Ledger --[owns:write-responsibility]--> Account
--[owns:write-responsibility]--> Balance`.

- **A — Direct-only:** Ledger has direct write-responsibility for Account; Account
  has direct write-responsibility for Balance; no Ledger-to-Balance consequence is
  derived.
- **B — Derived reachability:** the same direct facts remain canonical, and Ledger
  additionally has a non-authoritative derived write-responsibility reachability
  consequence to Balance.
- **C — Defer:** keep the two direct facts and leave the path consequence unresolved.
- **D — Stop:** retain existing evidence and terminate this continuation.

This demonstrates the direct-versus-derived distinction. It does not prove a real
domain responsibility model, permission model, storage shape, or implementation.

## Medium Complexity

Added complexity: one longer chain and one direct shortcut. Hypothetical facts are
`Ledger -> Account -> Balance -> Entry` plus direct write-responsibility fact
`Ledger -> Balance`.

- **A — Direct-only:** only the four authored direct facts have consequences; the
  longer paths add no upstream responsibility.
- **B — Derived reachability:** Ledger reaches Balance both directly and by a
  length-two path, and reaches Entry through the chain; those results remain
  non-authoritative and do not duplicate or replace direct facts.
- **C — Defer:** preserve the direct facts and keep shortcut-versus-chain consequence
  unresolved.
- **D — Stop:** preserve evidence and end the route without a behavior policy.

This adds path length and multiple routes to one endpoint. It does not choose path
provenance, result coalescence, closure proof, naming, or representation.

## Complex

Added complexity: branching, reconvergence, a feature boundary, incomplete
visibility, and a runtime writer. Hypothetical facts form
`Portfolio -> LeftAccount -> Balance` and `Portfolio -> RightAccount -> Balance`;
one branch crosses a feature boundary, evidence may omit external outgoing facts,
and hypothetical Operation `RecalculateBalance` writes Balance at runtime without
being a canonical `owns` edge.

- **A — Direct-only:** consequences remain on each observed authored fact;
  reconvergence, missing external adjacency, and the runtime Operation create no
  derived responsibility or new owner.
- **B — Derived reachability:** Portfolio has a conceptual non-authoritative
  reachability consequence to Balance through either complete observed canonical
  path; `RecalculateBalance` still contributes no ownership edge, and incomplete
  evidence semantics remain a separate question.
- **C — Defer:** preserve the graph and runtime-actor exclusion while leaving the
  path consequence unresolved.
- **D — Stop:** terminate before behavior, completeness, naming, provenance,
  representation, or runtime authority.

This adds branches, boundaries, uncertainty, and a non-owner runtime actor. It does
not select partial-view verdicts, cross-feature restrictions, path provenance,
materialization, permissions, runtime execution behavior, or canonical transitive
edges.

## Coverage

Low, medium, and complex rungs preserve the same write-responsibility-only
comparison. A, B, C, and D appear once per rung with equivalent depth. Unsupported
claims: zero; all scenario details are explicitly hypothetical.
`decision_effect: none`.
