---
task: TASK-BTE-L1-FORMATION-V2
layer: L1
status: planned-no-swu-instantiated
updatedAt: 2026-07-23
---

# TASK-BTE-L1-FORMATION-V2 — Versioned YAML-Owned Formation

## Primary Behavior

Materialize the accepted formation-v2 replacement so every one of 13 structure
bundles and 16 kind-scoped criterion identities has a closed machine contract,
while every current-v1 JSON constraint has an exact retirement/compatibility
disposition and current-v1 bytes remain unchanged.

## Consumes And Emits

Consumes a passing L0B `ValidationReceipt`, the unchanged L0A publication
handle set, the 13 current YAML schema handles, current-v1
profile/node/four formation-schema handles, and
`DEC-BTE-FORMATION-AUTHORITY-001`.

Emits under `impl/spec/minted-project/v2/formation/` a versioned structural AST,
criterion catalogue/grammar, retirement map, source-migration map, compatibility
manifest, and schemas. Implementation and tests live under the corresponding
`impl/tools/minted-project/v2/formation/` and BTE fixture roots. Run evidence
lives under `runs/<run-id>/l1/`.

## Ordered Rules

1. Inventory all current-v1 JSON constraints and all 13 YAML structure bundles/
   16 criterion records by stable source handle.
2. Require an exact predecessor-map row for every retired JSON constraint; no
   missing or duplicate predecessor.
3. Parse only the declared closed YAML subset and fail on every unsupported
   keyword.
4. Evaluate required structure before kind-scoped criteria and return stable
   phase/code diagnostics.
5. Run current-v1 compatibility fixtures byte-for-byte through the unchanged
   v1 route and separate successor fixtures through the v2 route.
6. Prove the Entity case `{"fields":[{"type":7,"identity":"yes"}]}` fails for
   the formation reason, not only a downstream digest or envelope reason.

## Negatives And Stop Conditions

Reject incomplete retirement mapping, JSON/YAML disagreement without explicit
disposition, ignored keyword, malformed structure, nearest-neighbour kind,
Interface/Mapping open-domain false green, Value Object equality substring
substitution, v1 source mutation, or v1/v2 fallback. Stop before admission; a
green implementation remains a candidate package.

## Validation And Recomposition

Planned `verify:bte:formation-v2`; current `tools:test`, `engine:test`,
`typecheck`, `validate:content`, and `instances:validate` where touched. Exit is
an exact retirement/migration/compatibility receipt that L2 can consume without
re-reading prose. SWUs are instantiated only after L0 completion exposes the
exact contract handles.
