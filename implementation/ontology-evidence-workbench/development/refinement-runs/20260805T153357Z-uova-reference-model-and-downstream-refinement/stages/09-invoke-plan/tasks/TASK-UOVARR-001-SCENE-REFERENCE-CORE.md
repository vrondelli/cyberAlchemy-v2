# UOVARR-001 — Scene Reference Core

## Outcome

Implement KnowledgeScene v1.2, canonical digest laws, immutable relation index, and
typed RelationRef resolution.

## Inputs

- repaired scene/reference schemas and digest laws from R06;
- current sourceGraph.ts, sceneQuery.ts, oew/types.ts;
- completed UOVA-001–003 receipts as compatibility evidence only.

## Exact target class

- modify packages/dashboard/src/oew/scene/sceneQuery.ts and oew/types.ts;
- create packages/dashboard/src/oew/scene/relationReference.ts;
- create test/relation-reference.test.mjs;
- update test/scene-partition.test.mjs only for v1.2 assertions.

Invoke Refresh must hash every existing target and bind absence for new files.

## Requirements

- build the index over exact internal/cut binding objects;
- reject duplicate IDs and union/index/count/order/digest mismatch;
- implement the normative digest profile and typed resolved/missing/stale result;
- prohibit tuple fallback;
- keep runtime index out of serialized payload while emitting its receipt.

## Validation

    node --experimental-strip-types --test test/relation-reference.test.mjs test/scene-partition.test.mjs
    npm test
    git diff --check -- packages/dashboard/src/oew/scene packages/dashboard/src/oew/types.ts test/relation-reference.test.mjs test/scene-partition.test.mjs

Negative fixtures cover parallel same-tuple relations, stale scene, missing ID,
duplicate ID, noncanonical order, bad count, wrong domain digest, and object reuse.

## Compatibility and closeout

Do not mutate or relabel v1/v1.1 evidence. Return exact hashes, validation output,
remaining compatibility gaps, and owner closeout. Successors: 002, 003, 004.
