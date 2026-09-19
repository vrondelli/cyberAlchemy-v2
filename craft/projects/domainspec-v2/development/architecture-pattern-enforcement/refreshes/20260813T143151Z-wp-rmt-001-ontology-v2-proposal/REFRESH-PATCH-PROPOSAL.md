# Refresh patch proposal — architecture-property ontology v2

## Proposal-only boundary

This document describes a future five-target patch. It is not an executable patch and does not authorize mutation. Live files remain unchanged until the complete proposal passes validation, receives owner acceptance, and a separate exact-byte apply package is built and accepted.

## Exact future target inventory

| Operation | Target | Proposed effect |
|---|---|---|
| Add | `implementation-conformance/ontology-experiment/schema/architecture-property-ontology-v2.schema.json` | define implementation, supporting, and relation instances; separated lifecycle axes; derived projections; and PromotionRecord requirements |
| Add | `implementation-conformance/ontology-experiment/schema/promotion-record-v1.schema.json` | define exact owner decision, evidence, transition, scope, rollback, and canonical-admission authority |
| Modify | `implementation-conformance/ontology-experiment/ontology.json` | preserve v1 definitions and add v2 source collections with six not-admitted instances and exact row-level relations only |
| Modify | `implementation-conformance/ontology-experiment/domain-meta-types.projection.json` | derive maturity, definition, evidence, admission, and authority axes without authoring them |
| Modify | `implementation-conformance/ontology-experiment/validate-ontology.mjs` | dual-run v1 continuity and v2 schema/instance/relation/promotion/projection/hostile checks |

The exact preimages, additions-as-absent checks, and rollback details are in `migration/migration-map.json`.

## Schema delta

### Implementation instances

Each implementation instance binds:

- stable implementation and candidate IDs;
- canonical DomainSpec meta-type and architecture type;
- exact candidate, projection receipt, and terminal receipt bytes;
- exact TypeScript, Python, and Rust node/provider/protocol identities;
- five independent lifecycle axes;
- an optional PromotionRecord reference that is required only when admitted.

Candidates remain immutable. An instance is a governed ontology record, not a rewritten candidate.

### Supporting instances

Each supporting instance binds an exact stable endpoint ID and architecture type to the owning candidate, candidate projection receipt, and terminal receipt. A JSON pointer into the exact candidate must resolve to that same endpoint ID. In v2 it is always `not-admitted` with authority `none`, cannot be a PromotionRecord subject, and cannot be an endpoint of an admitted relation. Its projection is derived, never authoritative.

### Relation instances

Each relation instance is one edge with a canonical `architecture.*` relation ID, exact source and target instance IDs resolved through the implementation or supporting-instance registries, exact endpoint types, evidence bytes, cycle policy, and lifecycle axes. Same-family allowed pairs are checked. Acyclic relation sets and duplicate semantic edges are checked globally.

The preview creates only three exact Enum `architecture.composed_from` rows. It does not inflate Policy, Value Object, or Entity proof counts into invented endpoint IDs.

### Lifecycle axes

The proposal replaces ambiguous lifecycle collapse with:

```text
meta_type_maturity = active
definition_status  = candidate
evidence_status    = validated-candidate
admission_status   = not-admitted
authority_effect   = none
```

These are the exact preview values for all six candidates. Evidence status cannot be copied into admission status.

### PromotionRecords

A PromotionRecord is the only admission authority for implementation and relation instances. It must bind:

- exact subject instance and candidate bytes;
- transition from `not-admitted` or `proposed` to `admitted`;
- at least two evidence refs;
- an accepted owner decision and exact accepted-scope digest;
- exact pre-admission live-v2 bytes plus a reversal owner route for future routing;
- authority effect `canonical-admission`.

A candidate or projection cannot self-author a PromotionRecord. The complete v2 admission vocabulary is `not-admitted`, `proposed`, and `admitted`; suspension, retirement, and reversal records are deliberately out of scope. `reversal_owner_route` does not implement a reversal lifecycle. No PromotionRecord is included in this package.

## Six-instance migration preview

The preview maps Enum, Calculation, Policy, Query, Value Object, and Entity into distinct implementation instances. Their active meta-type maturity and validated evidence are preserved, while admission remains explicitly absent.

Enum shorthand `composed_from` is normalized to `architecture.composed_from`. The migration validator rejects the unnormalized ID.

## Hostile validation

The staged validator must kill all 37 declared controls. They cover self-promotion, stale source and PromotionRecord refs, illegal transition, missing or mismatched owner decision/scope/subject/evidence/rollback/owner route, implementation and relation evidence-binding drift, cross-family and endpoint-type lies, cycle, duplicate admitted scope, projection-authored lifecycle, implementation/supporting/relation projection drift, authority inflation, unknown endpoint, unnormalized relation ID, blueprint drift, lifecycle-axis collapse, dangling definition sources, stale live self-reference, repository-path escape, duplicate semantic edges, relation-axis inflation, invented supporting identity, attempted admission of a supporting-endpoint relation, unsupported reversal status, and executable-schema type/identifier attacks.

## Migration and rollback impact

An accepted future apply changes five live targets. It makes older whole-file ontology/projection refs historical; it must not silently refresh predecessor receipts. The apply package must retain the exact raw bytes of the three modified preimages. Any PromotionRecord permanently blocks v1 rollback under this v2 schema. Restoration requires a separately proposed, validated, and owner-accepted reversal/export schema first; this package cannot infer or execute that transition. Candidate and proof-receipt bytes never change.

## Fresh owner decisions required

1. Accept this exact proposal package.
2. Separately authorize creation of a staged apply package.
3. Accept that exact apply package before live mutation.
4. After migration, decide any implementation or relation promotion through separate exact PromotionRecords.

## Claim ceiling

This proposal does not migrate, admit, or promote the six candidates; mutate live ontology bytes; grant authority; publish; release; deploy; or establish production readiness.
