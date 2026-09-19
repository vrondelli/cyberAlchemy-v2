# Operational Resilience, Observability, and Deployment Integration Specification

Status: Invoke Define candidate, source-bound and non-executing.

## Purpose

Define the smallest non-collapsing contract that lets DomainSpec describe error handling, monitoring, observability, workload evaluation, infrastructure planning, canary analysis, deployment evidence, and rollback while keeping domain meaning separate from tools, profiles, runtime facts, and protected owner decisions.

The result is a planning contract. Its witness `W-ORODI-001-R2` remains **specified-not-bound-not-run**.

## Success condition

Define succeeds when the accepted research is translated into:

- separate semantic, integration, profile, runtime, objective, workload, evaluator, receipt, acceptance, admission, deployment, promotion, and release layers;
- a complete C01-C16 evidence-closed control denominator and M01-M13 hostile denominator;
- visibly proposed, unadmitted C17-C20 and M14-M17 overlays;
- explicit owner, evidence, freshness, privacy, and failure-state rules;
- a design input that cannot be mistaken for live validation or execution authority.

## Core invariants

1. Domain failure meaning, integration outcome, and runtime exception remain distinct.
2. `passed`, `failed`, `missing`, `invalid`, `inconclusive`, `stale`, and `not-run` do not alias one another.
3. Product observability evidence remains separate from Arcanum workflow telemetry.
4. A profile binds tool-local mechanics but cannot redefine DomainSpec meaning.
5. Generated projections are derived artifacts; the DomainSpec ontology branch remains the semantic source for this private target.
6. A CAV2 crosswalk is directional and provenance-bound; it cannot silently become a definition or promotion.
7. Simulation may prove transition logic only and always records `deployment_effect: false`.
8. Actual deployment requires independently observed authorized effects; simulation never satisfies C12.
9. Missing data, unknown policy facts, disabled thresholds, stale inputs, or absent owner bindings fail closed.
10. An observer may append evidence but may not actuate deployment, rollback, admission, promotion, or release.

## Contract families

| Family | Owned meaning | Required boundary |
| --- | --- | --- |
| Error and recovery | normalized failure, exception mapping, retry, compensation, terminal outcome | domain owner vs integration/profile owner |
| Signals and health | traces, metrics, logs, correlation, privacy/cardinality, liveness/readiness | product evidence vs workflow telemetry |
| Service objectives | SLI query, SLO policy, alert policy, missing-data rule, expiry | objective owner vs monitoring evaluator |
| Workloads | load, stress, soak, capacity profile and generator safety | workload owner vs admitted tool profile |
| Infrastructure | plan facts, policy verdict, apply authority, observed state | plan evaluator vs protected environment owner |
| Delivery | compatibility, canary analysis, deployment receipt, rollback receipt | analysis vs authorized external effect |
| Ontology | local branches, profiles, generated projections, directional crosswalks | canonical meaning vs derived integration |

## Evidence grammar

Every executable claim must bind an exact subject, environment, owner set, stable and candidate artifact set, configuration, topology, profiles, tools, evaluators, policies, thresholds, fixture, observation set, receipt schema, creation time, expiry, invalidation keys, and supersession rule. A missing binding is `missing`; a malformed or disabled binding is `invalid`; incomplete observations are `inconclusive`; changed invalidation keys are `stale`; absence of execution is `not-run`.

## Control denominator

C01-C16 are the evidence-closed contract: binding completeness; fault activation/outcome; failure-mapping totality; correlation; privacy/cardinality; workload validity; SLI/SLO; compatibility; infrastructure plan/policy; canary analysis; simulated deployment; actual deployment; rollback; freshness/aggregation; telemetry-loss/export completeness; and readiness/critical-path behavior.

C17-C20 are proposed extensions for alert, stress, soak, and capacity evaluation. They remain outside the admitted denominator until their owners bind numerical rules, tools, evaluators, receipts, and expiry.

M01-M13 are required negative discriminators for disabled fault, lost propagation, unsafe labels, invalid load, generator saturation, telemetry loss, bad readiness, ignored partial success, stale receipt, incomplete rollback, incompatible change, unknown destructive plan fact, and missing canary evidence. M14-M17 are proposed hostile counterparts for the proposed controls.

## v1 disposition

Legacy v1 operational material is input evidence, not a drop-in authority surface. Each item is classified as reuse unchanged, adapt behind a profile, supersede, or retain as historical evidence. No v1 tool or ontology term is selected merely because it exists.

## Owner decisions still required

- Exact subject, environment, stable/candidate artifacts, configuration, and topology.
- Domain, integration, profile, evaluator, evidence, privacy, service-objective, workload, infrastructure, deployment, rollback, admission, promotion, and release owners.
- Admitted monitoring, load, infrastructure, canary, deployment, and rollback profiles and their exact tool/runtime versions.
- Thresholds, policies, fixtures, query definitions, receipt schemas, expiry, invalidation keys, and complete rollback inventory.
- Whether proposed C17-C20/M14-M17 enter a separately accepted closure.

## Failure and stop conditions

Stop if an owner is unresolved, a binding is ambient-latest, an evidence state is collapsed, a tool substitutes for a semantic contract, a simulation is presented as deployment, a missing observation passes, a receipt is stale, a candidate reference survives rollback, or a protected action lacks explicit authority.

## Claim ceiling

This Define package specifies a source-bound architecture and fixture contract only. It does not define canonical vocabulary, admit ontology concepts or profiles, select tools, authorize implementation or external effects, validate runtime behavior, execute load or fault tests, plan or apply infrastructure, run a canary, deploy, roll back, promote, release, or establish production readiness.
