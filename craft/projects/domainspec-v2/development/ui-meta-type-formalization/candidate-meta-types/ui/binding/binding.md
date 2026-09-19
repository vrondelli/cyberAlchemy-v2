---
artifact_id: domainspec-v2-candidate-binding
artifact_type: candidate-companion-doc
companion_to: binding.schema.yml
owner: ui-meta-type-formalization
lifecycle_status: candidate-experimental
authority_boundary: candidate evidence only; no canonical promotion
---

# Binding - Candidate Meta-Type Card

**Companion to** [`binding.schema.yml`](./binding.schema.yml).
The schema is the checked candidate contract; this prose is explanatory.

## Formation Law

A durable integration record declares one endpoint mode, target, mappings, trigger, cache key, and invalidation.

## Structural Criterion

The normalized `Attribute | Value` table must satisfy:

- `mode`: `attribute-present`
- `target_kind`: `attribute-present`
- `target_ref`: `attribute-present`
- `trigger`: `attribute-present`
- `parameter_mapping`: `attribute-present`
- `result_mapping`: `attribute-present`
- `cache_key`: `attribute-present`
- `invalidation`: `attribute-present`

## Distinguisher Versus DS-D8 relation

A Binding is a durable record with endpoint/cache structure; a pure connection remains a relation.

## Correction Contract

Add the durable endpoint/mapping/cache contract, or reroute an edge-only connection to relation-not-node.

## Fixtures

- [positive](./fixtures/positive.md) - must pass.
- [malformed](./fixtures/malformed.md) - must reject.
- [neighbor](./fixtures/neighbor.md) - must reject and reroute to DS-D8 relation.

## DS-D8 Slice

- Source of: `fetches`, `mutates`.
- Target of: none.

This edge slice is supporting evidence only.

## Limitations

Durable record only; Hook-Binding signature request pending. Round-trip and independent replication remain pending.

## Boundary

This candidate validates authored shape, never semantic meaning. It is not an
active or promoted DS-D1 type and is not installed under `impl/spec/meta-types`.
