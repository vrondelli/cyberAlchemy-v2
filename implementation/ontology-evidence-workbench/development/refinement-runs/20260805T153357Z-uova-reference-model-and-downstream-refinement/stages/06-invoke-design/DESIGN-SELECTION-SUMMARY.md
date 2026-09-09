# Design Selection Summary

## Verdict

`pass` with a fixed point and `design-validator-pass` evidence.

## Selected architecture

Use a revision-bound relation facet as an immutable index over the exact
`SourceRelationBinding` objects already stored in the Knowledge Scene. The facet
does not create another semantic relation record.

- Interactive consumers carry `RelationRef { source_relation_id, scene_digest }`
  and resolve through the scene-owned index.
- Detached or static consumers carry a validated `RelationSnapshot` whose source
  relation ID, scene digest, and snapshot digest are checked before use.
- Predicate identity, source direction, endpoint identity, and provenance remain
  owned by `SourceGraph` and its scene binding.
- Traversal direction and presentation cues remain consumer-owned and cannot
  overwrite source semantics.

## Compatibility boundary

The successor contract is `oew.knowledge-scene.v1.2`. A compatibility adapter
may read v1 and v1.1 inputs and emit a newly validated v1.2 scene. Existing
receipts retain their original schema version and claim ceiling.

## Why this survived

The design preserves exact relation identity across cards, portals, paths,
geometry, renderer state, and static export without duplicating semantic
ownership. It also provides explicit stale, missing, ambiguous, and cross-scene
failure states instead of silently falling back to tuple matching.

## Evidence boundary

This is validated design evidence. No product code, prior receipt, ontology,
deployment, or promotion state was changed.
