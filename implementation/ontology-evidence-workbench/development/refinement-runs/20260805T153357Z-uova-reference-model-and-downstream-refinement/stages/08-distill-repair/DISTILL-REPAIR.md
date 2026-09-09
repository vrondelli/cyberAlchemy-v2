# Distill Repair

## Fixed point

The model reaches a design fixed point after the coherence review and toy game.
The selected form is:

> One SourceGraph semantic relation, admitted into one scene binding, indexed once
> per immutable scene revision, referenced by interactive consumers, and snapshotted
> only for detached output under a digest law.

## Repairs applied

1. Split reusable reference/snapshot definitions from the actual compositional
   KnowledgeScene v1.2 schema.
2. Made Portal and Path records carry `RelationRef`, not copied predicates.
3. Added endpoint labels, source/traversal phrases, snapshot digest, and nullable
   color/pattern cues to detached snapshots.
4. Fixed canonical digest inputs, ordering, domain separation, counts, and the
   non-recursive scene-digest algorithm.
5. Required legacy migration to compare every binding against exact admitted
   SourceGraph and ViewPack evidence.

## Toy-game result

Fifteen positive and negative checks passed. They cover parallel same-tuple
relations, reverse portal traversal, Path, stale and missing refs, geometry revision,
view-model drift, static fallback/drift, cross-surface identity, domain separation,
duplicate IDs, and source-bound migration. The first run exposed and corrected a
test-harness field-name error; it is retained in evidence and carries no product
claim.

## Recomposition proof

- Portal and Path resolve exact semantics from the same scene index while keeping
  traversal-local state.
- Navigation, geometry, renderer, inspector, and index share `RelationRef` and fail
  stale/missing lookups.
- Derived view fields bind `relation_digest`; static snapshots bind both relation
  and snapshot digests.
- Body War remains an adapter fixture and cannot specialize relation identity.

## Residue

- Product implementation, owned-runner selection, full fixture execution, browser
  behavior, and accessibility acceptance remain unproven.
- The Body War denominator transition must be explicitly selected by its owner.
- Full schema-registry instance fixtures belong in the implementation pack.

The result is ready for a non-executed owner-routed repair plan, not Task Session.
