# SWU-ARE-001 Context Pack

- Mode: lean, strict local execution context.
- Work Pack: `WP-ARE-ENUM-TS-001`.
- Task/SWU: `TASK-ARE-L0-CONTRACTS` / `SWU-ARE-001`.
- Objective: freeze one expected-red `ArchitectureRealizationSpec/v1` denominator before projector implementation.
- Authority ceiling: candidate-local execution evidence, `authority_effect: none`.
- Product claim: no projector, compiler, generator, conformance, promotion, publication, or release claim.

## Obligations

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| ARE001-O1 | Freeze a closed JSON Schema for `ArchitectureRealizationSpec/v1`. | Design `ArchitectureRealizationSpec/v1`; live ontology/profile selectors. | covered |
| ARE001-O2 | Freeze one digest-bound expected payload from the exact live ontology and TypeScript profile bytes. | Live ontology SHA-256 `4b7b6e989995fa38a155665aca8eeabecafb3e0997b6766600b31b1a2d957a39`; live profile SHA-256 `4f57f8de1e9da7410d0dec89679014a53b87ceb84a20d545b2d3cfcebea0b558`. | covered |
| ARE001-O3 | Freeze one single-cause missing-property mutant and exact `ARCH_REALIZATION_PROPERTY_MISSING` expectation. | Task and SWU contracts. | covered |
| ARE001-O4 | Prove `derive-enum-realization-spec.ts` is absent. | Live absent-path check before admission. | covered |
| ARE001-O5 | Keep ontology, profile, product code, authority, and publication unchanged. | Exact write scope and claim ceiling. | covered |
| ARE001-O6 | Produce a deterministic terminal red receipt only after the verifier passes. | Validation command and execution-output partition. | covered |

## Selected evidence

- `stages/09-invoke-plan/WORK-PACK.md` — control fields, first-unit narrowness, claim ceiling, execution policy.
- `stages/09-invoke-plan/SWU-MANIFEST.json#/swus/0` — exact unit, write scope, done criteria, validation, owner.
- `stages/09-invoke-plan/EXECUTION-ENTRY.json` — captured one-unit frontier and exact Task Session/closeout routes.
- `stages/09-invoke-plan/work-pack/tasks/TASK-ARE-L0-CONTRACTS.md#swu-are-001` — acceptance boundary.
- `stages/09-invoke-plan/work-pack/shared/CLOSEOUT-CONTRACT.md#swu-are-001` — exact closeout inventory and unique successor.
- `stages/06-invoke-design/DESIGN.md#architecturerealizationspecv1` — payload contract and forbidden inference boundary.
- `development/implementation-conformance/ontology-experiment/ontology.json` — exact Enum type, required property metadata, relation metadata, and operator contracts.
- `development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json` — portable Enum constraints.
- `development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json` — selected representation overlay and active provider binding.
- `development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json` — selected TypeScript representation form and claim ceiling.

## Execution contract

- Material writes: schema, expected fixture, missing-property fixture, verifier.
- Execution output: `receipts/SWU-ARE-001.red.json`.
- Allowed writes: the exact union of those five paths.
- Acceptance-critical validation: `node projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs` from repository root, exit `0`.
- Lifecycle owner: `projects/domainspec-v2`.
- Authority class: `private`.
- Publication class: `internal`.
- Target baseline: all five paths absent at context capture.
- Projector witness: absent at `projects/domainspec-v2/impl/architecture-conformance/realization/spec/derive-enum-realization-spec.ts`.

## Decisions and residue

The independent fixture review resolved the apparent pre-activation/post-activation profile tension: the current active profile binds the immutable decision and provider receipts, and both the profile resolver and ontology validator pass.

Admission nevertheless blocks before selection. The Work Pack's closeout route uses `effect_class: repository-local-reversible-closeout-only`, while both the installed Work-Pack Readiness v2 schema and Implementation Readiness execution-policy schema admit only `repository-local-reversible` for a local reversible route. Normalizing this inside run evidence would change the frozen allowed-routes digest and bypass the plan owner. The exact repair is an Invoke Refresh over `EXECUTION-ENTRY.json` and the `WORK-PACK.md` digest projection; Task Session and all five product targets remain unentered.
