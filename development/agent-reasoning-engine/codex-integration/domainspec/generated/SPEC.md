# Codex Request Governance Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `884fdcb6af33860ac3860339fcc2f6cebfa705a66e4f360aa16eb22bce37f110`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `codex-request-governance.AppServerTurnBoundary` | Entity | Represent the client-owned Codex app-server boundary that receives turn/start input only after a direct preflight directive and exposes turn lifecycle events. |
| `codex-request-governance.AuthoritySeparation` | Rule | Keep routing, gating, approval mediation, validation, and receipts separate from Product Capability adoption and exact-effect authority. |
| `codex-request-governance.ContinuationAssessment` | Entity | Evaluate one completed turn and its mechanism-observed items into complete, direct, gate, or block without performing a successor. |
| `codex-request-governance.ContinuationProposal` | Entity | Represent one attributed continuation proposal from either the plan-bound or interaction-bound lane without treating proposal text as authority. |
| `codex-request-governance.ContinueUntilDecisionGate` | Rule | After turn/completed, reconcile plan-bound and interaction-bound proposals, and start at most one successor only when it is the sole safe plan-bound option. |
| `codex-request-governance.EffectApprovalBoundary` | Entity | Represent an app-server command, file-change, or permission approval callback whose exact effect must be evaluated before the wrapper responds. |
| `codex-request-governance.ImplementationBinding` | Entity | Bind the selected app-server interface to exact implementation and evidence bytes while preserving candidate, acceptance, conformance, and authority separation. |
| `codex-request-governance.IntegrationReceipt` | Entity | Join request, turn, item, profile, and decision identities to observable ordering without claiming semantic correctness or authorization. |
| `codex-request-governance.PreflightBeforeTurnStart` | Rule | Forbid forwarding turn/start until exact source verification and request routing yield one direct directive; gate and block yield no turn. |
| `codex-request-governance.RequestContext` | Entity | Preserve one raw Codex request with explicit posture for objective, effects, targets, constraints, evidence, and identity before route selection. |
| `codex-request-governance.RouteDirective` | Entity | Carry one deterministic direct, gate, or block preflight result with exact request, profile, decision, route, reason, and owner identities. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
