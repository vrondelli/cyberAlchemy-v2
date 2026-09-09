# Ontology Runtime Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `50623af9d9c9bb46aafed14194d69c5776cba1f4de2f98ec969a8e53abf3def7`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `ontology-runtime.OntologyCandidateEpoch` | Entity | Represent one separately reviewable successor epoch containing exact captured ontology bytes, current selected-source identities, native validation evidence, and visible blockers without becoming active by construction. |
| `ontology-runtime.OntologyDriftObservation` | Entity | Record a collect-all comparison between one admitted registration identity and current bounded ontology bytes without repairing either side or granting candidate construction authority. |
| `ontology-runtime.OntologyDurableEpochStore` | Entity | Persist immutable content-addressed ontology epoch objects and manifests beneath one declared repository-local root using crash-safe atomic publication and no ontology-source writes. |
| `ontology-runtime.OntologyEpoch` | Entity | Identify one immutable closed ontology state from a canonical manifest and the exact captured bytes named by that manifest. |
| `ontology-runtime.OntologyEpochInvariant` | Rule | Return true only when admitted history is unchanged, candidate identity matches canonical manifest and captured bytes, publication is complete and atomic, repeated staging is idempotent, and no candidate is represented as active or accepted. |
| `ontology-runtime.OntologyReconciliationPreflight` | Entity | Resolve one stale registered ontology into a deterministic drift observation and decide whether exact bounded bytes are eligible for candidate construction, while always returning effect_authorized false. |
| `ontology-runtime.OntologyRegistration` | Entity | Name one ontology package and the complete bounded set of files, source selections, record collections, native validator arguments, owner route, and authority ceiling the runtime may use. |
| `ontology-runtime.OntologyRoutePreflight` | Entity | Bind one ontology-related agent request to its already selected CyberAlchemy-v2 route and one current registered ontology snapshot without granting the route, mutation, publication, or acceptance authority. |
| `ontology-runtime.OntologyRuntimeInvariant` | Rule | Return true only when one explicitly registered ontology is path-contained, deterministically inspectable, bounded in retrieval, faithful to native validation, source-preserving, authority-neutral, and able to represent stale currentness as an immutable durable successor candidate rather than an in-place refresh. |
| `ontology-runtime.OntologySnapshot` | Entity | Represent one immutable deterministic read model of exact registered ontology material, current selector-bound sources, and bounded logical records. |
| `ontology-runtime.OntologyValidationRun` | Entity | Keep runtime execution success separate from the exact status and structured payload returned by the registered ontology's native validator. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |

This file is generated; edit machine sources and rebuild.
