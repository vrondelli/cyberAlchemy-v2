---
artifact_id: domainspec-v2-candidate-page
artifact_type: candidate-companion-doc
companion_to: page.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Page - Candidate Meta-Type Card

**Companion to** [`page.schema.yml`](./page.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A terminal route owns primary content, layout/access context, and a rendered unit inventory.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `route_path`: `attribute-present`
- `terminal`: `attribute-equals` = true
- `access_context`: `attribute-present`
- `primary_content`: `attribute-present`
- `layout_ref`: `attribute-present`
- `unit_inventory`: `attribute-present`

## Distinguisher Versus Component

A Page owns a terminal route and primary content; a Component is non-routable.

## Correction Contract

Add terminal route/content ownership or reroute a non-routable unit to Component.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Component.

## DS-D8 Slice

- Source of: `renders`.
- Target of: `wraps`, `protects`.

This edge slice is supporting evidence only.

## Limitations

Adapted corpus; independent route-framework replication pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
