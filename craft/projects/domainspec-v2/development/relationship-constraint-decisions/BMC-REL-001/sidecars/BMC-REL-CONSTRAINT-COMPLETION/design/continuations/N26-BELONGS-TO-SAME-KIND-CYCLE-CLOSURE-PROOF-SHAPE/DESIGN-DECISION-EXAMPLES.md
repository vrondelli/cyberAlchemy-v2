# N26 Complexity-Aligned Decision Examples

All scenarios are hypothetical. The invariant is: the same N22 directed cycle
predicate is evaluated for one exact D30 kind, and both action options require
declared boundary identity/kind, complete eligible Entity population and placement,
and complete outgoing exact-kind adjacency. Decision effect: `none`.

## Low — One Complete Classification Boundary

Scenario: a declared boundary contains exactly `Reply-A`, `Reply-B`, and `Reply-C`.
All outgoing `classification` adjacency for those Entities is complete.

- A: accept the outgoing proof as sufficient for same-kind cycle evaluation.
- B: require complete incoming `classification` adjacency as well before evaluation.
- C: leave the closure-proof shape unresolved and retain N25 not-evaluated behavior.
- D: stop without changing the facts or proof state.

Demonstrates the minimal directional distinction. It does not choose how completeness
is serialized or prove a positive minimum.

## Medium — Cross-Feature Placement With Exact-Kind Filtering

Added complexity: the eligible population spans two declared feature placements;
`classification` outgoing adjacency is complete across both, while unrelated
`home-assignment` facts coexist.

- A: evaluate from the complete population and outgoing `classification` adjacency; ignore unrelated-kind facts for this predicate.
- B: additionally require incoming `classification` completeness across both placements.
- C: preserve the proof-shape blocker without treating `home-assignment` as missing classification evidence.
- D: stop without inferring placement or pooling kinds.

Demonstrates declared placement and exact-kind filtering. It does not infer closure
from feature scope or collapse the two D30 kinds.

## Complex — Complete Outgoing Graph With An Incomplete Reverse Index

Added complexity: several loaders contribute the complete eligible population and all
outgoing exact-kind facts, but one loader cannot attest a complete incoming index;
an observed N22 cycle elsewhere is already invalid independently.

- A: evaluate the clean boundary because every potential directed cycle edge is present through complete outgoing adjacency; keep the observed cycle invalid.
- B: return N25 not evaluated for the clean boundary until the incoming index also becomes complete; keep the observed cycle invalid.
- C: retain only the proof-shape decision blocker and do not weaken observed invalidity.
- D: terminate without treating the incomplete reverse index as graph mutation.

Demonstrates evidence acquisition, a failure path, and observed-violation precedence.
It does not authorize a reverse edge, incoming projection, storage format, or loader
implementation.

## Coverage

- Rungs: `3/3`
- Options per rung: A, B, C, D with equivalent depth
- Unsupported claims: `0`
- Unequal option coverage: `false`
- Decision effect: `none`
