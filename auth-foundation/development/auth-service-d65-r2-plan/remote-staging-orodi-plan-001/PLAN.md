# Auth remote-staging ORODI execution plan

## Objective

Produce independently reviewable **remote-staging operational evidence** for
the exact Auth candidate by running it in a remotely isolated,
production-shaped staging environment with managed secrets, admitted product
observers, retained telemetry, bounded load and fault campaigns, backup restore,
and verified rollback. The result must preserve the boundary between:

1. Auth V3 construction evidence;
2. local supervised staging-rehearsal evidence;
3. remote-staging operational evidence;
4. a later authorized production-canary evidence epoch; and
5. sustained production operational evidence.

Passing this plan may justify preparing a production-canary decision package.
It cannot create production evidence, product approval, runtime admission,
release, certification, or deployment authority.

## ORODI reuse

This plan reuses the existing Craft ORODI meanings and capability contracts:

- `CAV2-D83` through `CAV2-D92`: Operational Resilience, Operational Evidence,
  Evaluation Binding, disjoint evidence states, Failure Meaning Separation,
  Product Observability, Telemetry Conservation, Runtime Evidence, Deployment
  Evidence, and Rollback Restoration Evidence.
- `CA2-CAP-ORODI-EVALUATE-OFFLINE-EVIDENCE` for deterministic preflight replay.
- `CA2-CAP-ORODI-EVALUATE-CANARY` for stable/candidate comparison with
  candidate-only faults and missing-data failure.
- `CA2-CAP-ORODI-VERIFY-ROLLBACK` for ordered rollback and independent proof
  that the complete inventory contains zero candidate references.
- `CA2-CAP-POLICY-ORODI-NON-INFLATING-EVIDENCE`: missing evidence fails closed;
  tests, simulations, plans, and projections never become runtime truth.

The ORODI Product Capability package is a candidate and its canary, rollback,
and commissioning realization bindings are planned or deferred. This plan uses
its active definitions and exact candidate contract shapes as planning inputs; it
does not claim ORODI runtime conformance or adoption.

### Current ORODI dependency state

The ORODI validator now discovers both the historical umbrella layout and the
current extracted sibling checkouts. Two layout tests protect that behavior.
A fresh validation on 2026-09-12 executes correctly and reports `status: fail`
with process exit code 1 and 20 package-currentness errors. Those errors include
six obsolete `public-realization` owner roles, drift in definitions, Craft
thesis, Project, system ontology, and DomainSpec-profile bindings, and missing
current Project links to the ORODI Goal and six ConstructionBindings.

`Z0` therefore selects the active CAV2-D83 through CAV2-D92 definitions and the
exact local candidate implementation bytes needed by this Auth evaluation. It
also records the failing package receipt and denies use of stale admission. It
does not refresh owner-bound hashes or claim that the ORODI source package is
currently admitted. Status/exit agreement remains a hostile regression control.
Any selected-byte change invalidates this plan's evidence and requires a fresh
selection and predecessor seal.

## Sealed predecessors

| Input | Digest | Use |
| --- | --- | --- |
| Auth V3 author result, attempt 005 | `b44aa86bd5b9d312aaf8e83d4abe51c33880a891337bca5222a7e32bc046e185` | exact five-obligation verification result |
| Auth V3 reviewer result, attempt 002 | `ec1cc92086a4d82922f3bee79f46c05a5ece62b2c96b5a217c2de5e0971ef41b` | independent V3 agreement |
| Local staging result, attempt 001 | `bd615fe3da8743208e151f50db668c10b75949578a729331477f3ac9b66aeb3f` | predecessor operational rehearsal |
| Local deployment report | `603980c0164906fea5b90337ce141c7fc08bbba602b3bb4e2d4d68da428dc82f` | known successes and harness residue |
| ORODI support contract | `6e89fd508c2a40b534c9b4ed6116f31903bca6974ff268875952e96d0b2d5eaa` | capability obligations and owner roles |
| ORODI immutable capability records | `cb7c7286550e8fd2b3f7e66efc9aab5745d9df16c886f437688037caa7a65dbf` | stable capability identities |
| CyberAlchemy definitions | `ecfbd64f334954809e83ffd5d4f9adfb759f39716de96c3ac1227d4ee869c6f8` | exact ORODI definitions source |

Any digest change invalidates this plan's predecessor seal and returns `S0` to
`stale`. The predecessor HTTPS campaign's 6/10 result and MFA-overlay overwrite
remain diagnostic counterevidence. The remote runner must prove idempotent
configuration composition before it may deploy.

## Two work lanes

### Product construction

Current bounded frontier: the exact five-obligation Auth V3 suite has passing
author evidence and an independent `AGREE` replay. Before remote deployment,
`P0` determines whether production-shaped telemetry, secret injection, health,
backup, or rollback contracts require changes to Auth bytes.

- If no product bytes change, `P0` emits a digest-bound no-change finding and
  `G0` can use the existing candidate.
- If product bytes change, `P1` creates a successor candidate and reruns the
  relevant Rust, Lean, TLC, Alloy, Souffle, mutation, and independent replay
  routes. Operational setup that does not depend on those bytes may continue,
  but candidate deployment waits at `G0`.

This keeps runnable product work visible without allowing infrastructure work to
silently advance the product-construction stage.

An optional `X0` branch may deploy an exact experimental portability artifact
to isolated loopback-only VPS resources after B0 and P0. It captures defects and
remote rehearsal evidence while P1 remains open. X0 cannot satisfy G0, O1, B1,
G1, O2, or any production-shaped claim; its result is retained and stops.

### Operational support

Operational work selects and prepares the remote environment, establishes
effect authorization, builds and identifies artifacts, configures isolated
infrastructure and managed secrets, admits independent observers, deploys the
stable baseline and candidate canary, executes evidence campaigns, rolls back,
seals evidence, and obtains independent replay. These tasks affect the remote
staging evidence epoch; they do not change a D65 construction stage unless `P1`
is triggered.

## Proposed bounded profile

These are candidate values. `B0` binds the owning profile decisions before
product construction. `B1` later closes artifact, environment instance,
topology, time, invalidation, and rollback-inventory identities before any
protected effect.

| Dimension | Proposed bound |
| --- | --- |
| Canary allocation | stable 95%, candidate 5%; candidate receives only synthetic or approved staging traffic |
| Warm-up and comparison | 15-minute warm-up, then 60-minute comparison window |
| Load steps | 5, 10, 25, and 50 requests/second for 10 minutes each; concurrency cap 50 |
| Burst | 100 requests/second for 60 seconds; generator saturation is invalid evidence |
| Soak | 25 requests/second for 2 hours |
| Availability | at least 99.0% over the bound comparison and soak observations |
| Correct authorization | 100% for the declared Auth decision fixture denominator |
| Latency | p95 no more than 500 ms and p99 no more than 1 s for accepted requests |
| Telemetry | `offered = queued + rejected` and `queued = exported + dropped + pending`; dropped must be zero for required observations |
| Recovery | worker recovery within 2 minutes; service recovery within 5 minutes |
| Backup restore | restore into an isolated target within 30 minutes; selected recovery-point age no more than 15 minutes |
| Rollback | complete within 10 minutes and independently prove zero candidate references across the full inventory |
| Retention | raw observations at least 30 days; sealed receipt and manifest at least 1 year |

The service-objective owner, workload owner, privacy owner, infrastructure
owner, rollback owner, and staging environment owner must adopt or revise these
values in the exact evaluation binding. An absent owner decision is `missing`.

## Execution gates

`DAG.json` is authoritative for dependency edges. The main gates are:

- **Z0 — exact ORODI dependency selection:** active definitions and exact local
  candidate implementation bytes are selected; the package validator executes;
  structured and process status agree; stale package admission is denied.
- **S0 — predecessor seal:** all source digests match and known counterevidence
  is retained.
- **B0 — profile and owner closure:** owners, observers, fixtures and queries,
  tools, policies, thresholds, rollback classes, and denominator applicability
  are bound. C17-C20 and M14-M17 are either adopted with exact bounds or marked
  inapplicable by their owners; omission is forbidden.
- **G0 — deployable product:** either product bytes are unchanged or a successor
  candidate has passed the affected verification routes and independent replay.
- **G1 — effect gate:** the environment owner authorizes the exact staging
  transition, fault envelope, rollback, backup restore, and cleanup. Credentials
  are referenced by secret-manager identity and never captured in evidence.
- **B1 — exact evaluation closure:** exact subject, environment instance,
  artifacts, topology, observation window, expiry, invalidation keys, and full
  rollback inventory close with B0. The full binding preflight has zero findings.
- **G2 — observation gate:** observers are admitted, telemetry conservation is
  testable, redaction checks pass, clocks are synchronized, and retention is
  active before the candidate receives traffic.
- **G3 — remote-staging verdict:** every required obligation is present, valid,
  fresh, executed, and passed; rollback restoration is independently observed.
- **G4 — production-pilot handoff:** create a digest-bound decision package for
  a separately authorized production canary. G4 performs no production effect.

## Evidence campaigns

The runtime campaigns are finite and retain raw inputs, outputs, timestamps,
actor/controller identities, tool versions, stable and candidate digests, and
environment identifiers.

1. Deploy and observe the stable baseline before introducing the candidate.
2. Deploy the exact candidate digest as a 5% canary and prove stable/candidate
   identity separation.
3. Replay the five Auth property fixtures through the live service: executable
   fail-closed, exact grant, revoked-never-allows, tenant-join isolation, and
   bounded delegation.
4. Exercise candidate-only worker termination, issuer loss, database loss,
   telemetry-export interruption, bad readiness, stale-secret/config input, and
   rate limiting. Subject failure, boundary outcome, and runtime exception are
   recorded separately.
5. Run the declared load, burst, and soak profiles with generator health and
   denominator accounting.
6. Restore the bound backup into an isolated restore target and verify critical
   Auth outcomes without altering the active staging data plane.
7. Roll back even after a passing canary. An independent observer checks every
   resource in the rollback inventory, the stable digest, critical outcomes,
   and zero surviving candidate references.
8. Seal the evidence and have a separate reviewer reproduce all offline
   evaluations from raw observations and manifests.

## Fail-closed stop rules

Stop and classify the affected obligation as `failed`, `missing`, `invalid`,
`inconclusive`, `stale`, or `not-run` when any of these occurs:

- an input, artifact, tool, profile, environment, owner, observer, policy,
  threshold, or inventory binding is absent or ambient-latest;
- the deployment harness can overwrite the durable MFA overlay or is not
  idempotent;
- an observer can deploy, shift traffic, inject faults, roll back, admit,
  promote, or release;
- offered telemetry cannot be completely accounted for, required telemetry is
  dropped, redaction fails, or clocks cannot support the claimed window;
- stable and candidate signals cannot be separated, a fault reaches stable, or
  the load generator saturates;
- a missing, partial, stale, simulated, or controller-acknowledged observation
  is reported as runtime or deployment evidence;
- rollback exceeds its deadline, critical outcomes remain unavailable, the
  inventory is incomplete, or any candidate reference survives;
- the evidence pipeline reports aggregate success after any required member is
  tampered with, omitted, duplicated, made stale, or changed to a non-passing
  state.
- any evaluator's structured status and process exit disagree, or a caller can
  accept `status: fail` as success.

After a protected effect starts, the operator executes only the already
authorized safety rollback/cleanup envelope, captures the failure, and stops.

## Deliverables

- an exact completed evaluation binding;
- environment, artifact, SBOM/provenance, configuration, topology, and secret
  identity manifests;
- admitted observer and retention receipts;
- stable baseline, deployment, canary, correctness, fault, load, soak,
  telemetry, alert, backup-restore, rollback, and cleanup evidence;
- an append-only evidence-state ledger with all required denominator members;
- an independent replay report and signed digest manifest;
- a G4 production-canary decision package whose effect remains unrequested.

## Owners

| Responsibility | Required owner |
| --- | --- |
| Auth product meaning and successor candidate | Auth Foundation product owner |
| Staging environment and exact protected effects | staging environment owner |
| ORODI evaluation profile and evaluator | ORODI profile/evaluator owner |
| Product telemetry, privacy, and retention | Auth observability and privacy owners |
| Workload and service objectives | Auth workload and SLO owners |
| Deployment and traffic control | staging deployment owner |
| Backup and recovery | staging data/recovery owner |
| Rollback inventory and deadline | rollback owner |
| Independent evidence observation | admitted ORODI observer |
| Independent technical replay | reviewer independent of the author/operator |
| Any later production canary | separately named production environment owner |

## Deferred operational residue

- Select the exact remote staging environment, account/project, region, and
  independent availability boundary.
- Bind secret-manager, monitoring, tracing, logging, artifact registry,
  backup-store, and alert-delivery products with versions and retention rules.
- Decide whether C17-C20/M14-M17 enter this Auth profile; the proposed load,
  stress, soak, and capacity values above are not owner-admitted yet.
- Name the production admission owner and define the production canary's
  traffic source, blast radius, stop authority, and evidence expiry.
- Resolve whether shared Java infrastructure in the V3 TLC/Alloy routes needs a
  second JVM implementation for a stronger independence claim.
- Repair the Goals validator before registering this plan as admitted execution
  state. This does not prevent maintaining the candidate plan.
- Reconcile and revalidate the stale ORODI source-package admissions while
  retaining correct failure exit semantics. This residue does not authorize
  their use and does not invalidate Z0's exact candidate dependency selection.

## Open Questions

- Which exact stable artifact digest will serve as the baseline for the gated
  canary path?
- Which managed platform supplies secrets, telemetry retention, alert delivery,
  artifact identity, and backup storage?
- Are the proposed numerical bounds acceptable to the Auth SLO, workload,
  privacy, recovery, and environment owners?
- Does remote observability require Auth product-byte changes, thereby
  triggering P1 and a fresh V3 evidence epoch?
- What production-canary denominator and duration would be sufficient for a
  later, separately authorized G4 successor?

`authority_effect: none`
