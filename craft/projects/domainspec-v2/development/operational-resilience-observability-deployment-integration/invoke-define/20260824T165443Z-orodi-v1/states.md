# States

## Evaluation lifecycle

`specified` → `bound` → `observing` → `evaluating` → terminal verdict.

Terminal verdicts are `passed`, `failed`, `missing`, `invalid`, `inconclusive`, `stale`, or `not-run`. They are disjoint. `specified-not-bound-not-run` is the current compound status for the research witness.

## Delivery lifecycle

`candidate-unselected` → `candidate-bound` → `plan-evaluated` → `authorized` → `canary-observed` → `deployed-observed` → `stable` or `rollback-required` → `rolled-back-observed`.

Only protected owners may cross `plan-evaluated` to `authorized` or actuate deployment/rollback transitions. Simulation occupies a separate `simulated` namespace and can never transition to `deployed-observed`.

## Profile lifecycle

`proposed` → `validated-candidate` → `owner-accepted` → `admitted` → `superseded` or `retired`.

This package admits none.
