# L0 execution context pack

Status: bounded implementation context; `authority_effect: none`.

## Objective

Prove that the installed reconciled TypeScript application planner and the
provider-neutral integration planner can be joined into one deterministic,
collision-free, natively compilable application artifact plan without changing
either predecessor's standalone behavior.

## Obligations

| Obligation | Evidence selectors | Required result |
| --- | --- | --- |
| Freeze predecessors | `EXECUTION-DAG.json#L0-00`, integration product candidate, source/layout/generator hashes | Exact byte and semantic predecessor identities are recorded before implementation. |
| Close the join | `CompiledProjectGraph.nodes`, integration logical references | Every application reference resolves exactly and case-sensitively to the required node/field/failure kind. |
| Preserve integration semantics | `planIntegrationProjectV2`, `IntegrationSemanticManifestV1` | Embedded generation reuses compiled source/manifest semantics and leaves standalone output byte-stable. |
| Compose one tree | `selectReconciledProjectArtifacts`, `PROJECT_LAYOUT` | Every final path has one owner; exact and case-folded collisions fail. |
| Compose one TypeScript root | application artifacts plus embedded integration artifacts | The composer owns one `tsconfig.json`, validates relative import closure, and emits deterministic bytes. |
| Bound claims | both child plans and combined plan | `runtime_guarantees_observed` remains false and `authority_effect` remains none. |
| Prove the minimum | focused hostile, repeatability, and native compile checks | Repeated planning is byte-identical, hostile joins fail causally, TypeScript compiles, and temporary output is disposed. |

## Included sources

1. `development/whole-application-compilation/v1/EXECUTION-DAG.json` — L0 node order and outputs.
2. `development/whole-application-compilation/v1/IMPLEMENTATION-LAYERING.md` — settled product boundaries and deferrals.
3. `development/integration-reconciliation/v1/candidate/INTEGRATION-PRODUCT-CANDIDATE.v2.json` — exact integration predecessor.
4. `impl/cli/src/input/project-model.ts` — compiled graph identity and node/body surface.
5. `impl/cli/src/generation/selected-reconciled-project.ts` — registered child-plan dispatch.
6. `impl/cli/src/generation/reconciled-project-layout.ts` — final project-layout projection.
7. `impl/cli/src/generation/contracts.ts` — artifact contract.
8. `impl/cli/src/generation/output-layout.ts` — final path vocabulary.
9. `impl/cli/src/system-integration/generation-v2.ts` — validated standalone integration generation and semantic manifest.
10. `impl/cli/src/system-integration/*-v2-types.ts` — reference-bearing integration source model.
11. `impl/cli/src/system-integration/integration-project-layout-v1.ts` — responsibility paths.
12. `impl/system-integration/contracts/integration-generation-source-v2.schema.json` — closed aggregate source schema.
13. `impl/cli/examples/reconciled-commerce/source/**` and `selections/typescript.json` — installed application fixture.
14. `impl/cli/test/system-integration/generation-v2.test.ts` and reconciled layout tests — focused test conventions.

## Write scope

- New closed application-integration binding schema and typed validator.
- New joined commerce integration fixture and expected binding manifest.
- New embedded contribution and whole-application TypeScript composer modules.
- Additive package exports only.
- New focused L0 tests and exact evidence receipts under this directory.

No CLI parsing, Python/Rust generation, provider execution, publication,
release, deployment, runtime calls, database contact, broker contact, HTTP
contact, ORODI evaluation, or authority mutation is in L0.

## Validation surface

- Existing integration candidate validator and DAG validator.
- Existing standalone integration generation tests, including byte-stability.
- Focused binding/composition hostile tests.
- Same-process and multiprocess plan digest repeatability.
- Materialization in a disposable directory followed by `tsc --noEmit`.
- Explicit check that the disposable directory no longer exists.

## Claim ceiling

Passing L0 proves only deterministic TypeScript formation and native static
compilation for one joined fixture. It does not prove runtime behavior,
provider connectivity, migration execution, message delivery, API calls,
observation evaluation, admission, publication, or release readiness.
