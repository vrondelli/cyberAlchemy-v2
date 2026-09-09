# Transport Report

## Selected transport

- Internal runtime transport: resolved `SourceRelationBinding` object from the
  immutable scene facet/index.
- Cross-component live transport: `RelationRef` with exact source relation ID and
  scene digest.
- Detached/static transport: validated `RelationSnapshot` with source relation ID,
  scene digest, predicate ID, endpoint IDs, cue data, provenance reference, and
  snapshot digest.

## Rejected transports

- Endpoint/predicate tuple as identity: cannot distinguish parallel relations.
- Copied relation DTO without a revision binding: can silently become stale.
- Consumer-owned predicate labels or colors: creates a second semantic owner.
- Bare source relation ID without a scene digest: cannot detect cross-scene reuse.

## Failure transport

Resolvers return typed failure states for missing relation, stale scene,
ambiguous legacy input, invalid snapshot, and incompatible schema. Consumers must
render or report these states; they may not silently invent a relation.
