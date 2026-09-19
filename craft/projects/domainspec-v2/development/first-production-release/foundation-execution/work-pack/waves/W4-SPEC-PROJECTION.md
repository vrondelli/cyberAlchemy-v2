---
wave: W4
layer: L3
status: blocked
---

# W4: FPR-04 Tiny Authoritative Spec Projection

## Decision

After this wave, we know whether one exact Spec source can become a total two-node/one-edge Sg and survive an independently checked bounded retraction.

## Order

1. `SWU-FPR04-001` — exact required source manifest, schemas, and fail-closed input controls.
2. `SWU-FPR04-002` — compile two nodes and one admitted edge into Sg.
3. `SWU-FPR04-003` — enumerate quotient and local G; reject relation collisions and direction drift.
4. `SWU-FPR04-004` — independently compare `Sg -> G -> Sg_canonical` and kill mutants.

## Entry

Verified FPR-03 direction and total mapping receipt.

## Promotion Gate

Zero unmapped in-profile elements; exact source digest; schema-valid nonempty Sg; explicit quotient only; independent comparator; missing/empty/deferred, node, field, edge-direction, and quotient mutants all fail.

## Downstream Boundary

The interactive ontology application may begin read-only traversal tests after this receipt. It cannot modify Sg, mint relations, or treat UI layout edges as DomainSpec authority.

