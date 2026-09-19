# Invoke Refresh — DomainSpec architecture-property ontology v2 proposal

## Result

The proposal-only refresh package is structurally complete and its core staged validation passes; the final exact-byte validation result and independent audit remain gates before a terminal proposal receipt. It proposes an ontology v2 schema, a separately owned PromotionRecord schema, a six-instance non-canonical preview, relation-instance migration rules, hostile controls, rollback, and a five-target future apply inventory.

No live target was changed. The six implementation candidates remain `not-admitted`; no PromotionRecord exists; authority remains `none`.

## Activation and scope

- Activation: direct user instruction.
- Mutation mode: explicit `proposal-only`.
- Proposal root: `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T143151Z-wp-rmt-001-ontology-v2-proposal/`.
- Bound sources: 15 files, 304,885 bytes, inventory digest `d4ca7e9205e795daf0d90467b62b2866823fa5ea551b85eeeed6b147e3d2059f`.
- Future apply targets: five—two schema additions plus the ontology, projection, and validator.
- Applied targets: zero.
- Candidate migrations: zero.
- Candidate promotions: zero.

## Refresh signals

1. The v1 schema defines architecture types but cannot represent concrete implementation or relation instances.
2. One candidate-status vocabulary collapses meta-type maturity, definition maturity, evidence, admission, and authority.
3. Passing WP-RMT-001 evidence cannot be represented without appearing either too weak or improperly promoted.
4. No owner-decision artifact can express admission.
5. Policy retains exact PolicyStrategyContract endpoint-identity residue.
6. Value Object retains exact factory and Rule endpoint-identity residue.
7. Entity retains exact factory and Rule endpoint-identity residue.
8. Enum uses shorthand `composed_from`, while the canonical ontology ID is `architecture.composed_from`.

Every proposed change maps to one of these signals. No unrelated ontology cleanup is included.

## Proposed model

The v2 source has four new collections:

- immutable `implementation_instances` bound to exact candidates and projection receipts;
- evidence-bound `supporting_instances` for exact architecture/support endpoints, fixed to `not-admitted` and authority `none` in v2;
- typed, directed `relation_instances` with exact endpoints and evidence;
- owner-gated `promotion_records` that alone can transition admission to `admitted`.

Lifecycle is split into five axes: meta-type maturity, definition status, evidence status, admission status, and authority effect. A derived projection can report these values but cannot author them or grant authority.

The preview includes six implementation instances, zero supporting instances, and three exact Enum composition relation rows. All are validated-candidate evidence, not admitted, and authority-none. A separate positive fixture proves that evidence-bound supporting endpoints can close a typed relation without authorizing migration or admission. Policy, Value Object, and Entity relation summaries remain explicit blueprints until stable row-level endpoint IDs are source-proven.

## Validation

Core staged validation currently proves:

- live source inventory: 15/15;
- future target boundaries: 5/5 (three exact present preimages and two exact absent create targets);
- v1 continuity: pass;
- synthetic live v2 catalogue continuity: 6/6—the exact definition-source catalogue plus five exact definition catalogues under the executable live-document schema;
- schema contracts: 2/2;
- executable Draft 2020-12 preview validation: 1/1 with Python `jsonschema` 4.10.3;
- executable synthetic PromotionRecord schema fixture: 1/1 (schema validation only, not an authority record);
- implementation instances: 6/6;
- exact relation instances: 3/3;
- relation blueprints: 3/3;
- synthetic owner-gated admission paths: 2/2 (one implementation instance and one relation instance; validation-only and authority-none);
- synthetic supporting-endpoint capability: 1/1 (evidence-bound, non-admissible in v2, validation-only and authority-none);
- derived implementation, supporting, and relation projections: pass;
- lifecycle axes: 5/5 separated;
- PromotionRecords present: 0;
- hostile controls: 37/37 killed, including invented supporting-endpoint identity and supporting-relation admission rejection.

The final package run and independent read-only audit are required before an owner acceptance request.

## Context, inventory, and technique trace

Context Builder was used as a bounded dry-run selection over the v1 ontology/projection, terminal receipt, six candidates, six projection receipts, and nearest refresh convention. Distill was skipped because the target is already one localized five-target schema change.

The repository Inventory validated ready with no failures, but the exact architecture-property/WP-RMT-001 selector returned no entries. This is recorded as a discovery coverage gap; direct source paths are the binding evidence.

The work used `sequence`, `owner_boundary_check`, `artifact_contract_bridge`, `validation_loop`, `concrete_path_evidence`, `residue_ledger`, and `approval_semantics_map`. A governed multi-agent dispatch was not needed for one bounded author and one independent auditor.

## Owner boundary

Owner acceptance is pending. Acceptance of this proposal would authorize only creation of a fresh, separately staged apply package against rehashed live targets. It would not authorize applying that package, migrating the six candidates, admitting implementations or relations, creating PromotionRecords, or promoting anything.

## Rollback

The proposal is rolled back by removing its isolated root. A future apply package must carry the exact raw bytes of all three modified preimages, not only their hashes. Any PromotionRecord in the live v2 source blocks v1 restoration under this schema. This v2 deliberately defines no suspension, retirement, or reversal lifecycle; a separately proposed, validated, and owner-accepted reversal/export schema must exist before restoration can be reconsidered. The `reversal_owner_route` field is future-routing metadata, not executable reversal authority.

## Claim boundary

This package does not migrate or promote the six candidates. It creates no live ontology nodes, no admission, no authority, and no publication, release, deployment, or production-readiness claim.
