# Task Session Context Pack — SWU-UOVA-001

Status: strict coverage blocked before product mutation.  
Resolution: explicit `SWU-UOVA-001` from visible session context.  
Purpose: determine whether the selected unit can cross Task Session mutation admission.

## Selected unit

`SWU-UOVA-001` is the unique selected and dependency-ready unit. It normalizes a versioned source graph into exact-ID node and relation maps, verifies the canonical graph digest, rejects duplicate IDs and dangling endpoints, preserves evidence and authority ceilings, keeps parallel relation identities even when endpoint/predicate tuples match, and emits deterministically ID-sorted records plus a source receipt.

## Controlling evidence

| Artifact | SHA-256 | Role |
|---|---|---|
| `stages/09-invoke-plan/WORK-PACK.md` | `05a7b6e8100685708cdceb5e911df970306a154a695d1cd173e48add35f6bb8f` | work-pack boundary and shared closeout contract |
| `stages/09-invoke-plan/SWU-MANIFEST.md` | `7f9586d4e223fe278129ce75224c8a0799c675bba77c78d2485d02bfbd9a6995` | selection and dependency row |
| `stages/09-invoke-plan/tasks/TASK-UOVA-01-SCENE-CORE.md` | `dae493f6739d732b88efb15e117244935ec985887fec2f1e2c88495ec3ce7b99` | behavior, write family, done criteria |
| `stages/09-invoke-plan/waves/W1-SEMANTIC-TRUST.md` | `95860ce55262ef8017f421cbdbb3800d8916265bdff57a25733eb7576147ce5c` | wave entry and stop rule |
| `stages/06-invoke-design/ARCHITECTURE.md` | `865339e006d6eb2f21d56485d2b41c81aaaeccf2ce8ae96fda529500fb14057d` | `compileSourceGraph` owner contract |
| `stages/06-invoke-design/SCENE-MODEL.schema.json` | `124a84d578c0edb8d368c87eb23d9c48bf2574b4b85ecae37cc0b2c553da8f83` | target scene identity/evidence ceiling |
| `stages/06-invoke-design/ACCEPTANCE-CONTRACT.md` | `80acc48d4183ac2efacaeff1ff9e06740dcf2044b44bd46bd2486387d2b9f864` | positive and negative acceptance invariants |

Existing adjacent code was inspected at `src/oew/types.ts`, `src/oew/loadOewBundle.ts`, and `src/oew/relationPresentation.ts`. The planned `src/oew/scene/` directory is absent, and no focused source-normalization fixture exists.

## Hard boundaries

- Permitted product family: OEW overlay `src/oew/scene/**` and focused owner tests.
- Permitted execution evidence: `session-evidence/SWU-UOVA-001/**`.
- Forbidden: visual components, Body War generated output, ontology source, dependencies, public Arcanum, unrelated projects, external requests, deployment, promotion, Git publication, and compiled-bundle surgery.
- Authority effect remains `none`; source identity and evidence must be lossless.

## Admission gap

The task is semantically ready but not mutation-ready. The current Task Session contract requires all of the following before a reusable selected-unit write, and none is present:

1. typed Plan Semantic Manifest;
2. current selection receipt bound to that manifest and the current baselines;
3. SWU-001 material package and producer receipt;
4. exact product/test target inventory with SHA-256/size or absent-target sentinels;
5. complete structured validation-contract digest and execution-output union;
6. unit-specific closeout inventory, baselines, validation commands, and expected owner receipt contract.

The existing `invoke-refresh/UOVA/20260804T191927Z-ui-profile-api-admission` package is inapplicable: its 31 exact targets are Design/Plan artifacts only.

## Gate result

`BLOCK` at Task Session Step 5A. No implementation or test command may run from this receipt. The narrow owner route is `invoke:refresh:apply-approved`, admission-only for SWU-UOVA-001; after that owner returns a valid package, rerun `task-session SWU-UOVA-001`.

