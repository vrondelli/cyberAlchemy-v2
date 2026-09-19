# Implementation Layering: ORODI Evidence Eligibility

## Layer boundary rule

Each layer answers: “After this layer, we know whether …”

| Layer | Decision question | Minimum working unit | Included now | Deferred | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether eligibility has a closed vocabulary and evidence boundary. | Closed request, receipt, result, and schema contracts. | `replay-only`, reserved `runtime-eligible`, `rejected`; source/control provenance. | Gate execution and CLI. | TypeScript compile and closed schema fixtures. |
| L1 | After this layer, we know whether legacy declarations are deterministically contained. | Pure legacy eligibility gate. | Exact inventory binding; simulation/no-effect/no-independent/no-telemetry invariants; no runtime admission. | Real profile admissions. | Golden classification and forged-observation hostile cases. |
| L2 | After this layer, we know whether containment survives end-to-end derived evaluation. | Replay assembler invokes the existing derived evaluator over runtime-admitted observations only. | Empty admitted set; exact derived states; claim mismatch rejection. | Generic live adapter composition. | C05/C15 `missing`, C11/C12 `not-run`, overall reject, comparison match. |
| L3 | After this layer, we know whether a separately owned live profile can become runtime eligible. | Future admitted-profile integration. | Nothing in WP4. | Tool profiles, real observations, load/canary/infra/deployment. | Separate owner acceptance and live evidence. |

## Non-regression guardrails

- WP1-WP3 contracts and 62 tests remain green.
- Replay observations remain visible for audit but never enter `runtime_admitted_observations`.
- `runtime-eligible` stays a reserved output value; WP4 has no input capable of producing it.
- Later layers cannot reinterpret a WP4 replay receipt as live evidence.

Recommended layer window: L0-L2 as one finite candidate-local proof. L3 remains deferred.
