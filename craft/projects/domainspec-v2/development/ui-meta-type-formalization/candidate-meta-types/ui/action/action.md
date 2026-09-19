---
artifact_id: domainspec-v2-candidate-action
artifact_type: candidate-companion-doc
companion_to: action.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Action - Candidate Meta-Type Card

**Companion to** [`action.schema.yml`](./action.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A named user intent declares trigger, target kind, effect boundary, and observable success/error outcomes.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `intent`: `attribute-present`
- `trigger`: `attribute-present`
- `target_kind`: `attribute-present`
- `effect_boundary`: `attribute-present`
- `success_outcome`: `attribute-present`
- `error_outcome`: `attribute-present`

## Distinguisher Versus event handler

An Action owns a complete intent/outcome contract; a passive event handler does not.

## Correction Contract

Add a named intent/target/effect/outcome contract, or reroute passive handlers to framework vocabulary.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to event handler.

## DS-D8 Slice

- Source of: none.
- Target of: `submits`.

This edge slice is supporting evidence only.

## Limitations

Action-source relationship request pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
