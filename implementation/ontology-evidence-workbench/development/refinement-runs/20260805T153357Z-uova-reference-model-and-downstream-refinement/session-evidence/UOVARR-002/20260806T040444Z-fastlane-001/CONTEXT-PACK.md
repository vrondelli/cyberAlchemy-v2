# UOVARR-002 Context Pack

- Mode: standard, strict
- Status: task-ready under the Candidate-Local Prototype Fast Lane
- Task: `TASK-UOVARR-002-MIGRATION.md`
- Product write scope: `sceneMigration.ts`, `relation-migration.test.mjs`
- Loader write: excluded because no exact loader/admission target is bound
- Lifecycle admission and closeout: explicitly deferred by user instruction; tracked by `HN-6F980FB7517C`

## Obligation matrix

| ID | Obligation | Evidence | Resolution |
|---|---|---|---|
| O1 | Accept only legacy `v1` and `v1.1` identities | task requirements; legacy `SCENE-MODEL.schema.json` | implement a closed schema-version set |
| O2 | Bind the exact admitted SourceGraph | migration laws; `sourceGraph.ts` digest and receipt contracts | recompute graph digest from owned content and validate receipt/index identity |
| O3 | Bind the exact admitted ViewPack | migration laws; `viewPack.ts` digest and receipt contracts | recompute ViewPack digest and validate graph/view identity |
| O4 | Compare relation identity and semantic fields | migration laws; legacy relation schema; SourceGraph relation keys | validate exact partition union and compare all legacy-carried relation fields |
| O5 | Reject missing, extra, duplicate, drifted bindings | task requirements; scene partition law | derive expected relevant relation IDs from visible nodes and SourceGraph endpoints |
| O6 | Preserve compatibility cues | architecture encoding transition | compare cue fields and rebuild from SourceGraph without registry derivation |
| O7 | Emit a separate v1.2 artifact and receipt | migration laws; `relationReference.ts` finalizer | create a deterministic migrated scene ID, finalize v1.2, emit authority-none receipt |
| O8 | Never mutate or strengthen legacy evidence | work pack and task closeout | clone scene-owned data; retain original schema/digest references in receipt |
| O9 | Validate positive and negative contracts | task validation surface | focused TypeScript-importing tests, full OEW regression, exact-target whitespace check |

## Selected evidence

- `stages/09-invoke-plan/tasks/TASK-UOVARR-002-MIGRATION.md` — outcome, scope, tests, negatives.
- `stages/12-invoke-refresh-admission/WORK-PACK.md` — canonical successor and semantic boundaries.
- `stages/06-invoke-design/DIGEST-AND-MIGRATION-LAWS.md` — normative source-bound migration law.
- `stages/06-invoke-design/ARCHITECTURE.md` § Version and compatibility design — successor and cue preservation.
- prior UOVA `SCENE-MODEL.schema.json` — legacy v1.1 scene/relation fields.
- `sourceGraph.ts` — compiled graph schema, exact relation keys, digest and receipt.
- `viewPack.ts` — compiled pack schema, graph/view digests and receipt.
- `relationReference.ts` — v1.2 finalizer, scene digest, runtime index.
- `scene-partition.test.mjs` — admitted fixture construction and partition expectations.
- UOVARR-001 prototype report — current validated predecessor product bytes, used only as candidate-local dependency evidence.

## Hard constraints

- SourceGraph remains the sole relation-semantic owner.
- No tuple fallback, project-specific branch, legacy relabel, runtime import from DomainSpec v2, network, dependency mutation, Git publication, deployment, or authority effect.
- Every declared validation is acceptance-critical.

## Context Builder summary

- Files selected: 10
- Obligation coverage: 9/9 (100%)
- Strict coverage: pass
- Handoff pack: none; local execution
- Unresolved implementation decisions: none
