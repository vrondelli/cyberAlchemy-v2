# UOVARR-004 — Reference-First Path

## Outcome

Compute bounded deterministic paths whose hops carry exact RelationRef and
traversal-local direction.

## Inputs

- UOVARR-001 terminal and closeout receipts;
- current graph relation bindings and Path policy contract;
- repaired path schema.

## Exact target class

- create packages/dashboard/src/oew/scene/pathQuery.ts;
- modify packages/dashboard/src/oew/types.ts only if required by the bound design;
- create test/path-reference.test.mjs.

## Requirements

- directed and undirected policies remain explicit and versioned;
- every hop resolves exact source relation identity;
- same-tuple parallel relations remain distinct alternative paths;
- reverse traversal never changes source direction;
- missing/stale refs, cap overflow, and no-path states are typed.

## Validation

    node --experimental-strip-types --test test/path-reference.test.mjs
    npm test

Fixtures cover directed shortest, reverse undirected traversal, parallel edges,
eight-path/eight-hop caps, deterministic ties, stale revision, and no path.

## Compatibility and closeout

No copied predicate is admitted in PathHop. Return exact hashes and owner closeout.
Successor: 005.
