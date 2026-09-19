# DomainSpec architecture-property ontology v2 migration proposal

## Result boundary

This is a proposal-only migration plan. It stages no live ontology, projection, validator, candidate, receipt, registry, admission, or promotion change. The v1 ontology and projection remain canonical for this experimental surface until a fresh exact-byte apply package is separately accepted.

## Current rule

The v1 ontology defines architecture concept types, properties, and relation types. Its single `candidate_status` vocabulary mixes definition progress with evidence and projection state. It has no implementation-instance collection, no relation-instance collection, no admission state, and no artifact that can represent an owner decision to admit a candidate. The v1 projection likewise exposes `candidate-mapped` but cannot distinguish active meta-type maturity from implementation evidence or admission.

All six WP-RMT-001 meta-types are currently active in the DomainSpec registry and candidate-mapped in the architecture projection. Their candidate implementations have passing, authority-none projection receipts. None is admitted or promoted.

## Proposed rule

The v2 ontology preserves the definition-source catalogue and all definition catalogues, and adds four source collections:

1. `implementation_instances`: immutable, evidence-bound records for concrete implementations and their exact language realizations;
2. `supporting_instances`: exact candidate-owned architecture/support endpoints, fixed to `not-admitted` and authority `none` in v2;
3. `relation_instances`: one directed row per exact typed endpoint pair, with evidence and lifecycle axes;
4. `promotion_records`: separately owned decisions that alone may change an implementation or relation `admission_status` to `admitted`.

Lifecycle becomes five independent axes:

- `meta_type_maturity`: maturity of the canonical DomainSpec meta-type;
- `definition_status`: maturity of the ontology type or relation definition;
- `evidence_status`: what the exact proof package supports;
- `admission_status`: whether an exact instance is canonically admitted;
- `authority_effect`: authority granted by a separate owner decision.

Evidence cannot author admission. A projection cannot author any lifecycle axis. An admitted implementation or relation instance must reference an accepted PromotionRecord; a non-admitted implementation or relation is forbidden from carrying one. Supporting instances are not PromotionRecord subjects in v2.

## Rationale

The six candidates already prove much more than the v1 schema can express, but their proof receipts explicitly deny promotion authority. Conflating `active`, `candidate-mapped`, `validated-candidate`, and `admitted` would either discard useful evidence or overstate governance. Separate axes preserve both facts.

PromotionRecords keep candidates immutable. They bind the exact candidate bytes, evidence bytes, owner decision, accepted scope, admission transition, and exact pre-admission live-v2 bytes. That preimage is admission evidence, not an implemented reversal mechanism. This follows the authority chain `evidence -> proposal -> owner decision -> canonical mutation -> projection`; it does not turn evidence into authority.

## Source inventory

The migration proposal binds 15 live files: the v1 ontology, v1 projection, WP-RMT-001 terminal receipt, six candidate projections, and six projection receipts. The path-sorted source inventory digest is `d4ca7e9205e795daf0d90467b62b2866823fa5ea551b85eeeed6b147e3d2059f` over 304,885 bytes. Any drift invalidates the package.

## Proposed migration

1. Rehash all 15 source files and stop on any digest, size, result, or authority drift.
2. Stage the v2 ontology and PromotionRecord schemas at their proposed live schema paths.
3. Copy the exact v1 `source_refs` catalogue into `definition_source_refs`, then copy the concept, property, relation, operator, and language-projection catalogues without semantic reinterpretation; reject dangling source IDs.
4. Materialize the six candidate implementations as immutable implementation instances.
5. Initialize every instance as `active / candidate / validated-candidate / not-admitted / none` on the five separate axes.
6. Materialize supporting endpoints only when a stable ID, exact architecture type, candidate JSON pointer resolving to the same ID, and candidate/receipt/terminal evidence bundle are source-proven. Keep every supporting instance `not-admitted` and authority-none; relations involving one cannot be admitted in v2.
7. Materialize only row-level relations whose exact endpoints resolve through the implementation or supporting registries. The preview contains the three Enum `architecture.composed_from` rows. It normalizes the candidate shorthand `composed_from` to the canonical relation ID.
8. Carry Policy, Value Object, and Entity relation summaries as migration residue until stable row-level strategy, factory, and Rule instance IDs are extracted. Do not manufacture endpoints from type-level counts.
9. Keep `promotion_records` empty.
10. Derive implementation, supporting, and relation projections from the source collections. Projections may report lifecycle but cannot mutate it.
11. Dual-run v1 continuity checks and v2 schema, source-closure, endpoint, cycle, lifecycle, promotion, hostile, and projection checks.
12. Present a new exact-byte apply package for owner acceptance. Do not infer apply authority from this proposal receipt.

## Candidate mapping

| Meta-type | Proposed implementation instance | Evidence status | Admission status | Exact relation rows now representable |
|---|---|---|---|---|
| Enum `DS-D1.3` | `implementation.logistics.shipment-priority.enum/v1` | `validated-candidate` | `not-admitted` | three `architecture.composed_from` rows |
| Calculation `DS-D1.6` | `implementation.settlement.net-amount.calculation/v1` | `validated-candidate` | `not-admitted` | none in the candidate |
| Policy `DS-D1.8` | `implementation.settlement.routing.policy/v1` | `validated-candidate` | `not-admitted` | blueprint only; exact strategy-contract instance IDs required |
| Query `DS-D1.5` | `implementation.settlement.complete-settlement.query/v1` | `validated-candidate` | `not-admitted` | none; typed read-edge ownership remains separate |
| Value Object `DS-D1.2` | `implementation.settlement.settlement-value.value-object/v1` | `validated-candidate` | `not-admitted` | blueprints only; exact factory and Rule instance IDs required |
| Entity `DS-D1.1` | `implementation.settlement.settlement.entity/v1` | `validated-candidate` | `not-admitted` | blueprints only; exact factory and Rule instance IDs required |

## Migration impact

The future schema apply is a five-target change: two added schema files and modifications to the ontology, projection, and validator. The later six-instance materialization and any exact supporting-endpoint materialization change the v2 ontology only after a freshly generated apply package is accepted. Supporting instances remain non-admissible in v2. Promotions are a later, independent owner route and must be one or more explicit implementation/relation PromotionRecords.

Existing whole-file hashes that point to the v1 ontology and projection become historical snapshots after any apply. They must not be silently refreshed. Successor packages must state whether they require v1 historical continuity, v2 current bytes, or both.

## Residue

- Policy proof summarizes five relation rows but does not expose canonical PolicyStrategyContract instance IDs.
- Value Object and Entity proofs establish 3/9/3 same-family relation counts but do not expose stable ontology IDs for every factory and Rule endpoint.
- Calculation and Query have no candidate-local typed architecture relation object.
- No PromotionRecord exists for any implementation or relation instance.
- The current Inventory index has no entry for this exact ontology/WP-RMT-001 selector; direct source paths therefore carry the proposal obligations. This is a discovery-coverage gap, not authority evidence.

## Rollback

Rollback is exact and owner-controlled. A future apply package must preserve the raw bytes of the three modified v1 preimages; hashes alone are insufficient. Any PromotionRecord in the live v2 source blocks v1 restoration because this v2 deliberately models only `not-admitted`, `proposed`, and `admitted`. A separately proposed, validated, and owner-accepted reversal/export schema must preserve immutable admission history and define any later transition before restoration can be reconsidered. Candidate files and receipts are never rewritten.

## Owner gates

1. Accept or reject this exact schema-and-migration proposal after validation.
2. If accepted, authorize creation of a separate staged apply package against freshly rehashed live targets.
3. Accept the exact apply package before changing v1 bytes.
4. After migration, decide each implementation or relation admission through separately scoped PromotionRecords.

## Claim ceiling

This plan improves representational capacity only. It does not migrate the six candidates, create canonical nodes, admit or promote anything, grant authority, synchronize external governance, publish, release, deploy, or establish production readiness.
