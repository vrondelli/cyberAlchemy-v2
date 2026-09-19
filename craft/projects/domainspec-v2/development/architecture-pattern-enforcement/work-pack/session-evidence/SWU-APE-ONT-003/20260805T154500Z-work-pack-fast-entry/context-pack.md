# Runtime Handoff Pack

## Identity

- Task/SWU: `SWU-APE-ONT-003`
- Source task/work-pack: `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L0-ENUM-ONTOLOGY.md`
- Session/run id: `invoke-refresh-ape-ont-003-20260805T152000Z`
- Session evidence path: `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/session-evidence/SWU-APE-ONT-003/20260805T154500Z-work-pack-fast-entry`
- Runtime handoff: `runtime`
- Repository revision: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`
- Evidence date: `2026-08-05`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `APE003-O1` predecessor and owner decision are current | covered | `SWU-APE-ONT-002.json#/result`; `DECISION-RECEIPT.json#/selected_option_id` | — |
| `APE003-O2` exact scope and baselines are frozen | covered | `MATERIAL-PACKAGE.json#/changes`; `#/plan_binding/target_baselines` | — |
| `APE003-O3` portable obligations inherit once | covered | staged `base-domain.profile.json#/representation_contracts`; exact resolver cases | — |
| `APE003-O4` real language forms remain owner-unselected | covered | staged TypeScript/Python/Rust `#/representation_overlays` | — |
| `APE003-O5` applicability and conflicts are deterministic and typed | covered | staged `cases.json#/cases`; `evaluations.expected.json#/evaluations` | — |
| `APE003-O6` owner validation and live regression commands are exact | covered | `MATERIAL-PACKAGE.json#/plan_binding/validation_contracts` | — |
| `APE003-O7` claim ceiling and deferred residue remain explicit | resolved | `REFRESH-REPORT.md#Residue-and-Claim-Boundary` | Fixture-local mechanism proof only; concrete forms and typed observed representation remain deferred. |

Strict coverage: `pass`

## Selected Sources

- `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L0-ENUM-ONTOLOGY.md`
  - Selectors: `SWU-APE-ONT-003 — Enum architecture profiles`
  - Obligations: `APE003-O1` through `APE003-O7`
  - Evidence excerpt: four profiles and Enum profile fixtures only; owner-unselected states, conflicts, and exact fixture checking are mandatory.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json`
  - Selectors: `/swus/2`
  - Obligations: `APE003-O1`, `APE003-O2`, `APE003-O6`
  - Evidence excerpt: dependency, exact five logical scope entries resolving to seven files, admitted delta classes, validation, receipt, and successor.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-002.json`
  - Selectors: `/result`, `/continuation/next_candidate`, `/lifecycle_owner_validation/status`
  - Obligations: `APE003-O1`
  - Evidence excerpt: predecessor pass and SWU-003 successor routing.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/session-evidence/SWU-APE-ONT-003/20260805T145200Z-profile-owner-blocker/DECISION-RECEIPT.json`
  - Selectors: `/result`, `/selected_option_id`, `/decision_effect`
  - Obligations: `APE003-O1`, `APE003-O4`, `APE003-O7`
  - Evidence excerpt: mechanism-first in W0; concrete forms remain with language owners; canonical meaning unchanged.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T152000Z-swu-ape-ont-003-apply-approved/material/MATERIAL-PACKAGE.json`
  - Selectors: `/changes`, `/plan_binding`, `/approval`
  - Obligations: `APE003-O2` through `APE003-O6`
  - Evidence excerpt: seven exact staged post-images, live baselines, validation contracts, and selected plan epoch.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T152000Z-swu-ape-ont-003-apply-approved/material/MATERIAL-RECEIPT.json`
  - Selectors: `/patchVerdict`, `/mutationHandoff`, `/ownerBoundaryResult`, `/publicationBoundaryResult`
  - Obligations: `APE003-O2`, `APE003-O6`
  - Evidence excerpt: package, dependency, owner, and publication checks pass; handoff ready.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T152000Z-swu-ape-ont-003-apply-approved/plan-once-canonical/selection-receipt.bound.json`
  - Selectors: `/selectionVerdict`, `/planEpochId`, `/unitContractDigest`
  - Obligations: `APE003-O1`, `APE003-O2`
  - Evidence excerpt: exact SWU-003 selected from the current semantic epoch.
- `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260805T152000Z-swu-ape-ont-003-apply-approved/REFRESH-REPORT.md`
  - Selectors: `Staged Delta`, `Validation`, `Residue and Claim Boundary`
  - Obligations: `APE003-O3` through `APE003-O7`
  - Evidence excerpt: deterministic staged proof and the explicit fixture-only evidence ceiling.

## Architecture Guidance

Representation is profile-local policy, not canonical Enum meaning. Portable
Enum obligations remain active for unselected and unsupported outcomes.
Conflicting parents or decisions block. Real language overlays carry no
admitted, rejected, or unsupported forms in this SWU.

## Related Feature Context

SWU-002 already established the portable Enum value and non-collapse
constraints. SWU-003 composes those constraints through profiles; it does not
alter their meaning or implement language adapters.

## Constraints And Non-Goals

- Preserve `authority_effect: none`.
- Apply only byte-exact staged post-images after mutation admission.
- Do not modify `ontology.json` or `validate-ontology.mjs` in this SWU.
- Do not select concrete TypeScript, Python, or Rust Enum forms.
- Do not claim ontology promotion, publication, release, deployment, or
  production readiness.

## Write Scope

- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/cases.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/evaluations.expected.json`
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs`
- Lifecycle output: `projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-003.json`

## Validation Surface

- `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`
- `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/enum/profiles/check-profile-resolution.mjs`
- Repeat the profile resolver and require byte-identical output.
- Require exact staged/live postimage equality and scoped `git diff --check`.

## Gaps And Blockers

- No execution blocker.
- Deferred: typed observed Enum representation property; owner is the later
  ontology/language lane.
- Deferred: concrete language forms and adapter consumption; owners are the
  later TypeScript, Python, and Rust lanes.

## Authority Precedence

1. Current SWU-003 task and manifest contract.
2. `PROFILE-MECHANISM-FIRST` owner decision receipt.
3. SWU-002 immutable completion receipt.
4. Selected plan epoch and material package/receipt.
5. Fixture-local implementation evidence.

## Fallback Exploration Rule

Broad repository exploration is allowed only for obligations listed in
`Gaps And Blockers` or for a gap explicitly named before exploring. Extra
sources must be reported in the runtime result.

## Provenance

- Source refs: the eight selector-level sources above.
- Content hashes or git SHA: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`; exact source and postimage hashes are bound by `MATERIAL-PACKAGE.json`.
- Builder mode: `lean`

## Output Paths

- Markdown: `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/session-evidence/SWU-APE-ONT-003/20260805T154500Z-work-pack-fast-entry/context-pack.md`
- JSON/index: `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/session-evidence/SWU-APE-ONT-003/20260805T154500Z-work-pack-fast-entry/context-pack.json`
