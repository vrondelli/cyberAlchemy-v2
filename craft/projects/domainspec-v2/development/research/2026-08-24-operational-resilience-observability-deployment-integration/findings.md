# Operational Resilience, Observability, and Deployment Integration Findings

Date: 2026-08-24

Research status: evidence-closed for writing

Domain gate: blocked

Authority effect: none

## Direct answer

The smallest enforceable DomainSpec v2 architecture is a **proposed owner-separated operational evidence spine**, not a new control stack. It preserves existing DomainSpec meaning and validation owners, routes cross-system failure outcomes through a future admitted SICL binding, keeps implementation and tool mechanics in separately admitted profiles, treats runtime signals and evaluations as evidence rather than authority, and lets FPR/SFC consume exact, freshness-bound receipts without owning deployment or release effects.

The research closes the architecture and finite fixture schema only. The fixture is **specified-not-bound-not-run**. No live subject, environment, owner set, profile set, tool artifact, evaluator, plan, load run, fault, canary, deployment, or rollback was bound or executed. Therefore this result does not validate a live system and does not authorize definitions, profiles, implementation, ontology admission, infrastructure effects, deployment, promotion, release, or production readiness.

## Status legend and current-state answer

| Status | Meaning in this finding |
|---|---|
| observed | Exact repository bytes were inspected, without claiming their behavior was executed. |
| executed | A bounded command or test was run and its result was recorded. |
| designed | A contract or procedure exists, but its behavior is not established. |
| absent | No scoped implementation, command, dependency, or configuration was found. |
| blocked | A required owner, admission, binding, evaluator, or authority gate is closed. |
| stale | Earlier evidence or a version row no longer matches the accepted current binding. |
| proposed | Research-candidate role or contract; not canonical and not admitted. |
| external-precedent | Current official material informs a candidate profile but owns no DomainSpec meaning or authority. |

Current v2 is partial and owner-fragmented, not operationally integrated:

- **Observed / executed:** the private v1 deterministic test-derivation engine passed its current typecheck and 97/97 Vitest tests. This is bounded private precedent, not v2 admission.
- **Observed:** Arcanum has append-only capability-invocation telemetry, but native-skill coverage, typed completion, redaction, retention, and storage-default drift remain open. It is workflow evidence, not product observability.
- **Designed:** legacy product monitoring, SLI/SLO templates, infrastructure presets, pilot readiness, and the SFC campaign describe parts of the desired path, but they do not establish runtime or deployment behavior.
- **Absent:** an admitted v2 operational receipt owner, runtime evaluator registry, complete product-observability contract, load/stress/soak/capacity evidence, and executed canary/rollback/deployment evidence.
- **Blocked:** FPR, SICL, spec-ontology protected admission, EVF execution admission, and the wider DomainSpec v2 domain gate.
- **Stale:** the 2026-06-29 v1 triage and older test-count/status prose understate the current 97-test engine evidence. Earlier synthesis tool rows for Prometheus 3.13.1 LTS, OpenTofu 1.12.1, Kubernetes 1.36.2, and Argo Rollouts 1.8.4 were superseded by reviewer-bound 2026-08-24 rows, while selection remains deferred.

## v1 disposition matrix

| Legacy capability | Verified legacy state | v2 disposition | Current ceiling or missing binding |
|---|---|---|---|
| Error handling and failure taxonomy | observed reusable documentation and app-local error constructs; no repository-wide normalized outcome or recovery evaluator | reformulate | Bind the exact feature source, producer, consumer, outcome schema, profile, evaluator, and owner acceptance. |
| Deterministic specification-to-test controls | executed: typecheck and 97/97 tests passed | build-from-owned | Preserve obligation identity, round-trip, and hostile-negative behavior as private precedent; no v2 profile admission follows. |
| Product monitoring and OTel derivation | designed; declarations exist but runtime telemetry implementation was absent | reformulate | Separate signal intent, instrumentation profile, Collector transport, backend, evaluator, and receipt owner. |
| OTel instrumentation and verification loop | blocked procedural design; no admitted report or full logs/metrics/traces verification | reformulate | Admit implementation and observability profiles plus positive, hostile, privacy, cardinality, and loss fixtures. |
| Prometheus monitoring and alerts | blocked configuration fragments; no proved monitored service or emitted metric set | reformulate | Treat Prometheus as a metrics/rule candidate only; bind service, query, denominator, threshold, evaluator, and evidence. |
| Legacy async observer | blocked in the scoped probe; executable-looking source but not proved end to end | build-from-owned | Preserve only a typed, non-actuating, append-only observer contract with redaction, retention, and regression fixtures. |
| Arcanum hook telemetry | observed; shell syntax passed, no live invocation receipt claimed | build-from-owned | Keep workflow-local; harden native-skill coverage, completion semantics, redaction, retention, and defaults. |
| SLI, SLO, error-budget, and alert policy | designed template only | reformulate | Separate SLI, SLO, error-budget policy, alert evaluation, verdict, receipt, expiry, and owner gates. |
| Load, stress, soak, and capacity testing | absent | net-new | Add separate workload, generator-calibration, observation, threshold, and capacity-claim roles only after exact admission. |
| Infrastructure definitions | designed/partial fragments; no complete owned production definition | reformulate | Separate desired definition, observed resource state, plan, policy result, apply authorization, and corrective route. |
| Deployment gates and delivery | proposed template; no repository-owned executed workflow or immutable deployment receipt | reformulate | Separate artifact verification, compatibility, acceptance, admission, deployment authorization/execution, promotion, and release. |
| Canary, blue-green, and rollback | absent beyond promises and compensation prose | net-new | Bind controller, traffic provider, stable/candidate artifacts, analysis, operator, rollback inventory, and independent observer. |
| Pilot readiness | designed; plans evidence but does not deploy | reformulate | Retain only as FPR/SFC evidence-plan input with no authority effect. |
| Full legacy `domainspec-pipeline` | observed procedural skill; not executed in this research | drop as fused import | Decompose its separately reusable stages among their existing or future owners. Precedent is not itself killed. |

## Smallest non-collapsing architecture

The minimum invariant is: owner-authored meaning, profile-local mechanics, observations, evaluator verdicts, receipts, owner acceptance, profile admission, deployment authorization, promotion, and release remain separately identified and separately gated.

| Layer | Surviving role | Classification and boundary |
|---|---|---|
| Meaning | owner-authored domain proposition | Existing proposition pattern using the narrowest active meta-type; no generic `DomainSpecMeaning` type. |
| Vocabulary | reusable vocabulary criterion | Existing definitions-governance route; it does not own each feature proposition. |
| Integration | integration failure outcome | proposed/unadmitted producer-consumer seam result that references but does not redefine domain meaning. |
| Recovery | domain strategy selection | proposed descriptive role; distinct from compensation and all technical recovery. |
| Recovery | compensation workflow | domain workflow effect; not application retry, deployment rollback, database recovery, or credential revocation. |
| Recovery | profile-local application recovery mechanism | proposed/unadmitted runtime mechanism mapped to domain and integration outcomes. |
| Observation | runtime signal | proposed/unadmitted timestamped observation; not failure meaning, evaluation, recovery instruction, or authority. |
| Objectives | SLI specification | proposed/unadmitted definition of good/total events and missing-data behavior. |
| Objectives | SLO objective | proposed/unadmitted owner-approved target and window; not a measurement. |
| Load | workload profile | proposed/unadmitted stimulus; separate from an observation or capacity claim. |
| Load | load observation/result | proposed/unadmitted environment-bound evidence; not an SLO or release decision. |
| Evaluation | evaluator verdict | proposed/unadmitted seven-state result from one exact evaluator. |
| Evidence | operational evidence receipt | novel-attempt/unadmitted immutable binding with `authority_effect: none`; EVF is precedent, not the established owner. |
| Profiles | implementation, observability, workload, infrastructure-provider, deployment-controller, migration, and integration profiles | separate proposed admission objects; no umbrella profile may admit them together. |
| Infrastructure | definition; observed resource identity/state; read-only plan; policy result; apply authorization | separate roles; desired state, observed fact, proposal evidence, evaluation, and authority do not alias. |
| Delivery | progressive-delivery evaluation policy; deployment execution contract; rollback contract | profile-local mechanisms; distinct from deployment authorization, promotion, and release. |
| Authority | owner acceptance; profile admission; deployment authorization; promotion decision; release authorization | separate exact records with late-bound owners; no generic `AuthorityDecision`. |
| Ontology | DomainSpec-local owner branch; generated projection; CAV2 reference/crosswalk | separate provenance and promotion routes; generated views have `authority_effect: none`. |
| Workflow evidence | Arcanum workflow telemetry | existing capability-invocation evidence only; cannot satisfy product observability. |

Every failure mapping must discriminate `mapped`, `unmapped`, `unknown`, `retry-exhausted`, `compensation-failed`, and `telemetry-missing`. No mapping may alias the domain proposition, integration outcome, and profile-local exception.

## Lifecycle and owner map

Lifecycle:

1. Author one exact proposition under the narrowest feature or business source owner.
2. Route reusable vocabulary criteria through definitions-governance.
3. Bind exact producer, consumer, seam, and integration outcomes through an admitted SICL contract.
4. Admit implementation, observability, workload, infrastructure-provider, deployment-controller, migration, and integration profiles separately.
5. Realize mechanics below the DomainSpec adapter line.
6. Validate structure and compatibility with positive and hostile fixtures.
7. Observe with non-actuating append-only evidence observers.
8. Evaluate signals, SLI/SLO, workload, compatibility, plans, canary behavior, telemetry completeness, readiness, and recovery separately.
9. Emit immutable non-authoritative receipts.
10. Request owner acceptance and profile admission separately.
11. Request exact deployment authorization; only then execute and independently observe deployment or rollback.
12. Request promotion and release authorization separately, and invalidate stale evidence when any bound key changes.

| Concern | Owner route | Existing insertion point and limit |
|---|---|---|
| Vocabulary criteria | definitions-governance | Exact route; does not own feature truth. |
| Feature/business proposition | narrowest exact feature or business source owner | Identity deferred until a subject is selected. |
| Integration outcome | exact producer and consumer through admitted SICL binding | SICL is the nearest route; schemas, owners, evaluator registry, and executed fixtures remain blocked. |
| Profile mechanics | separately admitted profile owners | External implementation/platform/environment owners; never DomainSpec meaning or authority. |
| Portable structural checks | APE | May consume profile-placement obligations after the relevant owner defines them; no runtime truth or release effect. |
| Evaluator verdict | exact admitted evaluator owner | Unadmitted; cannot issue acceptance, admission, deployment authorization, promotion, or release. |
| Operational receipt schema | fresh owner decision | EVF is nearest graph-evidence precedent only; no generic operational remit is inferred. |
| Release-path evidence consumption | FPR and SFC | Existing bounded routes; do not own providers, SLO truth, deployment mechanics, operator effects, or external authorization. |
| Workflow invocation telemetry | Arcanum observability | Harden invocation evidence only; never substitute it for product signals. |
| Ontology branch/view | DomainSpec spec-ontology and each branch owner | DomainSpec-local connected graph only; protected admissions remain blocked. |
| Acceptance/admission/deployment/promotion/release | exact owner at each named gate | All identities are deferred and no gate implies another. |

## Operational contracts

### Error and recovery

- A domain failure is an owner-authored proposition using an existing active meta-type.
- An integration failure outcome is a producer-consumer binding result under SICL; it references but does not redefine the proposition.
- An implementation exception and retry mechanism are profile-local mappings.
- Domain strategy selection, compensation workflow, application recovery, deployment rollback, database recovery, and credential revocation are different contracts with different owners and witnesses.
- Unknown, unmapped, exhausted, failed-compensation, and telemetry-missing outcomes must fail closed and remain distinguishable.

### Signals, observability, and health

- Logs, metrics, and traces remain distinct signals joined by exact correlation fields and provenance.
- OpenTelemetry semantic specification, semantic conventions, instrumentation, Collector transport, and signal backends are different layers.
- Telemetry loss, queue overflow, exporter rejection, pending items, and OTLP partial success must be explicit non-passing evidence; missing telemetry is never success.
- Startup, readiness, and liveness have separate meanings. A critical-path dependency failure must make readiness false and remove traffic by declared deadlines; liveness cannot stand in for readiness.
- The observer is non-actuating, not filesystem-read-only: it may append immutable evidence and rebuild indexes but may not mutate product state, ontology authority, profile admission, promotion, deployment, or release.

### SLI, SLO, alerting, load, and expiry

- SLI specifies good/total predicates, the exact query, window, and missing-data rule.
- SLO records an owner-approved target and window. Error-budget and alert policies are separately versioned evaluations.
- Workload profile, generator calibration, raw load observation, threshold evaluation, and capacity claim are separate artifacts.
- A valid load result binds the tool artifact, workload, environment, warmup/measurement periods, request mix, sample minimum, target safety ceiling, and generator-utilization ceiling.
- Every receipt binds generation time, validity limit, clock, invalidation keys, and supersession. A changed subject, artifact, configuration, environment, topology, profile, tool, evaluator, policy, or time window makes prior evidence stale.

#### Proposed alert, stress, soak, and capacity predicates

The following AR-02 overlay is **proposed, separately owned, unadmitted, and specified-not-bound-not-run**. C17-C20 do not rewrite the evidence-closed C01-C16 contract or enter an accepted claim set. Each future owner must bind the numerical values, evaluator, receipt schema, and expiry before any execution or claim.

| Proposed control and ownership | Workload type and duration/window | Predicate, thresholds, and missing-data behavior | Evaluator, receipt, and expiry | Hostile outcome and narrow claim ceiling |
|---|---|---|---|---|
| C17 alert evaluation. The service-objective owner owns the SLI/SLO and alert policy; an admitted monitoring-profile evaluator owner executes the rule; the notification-channel owner records delivery facts; a fresh receipt owner decision owns the schema. | A digest-bound SLI replay containing normal, burn, recovery, low-traffic, and zero-traffic intervals. Bind the short and long evaluation windows, replay duration, evaluation interval, and notification deadline. | The bound burn-rate thresholds, minimum-event rule, severity, notification deadline, and reset condition must produce the exact expected states. Missing query results, incomplete windows, missing notification evidence, or unknown low-traffic handling yields `missing` or `inconclusive`, never `passed`. | Exact admitted AlertEvaluator and `AlertEvaluationReceipt`; bind evaluator, policy, fixture, query, notification-channel, and environment digests plus `generated_at`, `valid_until`, invalidation keys, and supersession. | M14 treats missing or low-traffic data as healthy or pages contrary to policy; expected `failed` when the policy result is wrong and `invalid` when the rule or threshold binding is disabled. Ceiling: one bound policy/replay/channel evaluation only, not live alert operability, incident response, deployment, or release. |
| C18 stress evaluation. The workload owner owns the stress profile; the environment/safety owner owns abort ceilings; an admitted StressEvaluator owner evaluates; a fresh receipt owner decision owns the schema. | A digest-bound step or ramp workload toward a declared safety ceiling. Bind warmup, step size, duration per step, total maximum duration, cooldown, arrival/concurrency model, and request mix. | At every step, bound latency, error-rate, saturation, target-safety, sample-minimum, and generator-utilization thresholds must be present and evaluated. A disabled threshold or saturated generator yields `invalid`; a missing required step/bucket yields `missing` or `inconclusive`; a target threshold breach yields `failed`. | Exact admitted StressEvaluator and `StressEvaluationReceipt`; bind tool/runtime, workload, subject, environment, raw observations, thresholds, abort result, expiry, and invalidation keys. | M15 saturates the generator before the target or disables the abort/acceptance threshold; expected `invalid`, or `failed` if a target safety breach is observed and ignored. Ceiling: behavior under the exact stress run only, not general capacity or production safety. |
| C19 soak evaluation. The workload owner owns the steady-load profile; the runtime/resource owners own observable resource facts; an admitted SoakEvaluator owner evaluates; a fresh receipt owner decision owns the schema. | A digest-bound steady average-load workload. Bind warmup, measurement duration, bucket width, sampling interval, request mix, cooldown, and required complete bucket count. | Every bucket must satisfy bound latency, error-rate, saturation, resource-growth/slope, queue/backlog, telemetry-completeness, and generator-utilization thresholds. Missing or late buckets yield `missing` or `inconclusive`; an incomplete duration yields `invalid`; a bound degradation or leak predicate yields `failed`. | Exact admitted SoakEvaluator and `SoakEvaluationReceipt`; bind raw time series, workload, subject, environment, tool/runtime, thresholds, expiry, and invalidation keys. | M16 truncates the late test interval or hides monotonic resource growth in an aggregate; expected `invalid` for incomplete duration and `failed` when the bound slope predicate is false. Ceiling: endurance during the exact bound duration only, not indefinite stability or production readiness. |
| C20 capacity evaluation. The workload owner owns the breakpoint/step profile; the environment owner owns safety limits; an admitted CapacityEvaluator owner evaluates; a fresh receipt owner decision owns the schema. | A digest-bound breakpoint or step-ramp workload with a required steady interval at every level. Bind starting load, increments, per-level duration, maximum duration, safety stop, request mix, and cooldown. | A bounded capacity threshold is reported only when every control passes through the highest passing level and the next level produces the declared target threshold breach while generator utilization remains below its ceiling. A safety stop without the next discriminating level yields only `observed-safe-through`; missing levels yield `missing` or `inconclusive`; generator limitation or disabled thresholds yields `invalid`. | Exact admitted CapacityEvaluator and `CapacityEvaluationReceipt`; bind all level observations, the first non-passing level or safety-stop reason, workload, subject/environment/configuration digests, evaluator, expiry, and invalidation keys. | M17 reports the configured maximum or generator ceiling as measured system capacity; expected `invalid`. Ceiling: one environment-, configuration-, workload-, and time-bound threshold or lower-bound result only, never general or production capacity. |

All four receipts have `authority_effect: none`. Alert policy ownership does not become evaluator ownership; workload ownership does not become environment authorization; receipt production does not become owner acceptance, profile admission, deployment authorization, promotion, or release.

### Infrastructure, delivery, rollback, and integration

- Infrastructure definition, observed resource state, saved read-only plan, policy result, apply authorization, and apply effect are separate. Unknown policy facts never authorize apply.
- API, message, database, and telemetry seams require exact producer/consumer versions, positive compatibility controls, breaking mutants, and rollback compatibility.
- Canary evaluation binds stable/candidate digests, cohort or traffic rule, query, analysis window, minimum sample, pass/fail thresholds, and explicit inconclusive behavior.
- Simulation can test transition logic only and must emit `deployment_effect: false`; it cannot satisfy actual-deployment control C12.
- Deployment evidence requires independent observation of an authorized environment effect. Receipt emission alone is insufficient.
- Rollback binds the exact prior DeploymentReceipt, a complete resource inventory, zero candidate references, stable health, deadline, quarantine state, and an independent observer. Application traffic, configuration, infrastructure, database, and credential/integration rollback require different recovery contracts.

### Ontology branches and evidence

- DomainSpec may retain one connected DomainSpec-local graph with separately owned language, formal-claims, proof-bridge, and system branches.
- An owner-local branch assignment is canonical only within its owning DomainSpec surface.
- A generated operational projection is derived inspection material with `authority_effect: none`.
- DomainSpec language ontology and the separately owned CAV2 authority ontology align only through typed, directional, provenance-bound references or a generated non-authoritative crosswalk. Cross-owner merger, shared promotion state, duplicate truth, and inverse canonical edges are forbidden.
- An operational evidence receipt must bind subject, environment, evaluator, inputs, outcome, missing-data state, time, expiry, and digests. It cannot accept, admit, authorize, promote, or release.

## Tool-profile findings

All rows are **external-precedent** and selection is deferred. A future profile must re-resolve exact versions, binary/container digests, dependency closure, configuration, unsupported behavior, and source selectors.

| Role | Candidate as accepted on 2026-08-24 | Binding state |
|---|---|---|
| Telemetry semantic specification | OpenTelemetry Specification 1.60.0 | reviewer-bound selector; deferred |
| Telemetry semantic conventions | OpenTelemetry Semantic Conventions 1.44.0 | reviewer-bound selector; deferred |
| Telemetry collection/transport | OpenTelemetry Collector 0.158.0 | reviewer-bound release-schedule selector; component maturity remains profile-local |
| Metrics backend/rules | Prometheus 3.13.2 LTS | reviewer-bound selector; not SLO or release authority |
| Trace backend | Jaeger 2.20.0 inherited candidate | row-level feedback selector absent; unverified/deferred |
| Log backend | Loki 3.7.6 inherited candidate | row-level feedback selector absent; unverified/deferred |
| Load generation | k6 2.2.0, Locust 2.46.4, or JMeter 5.6.3 inherited candidates | exact workload/profile owner and row-level verification absent |
| Fault injection | system-owned deterministic fixture or Chaos Mesh 2.8.3 inherited candidate | target, privilege, blast radius, and cleanup unbound |
| Infrastructure planning | Terraform 1.15.9 inherited candidate or OpenTofu 1.12.6 | OpenTofu reviewer-bound; Terraform row-level feedback selector absent |
| Kubernetes runtime | Kubernetes 1.36.4 | reviewer-bound; conditional profile only |
| Progressive delivery | Argo Rollouts 1.9.1, Flagger 1.44.0 inherited candidate, or equivalent native controller | Argo reviewer-bound; other rows unverified/deferred |
| Reconciliation | Flux 2.9.3 or Argo CD 3.5.1 inherited candidates | row-level feedback selectors absent; deferred |
| Policy evaluation | OPA 1.16.2 inherited candidate or exact-binding native equivalent | policy owner, bundle, evaluator digest, and selector unbound |
| Supply chain | SLSA 1.2 predicates with Cosign 3.0.6 inherited candidate | trust root, identity, registry, verifier digest, and selector unbound |
| Migration | Flyway 13.3.0, Liquibase 5.0.3, or database-native equivalent | database, owner, compatibility, recovery, and selectors unbound |
| Integration description | OpenAPI 3.2.0, AsyncAPI 3.0.0, CloudEvents 1.0.2, OTLP 1.11.0 | choose by exact seam; presence never proves compatibility or delivery behavior |

## Exact evidence and source bindings

### Accepted local evidence chain

| Artifact | SHA-256 | Exact selector or use |
|---|---|---|
| `receipts/findings-revision-request-001.json` | `537756fd33fc67e471f24bde842586eb2204924ca9dc04cef4ec3d932ad9599e` | AR-01 exact-source repair; AR-02 alert/stress/soak/capacity predicate repair; revision authority ceiling |
| `receipts/findings-auditor.json` | `27e613e084392a0c541d312ceec5b93b4f246c8c6b6ccdaab94b49eb3e11cbe0` | `revision_requests` AR-01 and AR-02; prior findings digest |
| `dispatch-sheet.json` | `419b70508cfd98a84568725fb15d1e5f7f581a4a6151945e4316c739ec271386` | `groups[group_id=synthesizer].agents[agent_name="Beer, Stafford"]` and writer prompt under `groups[group_id=writer]` |
| `receipts/explorer-legacy-v1.json` | `2e48d9b137dde4427a4059b2d0273dd71092754e3727c20457641229191bec21` | complete document; v1 bytes and executable-status matrix |
| `receipts/explorer-current-v2.json` | `1a2e33dfa58aaebb1393b114d83b1c4ed850cc19fcf4257e60445af9471e4e08` | complete document; current owners, contexts, gaps, and blockers |
| `receipts/explorer-reliability.json` | `51026c7d8fb752097297bdc15bd5238bc61eccc338404cc479688c3ad5e4c97d` | complete document; reliability controls and primary sources |
| `receipts/explorer-deployment.json` | `aedc5cb0d8217f702306998c98875fcc61878edafd8f77c7b755f00cea82e18c` | complete document; infrastructure, progressive delivery, rollback, and integration sources |
| `receipts/reviewer-precedent.json` | `c72d8c9ea18f9063152d88e68d064e953969a26ae3bb8d92087c1f2b6e5276d2` | complete document; initial precedent BLOCK and PR-01 through PR-09 |
| `receipts/reviewer-non-vacuity.json` | `877656c586675517a3e4d481cf9d863b58e6ab031228727c0e43bebb50aa5c53` | complete document; initial hostile-witness BLOCK and repair requirements |
| `receipts/reviewer-non-collapse.json` | `fffaa40eb76a959dc2ab667a8df3a3071650469bbeb536c05519e0226dfd469d` | complete document; initial non-collapse BLOCK and RR-01 through RR-08 |
| `receipts/synthesis-feedback-001.json` | `2049855b1e6200a1c5f8cd79b94f472b6af621543088e100e7db979d10000d37` | complete exact base: disposition, architecture, owner and tool maps, C01-C14 |
| `receipts/synthesis-feedback-002.json` | `8c96e701fc19340241995c56bb052f59d4e3457cd0e76fab062f749d9c6cd011` | exact replacement overlay: C15-C16, M06-M08, claim-specific control sets |
| `receipts/reviewer-precedent-feedback-001.json` | `02a599122ba6ea00a37c39c8e3d43f80e32081e51973f963a7ae32387730eb99` | complete document; precedent/owner repairs PASS |
| `receipts/reviewer-non-collapse-feedback-001.json` | `355cb289470d97c6ab16006a1bbd1de4479b21c003a8ade5e9b2b12d1214cc41` | complete document; non-collapse repairs pass |
| `receipts/reviewer-non-vacuity-feedback-002.json` | `e46dd1fee3bd783a591b2e843c700ecefa7e6371fc096353369e07ed9c90f4fb` | hostile mutant verdicts and required-control-set verdict |
| `receipts/evidence-closure.json` | `23f1bdc34f30511d284bcb2167a91385cf032a4ac201ef69aee6a8e1e96e9fed` | `status: ready`, `writer_admission: ready`, closure rows, blockers, claim ceiling |

### Primary external source selectors

Each row below has one exact official URL and a version or evidence date plus a page, section, or heading selector already present in the admitted local receipts. These are evidence-date bindings, not evergreen claims.

| ID | Official URL | Version or evidence date | Exact local selector | Research binding |
|---|---|---|---|---|
| SRC-ERR-HTTP | https://www.rfc-editor.org/rfc/rfc9457.html | RFC 9457 | `3.1 Members of a Problem Details Object`; `5 Security Considerations` | HTTP failure representation and safe disclosure; not domain meaning. |
| SRC-ERR-GRPC | https://grpc.io/docs/guides/status-codes/ | observed 2026-08-24 | `Overview`; `The full list of status codes` | Transport outcome classification only. |
| SRC-TRACE-W3C | https://www.w3.org/TR/trace-context/ | W3C Recommendation 2021-11-23 | `2.3 Design Overview`; `3 Trace Context HTTP Headers Format`; `6 Privacy Considerations` | Propagation, trust-boundary, and privacy constraints. |
| SRC-OTEL-SPEC | https://opentelemetry.io/docs/specs/otel/error-handling/ | OpenTelemetry Specification 1.60.0 | `Basic error handling principles`; `Self-diagnostics` | Telemetry failure and self-diagnostics boundary. |
| SRC-OTEL-ERROR | https://opentelemetry.io/docs/specs/semconv/general/recording-errors/ | Semantic Conventions 1.44.0 | `What constitutes an error`; `Recording errors on spans`; `Recording errors on metrics`; `Recording exceptions` | Context-sensitive error recording; development-status area requires pinning. |
| SRC-OTEL-ERROR-TYPE | https://opentelemetry.io/docs/specs/semconv/registry/attributes/error/ | Semantic Conventions 1.44.0 | `Error Attributes` | Predictable low-cardinality `error.type`. |
| SRC-OTEL-LOGS | https://opentelemetry.io/docs/specs/otel/logs/data-model/ | OpenTelemetry Specification 1.60.0 | `Log and Event Record Definition`; `Trace Context Fields` | Correlated log evidence fields. |
| SRC-OTEL-CARDINALITY | https://opentelemetry.io/docs/specs/otel/metrics/sdk/ | OpenTelemetry Specification 1.60.0 | `Cardinality Limits`; `Overflow attribute`; `Exemplar` | Cardinality and trace-metric exemplar controls. |
| SRC-OTEL-PRIVACY | https://opentelemetry.io/docs/security/handling-sensitive-data/ | observed 2026-08-24 | `Your responsibility`; `Data minimization`; `Protecting sensitive data` | Data inventory and redaction remain implementer-owned. |
| SRC-OTEL-COLLECTOR | https://opentelemetry.io/docs/collector/ | Collector 0.158.0 | `Introduction`; `Status`; `Distributions and releases` | Receive/process/export boundary; component maturity varies. |
| SRC-OTEL-RESILIENCY | https://opentelemetry.io/docs/collector/resiliency/ | Collector 0.158.0 documentation | `Sending queue (in-memory buffering)`; `Persistent storage` | Bounded retry/queue and loss conditions. |
| SRC-K8S-PROBES | https://kubernetes.io/docs/concepts/workloads/pods/probes/ | Kubernetes v1.36 documentation | `Types of probe`; `Liveness probe`; `Readiness probe`; `Startup probe` | Distinct restart and traffic-admission controls. |
| SRC-SLO | https://sre.google/workbook/implementing-slos/ | observed 2026-08-24 | `Reliability Targets and Error Budgets`; `Establishing an Error Budget Policy`; `Documenting the SLO and Error Budget Policy` | User-centered SLI/SLO and review-date precedent. |
| SRC-ALERT | https://sre.google/workbook/alerting-on-slos/ | observed 2026-08-24 | `Alerting Considerations`; `Multiwindow, Multi-Burn-Rate Alerts`; `Low-Traffic Services and Error Budget Alerting` | Actionable alert evaluation and low-traffic treatment. |
| SRC-PROM-CARDINALITY | https://prometheus.io/docs/practices/instrumentation/ | observed 2026-08-24 | `How to instrument`; `Do not overuse labels` | Signal selection and label-cardinality risk. |
| SRC-LOG-SECURITY | https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html | observed 2026-08-24 | `Data to exclude`; `Verification`; `Protection`; `Disposal of logs` | Secret/PII exclusion, hostile verification, protection, and retention. |
| SRC-LOAD-K6 | https://grafana.com/docs/k6/latest/testing-guides/api-load-testing/ | observed 2026-08-24 | `Determine the reason for the test`; `Model the workload` | Smoke, average, stress, spike, breakpoint, and soak profile precedent. |
| SRC-LOAD-K6-THRESHOLD | https://grafana.com/docs/k6/latest/using-k6/thresholds/ | observed 2026-08-24 | `Threshold examples` | Machine-evaluable latency and failure-rate thresholds. |
| SRC-CHAOS | https://github.com/chaos-mesh/chaos-mesh/releases/tag/v2.8.3 | Chaos Mesh 2.8.3 | `v2.8.3 Release Notes` | Kubernetes fault-injection candidate; no installation or execution. |
| IAC-TF-PLAN | https://developer.hashicorp.com/terraform/cli/commands/plan | observed 2026-08-24 | `Introduction`; `saved-plan workflow`; `planning options` | A plan is proposal evidence, not effect or authorization. |
| IAC-TF-JSON | https://developer.hashicorp.com/terraform/internals/json-format | observed 2026-08-24 | `Plan Representation`; `resource_drift`; `checks` | Machine-readable changes, drift, and checks are plan evidence. |
| IAC-TOFU-PLAN | https://opentofu.org/docs/cli/commands/plan/ | observed 2026-08-24 | `OpenTofu plan command` page | Plan/apply separation; no effect or authority follows from a plan. |
| IAC-TOFU-ENCRYPTION | https://opentofu.org/docs/language/state/encryption/ | observed 2026-08-24 | `guidance`; `compatibility`; `rollover` | State/plan encryption is a profile obligation. |
| POLICY-OPA-TERRAFORM | https://www.openpolicyagent.org/docs/terraform | observed 2026-08-24 | `goals`; `plan limitations` | Policy may evaluate plan JSON; unavailable facts must not fail open. |
| PROGRESSIVE-ARGO-ANALYSIS | https://argo-rollouts.readthedocs.io/en/latest/features/analysis/ | observed 2026-08-24 | `analysis and progressive delivery` page | Canary analysis may produce explicit outcomes; it is not release authority. |
| PROGRESSIVE-ARGO-ROLLBACK | https://argo-rollouts.readthedocs.io/en/latest/features/rollback/ | observed 2026-08-24 | `rollback windows` page | Fast rollback behavior is controller/profile-local. |
| PROGRESSIVE-FLAGGER | https://github.com/fluxcd/flagger/blob/main/CHANGELOG.md | Flagger 1.44.0 | `Flagger 1.44.0 changelog` entry | Metric analysis and traffic-provider behavior remain profile-local. |
| GITOPS-FLUX-KUSTOMIZATION | https://fluxcd.io/flux/components/kustomize/kustomizations/ | observed 2026-08-24 | `source artifact`; `dry-run drift detection`; `health`; `suspend`; `field ownership` | Observation and reconciliation are distinct external effects. |
| GITOPS-ARGO-AUTO-SYNC | https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/ | observed 2026-08-24 | `automated sync policy` page | Automated reconciliation can constrain rollback; observer-only detection stays separate. |
| SUPPLY-SLSA-SPEC | https://slsa.dev/spec/v1.2/ | SLSA 1.2 | `SLSA 1.2 specification` page | Supply-chain predicate semantics; no promotion or release authority. |
| SUPPLY-SLSA-PROVENANCE | https://slsa.dev/spec/v1.2/provenance | SLSA 1.2 | `SLSA provenance` page | Provenance can bind artifact origin but does not authorize release. |
| SUPPLY-COSIGN-VERIFY | https://docs.sigstore.dev/cosign/verifying/verify/ | observed 2026-08-24 | `signature and attestation verification` page | Verification outcome is an immutable input, not authority. |
| INTEGRATION-OPENAPI | https://spec.openapis.org/oas/v3.2.0.html | OpenAPI 3.2.0 | complete versioned specification page | Request/response API description only. |
| INTEGRATION-ASYNCAPI | https://www.asyncapi.com/docs/reference/specification/v3.0.0 | AsyncAPI 3.0.0 | complete versioned specification page | Message API description only. |
| INTEGRATION-CLOUDEVENTS | https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md | observed 2026-08-24 | complete specification document | Event-envelope description only; delivery and compatibility remain unproved. |
| INTEGRATION-OTLP | https://opentelemetry.io/docs/specs/otlp/ | observed 2026-08-24 | complete OTLP specification page | Telemetry transport contract; partial success requires separate evidence. |
| DATABASE-FLYWAY-VALIDATE | https://documentation.red-gate.com/flyway/reference/commands/validate | Flyway 13.3.0 | `validate and checksum behavior` page | Migration identity/checksum input; not compatibility or rollback proof. |
| DATABASE-POSTGRES-ALTER | https://www.postgresql.org/docs/current/sql-altertable.html | PostgreSQL 18 as admitted locally | `ALTER TABLE lock behavior` page | Target-engine locking input; no generic rollback follows. |
| VERSION-PROMETHEUS | https://prometheus.io/download/ | evidence date 2026-08-24 | `3.14.0 latest and 3.13.2 LTS` | Reviewer-bound moving-version evidence; selection deferred. |
| VERSION-OPENTOFU | https://github.com/opentofu/opentofu/releases | evidence date 2026-08-24 | `v1.12.6 latest` | Reviewer-bound moving-version evidence; selection deferred. |
| VERSION-KUBERNETES | https://github.com/kubernetes/kubernetes/releases | evidence date 2026-08-24 | `v1.36.4 latest stable patch` | Reviewer-bound moving-version evidence; profile conditional. |
| VERSION-ARGO-ROLLOUTS | https://github.com/argoproj/argo-rollouts/releases | evidence date 2026-08-24 | `v1.9.1 latest stable security release` | Reviewer-bound moving-version evidence; selection deferred. |
| VERSION-OTEL-SPEC | https://opentelemetry.io/docs/specs/otel/ | evidence date 2026-08-24 | `OpenTelemetry Specification 1.60.0` | Reviewer-bound version evidence. |
| VERSION-OTEL-SEMCONV | https://github.com/open-telemetry/semantic-conventions/releases | evidence date 2026-08-24 | `Semantic Conventions v1.44.0` | Reviewer-bound version evidence. |
| VERSION-OTEL-COLLECTOR | https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/release.md | evidence date 2026-08-24 | `Collector v0.158.0 release schedule` | Reviewer-bound version evidence. |

### Deferred external-source bindings

The admitted local package did not provide an exact official URL plus precise version/date selector for the following moving-version claims. They are therefore excluded from the exact-source table as version evidence and remain explicitly deferred: Terraform 1.15.9, Jaeger 2.20.0, Loki 3.7.6, k6 2.2.0, Locust 2.46.4, JMeter 5.6.3, Flux 2.9.3, Argo CD 3.5.1, OPA 1.16.2, Cosign 3.0.6, and Liquibase 5.0.3. Their descriptive tool rows are candidate labels only; a future profile owner must supply the missing exact selector and artifact digest before admission.

## Smallest proposed end-to-end witness

`W-ORODI-001-R2` is a finite research fixture contract with status **specified-not-bound-not-run**. Before execution it requires exact bindings for subject/environment/owners; stable and candidate artifacts; configuration and topology; every profile, tool, evaluator, and policy bundle; failure fixture; trace and privacy fields; workload and SLO values; compatibility fixtures; infrastructure plan; canary/rollback resources; and freshness keys.

Its seven states are `not-run`, `missing`, `invalid`, `stale`, `inconclusive`, `failed`, and `passed`. Aggregate `passed` is allowed only when every control in the exact claim-specific required set is present and passed. No other state may be omitted, averaged, defaulted, or coerced to passed.

| Control | Required discrimination | Current expected state |
|---|---|---|
| C01 binding completeness | Every required field is present, valid, owner-bound where required, and digest-bound. | missing |
| C02 fault activation and outcome | Exact timeout activation, normalized outcome, exception mapping, retry and compensation states, one occurrence. | not-run |
| C03 failure-mapping totality | Six mapping states remain distinct and do not alias proposition, integration outcome, or exception. | not-run |
| C04 correlation | Every hop preserves the declared relation; span, metric exemplar, and log bind to the same request; one error. | not-run |
| C05 privacy and cardinality | Only allowlisted attributes; prohibited values absent; label budget respected; overflow/rejection explicit. | not-run |
| C06 workload validity | Thresholds active, generator below ceiling, sample minimum met, target safety limits hold. | not-run |
| C07 SLI/SLO | Injected failure counts total-not-good; exact query/window matches; missing telemetry cannot pass. | not-run |
| C08 compatibility | Positive fixture accepted, breaking mutant rejected, rollback compatibility true. | not-run |
| C09 infrastructure plan/policy | Clean/destructive/unknown fixtures produce exact results; unknown never authorizes apply. | not-run |
| C10 canary analysis | Complete evidence yields passed/failed by bound thresholds; missing metrics/controller yields inconclusive. | not-run |
| C11 simulated deployment evaluator | Tests transition logic only and emits `deployment_effect: false`. | not-run |
| C12 actual deployment evidence | Independently observed authorized environment effect with exact inputs, actor, partial failures, and resulting state. | not-run |
| C13 rollback | Trigger fires; every declared resource has zero candidate reference; stable health/quarantine hold before deadline. | not-run |
| C14 freshness and aggregation | Time and invalidation keys are current; all required children pass; subject state is independently observed. | missing |
| C15 telemetry loss/export completeness | Outage activated; queue accounting complete; zero overflow/drop/rejection/pending; exported equals offered; OTLP partial success empty/zero. | not-run |
| C16 readiness and critical path | During declared critical-path failure, readiness and traffic membership become false by deadlines; liveness stays separately scoped. | not-run |
| C17 proposed alert evaluation | Exact replay windows, thresholds, low/missing-data rule, notification deadline, reset, evaluator, receipt, and expiry produce the declared outcome. | not-run |
| C18 proposed stress evaluation | Exact ramp/step durations and thresholds discriminate target behavior from generator saturation and disabled safety controls. | not-run |
| C19 proposed soak evaluation | Exact full-duration buckets and degradation thresholds discriminate sustained behavior from truncation and hidden resource growth. | not-run |
| C20 proposed capacity evaluation | Exact levels discriminate a system threshold from a safety-stop lower bound, generator ceiling, or configured maximum. | not-run |

Claim-specific control sets are exact:

- Simulated transition: C01, C03, C08-C11, C14-C16; must remain non-deployment.
- Live deployment: C01-C10, C12, C14-C16; C12 is mandatory and cannot be substituted.
- Rollback: C01, C12-C16, with exact DeploymentReceipt and RollbackReceipt links.
- Complete operational-resilience evaluation: C01-C10 and C12-C16; C11 is excluded because simulation cannot establish live deployment.

The following AR-02 sets are proposed extensions only and are not closure-bound or executable under this finding:

- Alert-evaluation claim: C01, C04, C07, C14, C15, and C17.
- Stress-evaluation claim: C01, C05-C07, C14, C15, and C18.
- Soak-evaluation claim: C01, C05-C07, C14, C15, and C19.
- Capacity-evaluation claim: C01, C05-C07, C14, C15, and C20.

Each proposed extension can aggregate to `passed` only after separate ownership and admission and only when every listed control is present and passed. In the current finding all four extension controls are `not-run`, their live bindings are missing, and no claim is established.

## Hostile matrix

| Mutant | Named control | Required output |
|---|---|---|
| M01 fault disabled | C02 | failed |
| M02 traceparent dropped | C04 | failed |
| M03 sensitive or high-cardinality label | C05 | failed |
| M04 load thresholds disabled | C06 | invalid |
| M05 generator saturated first | C06 | invalid |
| M06 telemetry queue overflows | C15 | failed |
| M07 readiness remains true during critical-path failure | C16 | failed |
| M08 OTLP partial success treated as complete | C15 | failed |
| M09 receipt reused after an invalidation key changes | C14 | stale |
| M10 rollback retains a candidate reference | C13 | failed |
| M11 breaking interface or schema change | C08 | failed |
| M12 destructive plan fact is unknown | C09 | inconclusive and no apply authority |
| M13 canary metrics or controller unavailable | C10 | inconclusive |
| M14 missing/low-traffic alert data produces the wrong healthy/page state or alert thresholds are disabled | C17 | failed for the wrong policy result; invalid for disabled bindings |
| M15 generator saturates first or stress safety/acceptance thresholds are disabled | C18 | invalid; failed if an observed target safety breach is ignored |
| M16 soak duration is truncated or aggregate reporting hides a bound resource-growth violation | C19 | invalid for incomplete duration; failed for the false degradation predicate |
| M17 configured maximum or generator ceiling is reported as measured system capacity | C20 | invalid |

M06-M08 are killed only at the evidence-closed fixture-schema level; they were not executed. M14-M17 are proposed writer-revision hostile predicates and have not received separate owner admission or execution. These schema-level discriminators do not establish that a live system satisfies any control.

## Adoption sequence

1. Select one exact non-production subject, environment, topology, producer, consumer, and integration seam; name concrete owners for every gate.
2. Route only genuinely reusable vocabulary through definitions-governance; do not mint any killed composite.
3. Admit the minimum SICL binding/outcome schema and positive/hostile compatibility fixtures.
4. Decide the exact operational evaluator and receipt owner; EVF may be extended only by a fresh owner decision.
5. Admit implementation, observability, workload, infrastructure-provider, deployment-controller, migration, and integration profiles separately with exact artifact digests.
6. Bind the W-ORODI-001-R2 fixture values, evaluators, thresholds, expiry, policies, and complete rollback inventory.
7. Add only portable structural/profile-placement checks to APE after the owning contract exists.
8. Implement and run the finite non-production fixture under separate execution authorization; preserve all seven states and immutable evidence.
9. Let FPR/SFC consume only admitted, current receipts at their ordered gates.
10. Seek deployment, promotion, and release authority separately; rerun whenever an invalidation key changes.

## Blockers and residue

Blockers:

- The DomainSpec v2 domain gate remains independently blocked.
- No exact live subject, environment, topology, owner set, artifact set, profile set, tool artifacts, evaluator set, or policy bundle is admitted.
- SICL binding/outcome schemas, owner admissions, evaluator registry, and executed target fixtures remain blocked.
- No generic operational evaluator or receipt owner is admitted; EVF is graph-evidence precedent only.
- Protected DomainSpec ontology admissions and any DomainSpec-to-CAV2 crosswalk remain unapproved.
- No infrastructure plan, load, fault, compatibility, canary, deployment, rollback, promotion, release, or production evidence exists.
- Tool rows without feedback-cycle official selectors remain unverified and deferred; every moving version must be re-resolved at admission.

Residue:

- A later definitions-governance route must decide whether any proposed role deserves canonical vocabulary.
- Concrete owners must be late-bound; role labels in this finding are routing placeholders, not verified identities.
- Arcanum observability remains workflow-local and non-actuating.
- FPR and SFC remain evidence consumers and release-path gates.
- Any live-system claim requires fresh exact bindings, admission, authorization, execution, and independent observation.

## Killed and deferred candidates

Killed or dropped at this research boundary:

- `DomainSpecMeaning` as a new canonical type.
- Composite `ErrorAndRecoveryPolicy`.
- Composite `SLI_SLO_AndLoadEvidence`.
- Authority-bearing aggregate `DeploymentPolicy`.
- Ambiguous aggregate `InfrastructureResource`.
- One `ImplementationOrTechnologyProfile` admission object.
- Composite `OntologyBranchOrGeneratedView`.
- Generic `AuthorityDecision`.
- Literal filesystem-read-only observer wording; the surviving invariant is non-actuation.
- Any cross-owner DomainSpec-CAV2 ontology merger.
- Full legacy pipeline as a fused import; its separately owner-routable precedent remains available.
- Any claim that a live system was validated or that research authorizes implementation, infrastructure effects, deployment, promotion, release, or production.

Deferred:

- Every proposed operational role absent from active definitions.
- Exact feature, producer, consumer, service, environment, platform, database, security, deployment, promotion, and release owners.
- SICL outcomes and compatibility bindings, profile admissions, operational evaluator/receipt ownership, and protected ontology admission.
- All tool/profile selection and artifact locks.
- All fixture values and execution.

## Claim ceiling

Evidence closure is ready for this research finding only. The owner-separated architecture is an exact-bound, unadmitted research candidate, and W-ORODI-001-R2 is non-vacuous only as a specified fixture schema. Nothing here defines canonical vocabulary, admits a profile or ontology concept, selects a tool, authorizes implementation or external effects, proves runtime behavior, validates a live system, deploys, promotes, releases, or establishes production readiness.
