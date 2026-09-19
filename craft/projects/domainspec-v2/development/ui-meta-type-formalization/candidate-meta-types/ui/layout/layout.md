---
artifact_id: domainspec-v2-candidate-layout
artifact_type: candidate-companion-doc
companion_to: layout.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Layout - Candidate Meta-Type Card

**Companion to** [`layout.schema.yml`](./layout.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A shell owns finite named slots and shared chrome, contains no page-specific primary content, and wraps Pages.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `slots`: `attribute-present`
- `shared_chrome`: `attribute-present`
- `page_specific_content`: `attribute-equals` = false
- `wrap_target`: `attribute-equals` = Page

## Distinguisher Versus Page

A Layout owns shell slots; a Page owns terminal primary content.

## Correction Contract

Add finite slots/shared chrome and a Page wrap target, or reroute primary-content ownership to Page.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Page.

## DS-D8 Slice

- Source of: `wraps`.
- Target of: none.

This edge slice is supporting evidence only.

## Limitations

Finite shell law; independent corpus pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
