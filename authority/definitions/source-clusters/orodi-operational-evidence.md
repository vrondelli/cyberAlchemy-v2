# ORODI Operational Evidence Source Cluster

Status: promoted as `CAV2-D83` through `CAV2-D92` on 2026-09-02
Owner: definitions-governance
Canonical local definitions: [../DEFINITIONS.md](../DEFINITIONS.md)
Source pack: [`ORODI-DEFINITION-PACK.v1-candidate.json`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/ORODI-DEFINITION-PACK.v1-candidate.json)
Source-pack SHA-256: `66aedc5756733a1064e401bb1688bdb65850ae154fa1bb4ebf6cc6a264cf0c7d`
Owner disposition: [`ORODI-DEFINITIONS-DISPOSITION-002`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/owner-decisions/ORODI-DEFINITIONS-DISPOSITION-002.json)

## Authority Rule

This cluster preserves the candidate provenance for the ten terms promoted as
`CAV2-D83` through `CAV2-D92`. Canonical authority lives only in
[`DEFINITIONS.md`](../DEFINITIONS.md). The source pack remains immutable and
candidate-only; promotion does not rewrite the source records.

The domain-originated branch of `CAV2-D48` was first exercised against the
materially distinct CyberAlchemy v2 Define Session Runtime evidence context in
[`ORODI-D48-DEFINE-SESSION-RUNTIME-001`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/exercises/ORODI-D48-DEFINE-SESSION-RUNTIME-001.json).
It preserved counterevidence and semantic residue: four meanings survived the
challenge, three required revision, and three lacked positive second-context
evidence. The Define runtime and definitions-governance owners accepted that
exact historical snapshot for semantic challenge only through
`D48-ACCEPT-HISTORICAL-SNAPSHOT`. The snapshot remains non-current and cannot
support a runtime or conformance claim.

The three revisions are now recorded in
[`ORODI-D48-DEFINITION-REVISIONS-001`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/revisions/ORODI-D48-DEFINITION-REVISIONS-001.json).
A controlled executable-artifact transition provides positive second-context
semantic evidence for Telemetry Conservation, Deployment Evidence, and Rollback
Restoration Evidence in
[`ORODI-D48-ARTIFACT-RELEASE-001.observation`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/exercises/ORODI-D48-ARTIFACT-RELEASE-001.observation.json).
The definitions-governance candidate review of all ten results is
[`ORODI-D48-TEN-TERM-REVIEW-001`](../../../../projects/domainspec-v2/development/operational-resilience-observability-deployment-integration/definitions/reviews/ORODI-D48-TEN-TERM-REVIEW-001.json).
It selects four predecessor candidates, three R1 successors, and the three
positively exercised candidates as one exact input to a later owner decision.
It performed no canonical promotion; the later owner decision and synchronized
canonical postimages perform that distinct step.

The seven source records not listed here were approved for the ORODI bounded-
context track. They remain ORODI-local candidates; they do not become shared
CyberAlchemy vocabulary through proximity to this cluster.

## Candidate Rows

| Candidate ID | Source record | Term | Aliases | Current posture |
| --- | --- | --- | --- | --- |
| `CAV2-CAND-ORODI-001` | `DEFINE-HANDLED-DEFINITION-ORODI-002` | Operational Resilience | resilience outcome | reviewed; predecessor retained |
| `CAV2-CAND-ORODI-002` | `DEFINE-HANDLED-DEFINITION-ORODI-003` | Operational Evidence | operations evidence | reviewed; predecessor retained |
| `CAV2-CAND-ORODI-003-R1` | `DEFINE-HANDLED-DEFINITION-ORODI-004` | Evaluation Binding | exact evaluation binding; evidence context | reviewed; successor selected |
| `CAV2-CAND-ORODI-004-R1` | `DEFINE-HANDLED-DEFINITION-ORODI-005` | Operational Evidence Evaluation State | evidence evaluation state; operational verdict state | reviewed; successor selected |
| `CAV2-CAND-ORODI-005-R1` | `DEFINE-HANDLED-DEFINITION-ORODI-006` | Failure Meaning Separation | failure separation | reviewed; successor selected |
| `CAV2-CAND-ORODI-006` | `DEFINE-HANDLED-DEFINITION-ORODI-007` | Product Observability | runtime observability | reviewed; predecessor retained |
| `CAV2-CAND-ORODI-007` | `DEFINE-HANDLED-DEFINITION-ORODI-008` | Telemetry Conservation | observation accounting closure | reviewed; positive second-context evidence satisfied |
| `CAV2-CAND-ORODI-008` | `DEFINE-HANDLED-DEFINITION-ORODI-012` | Runtime Evidence | live operational evidence | reviewed; predecessor retained |
| `CAV2-CAND-ORODI-009` | `DEFINE-HANDLED-DEFINITION-ORODI-013` | Deployment Evidence | deployment observation | reviewed; positive second-context evidence satisfied |
| `CAV2-CAND-ORODI-010` | `DEFINE-HANDLED-DEFINITION-ORODI-014` | Rollback Restoration Evidence | rollback evidence; restoration proof | reviewed; positive second-context evidence satisfied |

## Candidate Voice Sketches

The sketches below reproduce the selected candidate voices. Seven terms retain
their predecessor source-pack text; the three challenged terms reproduce their
R1 successor text. They remain candidate sketches rather than canonical
definitions.

### Operational Resilience (`CAV2-CAND-ORODI-001`)

**Normative sketch.** Operational Resilience is the evidenced ability of a
bounded system to preserve or restore declared critical outcomes under declared
stressors, within declared degradation and recovery limits.

**Formal sketch.** `Resilient(S,K,F,W,P,E)` holds only when exact system `S`,
critical outcomes `K`, stressors `F`, evaluation window `W`, policy `P`, and
fresh evidence `E` are bound and `E` proves `preserve(K)` or `recover(K)` within
`P`; `missing(E)` yields `not_evaluable`, never true.

**Plain-language sketch.** A system is resilient only when we can show what
mattered kept working or was restored within the promised limits when something
went wrong.

**Domain-context sketch.** ORODI evaluates resilience through finite evidence
sets, canary observations, rollback restoration, and explicit degraded or
terminal outcomes.

**Boundary.** It is not generic uptime, the absence of alerts, static
configuration validity, an unbounded aspiration, or proof from one successful
test.

### Operational Evidence (`CAV2-CAND-ORODI-002`)

**Normative sketch.** Operational Evidence is an immutable, provenance-bound set
of observations and evaluations about one exact operational subject,
environment, time window, policy, and evidence state.

**Formal sketch.** `OperationalEvidence = (subject, environment, observations,
evaluator, policy, created_at, expiry, invalidation_keys, provenance, state,
receipt_digest)`; `authority_effect = none`.

**Plain-language sketch.** It is the exact record of what we observed, how we
judged it, when it was valid, and what would make it stale.

**Domain-context sketch.** ORODI uses operational evidence for replay, runtime
projection, canary comparison, infrastructure-plan evaluation, deployment
observation, and rollback verification.

**Boundary.** It is not authority, an effect, a live fact without source
admission, or a guarantee beyond its bound subject, environment, time, and
denominator.

### Evaluation Binding (`CAV2-CAND-ORODI-003-R1`)

**Normative sketch.** An Evaluation Binding is the immutable
identity-and-state set for every dependency that one evaluation profile
declares applicable, together with the complete declared denominator that makes
omitted, inapplicable, missing, invalid, and bound dependencies distinguishable.

**Formal sketch.** `EvaluationBinding = (profile_ref, denominator,
dependency_bindings, dependency_states, created_at, expires_at,
invalidation_keys, supersedes_ref)`, where every denominator member has state
`bound`, `inapplicable`, `missing`, or `invalid`; evaluation is possible only
when every required applicable member is bound, current, and valid.

**Plain-language sketch.** Freeze the full checklist for this kind of
evaluation, mark what applies, and bind every required item. Do not force
irrelevant fields, and do not let an omitted field look inapplicable.

**Domain-context sketch.** An ORODI deployment evaluation can require artifact,
environment, authorization, observer, and pre/post-state bindings without
inventing topology or fixture dependencies when its selected profile declares
those inapplicable.

**Boundary.** A complete binding proves denominator and identity completeness
only; it does not prove source authenticity, evidence truth, policy correctness,
owner acceptance, or effect authority.

### Operational Evidence Evaluation State (`CAV2-CAND-ORODI-004-R1`)

**Normative sketch.** Operational Evidence Evaluation State is the disjoint
typed condition assigned to one evaluated operational obligation: `passed`,
`failed`, `missing`, `invalid`, `inconclusive`, `stale`, or `not-run`.

**Formal sketch.** `OperationalEvidenceEvaluationState` is one member of that
pairwise-disjoint set; an aggregate may be `passed` only when every required
denominator member is present, valid, fresh, executed, and passed.

**Plain-language sketch.** For one operational check, success, failure, no data,
bad data, old data, uncertainty, and never run are different answers. Other
questions, such as model coverage, may use their own states.

**Domain-context sketch.** ORODI uses this state only for evaluated operational
obligations; model coverage, evidence availability, validator result, lifecycle
state, and owner decision remain separate owner-defined facets.

**Boundary.** This vocabulary must not flatten model coverage, evidence
availability, validation result, lifecycle state, or owner decision into one
state machine; absence of failure is never passed.

### Failure Meaning Separation (`CAV2-CAND-ORODI-005-R1`)

**Normative sketch.** Failure Meaning Separation is the invariant that
subject-level failure meaning, boundary or integration outcome, and runtime
exception remain distinct owner-defined roles throughout evaluation and
recovery.

**Formal sketch.** `SubjectFailureRole != BoundaryOutcomeRole !=
RuntimeExceptionRole`; the profile owner maps runtime exception role to boundary
outcome role, and the subject owner may interpret boundary outcome role as
subject failure role; neither mapping redefines the target role.

**Plain-language sketch.** What failed for the business, what the boundary
reported, and what the runtime threw may be connected, but they are not
interchangeable and need not share universal type names.

**Domain-context sketch.** ORODI profiles map tool and runtime exceptions into
boundary outcomes while the owning domain decides whether those outcomes
establish a subject-level failure and who may continue or recover.

**Boundary.** A runtime exception cannot create subject meaning, a boundary
outcome cannot silently become an owner decision, and a subject failure does
not prescribe one exception, retry, or integration vocabulary.

### Product Observability (`CAV2-CAND-ORODI-006`)

**Normative sketch.** Product Observability is the bounded ability to derive
evidence about a product subject from admitted traces, metrics, logs, exemplars,
health facts, and their complete accounting, without granting the observer
actuation authority.

**Formal sketch.** `Observe(subject, environment, window) -> ObservationSet`;
observer effects are limited to appending evidence and exclude deploy, traffic
shift, fault injection, rollback, admission, promotion, and release.

**Plain-language sketch.** Observability lets us understand what the product
did; it does not let the observer change what the product is doing.

**Domain-context sketch.** ORODI keeps product telemetry separate from Arcanum
workflow telemetry and uses it only through bound evidence contracts.

**Boundary.** Workflow or agent telemetry is not product-runtime evidence, and
the presence of a dashboard or signal does not prove coverage or correctness.

### Telemetry Conservation (`CAV2-CAND-ORODI-007`)

**Normative sketch.** Telemetry Conservation is the accounting invariant that
every offered observation is queued or rejected, and every queued observation
is exported, dropped, or pending, with partial success and loss explicit.

**Formal sketch.** `offered = queued + rejected`; `queued = exported + dropped +
pending`; all quantities are nonnegative and scope-identical; failed closure
makes evidence completeness inconclusive or invalid.

**Plain-language sketch.** Every signal must have a known fate; if some
disappeared and we cannot account for them, we cannot call the evidence complete.

**Domain-context sketch.** ORODI requires telemetry accounting before
stable/candidate comparisons or operational claims can pass.

**Boundary.** Accounting closure does not prove semantic correctness,
representativeness, privacy compliance, or good system behavior.

### Runtime Evidence (`CAV2-CAND-ORODI-008`)

**Normative sketch.** Runtime Evidence is Operational Evidence produced by an
admitted observer during an authorized execution in the exact bound environment
and accepted only for its declared subject, window, denominator, freshness, and
invalidation keys.

**Formal sketch.** `RuntimeEvidence` is a subset of `OperationalEvidence` where
`execution_ref` and `execution_authorization_ref` are present, the observer is
admitted, the observed environment is the bound environment, and `simulated =
false`.

**Plain-language sketch.** Runtime evidence comes from watching the real
authorized run in the exact place we claim, not from a schema, replay, plan, or
simulation.

**Domain-context sketch.** ORODI requires runtime evidence for commissioning and
environment-behavior claims while keeping offline and projected evidence
explicitly denied.

**Boundary.** Static tests, decoded receipts, generated projections,
configuration, simulation, plans, and not-run packages are not Runtime Evidence.

### Deployment Evidence (`CAV2-CAND-ORODI-009`)

**Normative sketch.** Deployment Evidence is independent Runtime Evidence that
an explicitly authorized environment transition occurred and that binds the
observed pre-state, requested transition, resulting state, time, actor or
controller, and exact stable and candidate identities.

**Formal sketch.** `DeploymentEvidence = RuntimeEvidence +
(authorization_ref, pre_state, requested_transition, observed_post_state,
actor_ref, stable_digest, candidate_digest)`; `observed_effect = true` and
`authority_effect = none`.

**Plain-language sketch.** It proves that an authorized change really happened
and records what state the environment reached; it does not grant permission for
the change.

**Domain-context sketch.** ORODI keeps simulated deployment separate from
independently observed environment effects and uses deployment evidence as input
to rollback and terminal-state evaluation.

**Boundary.** A deployment plan, command invocation, simulation, canary verdict,
static configuration, or controller acknowledgement alone is not Deployment
Evidence.

### Rollback Restoration Evidence (`CAV2-CAND-ORODI-010`)

**Normative sketch.** Rollback Restoration Evidence is independent Runtime
Evidence that, before the bound deadline, every resource in the complete
rollback inventory has zero candidate reference and the declared stable identity
and required critical outcomes are restored.

**Formal sketch.** `Restored(inventory, deadline)` holds only when the inventory
is complete and every resource observed before the deadline has zero candidate
references, the expected stable digest, and restored critical outcomes;
invocation of rollback alone is insufficient.

**Plain-language sketch.** Rollback is complete only when an independent check
shows the candidate is gone everywhere it should be and the stable system is
actually back.

**Domain-context sketch.** ORODI uses a recovery ledger, ordered rollback,
complete resource inventory, deadline, and independent observer to establish
restoration.

**Boundary.** Calling a rollback function, stopping one component, receiving a
controller acknowledgement, or passing a tabletop test is not Rollback
Restoration Evidence.

## Bounded-Context Disposition

The approved ORODI-local track contains exactly these source records:

- `DEFINE-HANDLED-DEFINITION-ORODI-001` — ORODI
- `DEFINE-HANDLED-DEFINITION-ORODI-009` — Deployment Integration
- `DEFINE-HANDLED-DEFINITION-ORODI-010` — Operational Simulation
- `DEFINE-HANDLED-DEFINITION-ORODI-011` — Canary Analysis
- `DEFINE-HANDLED-DEFINITION-ORODI-015` — Infrastructure Plan Safety
- `DEFINE-HANDLED-DEFINITION-ORODI-016` — Run-Ready Local Lab
- `DEFINE-HANDLED-DEFINITION-ORODI-017` — Local Commissioning

They remain exact records in the source pack. Their approved disposition does
not admit a business ontology or turn the pack into canonical shared authority.

## Promotion Result

The definitions-governance owner promoted the reviewed selection on 2026-09-02
as `CAV2-D83` through `CAV2-D92`. The exact decision binds the immutable source,
revision, exercise, review, selected IDs, and synchronized canonical postimages.
The seven bounded-context terms remain local candidates. Promotion grants
definition authority only; each consuming domain still requires a separate
version-exact adoption or admission decision.
