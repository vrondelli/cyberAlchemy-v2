---
artifact_id: domainspec-v2-candidate-guard
artifact_type: candidate-companion-doc
companion_to: guard.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Guard - Candidate Meta-Type Card

**Companion to** [`guard.schema.yml`](./guard.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A non-authoritative UI gate declares protected surface, source rule, conditions, fallback, and UI enforcement scope.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `protected_surface`: `attribute-present`
- `source_rule`: `attribute-present`
- `conditions`: `attribute-present`
- `fallback`: `attribute-present`
- `decision_authority`: `attribute-equals` = false
- `enforcement_scope`: `attribute-present`

## Distinguisher Versus Rule

A Guard projects an authoritative Rule into UI behavior; it never owns the access decision.

## Correction Contract

Add source/fallback/non-authority structure, or reroute authoritative decisions to Rule.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Rule.

## DS-D8 Slice

- Source of: `protects`, `mirrors`.
- Target of: none.

This edge slice is supporting evidence only.

## Limitations

Non-authoritative Page gate only; component target scope unresolved. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
