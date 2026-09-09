# Events

| Event | Trigger | Required receipt | Forbidden inference |
|---|---|---|---|
| `SourceManifestPinned` | exact allowlist and revisions selected | manifest hash | sources are true/promoted |
| `ExtractionCompleted` | adapters finish | record counts and unresolved refs | schema/runtime correctness |
| `RelationRejected` | endpoint/signature rule fails | attempted relation, reason, source rule | semantic relation exists |
| `SemanticSnapshotBuilt` | semantic validation passes | canonical hash and bytes | learner content approved |
| `LearningViewsBuilt` | authored views compile | view hashes and parity report | semantics changed |
| `LayoutBuilt` | versioned ELK policy runs | coordinates and policy version | accessibility/comprehension passes |
| `GateEvaluated` | independent validator runs | gate-specific evidence and verdict | other gates close |
| `PrivatePilotCompleted` | named pilot protocol ends | comprehension/evidence report | publication approval |

Source-owner decisions, promotions, and publication verdicts remain external events referenced by evidence; this package cannot emit them as its own authority.
