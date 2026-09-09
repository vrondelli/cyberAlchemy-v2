# Context selection

This is a standard-mode, strict authoring context selection. It is not an
execution-time Context Builder handoff pack.

## Obligations

| ID | Obligation | Status |
|---|---|---|
| O-01 | Determine whether the Agent Reasoning Engine already implements intent-to-route resolution. | covered |
| O-02 | Define the smallest non-authorizing runtime contract. | covered |
| O-03 | Prevent overlap with Dispatch Spec, Continuation Router, Orchestrate, and the semantic evaluator. | covered |
| O-04 | Explain how the resolver composes with Augmentor and ResonantOS. | covered |
| O-05 | Produce a gated implementation path without implementing it. | covered |

## Selected evidence

| Evidence ID | Source selector | Obligations | Why selected |
|---|---|---|---|
| E-01 | `../spec/SPEC.md#system-boundary` and `#records-and-non-collapse-boundaries` | O-01, O-02 | Owns the existing `IntentRecord -> ProblemFrame` boundary and non-authorizing semantics. |
| E-02 | `../spec/INTENT-RECORD.md#selected-local-model` and `#candidate-structural-invariants` | O-02 | Supplies the selected-local intent projection and unresolved-field behavior. |
| E-03 | `../design/ARCHITECTURE.md#view-3--low-level-components` | O-01, O-02 | Places Intent Projector before gates, actors, and the semantic evaluator. |
| E-04 | `../../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/README.md` | O-01, O-03 | Explicitly limits the implemented witness to semantic reduction. |
| E-05 | `.agents/skills/dispatch-spec/SKILL.md#purpose` | O-03 | Dispatch Spec validates a proposed composition; it does not select capabilities. |
| E-06 | `.agents/skills/continuation-router/SKILL.md` purpose and applicability | O-03 | Continuation Router begins from a terminal capability receipt, not raw intent. |
| E-07 | `.arcanum/inventory/entries/augmentor-routing-session-fabric-research-result-synthesis.md#classification-and-route-decisions` | O-04 | Non-authority Inventory precedent for ambiguity-first conversational routing. |
| E-08 | `.arcanum/inventory/entries/augmentor-unified-agent-architecture-research-result-synthesis.md#system-context-and-retained-owners` | O-03, O-04 | Preserves Augmentor as a projection rather than a second router or scheduler. |
| E-09 | `.arcanum/inventory/entries/arcanum-resonantos-addon-research-result-synthesis.md#owner-preserving-contract` | O-04, O-05 | Preserves Bootstrap, ResonantOS host, Augmentor, and execution-owner boundaries. |

Inventory validation passed with `lookup_readiness=ready`. Inventory entries
remain non-authority read models; the linked live engine contracts are the
source authority for this package.

## Excluded candidates

| Source | Reason |
|---|---|
| `projects/cyberalchemy-orchestrator/**` | Separate control-plane project; not the implementation owner of this resolver. |
| Agent Reasoning Engine refresh staging copies | Historical/staged duplicates; current target files are sufficient. |
| ResonantOS UI source | The runtime contract is being authored here; consumer UI mutation is a later owner route. |

## Coverage result

- Files selected: 9 logical sources
- Obligation coverage: 100%
- Uncovered blocker obligations: 0
- Interview result: no question asked; the user supplied target, behavior, and
  likely owner context, and the safe non-authorizing default closes the
  remaining interpretation.

Open questions are owned in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
