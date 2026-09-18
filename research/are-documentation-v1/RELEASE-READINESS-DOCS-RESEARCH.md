# Release-readiness documentation research

Status: candidate research, reviewed source snapshot 2026-09-17.
Authority effect: none.
Scope: seven deferred ARE guides: deployment; migration and upgrade; generated
API field reference; public security policy; service runbook and SLOs; release
notes and changelog; compliance.

## Objective and question

Determine which guides can be authored truthfully from Candidate 013 evidence,
which require new product or operational decisions, and what dependency order
prevents documentation from creating unsupported deployment, security,
reliability, compatibility, or compliance claims.

The project lighthouse remains the objective owner. Documentation must make the
engine easier to evaluate and operate without converting a tested private
candidate into a public package, deployed service, supported API, SLO, security
commitment, or compliance status.

## Research DAG

~~~mermaid
flowchart TD
    O[Objective: truthful release-readiness guides] --> G[Gap: seven guides deferred]
    G --> Q[Which facts and owner decisions does each guide require?]
    Q --> H0[H0: current sources are sufficient for all seven]
    Q --> H1[H1: operational guides require a selected deployment model]
    Q --> H2[H2: API reference requires public-surface classification]
    Q --> H3[H3: policy guides require named owners and applicability decisions]
    Q --> H4[H4: templates can be created before claims are supportable]
    H0 --> E[Repository and standards evidence]
    H1 --> E
    H2 --> E
    H3 --> E
    H4 --> E
    E --> D[Decision: staged evidence-gated authoring]
    D --> P[Dependency-ordered implementation plan]
~~~

## Competing hypotheses and observations

| Hypothesis | Prediction | Observation | Disposition |
| --- | --- | --- | --- |
| H0 — current sources are sufficient | Seven complete, actionable guides can be written without new decisions | No accepted artifact, deployment topology, public API, service, SLO, reporting channel, jurisdiction, or compliance classification exists | Rejected |
| H1 — operational model first | Deployment, migration, runbook, and SLO content depends on a selected runtime/artifact/storage topology | Current evidence covers a local Unix-socket candidate with single-writer stores, while hosted and multi-tenant operation are excluded | Supported |
| H2 — classify before generating API docs | Generation without a selected surface will publish internal helpers as supported API | Existing research found 1,067 lexical export candidates; a narrower scan finds 409 named exports across 17 package entrypoints, and neither count is a public API decision | Supported |
| H3 — policy ownership first | Security and compliance prose without contacts, scope, jurisdiction, and accountable owners will make false commitments | Repository sources contain technical boundaries but no public vulnerability intake, response commitment, deployment role, jurisdiction, or certification decision | Supported |
| H4 — templates can precede claims | A guide can expose known facts and explicit `TBD` gates without asserting readiness | The current manual already uses lifecycle postures and claim limits successfully | Supported with constraint: templates must be visibly non-operational |

## Repository evidence

### Deployment

Candidate 013 supports a local Unix-socket gateway, a pinned Node runtime, a
Codex backend plus a generic JSON-lines process adapter, bounded in-memory and
file-backed state, and single-writer persistence. It has no accepted deployment
artifact, service manager definition, container image, network endpoint,
multi-tenant isolation, health-check contract, or production configuration.

The frozen candidate also depends on 1,769 content-addressed workspace inputs
that are not all represented by a fresh ARE Git checkout. Packaging or binding
those inputs is a prerequisite for an executable deployment guide.

### Migration and upgrade

Records carry schema versions and append-only identities. Recovery and rollback
mechanisms exist for bounded runtime concerns, and the evolution runtime can
recommend a serving-version change. There is no declared installed baseline,
data migration CLI, compatibility matrix for persisted records, or tested
Candidate 013-to-successor upgrade path. An upgrade recommendation is not a data
migration.

### Generated API field reference

The product has 17 JavaScript package entrypoints for 17 library components,
plus one executable benchmark component. Existing documentation research
indexes 1,067 lexical export declarations across the wider source surface. A
simple entrypoint scan recognizes 409 named exports, showing that extraction
method changes the apparent API. The three standalone coding-runtime JSON
Schemas contain 59 property declarations and no `description` annotations.

Generation is technically feasible, but the supported public subset, stability
level, naming rules, schema annotation requirements, and internal exclusions
must be selected first.

### Public security policy

The codebase has secret-provider boundaries, effect gates, local socket
assumptions, fail-closed recovery, closure scanning, and explicit security claim
limits. It does not have a public reporting address or form, supported public
versions, response-time commitment, disclosure/safe-harbor language, or selected
in-scope deployed system. Those are policy commitments owned outside the
implementation.

### Service runbook and SLOs

The runtime exposes journals, gateway lifecycle events, cache telemetry, test
receipts, and bounded operational limits. It has no accepted service boundary,
production telemetry exporter, stable metric catalog, alert thresholds, on-call
owner, escalation channel, traffic profile, availability history, or user-based
SLI. Candidate tests and benchmark scores are not service reliability measures.

### Release notes and changelog

Immutable candidate records, product versions, closure digests, test receipts,
and historical decisions provide a strong source for internal candidate notes.
There is no accepted public release series, tag convention, public API baseline,
or changelog policy. Internal candidate history can be generated now; a public
changelog begins only after an accepted release baseline and versioning policy.

### Compliance

ARE records provenance, authority separation, model limitations, security
boundaries, evaluation evidence, and data-retention gaps. No intended deployment
jurisdiction, regulated use case, provider/deployer role classification, data
controller/processor role, applicable control framework, legal owner, audit
scope, or certification target is selected. A compliance guide can initially be
an applicability and evidence map; it cannot state conformity or certification.

## External evidence

| Source | Relevant pattern | Planning consequence |
| --- | --- | --- |
| [NIST SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final) | Secure development practices need integration into the chosen lifecycle and traceable producer/acquirer responsibilities | Security documentation must map practices to evidence and owners instead of claiming security from tests alone |
| [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | AI risk work connects Govern, Map, Measure, and Manage and expects context, roles, monitoring, and lifecycle review | Compliance work begins with applicability, intended use, actors, risk tolerance, measures, and review ownership |
| [EU AI Act official text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689) | Obligations vary by role, system classification, intended use, and deployment context | Do not create an EU compliance claim before role and applicability classification by a qualified owner |
| [GitHub repository security guidance](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories) | A repository security policy explains how vulnerabilities are reported; platform security controls remain separate | `SECURITY.md` needs a real intake channel and supported-version scope |
| [CISA vulnerability disclosure policy guidance](https://www.cisa.gov/sites/default/files/publications/guide-vulnerability-reporting-americas-election-admins_508.pdf) | Disclosure policy should define scope, permitted testing, submission information, handling, and disclosure expectations | Policy placeholders cannot be published as a working vulnerability program |
| [Google SRE SLO guidance](https://sre.google/workbook/implementing-slos/) | SLOs express user-facing reliability targets through SLIs and error budgets and should be iterated from evidence | Select service users and instrument SLIs before choosing numerical targets |
| [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | Stable names and attributes make telemetry correlatable across events, logs, metrics, and traces | Define an ARE telemetry contract and sensitive/high-cardinality fields before runbook alerts |
| [JSON Schema annotations](https://json-schema.org/understanding-json-schema/reference/annotations) | Titles, descriptions, examples, deprecation, and read/write annotations support documentation generators | Enrich selected schemas and validate examples before generating field reference |
| [Semantic Versioning 2.0.0](https://semver.org/) | Semantic versioning depends on a declared public API and immutable released versions | Select the public API baseline before promising SemVer or migration compatibility |
| [GitHub release guidance](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) | Releases bind tags, assets, notes, and downloadable artifacts | Release notes must reference an accepted immutable artifact, not only a working tree |

External sources provide patterns and legal text; they do not determine ARE's
deployment, policy, SLO, or compliance decisions.

## Readiness assessment

| Guide | Research readiness | Earliest honest artifact | Missing gate |
| --- | --- | --- | --- |
| Generated API field reference | Ready for generator design | Internal candidate reference labeled by stability | Supported-surface registry and schema annotations |
| Release notes and changelog | Ready for candidate-history generation | Unreleased/internal candidate notes | Accepted release baseline, tag and version policy for public history |
| Deployment guide | Ready for topology decision | Deployment-readiness template with current local topology | Reproducible artifact, selected topology, configuration and rollback evidence |
| Migration and upgrade guide | Ready for compatibility design | Compatibility and migration template | Two supported versions and tested state/config migration |
| Public security policy | Ready for policy intake design | Private draft with no reporting promise | Security owner, reporting channel, supported versions, scope and response policy |
| Service runbook and SLOs | Ready for instrumentation plan | Runbook skeleton and proposed SLI catalog | Accepted service, telemetry, operator/on-call model and measured baseline |
| Compliance guide | Ready for applicability mapping | Non-claiming framework/evidence map | Jurisdiction, intended use, roles, risk class, legal/compliance owner and review |

## Selected conclusion

Use one dependency-ordered documentation-readiness program. Generate evidence
where the repository already owns machine-readable facts, and introduce owner
gates where a document would otherwise invent a promise. Do not write seven
apparently complete guides in parallel.

The program should have four lanes:

1. **Product facts:** public surface, artifact identity, versions, storage and
   configuration contracts.
2. **Operational facts:** deployment topology, telemetry, recovery, rollback,
   incidents and user-facing service boundaries.
3. **Policy decisions:** security intake, disclosure, applicability,
   jurisdiction, roles, risk tolerance and compliance ownership.
4. **Publication:** generated references, release notes, guide integration,
   link/claim verification and owner review.

## Falsifiers and review tests

The staged conclusion should be rejected or revised if:

- a currently accepted deployment artifact and topology are found;
- a public API registry already classifies supported exports and fields;
- an active vulnerability intake and response commitment already exists;
- an operating service already has production SLIs, alerts and on-call ownership;
- a legal/compliance owner has already classified applicable obligations; or
- the proposed plan lets placeholder text look like an active commitment.

Plan review must check every task for an evidence input, owner, output, gate,
failure state, and claim ceiling. It must keep product-construction work separate
from operational and policy decisions.

## Open Questions

- Is the first intended deployment a single-user local service, a shared private
  service, or a distributable CLI/package without a continuously running service?
- Which exports and record schemas should form the first supported public API?
- Who owns security reports, operational incidents, SLO decisions, and legal
  applicability review?
- Which jurisdiction and intended-use scenario should the first compliance map
  evaluate?
