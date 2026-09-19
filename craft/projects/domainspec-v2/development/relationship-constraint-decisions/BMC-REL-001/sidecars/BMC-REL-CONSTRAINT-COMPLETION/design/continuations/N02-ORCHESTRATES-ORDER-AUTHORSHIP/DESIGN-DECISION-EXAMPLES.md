# N02 Complexity Example Ladder

These are hypothetical, aligned examples. Every level keeps the same invariant:
one Workflow has distinct declared step IDs and needs one total order. The examples
explain options; they do not select one, prove a serialization, or authorize work.
`decision_effect: none`.

## Low Complexity — Three Steps

Declared steps: `validate`, `charge`, `confirm`.

- **A — sole authored `ordered_step_ids`:** author
  `[validate, charge, confirm]`. The `steps` array position has no meaning. Validation
  checks that each declared step ID appears exactly once.
- **B — sole authored total predecessor chain:** author `validate` as the one root,
  `charge after validate`, and `confirm after charge`; generate
  `[validate, charge, confirm]`. Validation must also prove one root, one path,
  acyclicity, complete coverage, and no branch or join.
- **C — defer:** keep representation unresolved; no representation-specific Design
  or Plan may proceed.
- **D — stop:** close this route without choosing a representation.

## Medium Complexity — Insert And Reorder

Declared steps begin as `validate`, `charge`, `confirm`; a reviewer inserts
`fraud_check` between validate and charge and moves confirm last.

- **A:** edit one ordered list to
  `[validate, fraud_check, charge, confirm]`. Merge conflicts concentrate on the
  list, and exact membership remains directly visible.
- **B:** change local predecessor links to form
  `validate -> fraud_check -> charge -> confirm`, then regenerate the list. The
  local edit can be narrower, but validation and merge logic must reject any edit
  that creates two roots, a fork, a join, a cycle, or a disconnected step.
- **C:** defer the representation decision and preserve only the declared steps.
- **D:** stop this Design continuation.

## Complex — Reuse, Metadata, And Concurrent Edits

A Workflow has eight step IDs across feature-owned fragments. Two distinct step IDs
reuse the same `NotifyCustomer` Operation binding, steps carry retry/compensation
metadata, and two authors concurrently insert different steps. The required order
is still total; branches and joins are outside N02.

- **A:** merge one sole-authored eight-ID order list. Reused Operation bindings stay
  distinct because order members are step IDs. Conflict resolution is explicit at
  the whole-order surface; validation is membership plus uniqueness.
- **B:** merge a sole-authored total chain and generate the eight-ID list. Local link
  edits may isolate change, but the system incurs graph-validation and generation
  obligations and must reject forks, joins, cycles, multiple roots, and disconnected
  fragments. Compensation metadata does not turn the chain into runtime scheduling.
- **C:** defer and avoid choosing conflict or generation semantics.
- **D:** stop; no later representation-dependent work is admitted.

## Decision Effect

No example changes evidence, option semantics, recommendation, or authority. They
only scale the same comparison from one list edit to multi-owner merge pressure.
