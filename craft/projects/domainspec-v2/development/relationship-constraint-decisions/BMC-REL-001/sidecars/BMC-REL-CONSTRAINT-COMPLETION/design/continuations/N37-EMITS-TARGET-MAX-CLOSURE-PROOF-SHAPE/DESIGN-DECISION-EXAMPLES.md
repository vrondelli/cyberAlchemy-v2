# N37 Complexity Example Ladder

All scenarios are hypothetical. Shared invariant: A and B both bind boundary
identity/kind, complete eligible Entity and Event populations with placement, and
complete incoming `emits` adjacency for every eligible Event. B adds outgoing
adjacency closure; it does not change the selected `target_max = 1` predicate. C and
D are continuation states. `decision_effect: none`.

## Low Complexity — One Event in One Boundary

The boundary contains one eligible Entity, one eligible Event, and one authored
`Entity --[emits]--> Event` fact.

- **A — minimal incoming closure:** prove both populations and the Event's complete
  incoming adjacency, then evaluate one incoming Entity subject against the maximum.
- **B — symmetric closure:** prove the same evidence and also the Entity's complete
  outgoing adjacency, then evaluate the same incoming count.
- **C — defer:** preserve the facts and leave proof sufficiency unresolved.
- **D — stop:** end the continuation without declaring a proof shape.

Demonstrates: B adds proof work but no target-predicate difference. Limits: does not
select a manifest format, loader, or packet field.

## Medium Complexity — Several Same-Feature Partitions and Loaders

One declared validation boundary assembles several same-feature partitions through
multiple loaders. Every `emits` fact remains inside its canonical same-feature scope.
The boundary contains several eligible Entity and Event IDs; all incoming `emits`
adjacency for every eligible Event is assembled, while some Entity outgoing adjacency
remains open.

- **A — minimal incoming closure:** the complete two-population boundary and incoming
  adjacency are sufficient to evaluate every Event's subject count.
- **B — symmetric closure:** evaluation waits until every eligible Entity's outgoing
  adjacency is also complete, then applies the identical Event-side counts.
- **C — defer:** retain the assembled evidence without deciding sufficiency.
- **D — stop:** terminate N37; N36 A continues to withhold a whole-boundary verdict.

Added complexity: multiple endpoint IDs, same-feature partitions, multiple loaders,
and one direction still open. Limits: does not authorize cross-feature `emits`, choose
loader integration, or decide source-side constraints.

## Complex — Federated Assembly with a Late Entity Fact

Several authorities contribute fragments. The declared boundary and complete Entity
and Event populations are fixed. A late incoming fact gives one Event a second
distinct Entity subject; exact duplicates are already rejected.

- **A — minimal incoming closure:** wait for complete incoming adjacency, then reject
  the Event's count of two; outgoing closure is unnecessary to that result.
- **B — symmetric closure:** also wait for complete outgoing adjacency, then reject
  the same Event for the same target-maximum reason.
- **C — defer:** establish no closure-proof policy; the two visible subjects remain an
  observed violation independently.
- **D — stop:** establish no N37 policy; earlier numeric and N36 selections remain.

Added complexity: multiple authorities, late evidence, duplicate handling, and an
observed violation. Limits: does not select authority precedence, merge algorithms,
runtime Event instances, serialization, or implementation.

## Coverage

- Rungs: `3/3`
- Presented options: A, B, C, and D exactly once per rung
- Explain standing choice: available, non-committal, and not a decision answer
- Shared invariant preserved: yes
- Unsupported claims: `0`; scenario details are hypothetical
- Decision effect: `none`
