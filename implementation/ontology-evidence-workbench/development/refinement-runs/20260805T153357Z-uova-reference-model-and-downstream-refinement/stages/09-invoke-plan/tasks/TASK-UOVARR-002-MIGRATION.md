# UOVARR-002 — Source-Bound Compatibility Migration

## Outcome

Admit v1/v1.1 scenes only through exact SourceGraph and ViewPack comparison, then
emit a separately identified v1.2 scene and migration receipt.

## Inputs

- UOVARR-001 terminal and owner-closeout receipts;
- direct v1 and v1.1 fixtures plus admitted SourceGraph/ViewPack inputs;
- DIGEST-AND-MIGRATION-LAWS.md.

## Exact target class

- create packages/dashboard/src/oew/scene/sceneMigration.ts;
- create test/relation-migration.test.mjs;
- modify loader/admission entrypoint only if Refresh binds its exact path.

## Requirements

- compare every SourceGraph-owned binding field by exact relation ID;
- reject missing, extra, duplicate, drifted, wrong-graph, and wrong-ViewPack inputs;
- issue a new migration receipt without changing the legacy artifact;
- preserve cue fields until the encoding-registry comparison task.

## Validation

    node --experimental-strip-types --test test/relation-migration.test.mjs
    npm test
    git diff --check -- packages/dashboard/src/oew/scene/sceneMigration.ts test/relation-migration.test.mjs

Positive fixtures cover v1 and v1.1. Negative fixtures mutate predicate, endpoint,
cue, evidence, mapping loss, authority effect, graph digest, and ViewPack digest.

## Compatibility and closeout

The adapter grants no new authority to legacy scenes. Return new artifact/receipt
hashes and keep old receipts untouched. Successor: 008.
