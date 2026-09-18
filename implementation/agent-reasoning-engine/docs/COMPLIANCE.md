# Compliance guide

**Lifecycle status:** DRAFT_INACTIVE

**Audience:** Product, privacy, security, legal, compliance, and procurement reviewers.

**Owner:** Unassigned legal/compliance owner.

**Last reviewed:** 2026-09-17.

**Applies to:** No selected jurisdiction, regulated use case, deployed role, or certification scope.

**Claim ceiling:** Provides an applicability and evidence-map structure. It makes no legal conclusion, conformity statement, certification, or assurance claim.

## Applicability before controls

Compliance cannot be inferred from technical features. The responsible owner
must first record:

- intended and prohibited uses.
- countries and jurisdictions.
- users, affected people and organizational context.
- whether Keld acts as developer, provider, deployer, operator,
  controller, processor, customer, or another role.
- model/provider and third-party responsibilities.
- data categories, sources, retention, transfers and deletion obligations.
- system/risk classification and human-oversight model.
- applicable laws, standards, contracts and voluntary frameworks, with versions.
- risk tolerance, assessment cadence and accountable reviewers.

This classification must constrain deployment design before a topology is
frozen.

## Current evidence map

| Evidence area | Current source | Limit |
| --- | --- | --- |
| Product purpose and exclusions | Product capability records and manual overview | Candidate meaning, not legal classification |
| Authority and effect separation | Routing/effect contracts and governance records | No organizational control audit |
| Provenance and recovery | Context, Reasoning State, receipts and candidate evidence | Bounded local implementation evidence |
| Model evaluation | Research program and benchmark artifacts | Limited models, tasks and context windows |
| Security practices | Operations/security guide and product tests | No active public security program or hostile-service qualification |
| Privacy and retention | Privacy/retention guide and repository profile | Physical erasure and deployment policy unresolved |
| Change/release integrity | Immutable candidate closure and release verification | No accepted public artifact or certification |
| Commercial license direction | Digest-bound Keld license research and ARE release policy | Candidate source-available intent only. Exact legal text and rights/notice review are absent |
| Current distribution-closure inventory | [`license-requirements.json`](license-requirements.json) and its verification receipt | Candidate 018 inventory only. No ownership certification or distribution clearance |

## License and sale applicability

The selected commercial model sells the complete ARE software. The latest
[Keld license research](../../../keld-project/docs/LICENSE-PAYMENT-RESEARCH.md)
supersedes its older Apache-2.0 direction with candidate custom
source-available terms. The intended permissions cover use, copying,
modification, sharing, and commercial use. Selling a redistributed software
copy requires an added working function or integration. Cosmetic edits, renaming, and bug fixes alone do not
qualify. Hosted access and paid support services are outside the redistributed-
copy resale rule.

Because
that restriction is incompatible with an OSI open-source claim, ARE must not be
marketed as open source under the current direction.

Before accepting payment, qualified review must settle the exact wording,
downstream permissions, attribution, trademarks, patents, and ownership. It must
also settle third-party notices, merchant identity, target markets, taxes,
refunds, and consumer terms. Existing third-party licenses cannot be replaced by the ARE license.

The machine-checked Candidate 018 closure has 23 package manifests. No package
manifest declares a license or npm dependency edge. The closure contains no
`LICENSE`, `NOTICE`, Cargo manifest, or Cargo lock file. These
facts narrow the packaging review. They do not prove ownership or eliminate
copied-source and non-package obligations.

Keld's historical
[`NOTICE-AUDIT.md`](../../../keld-project/docs/NOTICE-AUDIT.md) covers a different
3,000-plus-file archive with bundled TypeScript and cannot clear Candidate 018.
The exact requirements, required customer materials, eight recorded owner
decisions, and remaining qualified-review gates are recorded in
[`license-requirements.json`](license-requirements.json).

The underlying product-owner selections are recorded in
[`release-owner-decisions.json`](release-owner-decisions.json). Keld is the
merchant. Vladimir Rondelli is the copyright owner and accountable coordinator.
The initial markets are the United States, European Union member states, and
Brazil. Qualified review must still determine the applicable obligations
and approve the exact legal and customer-facing text.

The deterministic [`source-rights-inventory.json`](source-rights-inventory.json)
covers all 907 Candidate 018 files and 134 source families. It found no SPDX or
copyright markers and one textual third-party signal that still requires
disposition. Vladimir Rondelli's owner assertion is recorded for every file.
Provenance and legal review remain required because marker absence and an owner
assertion alone do not prove originality or distribution rights.

## Future control mapping

For every applicable requirement or control, record:

| Field | Required meaning |
| --- | --- |
| Framework reference | Exact source, version, clause/control and applicability basis |
| Owner | Person or role accountable for interpretation and operation |
| Implementation | Technical, procedural or organizational measure |
| Evidence | Current, inspectable artifact and review date |
| Status | Implemented, partial, gap, not applicable, or not evaluated |
| Test | How effectiveness is checked and how often |
| Residue | Limitation, accepted risk, remediation and due owner/date |

Missing evidence remains a gap. A source link, passing test, policy draft or
framework resemblance does not mean “compliant by design.”

## Review and publication gate

An independent qualified owner or counsel must review applicability, role and
claim wording. Certification or formal conformity requires its own scope,
criteria and external evidence. Changes to intended use, jurisdiction,
deployment, data, providers or framework versions invalidate the affected map.

## Open Questions

- Which intended use and jurisdiction should receive the first assessment?
- What exact reviewed license text implements the Keld direction?
- Who owns legal applicability and ongoing compliance evidence?
- Is the first output an internal risk map, customer assurance packet, or a
  formal certification preparation artifact?
