# Interfaces

| Interface | Direction | Contract | Owner boundary |
| --- | --- | --- | --- |
| Domain failure mapping | bidirectional | domain failure ↔ integration outcome ↔ runtime mapping with no aliasing | domain, integration, profile owners |
| Telemetry ingest | inbound | allowlisted trace/metric/log observations with complete queue accounting | runtime and privacy owners |
| Evaluation receipt | outbound | immutable typed verdict with exact provenance and expiry | evaluator and receipt owners |
| Profile binding | inbound | admitted profile plus exact tool/runtime configuration | profile lifecycle owner |
| Infrastructure plan | inbound | immutable plan facts and policy bundle | infrastructure owner |
| Deployment authorization | inbound | separate protected approval; never inferred from evaluation | environment/deployment owner |
| CAV2 crosswalk | outbound directional | provenance-bound semantic alignment only | ontology/crosswalk owner |
| Arcanum observability | outbound separate | workflow invocation telemetry | Arcanum capability owner |

No interface transports private DomainSpec prose into public Arcanum artifacts.
