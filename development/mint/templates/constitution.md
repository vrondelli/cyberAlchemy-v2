---
node_type: template
is_session: false
status: candidate
boundary: INTERNAL — Mint emit-template; intended-not-shipped, non-executed
created: 2026-06-29
authored_by: task-session (SWU-2)
swu: SWU-2 (emit-template set)
source_artifact: resonantos-economy-research/authority/constitutions/RESEARCH-CREDIBILITY-CONSTITUTION.md
emits_to: <TARGET_REPO>/authority/constitutions/<DOMAIN>-CONSTITUTION.md
leak_strip: |
  This constitution IS the localized method authority — it is where the method-authority
  role lives after the leak is stripped from AUTHORITY-MODEL/source-spine. The precedent's
  own constitution was already local (owner: constitution-governance), so the structure is
  inherited cleanly. The anti-laundering rule (precedent REC-C13: "no reciprocal CAV2 return
  package promotes by cyclic citation; it transfers no CAV2 authority") is PRESERVED — it is
  a positive Obs-B control. NOTE: constitution-governance is the owner route for a
  CONSTITUTION kind in BOTH cav2 and here; the constitution itself is meta-machinery the
  domain inherits — the DOMAIN-ORIGINATED kinds (Obs-A) belong in AUTHORITY-MODEL, not here.
---

<!--
  MINT EMIT-TEMPLATE (intended-not-shipped). INHERITS: the constitution FORMAT (Status/
  Owner/Authority-level/Selectors header; numbered rules with Validation mode; the claim<=
  evidence rule; the non-collapse rules; the anti-laundering rule; the load-bearing-term
  tracking rule). LOCALIZES: the domain's own credibility rules. cav2 appears ONLY in the
  anti-laundering rule, as the thing forbidden from laundering authority — never as the
  authority source. Replace <DOMAIN>/<...> placeholders at emit.
-->

# <DOMAIN> Credibility Constitution

Status: active local constitution
Owner: constitution-governance
Authority level: repository-local constitution
Selectors: `**`

## Scope

This constitution governs the credibility of <DOMAIN> work in this standalone repository.
**It is the local home of method authority** (source posture, promotion discipline,
non-collapse rules, authority separation) — owned here, NOT delegated to any external
framework.

## Rules

<!--
  INHERITED meta-rules (keep, localized): claim<=evidence; research-before-mechanism;
  separation-of-concerns; non-collapse; dispatch confirmation; finding-to-development
  contract; status non-collapse; load-bearing-term tracking; anti-laundering. ADD the
  domain's own object rules. Each rule carries a "Validation mode:" line (review|hybrid).
-->

### <DOMAIN>-C1. Primary Source Boundary

Validation mode: review

The official <DOMAIN> primary source is `<DOMAIN_PRIMARY_SOURCE_URI>`. Every other source
is supporting, related, analogy, local inference, or open residue.

### <DOMAIN>-C2. Claim <= Evidence

Validation mode: review

No artifact may claim a safer, more complete, more official, or more proven <DOMAIN>
result than the cited evidence supports.

### <DOMAIN>-C3. <DOMAIN_PROPOSAL_UNIT> Before <DOMAIN_COMMITMENT>

Validation mode: review

<DOMAIN proposal sketches> must stay in research lanes / residue maps / closure plans /
validation requests until source, formal, and authority gates are named.

### <DOMAIN>-C4. Separation Of Concerns

Validation mode: review

The repository must keep <DOMAIN_SEPARABLE_CONCERN_1>, <...2>, and governance authority
separate unless an external owner decision explicitly binds them.

### <DOMAIN>-Cn. <DOMAIN_ORIGINATED_RULE> ⟵ *domain-originated (Obs-A rule-level)*

Validation mode: <review|hybrid>

<A credibility rule specific to THIS domain — one cav2 has no analog for. This is what
makes the constitution's content domain-localized, not a cav2 re-skin.>

### <DOMAIN>-C(meta-1). Finding-To-Development Contract

Validation mode: hybrid

Any artifact that converts a harvested finding into definition, design, plan, fixture,
schema, or implementation-adjacent work must carry: a canonical definition ID (or an
explicit reason none exists yet); allowed/blocked use; source posture + local bridge
status; the required workflow witness / failure fixture / typed negative; authority +
promotion boundary; open residue that would block policy / governance / launch use. It must
not treat a refined finding as a mechanism, policy, implementation contract, governance
authority, or launch readiness.

### <DOMAIN>-C(meta-2). Local Status Non-Collapse

Validation mode: hybrid

Local status labels (`<DOMAIN>-pass`, `<DOMAIN>-flag`, `<DOMAIN>-block`) may route local
work but must NOT create validation proof, implementation readiness, reward eligibility,
governance weight, policy effect, **authority effect**, or launch readiness. Keep
`source_posture`, `evidence_status`, `confidence_status`, `reviewed_credit`,
`authority_effect`, `policy_effect`, `implementation_status`, `lifecycle_stage` separate
when relevant.

### <DOMAIN>-C(meta-3). No Reciprocal Authority Laundering ⟵ *Obs-B positive control*

Validation mode: review

No claim may be promoted in this repository **or in a reciprocal CyberAlchemy v2 / framework
return package through a cyclic citation chain alone.** A return package may be candidate
evidence for an external owner route, but it must name source IDs, blocked uses, unresolved
review findings, public/private scrub status, and the independent owner route that would
decide any reuse.

The package must state that it **transfers no framework authority**, proves no <DOMAIN>
result, contains no validation report unless one exists, and implements no behavior unless a
separate task route did so. *(This rule keeps the framework as citation-only — it is the
constitution-level guard against the precedent's leak.)*

### <DOMAIN>-C(meta-4). Load-Bearing Term Tracking

Validation mode: hybrid

Every **load-bearing term** (a symbol/named quantity in a formal expression, a fixture
FAIL-region, a candidate invariant, a decidable rule, or the normative content of a claim
ledger entry) must resolve to a tracked authority entry (a canonical definition ID). A
load-bearing term first cited without a tracked entry must be created as a `candidate`
definition carrying an `Open / to-ground:` field and moved through the definitions
lifecycle. Citing one with no tracked entry is a drift defect the definition-drift audit must
flag. Candidate status is not validation.

## Open Questions

### OQ-1. <DOMAIN first validation-harness question>

Candidate: <a small <DOMAIN> witness>. Status: OPEN.
