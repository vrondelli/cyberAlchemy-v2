# UOVA Relation Reference Architecture

Status: candidate design, not implemented  
Selected model: revision-bound scene RelationFacet over existing relation bindings  
Target successor contract: `oew.knowledge-scene.v1.2`  
Authority effect: none

## 1. Context view

The OEW reads a project-owned `SourceGraph` and a source-bound `ViewPack`. `SourceGraph` remains the canonical relation-semantic owner. The scene compiler produces one immutable `KnowledgeScene` revision. A natural-person reader uses portals, Path, spatial graph, inspector, Full Index, and static output; none of these surfaces may create ontology meaning or mutate source authority.

Body War is the complete project adapter and acceptance fixture. It is not the owner of relation identity, predicate, revision, or snapshot rules.

## 2. High-level structure view

```text
project sources
    │
    ▼
SourceGraph ─────── ViewPack
    │                 │
    └──── scene compiler ────► KnowledgeScene v1.2
                                  │
                                  ├─ internal_relations[]
                                  ├─ cut_relations[]
                                  ├─ relation_index_receipt
                                  └─ runtime immutable relationFacetsById
                                           │
                 ┌─────────────────────────┼────────────────────────┐
                 ▼                         ▼                        ▼
          reference consumers       semantic resolvers      detached serializer
          Portal / Path /            UI / renderer /         RelationSnapshot
          Navigation / Geometry      inspector / index       SVG / print / no-JS
```

`relationFacetsById` is an immutable index over the exact `SourceRelationBinding` objects already present in one scene partition. It does not copy their semantic fields. The serialized scene carries a deterministic `relation_index_receipt` so consumers can verify index totality and the facet-set digest.

## 3. Low-level component view

### 3.1 RelationRef

```ts
type RelationRef = {
  source_relation_id: string;
  scene_digest: string;
};
```

For source-wide Full Index rows outside a scene, the equivalent source reference binds `source_graph_digest` instead. A component may use a bare relation ID only inside an already scene-bound function.

### 3.2 RelationFacet role

```ts
type RelationFacet = Readonly<SourceRelationBinding>;
type RelationFacetIndex = ReadonlyMap<string, RelationFacet>;
```

The scene compiler builds the index from `internal_relations ∪ cut_relations`, rejects duplicate IDs, proves totality, computes `relation_ids` in canonical order, computes `facet_set_digest`, and freezes the index. The index values are the partition objects, not copies.

### 3.3 Relation index receipt

```ts
type RelationIndexReceipt = {
  scene_digest: string;
  source_graph_digest: string;
  relation_ids: readonly string[];
  relation_count: number;
  facet_set_digest: string;
};
```

The scene digest uses the non-recursive two-phase algorithm in
`DIGEST-AND-MIGRATION-LAWS.md`. That artifact fixes canonicalization, hash domains,
ordering, count equality, excluded back-references, and validation ownership. A
consumer recomputes every digest layer and the index receipt during admission.

### 3.4 Resolution results

```ts
type RelationResolution =
  | { status: "resolved"; ref: RelationRef; facet: RelationFacet }
  | { status: "missing"; ref: RelationRef }
  | { status: "stale-scene"; ref: RelationRef; actual_scene_digest: string };
```

No consumer may substitute endpoint/predicate tuple matching after a missing or stale result.

### 3.5 Interactive reference records

- `PortalConstituent`: `RelationRef` plus inside/outside endpoint, traversal direction, and destination cluster.
- `PathHop`: `RelationRef` plus from/to node and traversal direction.
- `NavigationFrame.selection`: selected kind plus exact ID and scene revision.
- `RelationGeometry`: exact relation ID plus geometry, while its parent `SceneGeometry` binds the scene digest.

Predicate, source direction, evidence, mapping loss, authority effect, and encoding inputs are resolved from the facet. `predicate_summary` is a deterministic cache over resolved constituents and is validated, not trusted.

### 3.6 Derived view models

Relation/Portal/Path/Inspector/Index view models may carry resolved display fields for render efficiency. Every relation-bearing view-model row also carries `RelationRef` and `relation_digest`. Mapping validation recomputes the digest and rejects drift.

### 3.7 Detached RelationSnapshot

Detached output includes:

- `RelationRef` and `source_graph_digest`;
- ordered endpoint IDs and labels;
- exact predicate and source-direction phrase;
- traversal phrase when the snapshot is path/portal-local;
- visible label, nullable color/pattern tokens, and direction label;
- evidence reference handles, mapping loss, and authority effect;
- `relation_digest`, `snapshot_digest`, projection context, snapshot schema version,
  and serializer version.

Snapshots are immutable projection evidence. They never become SourceGraph or ontology authority.

## 4. Workflow process view

1. Validate and freeze `SourceGraph`; its `relation_by_id` remains canonical.
2. Validate `ViewPack` against the exact graph digest.
3. Compile scene membership and partition complete relation bindings into internal/cut arrays.
4. Build `relationFacetsById` over those exact objects.
5. Prove union totality, uniqueness, canonical order, and facet-set digest; emit `relation_index_receipt`.
6. Compute/finalize the scene revision and freeze the complete scene plus index.
7. Portal and Path builders emit reference records plus traversal-local state.
8. Navigation stores a scene-bound selection reference and restores only after successful re-resolution.
9. Encoding, renderer, inspector, and index mappers resolve the same reference; geometry joins by exact ID under the same scene digest.
10. Static serializer resolves all required references, emits snapshots, validates each relation digest, and then writes deterministic SVG/print/no-JS output.
11. Body War and later projects supply sources/View Packs only; they do not specialize the relation law.

## 5. Decision flow view

```text
reference received
  ├─ scene digest differs ──► RELATION_REVISION_STALE ──► no action/render; fallback state
  └─ scene digest matches
       ├─ ID missing ───────► RELATION_REFERENCE_MISSING ─► no tuple fallback
       └─ facet found
            ├─ digest/cache mismatch ─► RELATION_SNAPSHOT_STALE ─► reject projection
            └─ resolved
                 ├─ interactive surface ─► derive view/local state
                 └─ detached output ─────► validate and serialize snapshot
```

Duplicate ID during compilation is `RELATION_ID_COLLISION`. Distinct IDs collapsing into one renderer/index/static identity is `RELATION_PROJECTION_COLLAPSE`. A missing predicate encoding blocks complete-registry acceptance but exact text remains the non-color semantic fallback.

## 6. Dependency and interface view

| Producer | Consumer | Contract | Failure boundary |
| --- | --- | --- | --- |
| SourceGraph validator | scene compiler | complete immutable relation binding and graph digest | duplicate/dangling/invalid relation rejects graph |
| ViewPack validator | scene compiler | membership and graph digest | stale View Pack rejects scene |
| scene compiler | relation resolver | frozen scene, partitions, index receipt | union/index/digest mismatch rejects scene |
| relation resolver | Portal/Path/navigation | RelationRef to exact facet | missing/stale is typed and no-op/fallback |
| relation resolver + encoding registry | UI view-model mapper | semantic facet plus display encoding | drift or encoding gap blocks corresponding claim |
| SceneGeometry | renderer/inspector | scene-digest-bound geometry keyed by relation ID | stale geometry rejected |
| SourceGraph/scene resolver | Full Index | exact source/scene relation resolution | fallback remains geometry-independent |
| serializer | static adapter | validated RelationSnapshots and geometry | any stale snapshot blocks artifact |
| project adapter | generic compiler | SourceGraph + ViewPack only | project-specific semantic branch rejected |

## Version and compatibility design

The current approved schema says `oew.knowledge-scene.v1`; the implementation emits `v1.1`. The repair introduces `v1.2` as a successor rather than editing prior evidence:

- v1.1 internal/cut relation arrays remain the payload.
- v1.2 adds the serialized `relation_index_receipt` and an admitted runtime index contract.
- one compatibility compiler reads the current v1.1 scene together with the exact
  admitted SourceGraph and ViewPack, verifies every copied binding, recomputes the
  index, and emits a separately identified v1.2 scene.
- completed SWU-UOVA-001 and 002 receipts remain unchanged.
- SWU-UOVA-003 partition evidence remains an input witness, not proof of the new index receipt.
- no v1 or v1.1 artifact is relabeled as v1.2 evidence.

## Encoding transition

Current SourceGraph relations store presentation cue fields. SWU-UOVA-008 plans a predicate encoding registry. The transition is two-phase:

1. v1.2 compatibility preserves current cue values and proves they round-trip.
2. registry implementation derives cue fields from exact predicate and compares them to current values; mismatch fails and requires an owner decision.

Exact predicate remains source semantic in both phases. The registry owns only display encoding.

## Static self-containment decision

Static output uses snapshots rather than requiring a live resolver. It serializes the minimum meaningful relation sentence, redundant visual cues, source/evidence handles, and authority/mapping notices. The full scene remains the source input; the output snapshots are derived and digest-bound.

## Design decisions

| ID | Decision | Rejected alternative |
| --- | --- | --- |
| ADR-RR-01 | one SourceGraph semantic owner | semantic ownership per component |
| ADR-RR-02 | scene facet index reuses partition objects | second copied facet record |
| ADR-RR-03 | interactive records are reference-first | predicate copies on every portal/Path record |
| ADR-RR-04 | detached outputs use validated snapshots | require live resolver for print/no-JS |
| ADR-RR-05 | v1.2 successor plus adapter | silently edit v1/v1.1 contracts |
| ADR-RR-06 | encoding registry owns cues, not predicate | color/pattern as predicate identity |

## Claim ceiling

This architecture is authored design evidence. It has not changed the approved UOVA schema, implemented a relation index/resolver/snapshot, run the toy game, resumed SWU-UOVA-004, or proven frontend/browser/accessibility behavior.
