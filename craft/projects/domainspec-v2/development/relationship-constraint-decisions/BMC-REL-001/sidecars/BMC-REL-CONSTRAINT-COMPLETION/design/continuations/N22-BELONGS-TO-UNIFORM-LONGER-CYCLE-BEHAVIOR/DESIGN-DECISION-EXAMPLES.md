# N22 Complexity-Aligned Decision Examples

All Entity names and facts below are hypothetical. The invariant is constant across
all rungs: every edge in the candidate closed path carries one exact admitted D30
kind, the path has length at least two, and at least two distinct Entity IDs occur.
Recommendation and admissibility remain unchanged. Decision effect: `none`.

## Low — One Classification Cycle

Hypothetical scenario: `Topic-A belongs-to_classification Topic-B` and
`Topic-B belongs-to_classification Topic-A` form a two-Entity cycle.

- A: reject the cycle and require an authored edge to be repaired or removed; no
  replacement classifier is required.
- B: allow both direct facts; do not derive any additional membership or reachability.
- C: leave validity unresolved and block downstream enforcement.
- D: end this continuation without changing the candidate facts.

Demonstrates: the exact reject-versus-allow predicate. Does not prove either choice.

## Medium — Three-Entity Home Cycle And Acyclic Chain

Added complexity: `Workspace-A -> Workspace-B -> Workspace-C -> Workspace-A` uses
only `home-assignment`, while a separate classification chain stays acyclic.

- A: reject the three-Entity home-assignment cycle; leave the acyclic classification
  chain untouched.
- B: allow the three direct cycle facts and the acyclic chain; derive no closure.
- C: leave cycle validity unresolved for both current kinds.
- D: stop without changing either topology.

Demonstrates: uniform behavior applies to cycle length beyond two while preserving
non-cycles. Does not decide completeness or mixed-kind paths.

## Complex — Future Kind, Cross-Feature Facts, And Mixed-Kind Residue

Added complexity: a future owner admits hypothetical kind `affiliation`; an
`affiliation` cycle spans features; an unrelated path mixes `classification` and
`home-assignment` edges.

- A: reject the same-`affiliation` cycle under the uniform rule unless fresh authority
  changes governance; leave the mixed-kind path outside N22.
- B: allow the same-`affiliation` cycle without deriving reachability; leave the
  mixed-kind path outside N22.
- C: registry evolution does not resolve N22 and no behavior is selected.
- D: terminate the route; future-kind and mixed-kind questions remain untouched.

Demonstrates: current/later-kind uniformity and the mixed-kind boundary. Does not
admit `affiliation`, decide cross-feature policy, create exception tokens, prove
closure, or authorize representation/runtime behavior.

## Coverage

- Rungs: `3/3`
- Options per rung: A, B, C, D with equivalent depth
- Unsupported claims: `0`
- Unequal option coverage: `false`
- Decision effect: `none`
