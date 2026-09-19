---
artifact_id: domainspec-v2-candidate-view-model
artifact_type: candidate-companion-doc
companion_to: view-model.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# View Model - Candidate Meta-Type Card

**Companion to** [`view-model.schema.yml`](./view-model.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A typed display-scoped shape declares sources, display roles/context, and no domain authority.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `typed_fields`: `attribute-present`
- `source_refs`: `attribute-present`
- `display_context`: `attribute-present`
- `display_roles`: `attribute-present`
- `domain_authority`: `attribute-equals` = false

## Distinguisher Versus Value Object

A View Model is display-scoped and non-authoritative; a Value Object owns domain equality.

## Correction Contract

Add source-backed display structure and non-domain authority, or reroute domain equality to Value Object.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Value Object.

## DS-D8 Slice

- Source of: `derives`.
- Target of: `shapes`, `displays`.

This edge slice is supporting evidence only.

## Limitations

Display-shape law; independent corpus pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
