# Context Pack — SWU-APE-ONT-001

## Selected Unit

- Task: `TASK-APE-L0-ENUM-ONTOLOGY`.
- SWU: `SWU-APE-ONT-001`.
- Primary behavior: add one reciprocal canonical-bound Enum implementation realization identity.
- Dependencies: none.
- Execution limit: one SWU.

## Exact Execution Contract

- Material writes:
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json`
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json`
- Execution output:
  - `projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-001.json`
- Lifecycle owner: `projects/domainspec-v2`.
- Authority class: private.
- Publication class: internal.
- Validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`.

## Hard Constraints

- Add exactly one `architecture.EnumImplementation` extending `architecture.DomainConceptImplementation`.
- Bind it reciprocally to active `DS-D1.3` with candidate mapping and authority effect none.
- Exclude `DS-D1.10`, UI candidates, profiles, other meta-types, and later SWUs.
- Preserve the two exact pre-mutation hashes from the material package.
- Apply only the validated staged post-images after plan-once mutation admission passes.
- Treat the expected negative controls as acceptance-critical.
- Do not promote, publish, release, deploy, or claim full Work Pack readiness.

## Admission Evidence

- Refresh report: `refreshes/20260804T210925Z-swu-ape-ont-001-apply-approved/refresh-report.json`.
- Plan semantic manifest: `refreshes/20260804T210925Z-swu-ape-ont-001-apply-approved/plan-once/plan-semantic-manifest.json`.
- Selection receipt: `refreshes/20260804T210925Z-swu-ape-ont-001-apply-approved/plan-once/selection-receipt.json`.
- Material package and producer receipt: `refreshes/20260804T210925Z-swu-ape-ont-001-apply-approved/material/`.
- Refresh handoff: ready with `mutationReady=true`.

## Coverage

Strict coverage passes for task identity, dependencies, canonical Enum binding, exact material writes, execution output, baselines, plan epoch, selection, material package, validation, closeout preflight, owner boundary, and claim ceiling. No fallback exploration is permitted.
