# Context Pack — SWU-SFOL-008

Selected `SWU-SFOL-008` after the passing SWU-007 owner receipt. Scope is only
the finite effect-trace value contract, source-relation evaluation, an
adopter-neutral positive/negative corpus, and this evidence.

The trace contract declares exact pre/post fields and types, an exact ordered
sequence of call/write/event/error observations, their payload types, optional
return observation, semantic record IDs, and a finite event ceiling. Validation
must reject incomplete, extra, reordered, wrong-type, undeclared, duplicate,
and over-limit traces before relation evaluation.

The effect evaluator converts only a validated trace into fixed `pre`, `post`,
`effects`, and optional `result` variables and evaluates an admitted DS-SFOL
effect relation independently. It cannot run setup, invoke a harness, capture
resources, or alter pure evaluation. Harness lifecycle, node projection,
adopters, BTE semantic claims, authority, release, and production remain
excluded.
