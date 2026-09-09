# UOVARR-007 — Static Projection and Accessibility Fallback

## Outcome

Produce deterministic SVG, print, and no-JS artifacts from validated
RelationSnapshots without a live resolver.

## Inputs

- UOVARR-006 terminal and closeout receipts;
- repaired snapshot schema and digest laws;
- existing accessibility and responsive contracts.

## Exact target class

- create packages/dashboard/src/oew/relationSnapshot.ts;
- bind the existing owner-selected static serializer/output target during Refresh;
- create test/static-relation-snapshot.test.mjs;
- update browser/responsive tests only for declared static behavior.

## Requirements

- include endpoint labels, exact predicate, source direction, and contextual
  traversal phrase;
- permit null color and pattern without losing meaning;
- validate relation and snapshot digests before output;
- deterministic canonical order and byte-equal repeat;
- evidence, mapping-loss, and authority notices remain visible;
- reject any stale or incomplete required snapshot.

## Validation

    node --experimental-strip-types --test test/static-relation-snapshot.test.mjs test/responsive.test.mjs
    npm test

Fixtures include reverse traversal, null cues, altered snapshot, stale scene, print
layout, no-JS sentence, forced colors, and byte equality.

## Compatibility and closeout

Snapshots are projection evidence, never SourceGraph authority. Return artifact
sizes, hashes, validation, and owner closeout. Successor: 008.
