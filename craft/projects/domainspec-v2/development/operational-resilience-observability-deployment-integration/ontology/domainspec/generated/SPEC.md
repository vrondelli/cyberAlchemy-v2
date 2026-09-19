# Orodi Operational Evidence Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `31ac6387124aae6b79d224eb533a2c22bfc33ca680710297fa7a7e54859df0ac`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `orodi-operational-evidence.AggregateClaim` | Operation | Append one aggregate receipt over exactly one claim-specific control set without importing proposed or missing controls. |
| `orodi-operational-evidence.AnalyzeCanary` | Operation | Append a passed, failed, or inconclusive canary-analysis receipt from complete stable and candidate evidence without shifting traffic. |
| `orodi-operational-evidence.AssembleEvaluationBinding` | Operation | Create one complete exact evaluation binding or reject it with typed missing or invalid state. |
| `orodi-operational-evidence.BindingAssembled` | Event | Record that one exact evaluation binding was assembled successfully. |
| `orodi-operational-evidence.CanaryAnalyzed` | Event | Record that complete canary evidence was analyzed without traffic or deployment authority. |
| `orodi-operational-evidence.ClaimAggregated` | Event | Record that one exact claim-specific control set produced an aggregate receipt. |
| `orodi-operational-evidence.ControlEvaluated` | Event | Record that one declared control produced a typed evaluation receipt. |
| `orodi-operational-evidence.DeploymentEffectObserved` | Event | Record observed evidence of a separately authorized deployment effect. |
| `orodi-operational-evidence.DeploymentTransition` | Entity | Track candidate, authorization, observation, rollback inventory, and terminal state without allowing evidence to create an external effect. |
| `orodi-operational-evidence.EvaluateControl` | Operation | Append one typed per-control evaluation receipt from a complete current binding and required observations. |
| `orodi-operational-evidence.EvaluateRollback` | Operation | Append a rollback evaluation receipt only after every declared resource is checked for zero candidate references before the deadline. |
| `orodi-operational-evidence.EvaluationBinding` | Entity | Bind one operational evaluation to exact subjects, environments, owners, artifacts, profiles, tools, policies, fixtures, observations, evaluators, expiry, and invalidation keys. |
| `orodi-operational-evidence.EvidenceStatesRemainDistinct` | Rule | Return true only when passed, failed, missing, invalid, inconclusive, stale, and not-run remain disjoint. |
| `orodi-operational-evidence.ExactBindingRequired` | Rule | Return true only when every required subject, owner, artifact, profile, evaluator, observation, expiry, and invalidation identity is exact and current. |
| `orodi-operational-evidence.MissingDataFailsClosed` | Rule | Return true only when missing, unknown, disabled, incomplete, or stale evidence cannot become pass. |
| `orodi-operational-evidence.ObservationRecorded` | Event | Record that one bounded product observation was appended with provenance. |
| `orodi-operational-evidence.ObserveDeploymentEffect` | Operation | Append evidence of a separately authorized deployment effect without creating or authorizing that effect. |
| `orodi-operational-evidence.ObserverCannotActuate` | Rule | Return true only when observers append evidence without actuating deployment, rollback, admission, promotion, or release. |
| `orodi-operational-evidence.OperationalContract` | Entity | Own one finite operational-control denominator and its explicit non-collapse rules without owning execution authority. |
| `orodi-operational-evidence.OperationalEvaluation` | Entity | Preserve immutable per-control outcomes and one claim-bounded aggregate verdict. |
| `orodi-operational-evidence.OperationalEvaluator` | Entity | Identify the bounded evaluator responsible for producing typed evidence without actuation authority. |
| `orodi-operational-evidence.ProfileCannotRedefineMeaning` | Rule | Return true only when tool and runtime profiles bind mechanics without redefining DomainSpec operational meaning. |
| `orodi-operational-evidence.ProjectionResult` | Entity | Preserve one deterministic offline projection that retains denied admission, replay-only eligibility, and exact snapshot provenance. |
| `orodi-operational-evidence.ProjectRuntimeSnapshot` | Operation | Materialize a deterministic offline projection from one exact runtime snapshot while retaining denied admission and raw-pack provenance. |
| `orodi-operational-evidence.RecordObservation` | Operation | Append one privacy- and cardinality-bounded product observation with exact provenance. |
| `orodi-operational-evidence.RollbackEvaluated` | Event | Record that rollback restoration evidence and all declared candidate references were evaluated. |
| `orodi-operational-evidence.RollbackRequiresZeroCandidateReferences` | Rule | Return true only when every declared candidate reference is absent before the rollback deadline and stable identity remains unchanged. |
| `orodi-operational-evidence.RuntimeObserver` | Entity | Identify an append-only observer that may record evidence but cannot actuate deployment, rollback, admission, promotion, or release. |
| `orodi-operational-evidence.RuntimeSnapshot` | Entity | Preserve one exact runtime-receipt-derived offline snapshot with denied admission and raw-pack provenance. |
| `orodi-operational-evidence.RuntimeSnapshotProjected` | Event | Record that one exact denied-admission runtime snapshot produced an offline projection. |
| `orodi-operational-evidence.SimulationCannotProveDeployment` | Rule | Return true only when simulation remains deployment-effect false and cannot satisfy actual-deployment evidence. |
| `orodi-operational-evidence.TelemetryMustConserve` | Rule | Return true only when offered equals queued plus rejected and queued equals exported plus dropped plus pending, with partial success explicit. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `orodi.edge.aggregate-produces-claim` | `orodi-operational-evidence.AggregateClaim` | `produces` | `orodi-operational-evidence.ClaimAggregated` |
| `orodi.edge.assemble-produces-binding` | `orodi-operational-evidence.AssembleEvaluationBinding` | `produces` | `orodi-operational-evidence.BindingAssembled` |
| `orodi.edge.canary-produces-analysis` | `orodi-operational-evidence.AnalyzeCanary` | `produces` | `orodi-operational-evidence.CanaryAnalyzed` |
| `orodi.edge.evaluate-produces-control` | `orodi-operational-evidence.EvaluateControl` | `produces` | `orodi-operational-evidence.ControlEvaluated` |
| `orodi.edge.evaluator-aggregates-claim` | `orodi-operational-evidence.OperationalEvaluator` | `performs` | `orodi-operational-evidence.AggregateClaim` |
| `orodi.edge.evaluator-analyzes-canary` | `orodi-operational-evidence.OperationalEvaluator` | `performs` | `orodi-operational-evidence.AnalyzeCanary` |
| `orodi.edge.evaluator-assembles-binding` | `orodi-operational-evidence.OperationalEvaluator` | `performs` | `orodi-operational-evidence.AssembleEvaluationBinding` |
| `orodi.edge.evaluator-evaluates-control` | `orodi-operational-evidence.OperationalEvaluator` | `performs` | `orodi-operational-evidence.EvaluateControl` |
| `orodi.edge.evaluator-evaluates-rollback` | `orodi-operational-evidence.OperationalEvaluator` | `performs` | `orodi-operational-evidence.EvaluateRollback` |
| `orodi.edge.exact-binding-enforces-assemble` | `orodi-operational-evidence.ExactBindingRequired` | `enforces` | `orodi-operational-evidence.AssembleEvaluationBinding` |
| `orodi.edge.missing-enforces-canary` | `orodi-operational-evidence.MissingDataFailsClosed` | `enforces` | `orodi-operational-evidence.AnalyzeCanary` |
| `orodi.edge.missing-enforces-evaluate` | `orodi-operational-evidence.MissingDataFailsClosed` | `enforces` | `orodi-operational-evidence.EvaluateControl` |
| `orodi.edge.missing-enforces-rollback` | `orodi-operational-evidence.MissingDataFailsClosed` | `enforces` | `orodi-operational-evidence.EvaluateRollback` |
| `orodi.edge.observe-deployment-produces-event` | `orodi-operational-evidence.ObserveDeploymentEffect` | `produces` | `orodi-operational-evidence.DeploymentEffectObserved` |
| `orodi.edge.observer-observes-deployment` | `orodi-operational-evidence.RuntimeObserver` | `performs` | `orodi-operational-evidence.ObserveDeploymentEffect` |
| `orodi.edge.observer-projects-snapshot` | `orodi-operational-evidence.RuntimeObserver` | `performs` | `orodi-operational-evidence.ProjectRuntimeSnapshot` |
| `orodi.edge.observer-records-observation` | `orodi-operational-evidence.RuntimeObserver` | `performs` | `orodi-operational-evidence.RecordObservation` |
| `orodi.edge.observer-rule-enforces-deployment` | `orodi-operational-evidence.ObserverCannotActuate` | `enforces` | `orodi-operational-evidence.ObserveDeploymentEffect` |
| `orodi.edge.observer-rule-enforces-record` | `orodi-operational-evidence.ObserverCannotActuate` | `enforces` | `orodi-operational-evidence.RecordObservation` |
| `orodi.edge.profile-enforces-assemble` | `orodi-operational-evidence.ProfileCannotRedefineMeaning` | `enforces` | `orodi-operational-evidence.AssembleEvaluationBinding` |
| `orodi.edge.project-produces-snapshot` | `orodi-operational-evidence.ProjectRuntimeSnapshot` | `produces` | `orodi-operational-evidence.RuntimeSnapshotProjected` |
| `orodi.edge.record-produces-observation` | `orodi-operational-evidence.RecordObservation` | `produces` | `orodi-operational-evidence.ObservationRecorded` |
| `orodi.edge.rollback-produces-evaluation` | `orodi-operational-evidence.EvaluateRollback` | `produces` | `orodi-operational-evidence.RollbackEvaluated` |
| `orodi.edge.rollback-zero-enforces-evaluate` | `orodi-operational-evidence.RollbackRequiresZeroCandidateReferences` | `enforces` | `orodi-operational-evidence.EvaluateRollback` |
| `orodi.edge.rollback-zero-enforces-project` | `orodi-operational-evidence.RollbackRequiresZeroCandidateReferences` | `enforces` | `orodi-operational-evidence.ProjectRuntimeSnapshot` |
| `orodi.edge.simulation-enforces-canary` | `orodi-operational-evidence.SimulationCannotProveDeployment` | `enforces` | `orodi-operational-evidence.AnalyzeCanary` |
| `orodi.edge.simulation-enforces-observation` | `orodi-operational-evidence.SimulationCannotProveDeployment` | `enforces` | `orodi-operational-evidence.ObserveDeploymentEffect` |
| `orodi.edge.states-enforce-aggregate` | `orodi-operational-evidence.EvidenceStatesRemainDistinct` | `enforces` | `orodi-operational-evidence.AggregateClaim` |
| `orodi.edge.states-enforce-evaluate` | `orodi-operational-evidence.EvidenceStatesRemainDistinct` | `enforces` | `orodi-operational-evidence.EvaluateControl` |
| `orodi.edge.telemetry-enforces-evaluate` | `orodi-operational-evidence.TelemetryMustConserve` | `enforces` | `orodi-operational-evidence.EvaluateControl` |
| `orodi.edge.telemetry-enforces-project` | `orodi-operational-evidence.TelemetryMustConserve` | `enforces` | `orodi-operational-evidence.ProjectRuntimeSnapshot` |

This file is generated; edit machine sources and rebuild.
