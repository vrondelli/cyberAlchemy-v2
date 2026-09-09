<!--
  GOLDEN FIXTURE — worked mint-act output. Hand-instantiated from templates/constitution.md
  for the release-approval process domain. This file IS the localized home of method authority.
-->

# Release-Approval Credibility Constitution

Status: active local constitution
Owner: constitution-governance
Authority level: repository-local constitution
Selectors: `**`

## Scope

This constitution governs the credibility of release-approval work in this standalone
repository. **It is the local home of method authority** (source posture, promotion
discipline, non-collapse rules, authority separation) — owned here, NOT delegated to any
external framework.

## Rules

### release-approval-C1. Primary Source Boundary

Validation mode: review

The official primary source for a change is its own change record (diff, declared
blast-radius, rollback plan). Every other source — reviewer reading, incident history,
external standard — is supporting, related, analogy, local inference, or open residue.

### release-approval-C2. Claim <= Evidence

Validation mode: review

No artifact may claim a safer, lower-risk, more-approved, or more-tested change result
than the cited evidence (gate outcomes, witness changes) supports.

### release-approval-C3. Change-Class Ruling Before Gate Firing

Validation mode: hybrid

A change's gate-set binding fires only AFTER its change-class is **ruled by
`change-class-governance`** — never from the author's declared blast-radius alone. A change
with no ruled class sits in `change-class proposal` and cannot promote to gate evaluation.

### release-approval-C4. Role Separation (the domain-originated object rule) ⟵ *Obs-A rule-level*

Validation mode: hybrid

The **change-class ruler**, the **bound gate**, and the **approver** are three separated
roles for any one change. The author of a change may hold none of them for that change. A
change-class ruling may not approve a release; an approver may not re-rule the class to dodge
a gate. *(This is a credibility rule cav2 has no analog for — it constrains the separation
that the domain-originated `change-class-governance` route exists to enforce.)*

### release-approval-C(meta-1). Finding-To-Development Contract

Validation mode: hybrid

Any artifact that converts a harvested finding (an incident lesson, an external standard)
into a definition, gate rule, class binding, schema, or implementation-adjacent work must
carry: a canonical definition ID (or an explicit reason none exists yet); allowed/blocked
use; source posture + local bridge status; the required workflow witness / failure fixture;
authority + promotion boundary; open residue that would block policy / governance / launch
use. It must not treat a refined finding as a bound gate, policy, governance authority, or
release readiness.

### release-approval-C(meta-2). Local Status Non-Collapse

Validation mode: hybrid

Local status labels (`release-approval-pass`, `release-approval-flag`,
`release-approval-block`) may route local work but must NOT create validation proof,
release readiness, governance weight, policy effect, **authority effect**, or production
authorization. Keep `source_posture`, `evidence_status`, `class_ruling_status`,
`gate_status`, `authority_effect`, `policy_effect`, `release_status` separate when relevant.

### release-approval-C(meta-3). No Reciprocal Authority Laundering ⟵ *Obs-B positive control*

Validation mode: review

No claim may be promoted in this repository **or in a reciprocal CyberAlchemy v2 / framework
return package through a cyclic citation chain alone.** A return package may be candidate
evidence for an external owner route, but it must name source IDs, blocked uses, unresolved
review findings, public/private scrub status, and the independent owner route that would
decide any reuse.

The package must state that it **transfers no framework authority**, proves no
release-approval result, contains no validation report unless one exists, and authorizes no
release unless a separate owner decision did so.

### release-approval-C(meta-4). Load-Bearing Term Tracking

Validation mode: hybrid

Every **load-bearing term** (change-class label, a gate-set binding, a candidate gate rule,
the normative content of a class ruling) must resolve to a tracked authority entry (a
canonical definition ID). A load-bearing term first cited without a tracked entry must be
created as a `candidate` definition carrying an `Open / to-ground:` field and moved through
the definitions lifecycle. Citing one with no tracked entry is a drift defect the
definition-drift audit must flag. Candidate status is not validation.

## Open Questions

### OQ-1. First gate-rule validation witness

Candidate: replay one past `significant` change through the bound gate-set and check the
gates would have caught its actual failure mode. Status: OPEN.
