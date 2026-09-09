# Governance Dependency Kernel Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `a9358609245902ceea958ed15b74045c41a55f209724b063f7be56f8527083f5`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `governance-dependency-kernel.ActivationBinding` | Entity | Represent the separately owned immutable binding over program, kernel, route, scope, and effect mapping that must exist before an enforcement adapter may act. |
| `governance-dependency-kernel.DependencyEvaluation` | Entity | Return a deterministic no-effect result with the closed relevant set, observations, ambient evidence, causal blockers, and PASS, CANDIDATE, BLOCK, or NOT_EVALUABLE status. |
| `governance-dependency-kernel.DependencyEvaluationRequest` | Entity | Select one exact program, admitted-use or candidate-construction mode, root dependency IDs, and exact changed input digests intentionally used by candidate construction. |
| `governance-dependency-kernel.DependencyRecord` | Entity | Bind one repository-contained whole file, heading section, JSON record, or JSON record set to an admitted digest and explicit dependency edges. |
| `governance-dependency-kernel.DependencyRelevanceInvariant` | Rule | Return true only when program and request identities are exact, every selected dependency closes without cycles or ambiguity, admitted-use inputs match admitted digests, candidate inputs are explicitly selected by exact observed digest, and unselected drift cannot affect the result. |
| `governance-dependency-kernel.GovernanceProgram` | Entity | Represent one immutable owner-selected no-effect program containing an explicit dependency graph, permitted evaluation modes, and claim ceilings. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
