---
decision_id: ARE-BUSINESS-ONTOLOGY-ADMISSION-001
status: selected-exact-business-ontology
target_ontology_id: CA2-ARE-BUSINESS-ONTOLOGY
target_sha256: 2090c6e79152a75bed801d9489d308741a1a88e231cb6a677ec2f9b75e4a9fff
authority_effect: none
---

# ARE business-ontology admission gate

## Decision question

Should the exact ARE business ontology at SHA-256
`2090c6e79152a75bed801d9489d308741a1a88e231cb6a677ec2f9b75e4a9fff`
be admitted as the business-model predecessor for the adopted Product
Capability and bounded ARE implementation program?

Admission accepts the exact business concepts and relations. It does not admit
the DomainSpec source or generated system ontology, register a
ConstructionBinding, prove conformance, or authorize code.

## Options

### ARE-BO-001-A — Admit exact business ontology

- Benefit: fixes the business model used by downstream DomainSpec and planning.
- Cost/risk: changed business meaning requires a successor ontology and new
  downstream decisions.
- Downstream impact: opens the separate DomainSpec/system-model admission gate.

### ARE-BO-001-B — Defer

- Benefit: permits another semantic/model review without losing evidence.
- Cost/risk: DomainSpec admission and implementation remain blocked.
- Downstream impact: no successor D65 gate opens.

### ARE-BO-001-C — Stop/reject

- Benefit: prevents implementation from following a rejected business model.
- Cost/risk: requires ontology revision and deterministic rematerialization.
- Downstream impact: return to business ontology alignment.

## Explain / more context

This non-committal choice does not resolve the gate. On request, the same three
options must be explained with aligned low-, medium-, and complex examples.

## Current result

- Result: `PASS` for exact business-ontology admission only.
- Selection: `ARE-BO-001-A-ADMIT-EXACT-BUSINESS-ONTOLOGY`.
- Rationale: admit the exact business model as the D65 predecessor for the
  adopted Product Capability while preserving independent DomainSpec,
  implementation, conformance, and runtime decisions.
- Source of decision: explicit user response `A` in the current Codex task on
  2026-09-01.
- Owner identity posture: user selection recorded; independent proof that one
  person occupies every named owner role is not asserted.
- Blockers remaining for this decision: 0.
- Implementation effect: none.
- Remaining blockers: DomainSpec/system-model admission and exact SWU
  implementation authorization.
- Next step: open the exact DomainSpec/system-model admission gate.
