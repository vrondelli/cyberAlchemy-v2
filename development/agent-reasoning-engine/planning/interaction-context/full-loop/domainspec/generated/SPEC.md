# Are Interaction Learning Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `3a6cb1798c11b09bf72aa8ccfe7641ff5b8083030ec95f06d7f37c399eaee4aa`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `are-interaction-learning.InteractionLearningState` | Entity | Preserve scoped interaction meanings, lessons, applications, outcome coverage and progress without granting authority. |
| `are-interaction-learning.LearningBoundary` | Rule | Reject cross-scope learning, ungrounded feedback, stale application and unbounded retries. |
| `are-interaction-learning.RunInteractionLearning` | Operation | Join interpretation, dispatch, attributed outcomes, corrections, scoped lesson application and bounded research/experiment feedback using the existing ledger. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `are-interaction-learning.edge.creates-continuity` | `are-interaction-learning.RunInteractionLearning` | `creates` | `are-interaction-learning.InteractionLearningState` |
| `are-interaction-learning.edge.enforces-continuity` | `are-interaction-learning.LearningBoundary` | `enforces` | `are-interaction-learning.RunInteractionLearning` |

This file is generated; edit machine sources and rebuild.
