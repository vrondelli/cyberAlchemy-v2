# UOVARR-006 — Presentation Joins

## Outcome

Join encoding, geometry, renderer, inspector, cards, and Full Index by one exact
relation reference while preserving complete text and semantic-free geometry.

## Inputs

- UOVARR-005 terminal and closeout receipts;
- relation presentation, inspector, workspace, and index sources;
- current cue compatibility fields and future registry contract.

## Exact target class

- modify packages/dashboard/src/oew/relationPresentation.ts,
  EvidenceWorkspace.tsx, EvidenceInspector.tsx, EvidenceOutline.tsx, and
  EvidenceTable.tsx;
- create packages/dashboard/src/oew/scene/relationGeometry.ts if the refreshed
  architecture retains that seam;
- create test/relation-projection.test.mjs and update focused component tests.

## Requirements

- registry keys exact predicate and owns display encoding only;
- present registry cues must equal compatibility cues during transition;
- geometry binds scene digest and contains no predicate/evidence semantics;
- renderer emits one separately addressable edge per source relation ID;
- labels expose exact predicate/direction text; color is never sole meaning;
- inspector and Full Index resolve independently of geometry.

## Validation

    node --experimental-strip-types --test test/relation-projection.test.mjs test/evidence-inspector.test.mjs test/presentation-edges.test.mjs
    npm test

Fixtures cover 39 predicate encodings, missing/colliding cues, forced-color fallback,
parallel visible paths, stale geometry, exact inspector selection, and complete index.

## Compatibility and closeout

Do not infer semantics from layout or color. Return exact hashes, focused/full
validation, and owner closeout. Successor: 007.
