# ORODI System View

This is the architecture-system branch, not the generated DomainSpec system ontology.

| Node | Status | Responsibility |
|---|---|---|
| `offline-evidence-contracts` | implemented | Candidate-local evidence and evaluation contracts |
| `offline-replay` | evidence-bound | Deterministic historical campaign replay |
| `runtime-snapshot-contract` | implemented | Denied-by-default runtime snapshot shape |
| `runtime-contract-decoder` | implemented | Runtime snapshot decoding and validation |
| `runtime-projector` | planned | Project live observations into the denied snapshot contract |
| `canary-lab-contracts` | planned | Typed canary, telemetry, workload, rollback, and teardown contracts |
| `canary-gateway` | planned | Controlled stable/candidate traffic routing |
| `telemetry-pipeline` | planned | Request, outcome, and error capture with conservation checks |
| `workload-evaluator` | planned | Execute bounded load/fault workloads and evaluate controls |
| `rollback-controller` | planned | Restore stable state under an explicit effect gate |
| `evidence-packager` | planned | Package exact observations and outcomes |
| `compose-lab` | planned | Local two-environment infrastructure |
| `validation-suite` | planned | Aggregate contract, integration, teardown, and negative tests |
| `local-commissioning-runtime` | deferred | Separately authorized live execution surface |

The generated system ontology is at `domainspec/generated/system-ontology.json`: 32 typed nodes and 31 typed edges, with release admission explicitly not granted.

