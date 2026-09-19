---
task_id: TASK-SGRM-AUTHORITY
feature_code: SGRM
layer: L1
status: completed
---

# TASK-SGRM-AUTHORITY: Migrate DS-D1 And DS-D8 Authority

## Objective

Remove Saga from active canonical type authority and make Workflow the only
source type for ordered orchestration across same/cross feature scopes.

## Inputs

- SWU-SGRM-001 migration packet and manifest
- ../../../../definitions/meta-types/meta-types.yml
- ../../../../definitions/meta-types/meta-types.md
- ../../../../definitions/relationships/relationships.yml
- ../../../../definitions/relationships/relationships.md
- ../../../../definitions/DEFINITIONS.md
- ../../../../definitions/DEFINITIONS-INDEX.md
- ../../../../impl/spec/meta-types/behavioral/saga.schema.yml

## Outputs

Scoped canonical authority edits, the focused schema edge-participation bridge, plus
../../runs/SWU-SGRM-002/TASK-SESSION-RESULT.md.

## Transformation Rules

### DS-D1

1. Parse the active meta-type registry.
2. Remove only the Saga/DS-D1.10 active row.
3. Do not renumber any later DS-D1 identifier.
4. Reconcile counts, indexes, and current examples.
5. Record retired DS-D1.10 only in migration/decision/history artifacts.

### DS-D8

1. Locate the active Workflow and Saga orchestrates rows.
2. Verify both target Operation with one_to_many_ordered multiplicity.
3. Replace them with one active Workflow row.
4. Set feature_scope to same-feature and cross-feature.
5. Preserve ordered-operation semantics.
6. Remove Saga-only obligations and source-type validation.
7. Require Workflow source, Operation target, and an admitted declared scope.
8. Reconcile the human projection from root YAML.
9. Assert no active root relationship endpoint names Saga.

### Validator-Consistency Bridge

1. In `impl/spec/meta-types/behavioral/saga.schema.yml`, change only
   `edge_participation.source_of` from `[orchestrates]` to `[]` in the same
   mutation unit as the root authority transition.
2. Do not alter its criterion, card, fixtures, identity, or deletion status.
3. Preserve SGRM-004 as owner of deleting the schema/card/fixtures after
   Workflow criterion support exists.
4. Treat any broader schema edit as out of scope and block promotion.

## Edge Cases

- Multiple unexpected Saga rows: block and return to SGRM-001.
- A later DS-D1 ID references DS-D1.10 numerically: preserve identity and route
  a targeted reference repair; never shift IDs.
- Generated relationships.md differs from YAML: YAML wins; regenerate/reconcile
  through the established projection route.
- Root authority without the focused schema bridge fails `validate:rels`; do
  not accept that staged state or weaken the validator.
- Owner approvals split: do not partially promote DS-D1 without DS-D8 or vice
  versa in the final receipt.

## Smallest Working Unit

### SWU-SGRM-002

- Goal: complete canonical authority transition.
- Dependencies: SGRM-001.
- Write scope: definitions/meta-types, definitions/relationships, root
  definitions/index projections named by the packet, and only
  `impl/spec/meta-types/behavioral/saga.schema.yml#edge_participation.source_of`
  outside authority.
- Done criteria: Saga absent from active root authority; one widened Workflow
  orchestrates row; stable IDs preserved; legacy schema no longer projects the
  removed root edge.
- Acceptance evidence: owner-reviewed diff, YAML parse, focused schema-field
  diff, validator output, and receipt.
- Validation: npm validate:rels; npm validate:docs; YAML parse; active-root scan.
- Owner: manual definitions-governance plus DS-D8 relationship authority.
- Handoff: select migration packet, exact root rows, projection generator/route,
  legacy schema edge-participation field, and current validation tests; return
  standard SWU receipt.
