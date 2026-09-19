# Orodi Operator Interface Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `33e49dc0afdeedbf0c14cc4b01f6beb8840c006e3d24b2d37fea0c43a06fdee3`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `orodi-operator-interface.AlertEvaluationCannotActuate` | Rule | Return true only when alert evaluation has no control token, control endpoint, deployment, rollback, admission, acceptance, promotion, publication, or release action. |
| `orodi-operator-interface.AlertEvidence` | Entity | Record the rule, query, source status, alert state, and transition time needed to explain operator attention without repairing telemetry or claiming causation. |
| `orodi-operator-interface.AlertInstance` | Entity | Represent one bounded alert identity using fixed finite labels and no request, user, credential, or secret attributes. |
| `orodi-operator-interface.AlertRule` | Entity | Represent one declarative local condition over bounded ORODI metric projections with explicit timing and missing-data semantics. |
| `orodi-operator-interface.AlertState` | Entity | Represent normal, pending, firing, no_data, or error without treating any state as operational authority. |
| `orodi-operator-interface.AlertStateObserved` | Event | Record that one local alert instance was observed as normal, pending, firing, no_data, or error. |
| `orodi-operator-interface.CorrelateOperationalSignals` | Operation | Align metrics and events for one bounded run and time range without altering source evidence. |
| `orodi-operator-interface.EvaluateAlertRules` | Operation | Evaluate fixed local alert expressions over current Prometheus metric projections while preserving no-data and error states. |
| `orodi-operator-interface.LabelsMustRemainBounded` | Rule | Return true only when metric and log labels use declared finite values and exclude timestamps, request identifiers, and arbitrary strings. |
| `orodi-operator-interface.MetricProjection` | Entity | Represent a deterministic query-time projection of conserved gateway telemetry. |
| `orodi-operator-interface.MetricProjectionUpdated` | Event | Record that the displayed metric projection was recomputed from current source telemetry. |
| `orodi-operator-interface.NotificationDeliveryRequiresAuthority` | Rule | Return true only when local alert evaluation has no contact point and notification delivery remains a separately authorized external effect. |
| `orodi-operator-interface.ObserverCannotActuate` | Rule | Return true only when the interface has no control token, control endpoint, deployment, rollback, admission, promotion, or release actuation path. |
| `orodi-operator-interface.OperationalEventRecorded` | Event | Record that one bounded operational event was appended with run and time provenance. |
| `orodi-operator-interface.OperationalEventStream` | Entity | Represent append-only, run-correlated ORODI transition evidence with bounded attributes. |
| `orodi-operator-interface.OperatorInterface` | Entity | Present bounded local ORODI metrics and events without access to control-plane credentials or actuation paths. |
| `orodi-operator-interface.OperatorViewPresented` | Event | Record that a read-only operator view was rendered for human inspection. |
| `orodi-operator-interface.PresentOperatorView` | Operation | Render the provisioned read-only Grafana dashboard for human inspection. |
| `orodi-operator-interface.ProjectMetrics` | Operation | Evaluate fixed Prometheus queries over bounded ORODI metric names and labels. |
| `orodi-operator-interface.RecordOperationalEvent` | Operation | Append one structured ORODI transition event through the local telemetry collector. |
| `orodi-operator-interface.SensitiveFieldsMustBeExcluded` | Rule | Return true only when credentials, control tokens, request bodies, and arbitrary user values are absent from operational events. |
| `orodi-operator-interface.SignalCorrelation` | Entity | Align metric projections and operational events by bounded run and time without claiming causation. |
| `orodi-operator-interface.TelemetryMustConserve` | Rule | Return true only when projections preserve observed values and leave missing telemetry missing. |
| `orodi-operator-interface.VisualStateCannotPromote` | Rule | Return true only when dashboard and visual-validation states cannot be interpreted as admission, acceptance, publication, release, deployment, or rollback authority. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `orodi-operator-interface.edge.alert-evaluation-produces-state` | `orodi-operator-interface.EvaluateAlertRules` | `produces` | `orodi-operator-interface.AlertStateObserved` |
| `orodi-operator-interface.edge.alert-nonactuation-enforces-evaluation` | `orodi-operator-interface.AlertEvaluationCannotActuate` | `enforces` | `orodi-operator-interface.EvaluateAlertRules` |
| `orodi-operator-interface.edge.alert-rule-evaluates` | `orodi-operator-interface.AlertRule` | `performs` | `orodi-operator-interface.EvaluateAlertRules` |
| `orodi-operator-interface.edge.conservation-enforces-correlate` | `orodi-operator-interface.TelemetryMustConserve` | `enforces` | `orodi-operator-interface.CorrelateOperationalSignals` |
| `orodi-operator-interface.edge.conservation-enforces-project` | `orodi-operator-interface.TelemetryMustConserve` | `enforces` | `orodi-operator-interface.ProjectMetrics` |
| `orodi-operator-interface.edge.correlate-produces-view` | `orodi-operator-interface.CorrelateOperationalSignals` | `produces` | `orodi-operator-interface.OperatorViewPresented` |
| `orodi-operator-interface.edge.correlation-correlates` | `orodi-operator-interface.SignalCorrelation` | `performs` | `orodi-operator-interface.CorrelateOperationalSignals` |
| `orodi-operator-interface.edge.interface-presents-view` | `orodi-operator-interface.OperatorInterface` | `performs` | `orodi-operator-interface.PresentOperatorView` |
| `orodi-operator-interface.edge.labels-enforce-project` | `orodi-operator-interface.LabelsMustRemainBounded` | `enforces` | `orodi-operator-interface.ProjectMetrics` |
| `orodi-operator-interface.edge.labels-enforce-record` | `orodi-operator-interface.LabelsMustRemainBounded` | `enforces` | `orodi-operator-interface.RecordOperationalEvent` |
| `orodi-operator-interface.edge.metric-projects` | `orodi-operator-interface.MetricProjection` | `performs` | `orodi-operator-interface.ProjectMetrics` |
| `orodi-operator-interface.edge.nonactuation-enforces-correlate` | `orodi-operator-interface.ObserverCannotActuate` | `enforces` | `orodi-operator-interface.CorrelateOperationalSignals` |
| `orodi-operator-interface.edge.nonactuation-enforces-present` | `orodi-operator-interface.ObserverCannotActuate` | `enforces` | `orodi-operator-interface.PresentOperatorView` |
| `orodi-operator-interface.edge.notification-separation-enforces-evaluation` | `orodi-operator-interface.NotificationDeliveryRequiresAuthority` | `enforces` | `orodi-operator-interface.EvaluateAlertRules` |
| `orodi-operator-interface.edge.present-produces-view` | `orodi-operator-interface.PresentOperatorView` | `produces` | `orodi-operator-interface.OperatorViewPresented` |
| `orodi-operator-interface.edge.project-produces-metric` | `orodi-operator-interface.ProjectMetrics` | `produces` | `orodi-operator-interface.MetricProjectionUpdated` |
| `orodi-operator-interface.edge.record-produces-event` | `orodi-operator-interface.RecordOperationalEvent` | `produces` | `orodi-operator-interface.OperationalEventRecorded` |
| `orodi-operator-interface.edge.sensitive-enforces-record` | `orodi-operator-interface.SensitiveFieldsMustBeExcluded` | `enforces` | `orodi-operator-interface.RecordOperationalEvent` |
| `orodi-operator-interface.edge.stream-records-event` | `orodi-operator-interface.OperationalEventStream` | `performs` | `orodi-operator-interface.RecordOperationalEvent` |
| `orodi-operator-interface.edge.visual-enforces-present` | `orodi-operator-interface.VisualStateCannotPromote` | `enforces` | `orodi-operator-interface.PresentOperatorView` |

This file is generated; edit machine sources and rebuild.
