# ARE release-readiness owner decision packet

Prepared: 2026-09-17.
Applies to: private Candidate 018 and the later commercial customer successor.
Status: All product-owner decisions recorded; evidence verification and qualified review remain open.
Authority effect: none.

This packet records the completed owner-decision frontier. The machine-readable
[`release-owner-decisions.json`](../../../../implementation/agent-reasoning-engine/docs/release-owner-decisions.json)
is the closed decision record. Source-rights provenance review, contact testing, successor
construction, and qualified legal review remain evidence gates rather than open
product choices.

## Decision 1: first distribution

**Recorded selection (updated 2026-09-17):** sell and deliver the full
self-contained ARE software to customers as a downloadable source closure for
one user on one local host, with an optional customer-owned local gateway
process and Unix socket.
The first distributable version must be a successor to Candidate 013 because
the [artifact preflight](../../../../implementation/agent-reasoning-engine/docs/releases/candidate-013-artifact-preflight.json)
proves that 465 frozen files are no longer recoverable from its bound inputs,
including 457 DomainSpec compiler outputs, six Alch compiler outputs, and two
additional DomainSpec records.

| Option | Consequence |
| --- | --- |
| Paid downloadable full-software package | Reuses the tested local boundary; requires a standalone artifact, final license/notice bundle and install/upgrade lifecycle, but no hosted-service SLO or on-call claim |
| Local managed service | Adds service-manager, health, backup, restart, logging, and operator ownership before distribution |
| Shared private service | Adds network, authentication, tenancy, isolation, service telemetry, incident response, and SLO obligations unsupported by Candidate 013 |

The selected downloadable-software model keeps SLO and active runbook documents `NOT_APPLICABLE` while
still requiring reproducible packaging, local storage ownership, rollback, and
security review.

The product owner explicitly required the full project without Alch or
DomainSpec. Candidate 018 implements that choice: its 907-file closure contains
neither external tree, and all 1,158 product tests pass from the isolated copy.
Packaging or rebuilding those compilers is rejected for this distribution.

Decision record fields:

- Selection: self-contained source-closure ARE project
- Commercial model: paid download of the complete software, not hosted access
- Intended users: customers operating ARE for themselves or integrating it
- Supported operating systems/architectures: Linux x64 with Node.js `26.8.1`
  for the tested candidate procedure
- Installation boundary: normalized source archive extracted into a local
  user-owned prefix; no service manager or network listener is activated by
  installation
- Successor compiler strategy: eliminate the dependencies
- Explicit exclusions: Alch, DomainSpec, hosted/shared service claims
- License direction: latest Keld candidate source-available intent, pending
  exact legal text and rights/notice review
- Product owner and review date: product owner, 2026-09-17

## Decision 2: public API and version policy

**Recorded selection (2026-09-17):** distribute the complete self-contained ARE
project while supporting only the documented decision CLI and JSON-lines
process-adapter contracts on the first accepted successor. Keep all 16 current
JavaScript package entrypoints candidate-internal. Use Semantic Versioning
prereleases beginning with `0.10.0-rc.1` and tag it `v0.10.0-rc.1` only after
the successor is frozen and independently verified.

The selected [`release-policy.json`](../../../../implementation/agent-reasoning-engine/docs/release-policy.json)
also fixes the changelog taxonomy, append-only correction rule, one-minor
deprecation window with an urgent-security exception, and no-predecessor policy.
Its receipt verifies the two selected contract source sets and binds the latest
Keld license research by digest. Customers receive the complete software; the
support boundary still covers only the selected contracts. The decision does
not execute legal terms, accept payment, rename, tag, publish, or activate
Candidate 018.

The resale rule covers sales of redistributed software copies. An added working
function or integration qualifies; cosmetic edits, renaming, and bug fixes alone
do not. Hosted access and paid support services are outside the resale rule.
The machine-readable
[`license-requirements.json`](../../../../implementation/agent-reasoning-engine/docs/license-requirements.json)
separates those settled terms and the current closure inventory from eight
unresolved decisions that still require accountable owner or qualified review.

Decision record fields:

- Supported surface manifest: decision CLI and JSON-lines process adapter;
  JavaScript package imports remain candidate-internal
- Version semantics: Semantic Versioning 2.0.0 prerelease
- Tag convention: `v{version}` for accepted releases only
- Changelog categories: Added, Changed, Deprecated, Removed, Fixed, Security
- Correction policy: append a dated correction without rewriting published notes
- Deprecation window: one subsequent accepted minor release, with a documented
  urgent-security exception
- Predecessor policy: the first accepted version has no supported predecessor
- Release owner and review date: product/release owner, 2026-09-17

## Decision 3: accountable owners and contacts

**Recorded selection (2026-09-17):** Vladimir Rondelli owns product/release,
artifact/deployment, security/incident response, privacy/retention, and
compliance coordination for the first release. Reliability/SLO ownership is not
applicable while Keld does not operate ARE as a service. Qualified legal review
remains independent and unassigned. Security and support use
`rondelli.vladimir@gmail.com`; do not activate the address as a security
commitment until delivery and escalation tests pass.

| Boundary | Required accountable owner | Contact evidence needed |
| --- | --- | --- |
| Product/release | Product and release owner | Approval and release-decision path |
| Artifact/deployment | Operations owner | Install, rollback, backup, and recovery responsibility |
| Vulnerability intake | Security owner | Private delivery, acknowledgement, triage, escalation, and closure test |
| Incident response | Operations/security owner | Reachable escalation path for the selected distribution |
| Reliability/SLO | Product/reliability owner | Required only if an operated service is selected |
| Privacy/retention | Privacy owner | Data inventory, retention, access, deletion, and incident path |
| Compliance/legal | Qualified legal/compliance owner | Applicability and claim review for selected uses and jurisdictions |

Decision record fields:

- Applicable owner: Vladimir Rondelli
- Security/support contact: `rondelli.vladimir@gmail.com`
- Inapplicable boundary: reliability/SLO while no Keld-operated service exists
- Qualified reviewer: unassigned independent reviewer
- Product-owner approval and review date: approved, 2026-09-17

## Decision 4: intended use and applicability

**Recorded selection (2026-09-17):** customer-operated software-development assistance
on repositories the customer is authorized to access, with one human operator
approving consequential changes. Exclude employment, credit, insurance, healthcare,
biometrics, law enforcement, critical infrastructure control, and decisions
about people until separately reviewed.

This selection fixes the product scope but is not a legal conclusion. Qualified
review must evaluate:

- countries and jurisdictions of development, distribution, users, providers,
  data storage, and affected people;
- developer, provider, deployer, operator, controller, processor, customer, and
  model-provider roles;
- repository content, prompts, credentials, logs, retained state, and telemetry
  data categories;
- prohibited uses and human-oversight requirements;
- applicable laws, standards, customer contracts, and framework versions; and
- qualified reviewer, assumptions, decision date, and mandatory re-review event.

Decision record fields:

- Intended use: customer-operated software-development assistance on authorized repositories
- Prohibited uses: the eight high-risk categories recorded in `release-owner-decisions.json`
- Initial markets: United States, European Union member states, and Brazil
- Organizational/data roles: customer controls local data and provider selection; Keld does not operate the first release
- Selected frameworks: no voluntary certification or conformity claim
- Legal/compliance coordinator and review date: Vladimir Rondelli, 2026-09-17

## Decision 5: commercial identity and license direction

**Recorded selection (2026-09-17):** the commercial product is Agent Reasoning
Engine (ARE), the merchant is Keld, and the copyright owner is Vladimir
Rondelli. The customer-facing `0.10.0-rc.1` successor must contain no
CyberAlchemy v2 name, path, or product identifier. Frozen Candidate 018 evidence
may retain historical repository identifiers only as immutable provenance.

Redistribution must retain the exact license, notices, attribution, and
corresponding source. The previously recorded resale threshold remains in force.
Keld trademarks are excluded except for truthful identification and required
attribution. The exact license should include the selected patent grant with
defensive termination. Qualified review must translate these directions into
legal text for the three initial markets.

## Decision order

~~~mermaid
flowchart LR
    D1[1 Distribution] --> D2[2 API and version policy]
    D1 --> D3[3 Owners and contacts]
    D1 --> D4[4 Use and applicability]
    D2 --> D5[5 Commercial identity and license]
    D4 --> T[Artifact and topology constraints]
    D5 --> T
    D2 --> T
    D3 --> T
~~~

Decision 1 has built the standalone source artifact. The recorded decisions unblock source-rights provenance review, standalone successor
construction, security contact testing, and qualified compliance mapping.

## Open Questions

- Which qualified reviewer will approve the exact license and market obligations?
- Does `Keld` require a longer registered legal name before payment activation?
- Which Brazilian state must appear in merchant and governing-law records?
