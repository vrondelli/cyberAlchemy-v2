---
spec_id: uova-relation-reference-contract
status: candidate-refinement
version: 0.1.0
authority_effect: none
source_run: 20260805T153357Z-uova-reference-model-and-downstream-refinement
discovery_status: present
---

# UOVA Relation Reference Contract

## Purpose

Define the semantic laws that every OEW relation-bearing presentation contract must preserve. This specification intentionally does not select denormalized, reference-first, or immutable-facet storage. It defines the proof obligations any selection must satisfy.

## Scope

Applies to `SourceGraph`, `KnowledgeScene`, Grouped Portals, Path, `NavigationFrame`, UI View Models, predicate encoding, `SceneGeometry`, renderer, inspector/index, static projection, and project adapters such as Body War.

## Canonical identity law

Within one exact admitted source-graph revision, a relation is identified by `source_relation_id`. The portable reference is the pair:

```text
RelationRef = (source_graph_digest, source_relation_id)
```

`source_relation_id` alone is a local shorthand only when the owning object already carries an unambiguous `source_graph_digest` or a `scene_digest` that binds it.

Two relations remain distinct when their endpoints, exact predicate, or presentation family are equal. Endpoint/predicate tuples are not identities.

## Canonical semantic record

`SourceRelationBinding` is the current canonical semantic record admitted from the source graph. It owns:

- source relation identity;
- ordered source and target endpoints;
- exact predicate;
- source direction;
- evidence references;
- mapping loss and authority effect;
- source-owned presentation cue inputs already admitted by the SourceGraph contract.

The selected design may expose this record directly, derive one immutable scene-local facet, or materialize validated snapshots. It may not create another independent semantic owner.

## Resolution law

```text
resolve(sceneRevision, RelationRef) -> SourceRelationBinding | MissingReference | StaleRevision
```

Resolution must be total for every admitted interactive relation reference. A missing ID, wrong graph digest, or wrong scene revision fails closed before rendering, navigation, geometry lookup, inspection, or export.

## Field-class laws

| Field class | Meaning owner | Permitted consumers |
| --- | --- | --- |
| identity | SourceGraph revision plus relation ID | every relation-bearing object |
| semantic | canonical relation record | portal/Path/view/inspector/static through exact resolution or validated snapshot |
| traversal-local | portal or Path construction | inside/outside endpoints and forward/reverse traversal |
| presentation encoding | exact-predicate encoding registry | color, pattern, visible label, direction phrase; never semantic identity |
| geometry-local | SceneGeometry revision | route sections, ports, labels, markers, bounds |
| interaction-local | NavigationFrame | selected reference, filters, viewport, panel, focus restoration |
| detached snapshot | explicit serializer/export owner | only fields needed when no resolver is available, bound to source digest |

## Direction law

`source_direction` records ontology/source order. `traversal_direction` records how a user crosses the relation from the current scene. Reverse traversal never reverses or rewrites the canonical source endpoints or predicate.

Every human-readable sentence must be reconstructable from the canonical source direction plus the local traversal direction.

## Predicate and encoding law

`exact_predicate` is semantic data owned by the canonical relation record. A predicate encoding is a deterministic presentation lookup keyed by exact predicate. Color, pattern, family, label, or direction phrase never replaces predicate identity.

If a downstream record stores `exact_predicate`, it must be explicitly classified as either:

1. a canonical field on the semantic owner; or
2. a validated snapshot tied to `RelationRef` and a digest.

It may not be an independently editable copy.

## Projection law

Portals, Path hops, view models, geometry records, renderer elements, inspector rows, index rows, and Body War assets are projections or local-state records. They may add their local fields, but they must preserve a resolvable `RelationRef` and cannot alter canonical relation semantics.

## Snapshot law

A detached or serialized snapshot that includes semantic fields must carry:

- the complete `RelationRef`;
- a `source_relation_digest` derived from the canonical semantic record;
- the snapshot schema version;
- an equality witness or deterministic validation rule.

On mismatch, the consumer reports `StaleSnapshot`; it does not silently prefer either copy.

## Scene and geometry revision law

The scene revision binds the exact SourceGraph and View Pack revisions. Geometry binds the exact scene digest plus layout inputs. A NavigationFrame, geometry result, portal, or Path from another scene revision is stale even if relation IDs still exist.

## Standalone-output law

Interactive presentation may use a live resolver. Detached SVG/print/export must remain understandable without one. The design must name the minimum snapshot fields and prove them equal to the canonical record at serialization time. Self-containment is a serialization obligation, not permission for every interactive object to own copies.

## Failure vocabulary

| Code | Meaning | Required effect |
| --- | --- | --- |
| `RELATION_REFERENCE_MISSING` | relation ID absent from the bound source graph | no partial presentation; expose fallback/index error state |
| `RELATION_REVISION_STALE` | graph or scene digest mismatch | reject restore/navigation/geometry result |
| `RELATION_SNAPSHOT_STALE` | semantic snapshot digest differs | reject detached projection generation |
| `RELATION_ID_COLLISION` | two records claim one ID in one graph revision | reject SourceGraph admission |
| `RELATION_PROJECTION_COLLAPSE` | distinct IDs map to one presentation identity | reject compilation/rendering acceptance |
| `RELATION_ENCODING_MISSING` | no encoding for an admitted exact predicate | text remains semantic fallback; acceptance blocks complete registry claim |

## Compatibility obligations

- SWU-UOVA-001 normalization remains valid if `SourceRelationBinding` and `source_relation_id` remain canonical.
- SWU-UOVA-002 View Pack remains valid if it selects source relation IDs without redefining them.
- SWU-UOVA-003 scene partition remains valid if internal and cut relation records remain lossless and references resolve within the bound scene.
- Any new facet or snapshot must be derived after those steps or introduced through an explicit versioned compatibility adapter.

## Acceptance obligations for later design

The selected model must prove:

1. parallel relations never collapse;
2. portal and Path traversal preserve source direction;
3. same-ID selection reaches renderer, inspector, index, and evidence;
4. stale graph/scene/geometry/navigation revisions fail closed;
5. missing references fail before partial rendering;
6. detached output remains understandable and digest-bound;
7. duplicated semantic drift is detected;
8. Body War remains an adapter and fixture, not the semantic owner.

## Claim ceiling

This specification defines candidate laws only. It does not amend the approved UOVA schema or task, unblock SWU-UOVA-004, implement a resolver/facet/snapshot, or prove runtime/browser behavior.
