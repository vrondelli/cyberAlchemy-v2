# Runtime Context Pack — SWU-OEWSN-005

## Identity

- Task: `TASK-OEWSN-02-RELATION-UI`
- SWU: `SWU-OEWSN-005`
- Attempt: `20260802T030021Z`
- Runtime handoff: strict
- Repository revision: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`
- Authority effect: `none`

## Objective

Render one selected relation from the versioned relation-presentation record so
its exact predicate, source-record direction, endpoints, provenance and
authority ceiling remain recoverable without color. Stable color is keyed by
the exact predicate and stable line pattern by the presentation relation.

## Selected evidence

- `planning/WORK-PACK.md` and `planning/SWU-MANIFEST.json`
  - Selectors: selected SWU, predecessor, write/output algebra and closeout row
  - Obligations: O-04, O-05, O-06
- `planning/work-pack/tasks/TASK-OEWSN-02-RELATION-UI.md`
  - Selector: `SWU-OEWSN-005`
  - Obligations: O-01, O-02, O-03, O-04
- `planning/decisions/BODY-WAR-PROFILE-APPROVED.json`
  - Selectors: relation-encoding profile and evidence ceilings
  - Obligations: O-02, O-03
- `implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts`
  - Selector: lossless relation-presentation record
  - Obligations: O-01, O-02, O-06
- `implementation/ontology-evidence-workbench/upstream/OEWSN-BUILD.binding.json`
  and `implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
  - Selectors: binding owner, patch inventory, output contract and hard-coded semantic build identity
  - Obligations: O-04, O-05
- `design/VALIDATION-CONTRACTS.md`
  - Selector: CR-01 and selected-edge color-mode witness
  - Obligations: O-03, O-06

## Obligations

| ID | Obligation | Coverage |
| --- | --- | --- |
| O-01 | Renderer consumes the versioned record only and exposes exact endpoint, predicate, source direction, provenance and authority fields. | covered |
| O-02 | Exact predicate color and presentation-relation pattern are stable, fail closed and redundant to text/direction. | covered |
| O-03 | Default, grayscale and forced-color witnesses retain exact semantics and named graphics meet the declared 3:1 gate. | covered |
| O-04 | Six material targets plus one terminal output are exact and disjoint. | covered |
| O-05 | A fresh build must consume cumulative patch `0003` while historical L1, manifests and patches `0001–0002` remain byte-exact. | covered — preflight blocker found |
| O-06 | Component, DOM/accessibility/contrast/screenshot, scoped whitespace and owner-closeout evidence are mandatory. | covered |

Strict coverage: `6/6`.

## Material write inventory

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/OewApp.tsx`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/EvidenceWorkspace.tsx`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.tsx`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationRendering.test.tsx`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/oew.css`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/patches/0003-oew-semantic-navigation.patch`

## Execution output inventory

- `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-005/20260802T030021Z/receipt.json`

## Architecture guidance

Do not mutate or weaken the historical L1 lock, first-working manifest, base
overlay manifest or patches `0001–0002`. Do not write product files until the
dedicated semantic-navigation build binding admits patch `0003`, names
SWU-OEWSN-005 outputs and the material/output inventory admits its validation
artifacts.

## Validation surface

- Focused relation-rendering component tests.
- Fresh semantic-navigation build with cumulative patch `0003`.
- Selected-edge Chromium matrix: default, grayscale and forced colors.
- DOM/accessibility, exact predicate/direction, contrast and screenshot evidence.
- Scoped `git diff --check`.
- Exact closeout row and source-receipt identity.

## Gaps and blockers

- `BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION`: the live dedicated binding is owned
  by SWU-OEWSN-004, permits only historical patches `0001–0002`, applies only
  the two relation-core additive files and emits SWU-OEWSN-004 output paths.
  SWU-OEWSN-005 owns patch `0003` but its material scope excludes the binding
  and builder, so the mandatory fresh build cannot include its product change.
- `MUTATION-ADMISSION-CONTRACT.json` still selects SWU-OEWSN-004 and validates
  the SWU-OEWSN-004 write/output algebra, so it cannot authorize SWU-OEWSN-005.
- The declared execution-output inventory contains only the terminal receipt,
  while acceptance requires persisted build and browser artifacts. Their exact
  owner paths are not admitted.
- `OEWSN-RELATION-DUPLICATE-TUPLES` remains noncritical relation-data residue:
  two duplicate graph tuples must continue to fail closed as ambiguous.

## Stop condition

Stop before material-package creation and product mutation. Invoke Refresh owns
the admission-contract refresh plus exact cumulative semantic-build and
validation-output contract repair.
