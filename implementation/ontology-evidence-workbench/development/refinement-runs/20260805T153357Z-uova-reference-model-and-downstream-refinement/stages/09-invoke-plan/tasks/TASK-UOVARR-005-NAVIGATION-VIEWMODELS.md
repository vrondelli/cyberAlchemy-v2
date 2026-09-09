# UOVARR-005 — Navigation and View-Model Integrity

## Outcome

Make selection, restoration, Portal/Path cards, and relation view models share the
same scene-bound reference and validate every derived semantic field.

## Inputs

- UOVARR-003 and 004 terminal/closeout receipts;
- current store.ts, navigation tests, and UI API contracts.

## Exact target class

- modify packages/dashboard/src/oew/store.ts and oew/types.ts;
- create packages/dashboard/src/oew/relationViewModels.ts;
- update test/navigation.test.mjs;
- create test/relation-consumer-sync.test.mjs.

## Requirements

- selected relation/path-hop state stores RelationRef;
- scene commit re-resolves before atomic restoration;
- stale/missing selection uses the declared focus fallback;
- every copied display row carries relation_digest and rejects drift;
- Portal, Path, graph, inspector, and index selection synchronize by exact ID.

## Validation

    node --experimental-strip-types --test test/navigation.test.mjs test/relation-consumer-sync.test.mjs
    npm test

Negative tests mutate predicate, cue, evidence, scene revision, and selected ID.

## Compatibility and closeout

Preserve existing non-relation UI store behavior and keyboard focus rules. Return
target hashes, focused/full validation, and owner closeout. Successor: 006.
