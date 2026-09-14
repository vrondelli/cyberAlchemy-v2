# M7 Context Pack

Status: session evidence  
Task: `M7 Migrate trusted-dataset consumer`  
Authority effect: none

## Obligations

| Obligation | Evidence | Status |
| --- | --- | --- |
| Replace the cross-repository RWO build dependency | `trusted-dataset-materialization/rwo-adapter/Cargo.toml` | covered |
| Use the public pure RWO API | adapter source and `examples/trusted-dataset/BINDING.json` | covered |
| Preserve publication and quarantine behavior | 12-check consumer conformance report | covered |
| Preserve historical identities | `examples/trusted-dataset/LEGACY-PROVENANCE.json` | covered |
| Keep definitions candidate | definition feedback in `TASK-SESSION.md` | covered |

## Selected context

- `development/orchestrator-product-migration/PLAN.md`, M7 and retirement gates.
- `trusted-dataset-materialization/`, current consumer source and conformance journey.
- `orchestrator/rwo/`, public structural API and engine.
- `orchestrator/authority/definitions/DEFINITIONS.md`, especially ORCH-D26.

## Open Questions

See `../../authority/definitions/DEFINITIONS.md#open-questions`.
