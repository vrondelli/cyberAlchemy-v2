# Events

- `EvaluationBindingAssembled` or `EvaluationBindingRejected`
- `FaultActivated`, `FailureNormalized`, `RetryObserved`, `CompensationObserved`, `TerminalOutcomeObserved`
- `TelemetryOffered`, `TelemetryQueued`, `TelemetryExported`, `TelemetryRejected`, `TelemetryDropped`, `TelemetryPartialSuccess`
- `HealthTransitionObserved`, `ReadinessRemoved`, `TrafficMembershipRemoved`
- `WorkloadStarted`, `WorkloadAborted`, `WorkloadCompleted`
- `ControlEvaluated`, `ClaimAggregated`, `ReceiptExpired`, `ReceiptInvalidated`
- `InfrastructurePlanEvaluated`, `CanaryAnalyzed`
- `DeploymentAuthorized`, `DeploymentEffectObserved`, `RollbackTriggered`, `RollbackEffectObserved`

Events record facts and provenance. Evidence events do not grant authority, and workflow telemetry events are stored separately from product events.
