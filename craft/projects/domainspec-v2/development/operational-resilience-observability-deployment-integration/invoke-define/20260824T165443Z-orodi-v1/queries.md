# Queries

| Query | Returns | Missing-data rule |
| --- | --- | --- |
| `EvaluationBindingStatus` | exact bindings and unresolved fields | unresolved fields return `missing` |
| `FailurePath` | correlated domain, integration, exception, retry, compensation and terminal facts | absent required hop cannot pass |
| `TelemetryCompleteness` | offered, queued, exported, rejected, dropped, pending and partial-success counts | incomplete accounting is inconclusive or failed |
| `ServiceLevelIndicator` | value, window, population and completeness | absent/partial window cannot pass |
| `WorkloadValidity` | generator utilization, sample count, target safety and threshold activation | disabled threshold or generator saturation is invalid |
| `InfrastructurePlanSafety` | clean/destructive/unknown fact set and policy verdict | unknown never authorizes apply |
| `CanaryVerdict` | stable/candidate comparison and controller presence | missing metrics/controller is inconclusive |
| `RollbackResiduals` | candidate refs per declared resource | any remaining candidate ref fails |
| `ReceiptFreshness` | current/stale plus changed invalidation keys | changed key is stale |

Every query binds its definition digest, input observation digests, evaluator identity, window, and expiry.
