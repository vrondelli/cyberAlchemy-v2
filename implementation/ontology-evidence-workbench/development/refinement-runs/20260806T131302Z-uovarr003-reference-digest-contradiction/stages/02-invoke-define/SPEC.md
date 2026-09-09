---
spec_id: uovarr003-acyclic-scene-reference-contract
status: candidate-refinement
version: 0.1.0
authority_effect: none
source_run: 20260806T131302Z-uovarr003-reference-digest-contradiction
discovery_status: present
---

# Acyclic Scene Reference Contract

## Purpose

Define the obligations a repair must satisfy before Grouped Portals may embed relation references in a content-addressed `KnowledgeScene`. This definition deliberately does not select an implementation model.

## Scope

Applies to scene finalization and admission, `RelationRef`, grouped portal constituents, Path hops, NavigationFrame selection, scene-local relation resolution, detached snapshots, serialization, and migration from `oew.knowledge-scene.v1.2`.

## Acyclic identity law

Every stored digest is a node in an explicit dependency DAG. A digest must not depend, directly or transitively, on its own stored value. A repair that requires a cryptographic fixed point is invalid.

```text
semantic fields -> semantic basis -> scene revision digest
canonical relation -> relation digest
scene revision digest + relation ID -> validated relation reference
```

An optional envelope digest may depend on the finalized semantic revision and its validated references. A scene revision must not then depend on that envelope digest.

## Field-class law

Every reference-bearing schema classifies each field as exactly one of:

| Field class | Included in semantic basis? | Validation |
| --- | --- | --- |
| semantic scene field | yes | recompute scene revision |
| traversal/local scene field | yes | recompute scene revision |
| canonical relation semantic field | through admitted relation partitions | relation digest and index equality |
| schema-declared revision back-reference | model-dependent, but never by ambient key-name filtering | equals the recomputed revision it claims |
| derived runtime index | no | rebuild and compare receipt basis |
| top-level stored revision digest | no | equals recomputation |
| optional envelope identity | excluded from the semantic revision | recompute from finalized envelope if selected |

Unknown fields and extension payloads remain in the semantic basis unless a versioned schema explicitly classifies them otherwise.

## Scene semantic basis

`SceneSemanticBasis` is the canonical, schema-versioned input to the scene revision hash. It contains all meaning-bearing scene fields, all portal/Path local traversal fields, admitted relation partitions, and receipt basis. It excludes only external identity slots and derived runtime artifacts declared by the selected schema version.

The basis extractor is schema-aware and path-specific. Recursively deleting every property named `scene_digest` is forbidden.

## Reference binding phase

`ReferenceBindingPhase` is the stage at which a revision identity becomes available to reference-bearing records. The selected model must identify whether references are:

1. bound into schema-declared back-reference slots after semantic revision computation;
2. emitted in a detached projection keyed by that revision; or
3. bound in an envelope whose identity is distinct from the semantic revision.

Binding may return a new immutable object. Mutation of an already admitted or published scene is forbidden.

## Validated relation reference

```text
ValidatedRelationRef = (scene_revision_digest, source_relation_id)
```

It is valid only when:

- the scene revision recomputes from the scene's semantic basis;
- the reference digest equals that recomputed revision;
- the source relation ID occurs exactly once in the admitted relation index; and
- every copy or snapshot of relation semantics passes its own digest/equality rule.

`source_relation_id` alone is an in-memory shorthand only within an already admitted scene revision.

## Finalization law

Finalization is deterministic and one-way:

1. validate input semantic and local fields;
2. build canonical relation/index receipt basis;
3. construct the schema-versioned semantic basis;
4. compute the scene revision digest exactly once from that basis;
5. bind or project reference records according to the selected model;
6. validate all bound references against the computed revision;
7. compute an envelope digest only if the selected model defines one;
8. deep-freeze and return one final artifact.

Re-finalizing equivalent input yields byte-equivalent canonical JSON and identical digests.

## Admission law

Admission distrusts stored digests. It reconstructs the semantic basis, recomputes the scene revision, rebuilds the relation index, validates every reference-bearing record, and rejects unexpected excluded fields or paths. It must reject:

- a tampered portal-local field;
- a tampered reference revision;
- an arbitrary nested field named `scene_digest` that changed;
- a missing or duplicated relation ID;
- a reference to a different admitted scene;
- a v1.2 artifact presented under the repaired schema identity without migration.

## Round-trip law

For any admitted repaired scene:

```text
admit(parse(canonicalSerialize(finalize(input))))
```

returns the same semantic revision, reference set, and canonical bytes. Ambient resolver state, current UI selection, or process-local maps may not affect the result.

## Candidate models

| Model | Required proof |
| --- | --- |
| validated embedded back-reference | path-specific digest-basis exclusions; deterministic post-digest binding; admission equality for every slot |
| detached projection | schema ownership and lifecycle of the projection; self-contained transport with scene; consumer joins fail closed |
| two-level revision/envelope identity | names and ownership of both identities; one-way dependency; explicit consumer choice and migration |
| ambient scope | negative control; must be rejected because serialization and admission are not self-contained |

## Migration law

The repaired schema receives a new schema identity. Existing v1.2 artifacts are never relabeled in place. A migration adapter must admit the original SourceGraph and v1.2 scene, verify its relation partitions and receipt evidence to the maximum sound extent, then rebuild the repaired artifact under the new finalizer. Circular portal references in a v1.2 artifact cannot self-certify and must be rebuilt or rejected.

## Compatibility obligations

- completed UOVARR-001 relation identity and index behavior remain preserved;
- grouped portals may not be implemented against a reference law that self-stales;
- Path and NavigationFrame use the same repaired reference type or an explicit adapter;
- static output remains understandable without ambient application state;
- parallel relation IDs never collapse, even with identical endpoints/predicates;
- Body War remains a fixture and adapter, not the digest or semantic owner.

## Failure vocabulary

| Code | Meaning |
| --- | --- |
| `SCENE_DIGEST_DEPENDENCY_CYCLE` | selected digest graph contains a direct or transitive self-dependency |
| `SCENE_REVISION_MISMATCH` | stored revision differs from recomputed semantic basis |
| `RELATION_REFERENCE_REVISION_MISMATCH` | embedded/projected reference names another revision |
| `REFERENCE_BINDING_PATH_UNDECLARED` | a field was omitted from hashing without schema authorization |
| `SCENE_ENVELOPE_MISMATCH` | selected envelope identity differs from recomputation |
| `LEGACY_SCENE_REBUILD_REQUIRED` | v1.2 artifact cannot be admitted as the repaired version |

## Claim ceiling

This specification is candidate-local definition evidence. It does not select a model, amend v1.2, repair `relationReference.ts`, unblock UOVARR-003, or prove browser/runtime behavior.
