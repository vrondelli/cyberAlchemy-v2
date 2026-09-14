# M5 Context Pack

Status: session evidence  
Task: `M5 Implement strategies, dispatch, templates, agents, and ARE adapter`  
Mode: standard, strict  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Keep Strategy declarative and outside runtime state | `strategy.rs` | covered |
| Compile authored and saved-template inputs through one RWO path | strategy/template integration test | covered |
| Distinguish pre-run agent requirements from runtime assignments | public Rust types and validation | covered |
| Bind proposal and strategy identity into admission | dispatch code and Run Bundle test | covered |
| Make the complete Run Bundle content-addressed | runtime model and tamper test | covered |
| Check agent identity and capability before execution | agent boundary test | covered |
| Route scripted and ARE-backed results through one checked controller | agent boundary test | covered |
| Keep ARE behind an adapter with no scheduler or authority role | `are_adapter.rs` | covered |
| Close four new machine contracts | contract schemas and contract test | covered |
| Record candidate-definition pressure without promotion | M4/M5 validation | covered |

## Controlling sources

- M2 merged architecture and single-engine decision.
- M3 RWO public API and recursive Work compiler.
- M4 durable runtime and worker boundary.
- Candidate ORCH-D3, D14-D21, D37-D40.

## Decisions

The implementation uses `AgentRequirement` for strategy and proposal needs;
only the runtime creates an `Assignment` for an exact command and attempt.
Templates substitute exact typed placeholders, validate bounded constraints and
adapter compatibility, and then pass through normal Strategy validation.

## Write scope

`orchestrator/capabilities/orchestration/`, four capability contracts, the Run
Bundle contract/model extension, M4 validation correction, M5 evidence, and the
package frontier.

## Open Questions

Persistent template storage, API transport, live ARE transport, and the Control
Center remain M6. Template publication ownership remains unresolved in the
candidate definitions.
