# ORODI Business-System Bridge View

The bridge contains 23 meaning-to-architecture relations and 11 architecture dependency relations. Every bridge relation carries both business-source and system-source evidence; every relation has `authority_effect: none`.

| Capability | Business concern | Architecture realization | Current ceiling |
|---|---|---|---|
| Offline evidence replay | exact, non-inflating evidence | offline contracts and replay | candidate-local historical evidence |
| Denied runtime projection | observation without admission | snapshot contract, decoder, projector | partial; projector absent |
| Canary evaluation | fail-closed canary decision | gateway, telemetry, workload evaluation | planned |
| Rollback verification | observable restoration | rollback controller and evidence packager | planned |
| Run-ready lab | safe infrastructure lifecycle | Compose lab and validation suite | planned |
| Local commissioning | effect authority separation | commissioning runtime | deferred, separately gated |

`domainspec/capability-projection.json` supplies the exact bridge from these six capabilities to the 32 DomainSpec nodes, 31 edges, architecture-system nodes, and implementation-binding IDs. Its union covers the complete compiled graph, but coverage is traceability—not admission or conformance.

