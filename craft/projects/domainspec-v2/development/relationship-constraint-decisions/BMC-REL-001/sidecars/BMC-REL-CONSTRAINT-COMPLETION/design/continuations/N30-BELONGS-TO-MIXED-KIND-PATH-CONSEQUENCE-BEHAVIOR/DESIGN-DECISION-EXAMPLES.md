# N30 Complexity Example Ladder

Every Entity name and arrangement is hypothetical. The invariant is a
topology-admitted canonical `belongs-to` path with distinct endpoints, length at
least two, and at least two exact active D30 membership kinds. The examples use
D30's exact direct meanings; they do not import ownership semantics.

## Low Complexity

Hypothetical path: `Draft --[belongs-to:classification]--> Editorial-Item
--[belongs-to:home-assignment]--> Editorial-Desk`.

- **A — Direct facts only:** Draft is directly classified under/by Editorial-Item,
  and Editorial-Desk is directly assigned as Editorial-Item's home or placement
  context. No Draft-to-Editorial-Desk mixed-path consequence is derived.
- **B — Trace-preserving reachability:** the same two direct facts keep those exact
  meanings, and Draft additionally has a non-authoritative reachability result to
  Editorial-Desk with ordered trace `[classification, home-assignment]`.
- **C — Defer:** preserve both direct facts and leave the mixed-path consequence unresolved.
- **D — Stop:** retain the evidence and terminate this continuation.

This demonstrates direct facts versus trace-preserving reachability. It does not
prove a real editorial model, self-reachability, storage, or implementation.

## Medium Complexity

Added complexity: a longer path and a second route. Hypothetical facts are
`Reply -classification-> Discussion-Item -home-assignment-> Forum
-classification-> Collaboration-Space` plus
`Reply -home-assignment-> Reply-Queue -classification-> Forum`.

- **A — Direct facts only:** each authored fact keeps its exact classification or
  home-assignment meaning; neither mixed route adds an endpoint consequence.
- **B — Trace-preserving reachability:** Reply has non-authoritative results to Forum
  under traces `[classification, home-assignment]` and
  `[home-assignment, classification]`, and to Collaboration-Space under
  `[classification, home-assignment, classification]`; no direct fact is replaced.
- **C — Defer:** preserve the direct facts and leave multi-route consequence unresolved.
- **D — Stop:** preserve evidence and end without a behavior policy.

This adds length and multiple ordered traces. It does not choose result coalescence,
provenance, completeness, naming, or representation.

## Complex

Added complexity: branching, reconvergence, a boundary, incomplete visibility, and
an adjacent excluded closed path. Hypothetical distinct-endpoint routes are
`Draft -classification-> Content-Item -home-assignment-> Workspace` and
`Draft -home-assignment-> Intake-Queue -classification-> Workspace`; separately,
`A -classification-> B -home-assignment-> A` closes, and external adjacency may be unseen.

- **A — Direct facts only:** each observed fact keeps its exact D30 meaning;
  reconvergence, missing adjacency, and the separate closed path add no derived result.
- **B — Trace-preserving reachability:** Draft has non-authoritative reachability to
  Workspace under both ordered kind traces; the equal-endpoint A-to-A path remains
  outside N30 and incomplete-evidence semantics remain separate.
- **C — Defer:** preserve the facts and closed-path exclusion while leaving the
  distinct-endpoint mixed consequence unresolved.
- **D — Stop:** terminate before mixed-path behavior, self-reachability,
  completeness, naming, provenance, or representation authority.

This adds branches, uncertainty, and a nearby excluded case. It does not select
closed-path self-reachability, partial-view verdicts, canonical transitive edges,
cross-feature behavior, or implementation.

## Coverage

All three rungs cover A, B, C, and D once with equivalent depth. Unsupported claims:
zero; all scenario details are hypothetical. Recommendation remains A.
`decision_effect: none`.
