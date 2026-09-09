# UOVARR-003 — Reference-First Portals

## Outcome

Compile grouped, labeled portals whose constituents carry RelationRef plus
traversal-local fields and whose summary is a validated derivation.

## Inputs

- UOVARR-001 terminal and closeout receipts;
- ViewPack cluster memberships and current cut relations;
- repaired portal schema and UX contract.

## Exact target class

- create packages/dashboard/src/oew/scene/portalQuery.ts;
- modify packages/dashboard/src/oew/scene/sceneQuery.ts;
- create test/portal-reference.test.mjs.

## Requirements

- group by declared destination cluster without losing any cut relation;
- retain one constituent per source relation ID;
- derive source direction/predicate text through resolver;
- keep traversal direction separate from source direction;
- compute and validate predicate_summary_digest;
- reject missing/stale constituent refs and cap overflow deterministically.

## Validation

    node --experimental-strip-types --test test/portal-reference.test.mjs test/scene-partition.test.mjs
    npm test

Fixtures include parallel relations, mixed predicates, reverse traversal, missing
cluster membership, summary drift, keyboard-readable sentence, and stable order.

## Compatibility and closeout

This supersedes the contradictory SWU-UOVA-004 portal requirement only after owner
refresh/closeout. It does not rewrite that blocker receipt. Successor: 005.
