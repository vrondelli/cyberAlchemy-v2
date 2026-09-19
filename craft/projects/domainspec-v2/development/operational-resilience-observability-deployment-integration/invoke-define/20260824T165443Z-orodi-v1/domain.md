# Domain Model

## Aggregates

- `OperationalContract`: owns the C01-C16 denominator, admitted claim sets, and non-collapse rules.
- `EvaluationBinding`: exact subject, environment, owners, profiles, tools, policies, fixtures, observations, evaluator, receipt, and freshness keys.
- `OperationalEvaluation`: immutable control outcomes and one aggregate verdict.
- `DeploymentTransition`: stable/candidate state, authorization, observation, rollback inventory, and terminal state.

## Value objects

`FailureMeaning`, `IntegrationOutcome`, `ExceptionMapping`, `ObservationRef`, `SLIDefinition`, `SLOPolicy`, `WorkloadProfileRef`, `EvaluatorRef`, `ReceiptRef`, `FreshnessWindow`, `InvalidationKey`, `CanaryPolicy`, `InfrastructurePlanFact`, and `RollbackInventory`.

## Invariants

- Meanings, observations, evaluations, and authority records are separate objects.
- All executable bindings use exact identities and digests.
- Evaluator output is typed and fail-closed.
- Proposed controls cannot enter an admitted claim set by aggregation.
- No evaluation object can authorize a protected effect.
