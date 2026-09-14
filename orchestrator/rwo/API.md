# RWO Core API

Status: implementation candidate  
API version: `rwo-core-api/v1`  
Engine version: `rwo-core-dag/v2`  
Authority effect: none

The public API has four structural operations:

- `compile_work_graph(catalog, root, dag_id, deadline, parallelism)` recursively compiles uniform leaf/composite Work into a validated graph;
- `start(definition)` returns the initial cursor and deterministic root command batch;
- `apply_event(definition, cursor, accepted_event)` returns one next cursor and complete command batch;
- `replay(definition, accepted_events)` rebuilds state from an empty cursor.

All operations are in-memory and perform no I/O. The caller validates whether an
Event Proposal may become an accepted event and atomically persists the accepted
event, returned cursor, and complete command batch.

A node may declare `when: { dependency, pointer, equals }`. RWO evaluates this
condition only after the named dependency succeeds. A non-matching branch and
its unreachable descendants become `skipped`; a branch made impossible by a
failed dependency becomes `blocked`. This keeps domain decisions in typed node
outputs while making branch selection a generic structural operation.

## Open Questions

Control-flow extensions and condition policies must enter as generic structural
contracts during M5 rather than research-specific dependencies.
