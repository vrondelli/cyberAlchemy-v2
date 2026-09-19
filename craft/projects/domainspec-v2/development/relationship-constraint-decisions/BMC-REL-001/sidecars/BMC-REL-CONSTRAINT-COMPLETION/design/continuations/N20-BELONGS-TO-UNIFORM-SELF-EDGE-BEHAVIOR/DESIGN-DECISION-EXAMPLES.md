# N20 Complexity Example Ladder

All scenarios are hypothetical. The invariant is the uniform validity treatment of one
direct canonical `belongs-to` proposition whose source and target Entity concept IDs
are equal inside one exact admitted D30 kind. The examples do not select an option.
`decision_effect: none`.

## Low Complexity — One Classification Self-Edge

Scenario: hypothetical `CategoryA --[belongs-to_classification]--> CategoryA`.

- **A — Reject uniformly:** this direct self-edge is invalid; repair or remove the
  authored fact, without requiring a replacement classifier.
- **B — Allow uniformly:** this direct self-edge is valid but optional; it consumes the
  one direct `classification` parent slot for this source.
- **C — Defer:** leave validity unresolved and keep Design blocked.
- **D — Stop:** terminate this continuation without direct self-edge behavior authority.

Demonstrates: invalid versus valid-but-optional treatment of the same direct fact. Does
not prove that any real Entity should classify itself or decide longer cycles.

## Medium Complexity — Both Current Kinds

Added complexity: the same hypothetical Entity has separate direct self-edge candidates
under `classification` and `home-assignment`, plus no other parent in either kind.

- **A — Reject uniformly:** both candidates are invalid and require source repair;
  neither kind is required to receive a replacement parent.
- **B — Allow uniformly:** both candidates are valid but optional, each independently
  occupying its own exact kind's direct-parent slot.
- **C — Defer:** both candidates remain unresolved with no behavior selected.
- **D — Stop:** end the route; neither candidate gains validity authority.

Demonstrates: N19's uniform behavior across pairwise non-overlapping kinds while D07
uniqueness remains per kind. Does not authorize mandatory membership, kind collapse, or
cross-kind parent competition.

## Complex — Registry Evolution And Separate Topology Residue

Added complexity: current self-edge candidates occur in different features, a separate
two-Entity membership cycle exists, and a later Definitions decision adds a hypothetical
third admitted kind.

- **A — Reject uniformly:** current and later-kind direct self-edges are invalid; the
  distinct-Entity cycle and cross-feature semantics remain unresolved.
- **B — Allow uniformly:** current and later-kind direct self-edges are valid but
  optional; the distinct-Entity cycle and cross-feature semantics remain unresolved.
- **C — Defer:** current and future-kind candidates remain blocked, with the separate
  cycle still outside this gate.
- **D — Stop:** terminate without governing current or future direct self-edges.

Demonstrates: uniform registry evolution plus preservation of independent topology and
feature-scope residue. Does not prove cycle behavior, transitivity, closure, duplicates,
representation, runtime behavior, numeric bounds, or packet authority.

## Coverage

- Rungs: 3/3.
- A, B, C, and D appear exactly once per rung with equivalent scenario depth.
- Unsupported claims: 0; every scenario detail is labelled hypothetical.
- Recommendation preserved: A, uniform rejection.
- Decision effect: none.
