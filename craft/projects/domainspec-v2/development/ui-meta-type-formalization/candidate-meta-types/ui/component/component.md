---
artifact_id: domainspec-v2-candidate-component
artifact_type: candidate-companion-doc
companion_to: component.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Component - Candidate Meta-Type Card

**Companion to** [`component.schema.yml`](./component.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A narrow non-routable visual unit has typed inputs/outputs and no route, domain, validation, or access authority.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `typed_inputs`: `attribute-present`
- `typed_outputs`: `attribute-present`
- `independent_route`: `attribute-equals` = false
- `domain_data_authority`: `attribute-equals` = false
- `validation_authority`: `attribute-equals` = false
- `access_authority`: `attribute-equals` = false

## Distinguisher Versus Form

A narrow Component lacks the specialized aggregate authority of Page, Form, Guard, or State Indicator.

## Correction Contract

Add typed I/O and explicit non-authority flags, or reroute specialized laws to their named candidates.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Form.

## DS-D8 Slice

- Source of: `composes`, `consumes`, `displays`.
- Target of: `renders`, `composes`.

This edge slice is supporting evidence only.

## Limitations

Narrow fallback only; umbrella Component meaning is rejected. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
