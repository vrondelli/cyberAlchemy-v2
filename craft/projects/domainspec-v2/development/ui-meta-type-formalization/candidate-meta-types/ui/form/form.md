---
artifact_id: domainspec-v2-candidate-form
artifact_type: candidate-companion-doc
companion_to: form.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Form - Candidate Meta-Type Card

**Companion to** [`form.schema.yml`](./form.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A typed input aggregate declares validation/error contracts, submission action, target interface, and error mapping.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `typed_fields`: `attribute-present`
- `validation_contract`: `attribute-present`
- `error_contract`: `attribute-present`
- `submission_action`: `attribute-present`
- `target_interface`: `attribute-present`
- `error_mapping`: `attribute-present`

## Distinguisher Versus Component

A Form owns a field-validation-submission aggregate; a Component owns only typed visual I/O.

## Correction Contract

Add the full validation/submission aggregate, or reroute passive typed visual units to Component.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Component.

## DS-D8 Slice

- Source of: `submits`, `contracts`.
- Target of: none.

This edge slice is supporting evidence only.

## Limitations

Adapted corpus; independent form corpus pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
