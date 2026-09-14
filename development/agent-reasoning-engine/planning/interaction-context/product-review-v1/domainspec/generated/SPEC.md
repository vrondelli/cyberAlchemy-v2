# Are Interaction Review Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `7b23cb9b85c402e2690663eadd352d42adef3db16486b22677c93dda1d7b1eef`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `are-interaction-review.HostBoundary` | Rule | Reject unbound feedback, cross-scope reuse, malformed provider responses and silent replay. |
| `are-interaction-review.HostRequest` | Entity | Keep user actions, reference data and completed-response identity distinct. |
| `are-interaction-review.ReviewInteraction` | Operation | Drive the existing wrapper and ledger through an explicit host adapter and bounded text response port. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `are-interaction-review.edge.enforces-host` | `are-interaction-review.HostBoundary` | `enforces` | `are-interaction-review.ReviewInteraction` |
| `are-interaction-review.edge.reads-request` | `are-interaction-review.ReviewInteraction` | `reads` | `are-interaction-review.HostRequest` |

This file is generated; edit machine sources and rebuild.
