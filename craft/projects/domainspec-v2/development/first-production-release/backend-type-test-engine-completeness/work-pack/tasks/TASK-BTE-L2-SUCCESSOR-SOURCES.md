---
task: TASK-BTE-L2-SUCCESSOR-SOURCES
layer: L2
status: planned-no-swu-instantiated
updatedAt: 2026-07-22
---

# TASK-BTE-L2-SUCCESSOR-SOURCES — Version-Hard Node And Edge Resolution

## Primary Behavior

Resolve one versioned successor project into exact feature, node, edge, and
source-set handles using independent same-feature and project-level
cross-feature edge roots, without current-v1 fallback or an authored second
graph.

## Consumes And Emits

Consumes L0/L1 receipts and accepted source topology. Emits versioned project,
feature, node, edge, and source-set schemas under
`impl/spec/minted-project/v2/`; resolver/migration code under
`impl/tools/minted-project/v2/`; positive/negative fixtures under the BTE L2
fixture root; and run evidence under `runs/<run-id>/l2/`.

## Ordered Rules

1. Dispatch by exact profile/contract version before loading a source.
2. Resolve feature-local nodes and edges from their declared roots.
3. Resolve cross-feature edges only from the project root and validate both
   endpoint ownership records.
4. Convert current embedded `connections` only through an explicit migration
   map; never infer duplicate authored edges.
5. Canonicalize IDs/order and compute one source-set digest from exact handles.
6. Return typed resolver results; do not build graph proof yet.

## Negative Matrix

Missing/duplicate IDs, wrong root, path/symlink escape, absent endpoint, wrong
endpoint kind, undeclared scope/direction, stale digest, duplicate declaration,
cross-feature edge in a feature root, same-feature edge in the project root,
and ordered-edge ordinal loss all fail with stable codes.

## Write And Validation Boundary

Only versioned v2 spec/tools/fixtures and L2 run output are writable. Current-v1
sources, graph outputs, catalogues, consumers, and admissions are forbidden.
Run planned `verify:bte:build --stage resolve`, current regressions, deterministic
two-run source-set comparison, and scoped integrity checks. Exit is an exact
resolver/source-set receipt consumed by L3.
