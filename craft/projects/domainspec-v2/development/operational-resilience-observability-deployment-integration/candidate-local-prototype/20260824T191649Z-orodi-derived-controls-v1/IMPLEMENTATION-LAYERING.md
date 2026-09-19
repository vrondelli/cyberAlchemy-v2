# Implementation Layering: ORODI Derived Foundational Controls

Status: `candidate-local-prototype`

## Layer decision table

| Layer | Decision unlocked | Minimum working unit | Included now | Deferred | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether raw ORODI facts can deterministically derive and challenge foundational control claims. | Closed derived-receipt contract, six pure evaluators, comparison, hostile tests | C01, C05, C11, C12, C14, C15; CLI; persisted fixtures | Legacy v1 adapters, tool/profile bindings, live collectors | compile, schema, unit, CLI, hostile, determinism, hygiene receipts |
| L1 | After this layer, we know whether legacy v1 evidence can be normalized without semantic loss. | One separately authorized adapter over pinned v1 fixtures | none | all adapter work | future adapter receipt |
| L2 | After this layer, we know whether admitted tools and environments satisfy the contracts. | Profile-bound collectors plus controlled integrations | none | load/fault/canary/infrastructure integrations | future owner-held evidence |
| L3 | After this layer, we know whether protected deployment and rollback claims are credible. | Authorized live run with owner-held receipts | none | all live effects | future protected-owner receipts |

## Non-regression guardrails

- Keep all seven evidence states distinct.
- Never let a claimed receipt determine its own derived state.
- Preserve product-evidence versus workflow-telemetry separation.
- Preserve `authority_effect: none` at every evaluator and aggregate boundary.
- Later adapters may translate source shape but may not weaken evaluator rules.

## Recommended next layer

Complete L0 only. L1 is a future separately authorized Work Pack after this candidate is validated and lifecycle reconciliation is performed or explicitly re-deferred.
