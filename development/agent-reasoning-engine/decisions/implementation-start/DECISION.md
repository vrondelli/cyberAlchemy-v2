---
decision_id: ARE-IMPLEMENTATION-START-001
status: selected-for-planning-baseline
target_material_digest: 4680d9b87c4dd06c77381fb70f97f16841a4130b4ab04f91c030fc50033765c4
authority_effect: none
---

# ARE implementation-start decision

## Decision question

Should the exact rematerialized ARE candidate with material digest
`4680d9b87c4dd06c77381fb70f97f16841a4130b4ab04f91c030fc50033765c4`
become the immutable planning baseline for the first Context Basis
implementation vertical?

This decision does not admit the DomainSpec profile or system ontology, prove
conformance, register a ConstructionBinding, or authorize implementation.

## Structurally admissible options

### ARE-START-001-A — Accept for planning baseline

- Benefit: permits preparation of one exact implementation-ready vertical
  against frozen source and generated identities.
- Cost/risk: binds future planning to this digest; changed acceptance-bound
  bytes require a successor candidate and a new decision.
- Choose when: the product and runtime owners agree that the candidate meaning
  is sufficient for bounded implementation planning.
- Downstream impact: author a candidate Work Pack for the Context Basis runtime;
  implementation remains separately authorized.

### ARE-START-001-B — Defer for independent review

- Benefit: adds an independent evidence lane before an owner-bound baseline.
- Cost/risk: implementation preparation remains blocked.
- Choose when: semantic coverage or authority boundaries need another review.
- Downstream impact: preserve the candidate and commission a digest-bound
  review; no Work Pack mutation.

### ARE-START-001-C — Stop and reject this candidate

- Benefit: prevents planning against a model the owners do not accept.
- Cost/risk: requires a successor definition/architecture candidate and a new
  deterministic materialization cycle.
- Choose when: the current context lifecycle or authority model is materially
  wrong.
- Downstream impact: return to the applicable Define or architecture route.

## Explain / more context

This is a non-committal option and does not resolve the gate. If selected, the
three real options must be explained with aligned low-, medium-, and
complexity-level examples before the same gate is presented again.

## Current result

- Result: `PASS` for planning-baseline selection only.
- Selection: `ARE-START-001-A-ACCEPT-PLANNING-BASELINE`.
- Rationale: proceed from the exact deterministic candidate while preserving a
  separate later implementation-authorization gate.
- Decisions resolved: 1.
- Blockers remaining for planning: 0.
- Source of decision: explicit user response `A` in the current Codex task on
  2026-09-01.
- Owner identity posture: the user selection is recorded; independent proof
  that one person occupies every named owner role is not asserted.
- Assumptions: none.
- Implementation effect: none.
- Remaining blockers: DomainSpec admission is not granted; ConstructionBinding
  registration is blocked by the Goals v9 empty-registry contract; static
  conformance and runtime evidence are not evaluable; implementation requires
  a later exact owner-directed `CA2-ROUTE-IMPLEMENT` authorization.
- Next step: prepare one digest-bound Context Basis implementation Work Pack.
