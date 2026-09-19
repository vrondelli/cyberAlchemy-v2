# Decisions and Risks

## Decisions

1. Use an append-only evidence spine and keep evaluators non-actuating.
2. Preserve distinct semantic, integration, profile, runtime, objective, workload, receipt, acceptance and protected-effect owners.
3. Treat C01-C16/M01-M13 as the admitted design denominator and C17-C20/M14-M17 as proposed only.
4. Keep product observability separate from Arcanum workflow telemetry.
5. Keep private DomainSpec semantics separate from public Arcanum profile mechanics.
6. Require actual deployment observation for C12; simulation cannot substitute.
7. Make the current Plan non-executing until exact live bindings and profile/tool admissions exist.

## Risks and treatment

| Risk | Consequence | Design treatment |
| --- | --- | --- |
| semantic/tool collapse | tool output silently defines domain truth | explicit profile mapping boundary |
| observer actuation | monitoring becomes an unsafe controller | non-actuating evaluator contract |
| missing-data optimism | incomplete telemetry passes | typed fail-closed states |
| generator bottleneck | load result describes generator, not subject | generator utilization control |
| simulation inflation | state-machine test claimed as deployment | distinct simulated/live receipts |
| stale reuse | old receipt passes after configuration change | expiry and invalidation keys |
| rollback incompleteness | candidate remains on one resource | full inventory and zero-reference predicate |
| authority collapse | analysis treated as apply/deploy/release approval | separate protected owner gates |
| privacy/cardinality failure | sensitive or unbounded telemetry | allowlist, budget, rejection and retention contract |
| private/public leakage | DomainSpec material copied into Arcanum | directional projection and owner review |

## Deferred decisions

Exact owners, environments, profiles, tools, policies, thresholds, receipt schemas, expiry, infrastructure targets, canary controller, deployment transport, rollback inventory, and C17-C20 admission remain deferred to named future owner decisions.
