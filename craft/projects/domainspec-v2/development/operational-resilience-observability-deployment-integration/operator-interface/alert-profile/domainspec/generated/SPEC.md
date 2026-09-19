# Orodi Alert Profile Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `fcccc1cee6165c10c30b46db18e5800ee0864ca11cb3ccae69e560815f4526fb`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `orodi-alert-profile.AlertArtifactRendered` | Event | Record that one exact profile and rule set were rendered deterministically into a bounded platform artifact. |
| `orodi-alert-profile.AlertCommissioningCompleted` | Event | Record that one bounded local alert commissioning exercise reached a terminal evidence state. |
| `orodi-alert-profile.AlertCommissioningEvidence` | Entity | Represent bounded firing, recovery, no-data, error, terminal-state, non-actuation, and notification-attempt evidence for exact rendered bytes. |
| `orodi-alert-profile.AlertEvidenceState` | Entity | Represent normal, pending, firing, no_data, or error while preserving the distinct source meaning of every state. |
| `orodi-alert-profile.AlertProfile` | Entity | Represent one versioned tool-neutral ORODI alert construction contract with no operational or notification authority. |
| `orodi-alert-profile.AlertRuleSet` | Entity | Represent one context-owned set of unique evidence-only rules referencing declared sources and finite labels. |
| `orodi-alert-profile.CommissioningMustProveStateTransitions` | Rule | Return true only when commissioning records intended firing, recovery, missing-data, evaluation-error, terminal, non-actuation, and zero-delivery evidence. |
| `orodi-alert-profile.CommissionRenderedAlerts` | Operation | Run a separately authorized bounded local evaluation exercise and retain evidence without external notification delivery. |
| `orodi-alert-profile.FailureMeaningMustRemainSeparate` | Rule | Return true only when observed breach, missing telemetry, and evaluation failure remain pairwise distinct evidence meanings. |
| `orodi-alert-profile.NotificationDeliveryBinding` | Entity | Represent the separately authorized external-effect contract that is absent from alert evaluation by default. |
| `orodi-alert-profile.NotificationDeliveryMustRemainSeparate` | Rule | Return true only when the alert profile and renderer add no externally reachable destination, credential, or delivery authority. |
| `orodi-alert-profile.RenderAlertProfile` | Operation | Validate one exact ORODI Alert Profile and deterministically render one platform artifact without adding authority or delivery. |
| `orodi-alert-profile.RenderedAlertArtifact` | Entity | Represent one deterministic platform configuration derived from exact profile, rule-set, renderer, and platform inputs. |
| `orodi-alert-profile.RendererMustPreserveSemantics` | Rule | Return true only when rendering preserves rule identity, predicates, timing, states, labels, non-actuation, and notification separation. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `orodi-alert-profile.edge.artifact-commissions` | `orodi-alert-profile.RenderedAlertArtifact` | `performs` | `orodi-alert-profile.CommissionRenderedAlerts` |
| `orodi-alert-profile.edge.commission-produces-evidence-event` | `orodi-alert-profile.CommissionRenderedAlerts` | `produces` | `orodi-alert-profile.AlertCommissioningCompleted` |
| `orodi-alert-profile.edge.commissioning-evidence-enforces-commission` | `orodi-alert-profile.CommissioningMustProveStateTransitions` | `enforces` | `orodi-alert-profile.CommissionRenderedAlerts` |
| `orodi-alert-profile.edge.failure-separation-enforces-render` | `orodi-alert-profile.FailureMeaningMustRemainSeparate` | `enforces` | `orodi-alert-profile.RenderAlertProfile` |
| `orodi-alert-profile.edge.notification-separation-enforces-render` | `orodi-alert-profile.NotificationDeliveryMustRemainSeparate` | `enforces` | `orodi-alert-profile.RenderAlertProfile` |
| `orodi-alert-profile.edge.profile-renders` | `orodi-alert-profile.AlertProfile` | `performs` | `orodi-alert-profile.RenderAlertProfile` |
| `orodi-alert-profile.edge.render-produces-artifact-event` | `orodi-alert-profile.RenderAlertProfile` | `produces` | `orodi-alert-profile.AlertArtifactRendered` |
| `orodi-alert-profile.edge.renderer-semantics-enforces-render` | `orodi-alert-profile.RendererMustPreserveSemantics` | `enforces` | `orodi-alert-profile.RenderAlertProfile` |
| `orodi-alert-profile.edge.rule-set-renders` | `orodi-alert-profile.AlertRuleSet` | `performs` | `orodi-alert-profile.RenderAlertProfile` |

This file is generated; edit machine sources and rebuild.
