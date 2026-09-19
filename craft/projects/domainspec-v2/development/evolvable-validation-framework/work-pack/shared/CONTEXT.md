---
artifact: work-pack-context
status: handoff-ready
updatedAt: 2026-07-18
---

# Shared Context: First Composability Proof

## Target

The key-and-door example contains a `Rule` node, an `Operation` node, and an
`enforces` edge. The first proof must preserve the source anchor and graph
digest at every boundary.

## Read In This Order

1. [DEFINE.md](../../DEFINE.md) for object meanings and ownership.
2. [DESIGN.md](../../DESIGN.md) for the six views and interfaces.
3. [IMPLEMENTATION-LAYERING.md](../../IMPLEMENTATION-LAYERING.md) for L0 scope.
4. [GAPS.md](GAPS.md) and [TRACEABILITY.md](TRACEABILITY.md) for open residue.
5. Existing test-engine files listed in [DEFINE.md](../../DEFINE.md).

## Working Rule

If a runtime adapter or formal predicate is absent, emit a typed gap and stop
that claim. Do not turn structural evidence into a semantic pass.
