<!--
  RUN OUTPUT — API-contract credibility constitution (stub). This IS the localized home of
  method authority. The anti-laundering rule is a positive Obs-B control. The CONSTITUTION kind
  is inherited meta-machinery (owner route constitution-governance in both cav2 and here) — the
  Obs-A domain-originated KINDS live in AUTHORITY-MODEL, not here.
-->

# API-Contract Credibility Constitution

Status: active local constitution
Owner: constitution-governance
Authority level: repository-local constitution
Selectors: `**`

## Scope

This constitution governs the credibility of API-contract governance work in this standalone
repository. **It is the local home of method authority** (source posture, promotion
discipline, non-collapse rules, authority separation) — owned here, NOT delegated to any
external framework.

## Rules

### APIC-C1. Primary Source Boundary

Validation mode: review

The official primary source is the published API contract (`schema / OpenAPI / proto`
registry). Every other source is supporting, related, analogy, local inference, or open
residue.

### APIC-C2. Claim <= Evidence

Validation mode: review

No artifact may claim a more compatible, more stable, or more fully-deprecated contract result
than the cited evidence (diff analysis + consumer telemetry) supports.

### APIC-C3. Ruling Before Ship

Validation mode: review

A contract change must carry a compatibility ruling — and, if breaking, a bound deprecation
schedule — before it enters a ship recommendation. A version label is not a ruling.

### APIC-C4. Surface / Implementation Separation

Validation mode: review

The repository must keep the **contract surface** (what is promised to consumers), the
**implementation surface** (what happens to exist), and ship authority separate unless an
external owner decision explicitly binds them.

### APIC-C5. Schedule Honored ⟵ *domain-originated (Obs-A rule-level — temporal commitment)*

Validation mode: review

A bound deprecation schedule (T0/T1/T2) is a commitment the repo MUST honor: a removal may not
fire before its scheduled T2, and a warn window may not be shortened for an element already
inside it. *(This is the credibility rule that has NO cav2 analog — it constrains a
future-dated, time-indexed obligation, the same temporal-commitment function that makes
`Deprecation schedule` a domain-originated KIND.)*

### APIC-C(meta-1). Local Status Non-Collapse

Validation mode: hybrid

Local status labels (`apic-pass`, `apic-flag`, `apic-block`) may route local work but must NOT
create validation proof, ship readiness, governance weight, policy effect, **authority effect**,
or launch readiness. Keep `source_posture`, `evidence_status`, `confidence_status`,
`authority_effect`, `policy_effect`, `implementation_status`, `lifecycle_stage` separate.

### APIC-C(meta-2). No Reciprocal Authority Laundering ⟵ *Obs-B positive control*

Validation mode: review

No claim may be promoted in this repository **or in a reciprocal CyberAlchemy v2 / framework
return package through a cyclic citation chain alone.** A return package may be candidate
evidence for an external owner route, but it must name source IDs, blocked uses, unresolved
review findings, public/private scrub status, and the independent owner route that would decide
any reuse.

The package must state that it **transfers no framework authority**, proves no API-contract
result, contains no validation report unless one exists, and implements no behavior unless a
separate task route did so.

### APIC-C(meta-3). Load-Bearing Term Tracking

Validation mode: hybrid

Every **load-bearing term** (a symbol/named quantity in a formal expression, a fixture
FAIL-region, a candidate compat rule, a decidable rule, or the normative content of a claim
ledger entry) must resolve to a tracked authority entry (a canonical definition ID). A
load-bearing term first cited without a tracked entry must be created as a `candidate`
definition carrying an `Open / to-ground:` field and moved through the definitions lifecycle.
Citing one with no tracked entry is a drift defect the definition-drift audit must flag.
Candidate status is not validation.

## Open Questions

### OQ-1. Which compatibility-ruling validation harness should become first?

Candidate: a small fixture that replays a known-breaking past diff and checks the ruling +
deprecation schedule catch it. Status: OPEN.
