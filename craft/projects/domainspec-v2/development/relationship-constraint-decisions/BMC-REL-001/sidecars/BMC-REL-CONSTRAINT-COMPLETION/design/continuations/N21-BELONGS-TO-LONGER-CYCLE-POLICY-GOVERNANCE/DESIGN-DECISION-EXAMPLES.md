# N21 Complexity-Aligned Decision Examples

All Entity names and facts below are hypothetical. The invariant is constant across
all rungs: N21 decides only whether a later same-kind longer-cycle behavior choice is
uniform across D30 kinds or independently governed per kind. It does not reject or
allow a cycle. Recommendation and admissibility remain unchanged. Decision effect:
`none`.

## Low — One Kind, One Two-Entity Cycle

Hypothetical scenario: under `classification`, `Topic-A belongs-to Topic-B` and
`Topic-B belongs-to Topic-A` form a cycle over two distinct Entities.

- A: the later reject/allow choice for this cycle shape will also govern every other
  admitted D30 kind.
- B: only `classification` gets a later behavior choice; `home-assignment` remains
  separately unresolved.
- C: no governance shape changes; behavior work remains blocked.
- D: this continuation ends with the cycle frontier unchanged.

Demonstrates: the uniform-versus-kind-specific partition. Does not prove whether the
cycle is valid or whether it creates derived membership.

## Medium — Two Current Kinds

Added complexity: a second independent kind and two separate cycle candidates.
Hypothetical scenario: the classification cycle above coexists with a
`home-assignment` cycle `Workspace-A -> Workspace-B -> Workspace-A`.

- A: one later behavior choice applies to both same-kind cycles.
- B: classification and home-assignment receive independent later behavior choices;
  either may differ only after its own owner gate.
- C: both governance questions remain unresolved and downstream behavior stays blocked.
- D: the route stops without changing either candidate.

Demonstrates: how governance partition affects multiple current kinds. Does not prove
that the two meanings should receive the same or different behavior.

## Complex — Registry Evolution And Cross-Feature Placement

Added complexity: a future registry entry, cross-feature facts, and an unrelated
mixed-kind path. Hypothetical scenario: current same-kind cycles occur under both
active kinds; a later owner admits `affiliation` as a third D30 kind; an unrelated path
mixes classification and home-assignment edges.

- A: the later uniform same-kind cycle behavior also governs `affiliation` unless
  fresh authority changes the policy; the mixed-kind path remains outside N21.
- B: each current kind and the future `affiliation` kind requires its own behavior
  decision and exact registry-digest review; the mixed-kind path remains outside N21.
- C: registry evolution does not resolve N21 and no cycle behavior is selected.
- D: the route terminates; future registry and mixed-kind questions remain untouched.

Demonstrates: future-kind and authority-boundary consequences. Does not prove future
registry admission, cross-feature behavior, mixed-kind topology, completeness,
representation, runtime, or numeric semantics.

## Coverage

- Rungs: `3/3`
- Options per rung: A, B, C, D with equivalent depth
- Unsupported claims: `0`
- Unequal option coverage: `false`
- Decision effect: `none`
