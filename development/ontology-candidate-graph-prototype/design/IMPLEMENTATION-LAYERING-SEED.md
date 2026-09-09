# Design Implementation Layering Seed

Status: ready-for-future-plan

| Layer | Boundary | Entry dependency | Completion witness |
| --- | --- | --- | --- |
| L0 finite evaluator | schemas, policy loader, graph validation, in-memory projection | current Design pass | positive/negative/indeterminate suite |
| L1 evidence bundle | canonical serialization, receipt binding, create-only writer | L0 | two-run deterministic byte comparison |
| L2 isolation fence | protected selector digest set and denied-write capability | L1 | isolation attestation passes |
| L3 inspection surface | static HTML from canonical run JSON | L1 and UX contract | automation plus named human evidence |
| L4 optional adapter | repaired IOLM consumes candidate run contract | L0-L3 plus separate product work unit | adapter parity without authority collapse |

Future Plan should select L0 through L2 as one minimum workable unit. L3 is a
separate product-facing layer and L4 remains explicitly deferred.
