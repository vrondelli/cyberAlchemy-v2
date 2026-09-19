---
artifact_id: domainspec-v2-candidate-hook
artifact_type: candidate-companion-doc
companion_to: hook.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Hook - Candidate Meta-Type Card

**Companion to** [`hook.schema.yml`](./hook.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A framework-neutral reactive contract has typed inputs/returns and explicit behavior, lifecycle, and effects.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `typed_inputs`: `attribute-present`
- `typed_returns`: `attribute-present`
- `reactive_behavior`: `attribute-present`
- `lifecycle`: `attribute-present`
- `effects`: `attribute-present`

## Distinguisher Versus Binding

A Hook owns reactive lifecycle behavior; a Binding owns a durable endpoint/cache record.

## Correction Contract

Add neutral reactive/lifecycle structure, or reroute endpoint records to Binding and framework-only helpers to implementation vocabulary.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to Binding.

## DS-D8 Slice

- Source of: none.
- Target of: `consumes`.

This edge slice is supporting evidence only.

## Limitations

Framework-neutral law only; Hook-Binding signature request pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
