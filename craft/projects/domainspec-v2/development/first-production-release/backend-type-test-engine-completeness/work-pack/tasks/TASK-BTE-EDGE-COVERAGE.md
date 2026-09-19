> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` for the L2/L4/L6 replacement route.

# TASK-BTE-EDGE-COVERAGE — Independent edge roots and causal backend signatures

## Objective

Bind the accepted `feature-with-independent-node-and-edge-files@1` candidate
profile and positively exercise all 16 backend relationship signatures without
making generated graph or consumer projections authoritative.

## Scope

- One edge-record schema for both roots.
- Same-feature edges under `specs/<feature>/edges/`.
- Cross-feature edges under project-level `specs/edges/`.
- Explicit endpoint ownership, scope, direction, and lifecycle metadata.
- Resolver negatives for duplicate IDs, wrong root, missing endpoint owner, path
  escape, stale digest, duplicate root declaration, unknown signature, and wrong
  scope.

## Positive exercise standard

Every signature must have an admitted edge, deterministic compilation, bounded
traversal, active edge-to-composition binding, causal removal evidence, provenance,
and a typed negative/mutation witness. Registry presence, compilation, or runtime
occurrence alone does not count.

The exact set is:

`performs`, `produces`, `produces-for`, `triggers-cross`, `enforces`, `calculates`,
`transitions`, `exposes`, `orchestrates`, `applies`, `maps`, `contains`, `queries`,
`emits`, `owns`, `belongs-to`.

## Dependencies

- Accepted `DEC-FPR02-SUPPORTED-PROFILE`.
- Node/profile contract and shared YAML criterion kernel.
- Independent `O_spec` catalogue before exact-set comparison.

## Done criteria

- `Backend_signatures_admitted = Backend_signatures_exercised = 16`.
- Same-feature proof passes before cross-feature proof contributes evidence.
- Node and edge source manifests bind profile, registry, schema, endpoint, and
  digest inputs.
- Removing an active edge or composition binding removes the governed obligation.
- No UI/cross-layer signature or runtime product claim is admitted.

## Validation

Run the resolver, compiler, bounded traversal, causal-removal, negative-fixture,
and deterministic replay checks from the selected v2 engine route. Return a
Task Session receipt; do not edit the historical four-kind profile.
