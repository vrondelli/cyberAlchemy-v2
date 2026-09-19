# Complexity Example Ladder — `emits.numeric_bounds`

- Mode: explanatory comparison of non-authoritative research controls.
- Invariant: count distinct authored canonical Entity-ID to Event-ID facts after exact-duplicate rejection.
- Assumptions: every scenario below is hypothetical. When minima are compared, the scenario explicitly declares complete eligible populations plus outgoing and incoming `emits` closure.
- Decision effect: none.

The controls are not owner options:

- RC-A: `0..unbounded` outgoing; `0..unbounded` incoming.
- RC-B: `0..unbounded` outgoing; `0..1` incoming.
- RC-C: `0..1` outgoing; `0..unbounded` incoming.
- RC-D: `1..unbounded` outgoing; `1..1` incoming.

## Low

- Scenario: one eligible Entity `E1`, one eligible Event `V1`, and one fact `E1 --[emits]--> V1`; both populations and both adjacency directions are declared complete.
- Results: RC-A, RC-B, RC-C, and RC-D all pass.
- Demonstrates: one degree-one fact cannot distinguish the four controls.
- Does not prove: either minimum, either maximum, or that the canonical example is a complete graph.

## Medium

- Added complexity: one source has two distinct targets.
- Scenario: eligible populations `{E1}` and `{V1,V2}`; facts `E1->V1` and `E1->V2`; both populations and both directions are closed.
- Results: RC-A, RC-B, and RC-D pass; RC-C fails `source_max=1`.
- Demonstrates: a valid same-Entity multi-Event fixture would discriminate an outgoing finite maximum.
- Does not prove: that this hypothetical is canonically valid or anything about incoming uniqueness and optionality.

## Complex

- Added complexity: shared target, isolated eligible endpoints, and complete closure.
- Scenario: eligible Entities `{E1,E2,E3}`, eligible Events `{V1,V2,V3}`, facts `E1->V1`, `E1->V2`, and `E2->V1`; both populations and both directions are closed.
- Results: RC-A passes; RC-B fails `target_max=1`; RC-C fails `source_max=1`; RC-D fails `source_min=1`, `target_min=1`, and `target_max=1`.
- Demonstrates: the smallest useful fixture for distinguishing outgoing maximum, incoming maximum, and positive minima on identical facts.
- Does not prove: which control is correct, whether an Event may have several subjects, or whether every eligible concept must participate.

## Coverage

- Rungs: 3/3.
- Controls covered evenly: 4/4 at every rung.
- Unsupported claims: 0; every invented detail is labelled hypothetical.
- Decision effect: none.
- Next step: supply authoritative valid/invalid outcomes for these shapes with D02 closure evidence, then reassess owner-gate readiness.
