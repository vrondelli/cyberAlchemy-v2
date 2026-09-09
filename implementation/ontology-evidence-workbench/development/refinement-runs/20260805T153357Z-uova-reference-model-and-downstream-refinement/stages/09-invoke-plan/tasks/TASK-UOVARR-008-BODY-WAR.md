# UOVARR-008 — Full Body War Adapter

## Outcome

Compile the complete Body War SourceGraph and ViewPack through the generic v1.2
pipeline, including clusters, portals, paths, projections, and static snapshots.

## Inputs

- UOVARR-002 and 007 terminal/closeout receipts;
- direct Body War ontology and ViewPack owner sources;
- a Decision Gate/owner receipt selecting the authoritative denominator transition.

## Exact target class

- modify only the refreshed Body War adapter/generator targets;
- update test/body-war-adapter.test.mjs;
- update projects/body-war/ontology/whole-system/tests/whole-system-oew-frontend.test.mjs
  if direct ownership and exact baselines are bound.

## Requirements

- no Body War condition in generic scene/resolver/projection code;
- all source relation IDs survive exactly once in SourceGraph and Full Index;
- scene partition, Portal, Path, geometry, renderer, inspector, and snapshots use
  the same identity;
- the selected source/scene/index denominators are explicit and reconciled against
  the historical 237/231 and planned 276/301/577 figures;
- generation is deterministic and source-owned.

## Validation

    node --experimental-strip-types --test test/body-war-adapter.test.mjs
    node --test projects/body-war/ontology/whole-system/tests/whole-system-oew-frontend.test.mjs
    npm test

Also assert parallel relation preservation, all portal destinations, all predicate
legend entries, Path reachability, complete index, and byte-equal regeneration.

## Compatibility and closeout

Stop if no owner-selected denominator exists; do not guess from a generated view.
Return denominator receipt, hashes, full validation, and owner closeout. Successor:
009.
