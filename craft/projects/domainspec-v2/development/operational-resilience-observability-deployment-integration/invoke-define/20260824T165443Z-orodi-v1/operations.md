# Operations

| Operation | Preconditions | Result | Side effect |
| --- | --- | --- | --- |
| `AssembleEvaluationBinding` | exact owner decisions and immutable refs | complete or typed missing/invalid binding | none |
| `NormalizeFailure` | domain and integration mappings selected | distinct domain failure, integration outcome, exception mapping | none |
| `RecordObservation` | admitted schema, privacy/cardinality policy | append-only observation ref | evidence append only |
| `EvaluateControl` | complete fresh binding and required observations | one of passed/failed/missing/invalid/inconclusive/stale/not-run | evaluator receipt append only |
| `AggregateClaim` | exact claim-specific control set | typed aggregate verdict | aggregate receipt append only |
| `EvaluateInfrastructurePlan` | exact plan and policy bundle | clean/destructive/unknown facts and policy verdict | none; no apply authority |
| `AnalyzeCanary` | complete stable/candidate observations and policy | passed/failed/inconclusive receipt | none |
| `ObserveDeploymentEffect` | separate authorization and live observer | DeploymentReceipt | records effect; does not create it |
| `EvaluateRollback` | deployment receipt, trigger, full inventory, deadline | RollbackReceipt | evidence only |

Protected operations such as infrastructure apply, traffic shift, deployment, rollback actuation, promotion, and release are outside this Define contract.
