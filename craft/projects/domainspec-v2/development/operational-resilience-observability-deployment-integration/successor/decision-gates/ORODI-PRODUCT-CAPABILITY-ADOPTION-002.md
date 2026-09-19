# ORODI Product Capability Adoption Gate

Status: PASS — `PC-ADOPT-PRESERVE` selected by the Craft Product owner
Decision ID: `ORODI-DECISION-PRODUCT-CAPABILITIES-002`
Owning gate: `CA2-OWNER-CRAFT-PRODUCT`
Product: `CA2-PRODUCT-CRAFT`
Project: `CA2-PROJECT-CRAFT`

## Decision Question

What should the Craft Product owner decide for the exact six-capability
immutable manifest SHA-256
`cb7c7286550e8fd2b3f7e66efc9aab5745d9df16c886f437688037caa7a65dbf`?

The owner decision binds that exact manifest only. Changed bytes require a new
candidate and decision. Adoption establishes Product Capability commitment; it
does not admit the business ontology, DomainSpec profile, system ontology, or
implementation and does not authorize commissioning, publication, release, or
deployment.

## Evidence Summary

- The manifest contains six stable Product Capability IDs with individual
  record digests.
- Every record is currently `candidate`, has `authority_effect: none`, and
  preserves distinct evidence, commitment, realization, and runtime postures.
- The approved Definition Pack disposition changes the future definition
  bindings but does not change Product, outcome, scope, or owner boundary.
- The registry identity rule requires a successor Product Capability ID only
  when Product, outcome, scope, or owner boundary changes.
- Canonical definition promotion remains independently blocked on the
  `CAV2-D48` cross-context exercise. Product adoption cannot satisfy that gate.

## Admissible Options

### `PC-ADOPT-PRESERVE` — adopt and preserve identities (recommended)

Adopt the exact immutable manifest while preserving all six Product Capability
IDs. After canonical definition promotion, create a separately digested
definition-binding successor record that references the unchanged identities.

- Benefit: preserves stable product meaning and avoids inventing identity churn
  for a binding-only change.
- Cost/risk: commits the Craft Product to the six outcomes while later ontology,
  profile, implementation, conformance, and runtime gates remain unresolved.
- Downstream impact: makes the Product Capability predecessor owner-decided;
  business-ontology successor materialization still waits for canonical
  definition promotion.

### `PC-REVISE` — return for bounded candidate revision

Do not adopt the current manifest. Identify exact non-identity fields that need
revision; preserve IDs unless a Product, outcome, scope, or owner-boundary change
is explicitly selected.

- Benefit: corrects a specific product-semantic defect before commitment.
- Cost/risk: requires a successor immutable manifest and another owner review.
- Downstream impact: all ontology and DomainSpec successor work remains blocked.

### `PC-REJECT` — reject and stop this successor path

Reject the exact manifest without deleting it or inferring any implementation
effect.

- Benefit: prevents commitment to product outcomes the owner does not want.
- Cost/risk: the current ORODI Product Capability path stops; replacement work
  requires a new product decision and candidate set.
- Downstream impact: business ontology, DomainSpec profile, and implementation
  successor work remain `not_evaluable`.

### `PC-DEFER` — leave the decision pending

Make no adoption decision now.

- Benefit: preserves every current byte and authority boundary.
- Cost/risk: no successor construction stage can advance.
- Downstream impact: the pending decision remains open and downstream admissions
  remain `not_evaluable`.

## Rejected Option

`PC-SUPERSEDE-NOW` is structurally inadmissible. No Product, outcome, scope, or
owner-boundary change is evidenced; definition binding, realization,
implementation, and evidence changes do not justify new Product Capability IDs.

## Current Result

- Gate result: `PASS`
- Selected option: `PC-ADOPT-PRESERVE`
- Decision source: explicit owner selection on `2026-09-01`
- Decision effect: adopt the exact six-record immutable manifest while
  preserving all six Product Capability identities
- Immutable decision record: `ORODI-PRODUCT-CAPABILITY-ADOPTION-002.decision.json`,
  SHA-256 `013c8453c91ad2c5b7348408b770d6a2b59e63439cd54357db82a370e3deeaf1`
- Remaining downstream blockers: `CAV2-D48` cross-context exercise and
  canonical definition promotion; definition-complete business ontology
  admission; DomainSpec profile and source admission; system ontology
  admission; implementation binding and conformance; separate commissioning
  authorization
- Admissibility request digest:
  `e7eac2d529d5ac29b2d30d8c07e3b874bb1f0eee881a432183c13f0d3c0bcac7`
- Override: none; this protected authority decision cannot be bypassed by a
  generic override.

This gate resolves only Product Capability adoption. It grants none of the
remaining admission, implementation, commissioning, publication, release,
deployment, or external-effect authorities.
