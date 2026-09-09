# B1 prototype mapping

| Stage | Local prototype | Observable evidence |
|---|---|---|
| Definition | Observe, select, inspect, replay, navigate | [Journeys](browser-journeys.md) |
| Ontology scaffold | Source-linked session, cursor, view and identity terms | [Source map](source-map.json) |
| Product | Browser colony using exact recorded values and accepted art direction | Real rendered scene and interaction capture |
| Business | Participant can understand a shared experiment without an editor or streamed desktop | Local browser journey only; adoption and revenue remain untested |
| DomainSpec | Source facts versus presentation intents with explicit bounds | [Session contract](session-contract.md); no admitted profile implied |
| Compiled system | Validated session → cursor → Babylon scene + React inspection | Typed loader/controller/view boundaries and Vite output |
| Implementation | New isolated TypeScript package and traced asset derivatives | Locked build, loader/controller tests and browser checks |
| Product test | Exact B1 scene candidate | Hash manifest, browser captures, metrics, failures and limitations |
| Decision | B1 visual validation only | Future separate user receipt on candidate digest |

Product construction: D0/D1/D2/C0 precede E1/A1/L1/S1/T1. Operational support O1 owns local Node, disk, and GPU probes; O2 owns a loopback preview for T1. The Vast VM and future Kubernetes/KEP hosting are deferred residue with no dependency on this scene. No ontology runtime is invoked as an admission gate.

Open questions: [browser plan](../PLAN.md#open-questions).
