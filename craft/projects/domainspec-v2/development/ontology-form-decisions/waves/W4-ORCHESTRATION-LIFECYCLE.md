# W4 — Orchestration and lifecycle

- Workflow: declared steps, order, scope, terminal outcomes, failure, and
  compensation policy.
- State Machine: closed states, transition graph, exhaustiveness, invalid
  transition rejection, and transition effect policy.

Decide representation only after graph semantics are fixed. A reducer,
transition table, enum match, or typestate realization cannot redefine the
admitted workflow/state-machine graph. Exit when order, missing-step, invalid-
transition, and target-mutation negatives all fail causally.

