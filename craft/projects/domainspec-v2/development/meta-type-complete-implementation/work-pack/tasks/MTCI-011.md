# MTCI-011 — Conditional Runtime Evidence Plane

Owner route: application/runtime owner. Status: conditionally eligible after MTCI-010.

## Entry predicate

Run only when the MTCI-005 design marks one or more runtime/temporal/effect obligations required. If none are required, create a signed not-applicable receipt bound to the design; do not silently skip.

## Outcome

Witness the same named behavior in each applicable language with positive paths, invalid paths, state/effect boundaries, and explicit failure semantics.

## Acceptance

Static representation and exhaustiveness remain distinct from transition/runtime correctness, durable state, intent publication, and effect delivery. Each claimed plane has its own fixture and raw evidence; unobserved external effects remain unproven. Any cross-language disagreement blocks.

