# Distill Result — Relation Model Tournament

Verdict: PASS  
Selected candidate: **C — a revision-bound immutable scene RelationFacet**  
Selection constraint: the facet is an index/view over the existing canonical scene relation binding, not a second semantic payload.

## Why this is the smallest coherent model

The system needs four properties at once:

1. one canonical semantic owner;
2. cheap same-revision lookup for interactive surfaces;
3. fail-closed revision and missing-reference behavior;
4. self-contained detached output whose copied fields cannot silently drift.

Candidate A supplies item 4 by copying everywhere but weakens 1 and 3. Candidate B supplies 1–3 but leaves 4 as an external resolver problem. Candidate C composes B's interactive references with one scene-local immutable index and permits digest-validated snapshots only where detachment requires them.

## Representation decision

`RelationFacet` is a role and contract, not permission to duplicate the relation record:

```text
KnowledgeScene
  scene_digest
  source_graph_digest
  view_pack_digest
  internal_relations[] ─┐
  cut_relations[]      ─┴─> immutable relation_facets_by_id

RelationRef = { source_relation_id, scene_digest }
```

Each index value is the exact immutable scene relation binding already present in one partition. A `facet_set_digest` proves the index covers the same relation records. Portal, Path, NavigationFrame selection, geometry, renderer, inspector/index, and project adapters reference that index. A detached serializer may emit a `RelationSnapshot`, but it must include the reference, semantic digest, schema version, and equality validation.

## Preserved analyst disagreement

- The relation-model analyst preferred C because it best closes stale-revision, snapshot, and testability obligations.
- The downstream analyst preferred B and rejected a second facet type because the existing `KnowledgeScene` bindings already provide the necessary semantic payload.

The selected constraint resolves, rather than averages, the disagreement: choose C's contract while adopting B's reuse warning. There is one indexed role over existing bindings, not a duplicate relation model.

## Rejected alternatives

### A — denormalized everywhere

Rejected because a copied `exact_predicate` field on the portal fixes one validator but creates an equality problem for Portal, Path, view models, index, static output, and project adapters. Immutability of each copy does not prove cross-revision equality.

### B — references only, no snapshot contract

Rejected as the complete solution because standalone SVG/print/no-JS output must remain understandable after the live resolver is gone. B remains the required behavior for interactive records inside C.

## Recomposition proof

- SWU-UOVA-001 remains the SourceGraph canonicalization owner.
- SWU-UOVA-002 remains the View Pack membership owner.
- SWU-UOVA-003 retains internal/cut partition bytes and totality; the facet index is derived over those exact objects, so completed evidence is not rewritten.
- SWU-UOVA-004 and SWU-UOVA-005 store exact references plus traversal-local fields and resolve predicate/source direction at use time.
- Later consumers share the same ID/revision and add only their local state.
- Static output creates the only detached semantic snapshot and validates it at the boundary.

## Mandatory repairs carried to Design

1. Reconcile schema `oew.knowledge-scene.v1` with runtime `v1.1`; issue a versioned successor rather than silently changing either.
2. Define `relation_facets_by_id`, `facet_set_digest`, `RelationRef`, resolver results, and duplicate/missing/stale failures.
3. Repair Portal and Path requirements in one change.
4. Mark `predicate_summary`, relation View Models, accessible labels, and static relation rows as derived caches/snapshots with validation laws.
5. Keep `SceneGeometry` semantic-free and scene-digest-bound.
6. Preserve exact relation identity across spatial, inspector, index, static, and Body War/second-project adapters.
7. Add negative controls for missing ID, stale graph/View Pack/scene, facet digest drift, snapshot semantic drift, encoding gap, and parallel same-tuple relations.

## Distill gaps

- Encoding fields currently live on SourceGraph but the plan expects an exact-predicate encoding registry. Design must assign transition ownership without changing canonical predicate ownership.
- The exact detached snapshot field set remains to be designed.
- The current Body War adapter test denominator differs from the planned UOVA denominator and cannot serve as acceptance proof.

These gaps are owned and do not prevent Design. They prevent implementation handoff until closed in the repair Work Pack.
