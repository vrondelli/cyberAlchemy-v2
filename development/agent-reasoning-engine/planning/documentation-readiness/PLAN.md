# ARE release-readiness documentation plan

Revision: 2, reviewed, 2026-09-17.
Status: candidate planning; Goals validation is blocked, so this plan is not an
admitted execution state.
Authority effect: none.
Owner: ARE product owner coordinates; named specialist owners decide operational,
security, reliability, release, and legal commitments.

The Goals-package blocker prevents admission of this plan as execution state. It
does not prevent research, planning analysis, or a later separately authorized
implementation request.

## Execution update: self-contained successor

On 2026-09-17 the product owner selected a full self-contained ARE project with
no Alch or DomainSpec build-time or runtime dependency. Candidate 018 implements
that boundary. DR-02 is complete for the private source-distribution scope;
DR-30 and DR-31 are complete with a 907-file content-addressed closure and a
passing 1,158-case isolated suite. A reproducible archive plus disposable
install, health, reconnect/restart, failure-injection, source rollback,
gateway-session and Reasoning-State backup/restore, and uninstall drill now
closes DR-32 for the selected disposable local topology. Trusted signing and
production-profile recovery remain separate gates. Public API policy, owners, security
intake, applicability, and service-operation gates remain unchanged. The exact
local package now has a candidate threat model; risk acceptance, supported
version scope, intake, and broader topologies remain gated.

## Objective

Create seven evidence-bound documentation families without implying that the
private Candidate 013 is deployed, publicly supported, covered by an SLO,
secure against an unstated threat model, or compliant with an unselected legal
framework:

1. deployment;
2. migration and upgrade;
3. generated API field reference;
4. public security policy;
5. service runbook and SLOs;
6. release notes and changelog; and
7. compliance.

The [research basis](../../../../research/are-documentation-v1/RELEASE-READINESS-DOCS-RESEARCH.md)
rejects parallel prose-first authoring. Machine evidence can start the API and
candidate-history lanes. Operational and policy guides need owner decisions and
tested boundaries first.

The [plan review](PLAN-REVIEW.md) found one critical, five high, five medium,
and one low-severity issue in revision 1. Revision 2 applies all twelve findings.

## Success conditions

- Every published statement traces to a current source, measurement, or named
  owner decision.
- Every guide declares lifecycle status, audience, owner, last-reviewed date,
  applicable product version, and claim ceiling.
- Generated reference is reproducible and fails on undocumented or unclassified
  selected fields.
- Deployment and migration instructions are executed against disposable
  environments using the exact artifact and persisted-state formats they name.
- Security reporting, incident escalation, and SLO contacts are tested before
  being presented as active channels.
- Compliance content distinguishes applicability, control mapping, evidence,
  gaps, owner assessment, and external certification.
- The manual, top-level pointers, manifest, source map, and local links agree.
- A documentation release manifest binds every generated and authored page even
  while manual bytes remain outside the product candidate closure.

## Non-goals

- Product approval, public release, deployment, activation, certification, or
  external security/SLO commitments.
- Selecting a jurisdiction, deployment topology, public API, or risk tolerance
  without the responsible owner.
- Turning Candidate 013 tests or ContextBench results into service reliability
  or compliance evidence outside their declared scope.
- Copying external standards into the repository.

## Scientific and work DAGs

The research DAG remains immutable evidence:

~~~text
objective -> gap -> question -> hypotheses -> evidence -> selected staged approach
~~~

This plan is the separate work DAG:

~~~mermaid
flowchart TD
    R0[DR-00 Bind research and current product facts] --> F0[DR-01 Freeze documentation contract]
    F0 --> T0[DR-06 Create inactive evidence-gap skeletons]
    F0 --> D0[DR-02 Select distribution and deployment intent]
    F0 --> A0[DR-03 Classify supported API surface]
    F0 --> P0[DR-05 Assign security reliability and compliance owners]
    A0 --> V0[DR-04 Select version and release policy]

    A0 --> A1[DR-10 Build API manifest and generator]
    A1 --> A2[DR-11 Annotate schemas and validate examples]
    A2 --> A3[DR-12 Generate API field reference]

    V0 --> N0[DR-20 Generate candidate history]
    N0 --> N1[DR-21 Author changelog]
    N0 --> N2[DR-22 Author release-note contract and candidate note]

    P0 --> C0[DR-70 Classify use jurisdiction actors and risk]
    D0 --> C0
    C0 --> D1[DR-30 Select constrained topology and package exact artifact]
    D1 --> D2[DR-31 Bind config secrets storage health and shutdown]
    D2 --> D3[DR-32 Prove install start stop backup restore rollback uninstall]
    D3 --> D4[DR-33 Author deployment guide]

    V0 --> M0[DR-40 Inventory compatibility and persisted formats]
    D2 --> M0
    M0 --> M1[DR-41 Define migration matrix and rollback contract]
    M1 --> M2[DR-42 Test successor migration and recovery]
    M2 --> M3[DR-43 Author migration and upgrade guide]

    P0 --> S0[DR-50 Define security scope intake and response policy]
    D1 --> S1[DR-51 Produce threat model and supported-version scope]
    V0 --> S1
    S0 --> S2[DR-52 Tabletop disclosure and contact handling]
    S1 --> S2
    S2 --> S3[DR-53 Author public security policy]

    D2 --> O0[DR-60 Define telemetry and incident event contract]
    P0 --> O0
    O0 --> O1[DR-61 Select user journeys and SLIs]
    O1 --> O2[DR-62 Measure baseline and select SLOs/error budgets]
    O2 --> O3[DR-63 Exercise alerts recovery and escalation]
    O2 --> O4[DR-64 Author service-level objectives]
    O3 --> O5[DR-65 Author service runbook]
    O4 --> O5

    C0 --> C1[DR-71 Map applicable requirements to evidence and gaps]
    C1 --> C2[DR-72 Independent owner or counsel review]
    C2 --> C3[DR-73 Author compliance guide]

    T0 --> I0[DR-80 Integrate manual and navigation]
    A3 --> I0[DR-80 Integrate manual and navigation]
    N1 --> I0
    N2 --> I0
    D4 --> I0
    M3 --> I0
    S3 --> I0
    O5 --> I0
    C3 --> I0
    I0 --> I1[DR-81 Validate generation links claims and examples]
    I1 --> I2[DR-82 Final cross-guide review]
~~~

## Task contract

| ID | Lane | Task and output | Owner | Completion evidence | Failure or gate |
| --- | --- | --- | --- | --- | --- |
| DR-00 | Product facts | Bind current Candidate 018, historical Candidate 013 evidence, product manifest, capability records, manual coverage, research decision, and current dirty/uncommitted posture | Documentation owner | Source inventory with exact paths/digests and no unsupported status inference | Changed or ambiguous source owner blocks dependent claims |
| DR-01 | Publication | Define required front matter, claim classes, source-link format, generated-file marker, review interval, and stale-content check | Documentation owner | Documentation contract and negative fixtures | No guide authoring until status and claim labels are unambiguous |
| DR-02 | Owner decision | Select first intended distribution: local service, private shared service, or installable CLI/package; identify users and environment | Product owner | Signed/recorded decision with exclusions | No executable deployment prose without selection |
| DR-03 | Product facts | Classify every candidate export/schema as supported, internal, generated, experimental, or excluded | Product/runtime owners | Closed public-surface manifest; every selected item has source and stability | Lexical export discovery cannot select support status |
| DR-04 | Owner decision | Select public API baseline, version semantics, tag convention, release-note categories, and changelog start | Product/release owners | Version/release policy decision | Candidate number alone is not a public version policy |
| DR-05 | Policy | Name security intake, incident/on-call, SLO, privacy, and legal/compliance owners and real contact paths | Product owner plus named owners | Owner matrix; contact verification plan | Placeholder contacts block active policy publication |
| DR-06 | Publication | Create visibly inactive evidence-gap skeletons for all seven families using the status contract | Documentation owner | Every requested family has a linked page that distinguishes known facts, missing evidence, trigger, owner and claim ceiling | Skeletons contain no runnable command, contact promise, SLO target or compliance claim without its gate |
| DR-10 | Product facts | Build deterministic API manifest and documentation generator from selected entrypoint exports, re-exports, schema constants, JSON Schemas, CLI request/results and protocol records | Runtime/documentation owners | Repeated generation is byte-identical; unclassified contract test fails | Generator must not traverse ambient/internal exports |
| DR-11 | Product facts | Add descriptions, required/default/deprecated/read/write metadata, validated examples, and sensitive-field notes to selected schemas | Contract owners | Schema tests and positive/negative examples pass | Annotation cannot change validation semantics accidentally |
| DR-12 | Publication | Generate `docs/reference/API-FIELDS.md` with package/export and record-field indexes | Documentation owner | Source digest, generator version, zero drift, all links valid | Generated prose never becomes the source contract |
| DR-20 | Product facts | Extract immutable candidate history and meaningful product changes | Release owner | Machine record linking versions, candidates, closure/test receipts, decisions | Working-tree diff is insufficient release history |
| DR-21 | Publication | Create cumulative product-root `CHANGELOG.md` from accepted change records | Release/documentation owners | Every entry traces to accepted source evidence and follows the selected change taxonomy | Working-tree churn and unreleased research results remain excluded |
| DR-22 | Publication | Create the versioned release-note contract and first internal candidate note | Release/documentation owners | Artifact identity, audience impact, compatibility, known issues and evidence links are complete; security-sensitive detail reviewed | Public release notes wait for accepted tag/artifact |
| DR-30 | Operations | Select a topology constrained by DR-70 and produce one reproducible, content-addressed artifact with no undeclared external build/runtime dependency | Product/release/operations owners | Clean-environment artifact build, inventory, checksums, provenance and applicable-policy constraint review | Candidate 013 workspace-only inputs or unresolved applicable constraints block deployment claims |
| DR-31 | Operations | Bind config, secret injection, filesystem ownership, state paths, quotas, health/readiness, shutdown, backup, and log/telemetry sinks | Operations/security owners | Deployment profile schema and validation fixtures | Missing secret/storage/health behavior blocks guide |
| DR-32 | Operations | Exercise install, start, reconnect, stop, restart, backup, restore, rollback, and uninstall in a disposable target | Operations owner | Transcript/receipts, failure injection, rollback and cleanup verification | Unknown external outcome or incomplete restore fails the task |
| DR-33 | Publication | Author `docs/DEPLOYMENT.md` for the exact tested topology | Documentation/operations owners | Fresh-reader execution in a clean disposable environment | Guide must label all other topologies unsupported |
| DR-40 | Product facts | Inventory config, protocol, schema, state, journal, credential, and artifact compatibility identities | Runtime owners | Compatibility matrix with readers/writers and current version | Missing identity remains an explicit gap |
| DR-41 | Product/operations | Define preflight, backup, migration, verification, rollback, downgrade, irreversible-change, and abort contracts | Runtime/operations owners | Version-pair migration specification and fixtures | No claim of automatic migration before tested implementation |
| DR-42 | Product/operations | Test one supported predecessor-to-successor upgrade and every affected store/config boundary | Runtime/operations owners | Forward migration, restart, verification and rollback evidence | Requires two selected supported versions; otherwise NOT_RUN |
| DR-43 | Publication | Author `docs/MIGRATION-AND-UPGRADE.md` | Documentation/runtime owners | Commands reproduce DR-42; unsupported paths and data-loss risks visible | Until DR-42, publish only “no supported upgrade path” status |
| DR-50 | Policy | Define vulnerability scope, intake, required report fields, permitted testing, coordination, privacy, response stages, and timing commitments | Security owner | Approved policy decision and functioning private intake | No invented safe harbor or response promise |
| DR-51 | Security | Threat-model the exact distribution/deployment and bind supported versions to DR-04 | Security/runtime/operations owners | Assets, actors, trust boundaries, threats, mitigations, version scope and residue | Generic local tests do not prove hostile isolation |
| DR-52 | Security | Tabletop valid, duplicate, spam, sensitive-data, embargoed, and out-of-scope reports | Security owner | Intake delivery, acknowledgement, triage, escalation and closure evidence | Failed channel or missing owner blocks publication |
| DR-53 | Publication | Place `SECURITY.md` at the selected distribution root and link it from the manual | Security/documentation owners | Discoverability and contact test; exact supported-version table | Private draft cannot be described as public policy |
| DR-60 | Operations | Define stable service identity, events, metrics, logs, traces, cardinality, redaction, retention, and correlation | Runtime/operations/privacy owners | Versioned telemetry contract and fixtures | Sensitive/unbounded fields block export |
| DR-61 | Reliability | Select user journeys and SLIs with numerator, denominator, exclusions, windows, and data source | Product/reliability owners | SLI specification tied to real user outcomes | Test pass rate and model benchmark score are not availability SLIs |
| DR-62 | Reliability | Measure a representative baseline, then select targets and error-budget policy | Reliability/product owners | Baseline dataset, uncertainty, owner-approved targets | Do not invent numerical targets without traffic/evidence |
| DR-63 | Operations | Exercise symptom-to-alert-to-diagnosis-to-mitigation-to-recovery and escalation paths | Operations/reliability owners | Timed game-day evidence and corrected procedures | Failed recovery revises system or runbook before publication |
| DR-64 | Reliability/publication | Author `docs/SERVICE-LEVEL-OBJECTIVES.md` with user journeys, SLIs, targets, windows, exclusions, error budgets and review policy | Product/reliability/documentation owners | Every target traces to baseline evidence and an owner decision | No service means lifecycle status remains NOT_APPLICABLE |
| DR-65 | Operations/publication | Author `docs/SERVICE-RUNBOOK.md` with symptoms, alerts, resource IDs, diagnosis, mitigation, recovery, escalation and post-incident steps | Operations/reliability/documentation owners | Every query, command, dashboard, alert, credential reference and contact exists; game-day path passes without exposing secrets | Unresolved resource or failed recovery blocks active posture |
| DR-70 | Policy | Classify intended use, jurisdictions, provider/deployer roles, data roles, affected people, risk class and chosen frameworks | Legal/compliance/product/privacy owners | Applicability decision with review date and assumptions | Engineering cannot make legal classification implicitly |
| DR-71 | Policy/evidence | Map applicable obligations/controls to owner, implementation, evidence, gap and remediation | Compliance owner | Evidence matrix with no self-certification by proximity | Missing evidence is a gap, never “compliant by design” |
| DR-72 | Review | Obtain independent qualified review of applicability and claim wording | Legal/compliance owner | Findings, resolutions, accepted residual risks and expiry | Review cannot be replaced by documentation validation |
| DR-73 | Publication | Author `docs/COMPLIANCE.md` as scope/evidence/gap guide | Compliance/documentation owners | Exact framework/version, applicability, evidence dates and disclaimers | Certification claims require separate external evidence |
| DR-80 | Publication | Add outputs to manual routes, manifest, source map and coverage map | Documentation owner | All expected pages reachable by intended reader path | Duplicate ownership or orphan page fails integration |
| DR-81 | Validation | Run generators, examples, links, schema tests, secret/PII scans, stale-source checks and documentation verifier; emit a documentation release manifest and receipt | Documentation plus source owners | Machine-readable all-pass receipt binds every page, source digest, generator and bounded exclusion | Any generated drift or broken executable example blocks closure |
| DR-82 | Review | Cross-review terminology, versions, contacts, claims, status rendering and contradictions across all guides | Product and independent domain owners | Resolved review log, negative check that drafts cannot look active, and remaining open questions | Review grants no publication or deployment authority |

## Document outputs

| Family | Planned artifact | Initial posture |
| --- | --- | --- |
| Deployment | `implementation/agent-reasoning-engine/docs/DEPLOYMENT.md` | Blocked until DR-30–32; a readiness page may state the block |
| Migration and upgrade | `implementation/agent-reasoning-engine/docs/MIGRATION-AND-UPGRADE.md` | “No supported upgrade path” until DR-42 passes |
| API field reference | `implementation/agent-reasoning-engine/docs/reference/API-FIELDS.md` plus source manifest and generator | Candidate/internal until public surface is selected |
| Security policy | Selected distribution-root `SECURITY.md` plus manual link | Private draft until DR-52 passes |
| Runbook and SLOs | `docs/SERVICE-LEVEL-OBJECTIVES.md` and `docs/SERVICE-RUNBOOK.md` | NOT_APPLICABLE until service selection; SLOs require a baseline and owner decision; runbook requires a game day |
| Release history | Product-root `CHANGELOG.md` and versioned `docs/releases/` note | Internal candidate history until accepted release |
| Compliance | `implementation/agent-reasoning-engine/docs/COMPLIANCE.md` | Applicability/evidence map; never self-certification |

## Construction and operational lanes

Current product-construction frontier: DR-00, DR-01 and DR-06, followed by the
machine-evidence lanes DR-03/10–12 and DR-20–22 once their owner decisions are
available. These tasks create documentation infrastructure and visibly inactive
candidate prose; they do not require a live service.

Operational tasks DR-30–33, DR-40–43, and DR-60–65 are tied to a selected
deployment and service. Policy tasks DR-05, DR-50–53, and DR-70–73 require named
owners. Unresolved operational work does not block API/reference construction,
but it blocks claims that the affected guide is executable or active.

| Operational prerequisite | Affected tasks | Owner | Blocking basis |
| --- | --- | --- | --- |
| Reproducible artifact and deployment topology | DR-30–33, DR-51, DR-60–65 | Product/release/operations | Exact prerequisite for deployment and service instructions |
| Two supported versions | DR-42–43 | Product/runtime | Exact prerequisite for tested upgrade claims |
| Active security intake | DR-52–53 | Security | Safety and external-contact boundary |
| Production-like telemetry and traffic evidence | DR-62–65 | Reliability/operations | Exact prerequisite for numerical SLOs and alerts |
| Jurisdiction/use/role classification | DR-70–73 | Legal/compliance/product | Authority and legal applicability boundary |
| Public release decision | Public DR-21/22, DR-53, DR-73 | Product/release/policy owners | Publication is a separate effect |

## Ownership and freshness

| Artifact | Maintainer | Mandatory stale trigger |
| --- | --- | --- |
| Deployment guide | Operations owner | Artifact, topology, runtime, configuration, secret, storage or recovery change |
| Migration guide | Runtime owner | Supported-version, schema, persisted-state or compatibility change |
| Generated API reference | Contract owners | Selected-surface or schema digest change; checked on every generation |
| Security policy | Security owner | Contact, supported-version, scope, threat-model or response-policy change |
| SLO document | Product/reliability owners | User journey, SLI, target, window, baseline or error-budget policy change |
| Service runbook | Operations owner | Alert, dashboard, command, topology, escalation or recovery change; review after every incident/game day |
| Changelog/release notes | Release owner | Every accepted release; corrections remain append-only and attributed |
| Compliance guide | Compliance owner | Intended use, jurisdiction, role, framework, evidence or legal interpretation change |

## Execution order

1. Complete DR-00/01, then DR-06 so every requested family has a truthful,
   visibly inactive starting page.
2. Complete DR-02/03/05. Run DR-70 applicability classification before topology
   is frozen, and complete DR-04 after the supported API surface is closed.
3. Run API and release-history lanes in parallel after DR-03/04.
4. Build and test the deployment lane after DR-02/05/70.
5. Run migration compatibility work when an exact successor exists; until then,
   keep the initial no-supported-path guide current.
6. Complete security tabletop work against the selected artifact/topology and
   version scope.
7. Instrument the selected service, measure baseline, then set SLOs and exercise
   the separate runbook.
8. Finish compliance mapping and qualified review after technical constraints
   have been incorporated.
9. Integrate, validate, and cross-review all pages. Route publication,
   deployment, or external commitments separately.

## Stop conditions

- Stop a lane when its named owner, source contract, artifact, or measurement is
  absent; record `BLOCKED` or `NOT_APPLICABLE` rather than filling the gap.
- Stop publication if any contact, command, rollback, alert, evidence link, or
  compliance scope cannot be exercised or verified.
- Stop generation if an export or field lacks classification, ownership, or
  required annotation.
- Stop SLO selection if the user journey or measurement denominator is unknown.
- Stop compliance wording if applicability or reviewer authority is unresolved.

## Validation

The plan itself requires link and DAG checks. Implementation later requires the
existing documentation validator plus generators, executable examples, policy
contact tests, deployment/migration drills, telemetry fixtures, game-day
evidence, and qualified policy review. Passing those checks proves only their
declared scope.

## Open Questions

- Which distribution/deployment intent will the product owner select first?
- Which exact exports and schemas form the supported API surface?
- Who owns the security intake, incident response, SLOs, and compliance review?
- Which successor version will provide the first real migration pair?
- Which jurisdiction and intended use should the first applicability review use?
