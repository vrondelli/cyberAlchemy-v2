# Runtime Handoff Pack: SWU-OEWSN-004

## Identity

- Task/SWU: `TASK-OEWSN-01-RELATION-CORE` / `SWU-OEWSN-004`
- Source task/work-pack: `planning/work-pack/tasks/TASK-OEWSN-01-RELATION-CORE.md`
- Session/run id: `20260802T022042Z`
- Runtime handoff: native helper plus parent-owned Task Session admission
- Repository revision: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`
- Evidence date: 2026-08-02

## Obligation coverage

| Obligation | Status | Selected evidence | Resolution |
| --- | --- | --- | --- |
| O-01 exact relation record | covered | task algorithm; Define mapping; architecture type view | source relation record is an explicit input because the sidecar's `authority_effect` is projection-only |
| O-02 approved encoding tables | covered | approved profile and OD-04 candidate/validation | 23 predicates and 2 presentation relations are digest-bound and fail closed |
| O-03 dedicated build ownership | covered | option-2 selection; refreshed manifest/admission contract | five material files and three outputs are exact |
| O-04 historical identity | covered | L1 lock, first-working manifest, base overlay manifest and patch inventory | immutable inputs are checked before and after execution |
| O-05 no visible UI/authority effect | covered | task done criteria and architecture | additive pure module/test only; `projectionAuthorityEffect` is always `none` |
| O-06 validation and closeout | covered | Task Session contract and closeout inventory | semantic build, seven typed tests, output reconciliation and Invoke closeout are mandatory |

Strict coverage: pass.

## Selected sources

- `planning/work-pack/tasks/TASK-OEWSN-01-RELATION-CORE.md`
  - Selectors: objective, algorithm, SWU-004, edge cases
  - Obligations: O-01, O-05, O-06
- `planning/SWU-MANIFEST.json`
  - Selector: `swu_id=SWU-OEWSN-004`
  - Obligations: O-03, O-04, O-06
- `planning/MUTATION-ADMISSION-CONTRACT.json`
  - Selectors: dedicated binding decision, required and forbidden lists
  - Obligations: O-03, O-04
- `define/mappings.md` and `design/ARCHITECTURE.md`
  - Selectors: `SourceEdgeToPresentationRecord`, Concept and Type View
  - Obligations: O-01, O-05
- `planning/decisions/OD-04-SEMANTIC-FAMILIES-CANDIDATE.json`
  - Selectors: predicate/color and presentation/pattern maps
  - Obligations: O-02
- `projects/body-war/ontology/business/relations/relations.json`
  - Selectors: relation schema and authority effects
  - Obligations: O-01
- Body War presentation graph and evidence sidecar
  - Selectors: first edge plus total predicate/presentation inventories
  - Obligations: O-01, O-02
- Existing builder, build test, historical L1 lock, base overlay and first-working manifest
  - Selectors: parser, `verifyOverlay`, typed discovery, patch loop and exact hashes
  - Obligations: O-03, O-04, O-06

## Architecture guidance

`RelationPresentationRecord` is a pure renderer input. The admitted graph edge
supplies projected endpoints/direction; the sidecar supplies source identity,
predicate, presentation relation and evidence refs; the exact source relation
record supplies source direction and source authority. Treating the sidecar's
constant `authority_effect: none` as source authority would be lossy and is
forbidden. All mismatches, unknown mappings, duplicate identities and missing
evidence fail closed.

The new builder mode verifies the historical base exactly, copies only the two
additive relation files after base overlay verification and before existing
patches, rejects collisions, runs seven typed tests, builds the dashboard and
writes the declared semantic build handle/dist without changing legacy `build`.

## Constraints and non-goals

- No renderer, visible UI, ontology, authority spine, package root, network,
  promotion, publication, deployment or production mutation.
- Do not edit the L1 lock, first-working manifest, base overlay manifest or
  patches 0001–0002.
- No human comprehension or preference claim.

## Write scope

Material files:

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/overlay/packages/dashboard/src/oew/relationPresentation.test.ts`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/upstream/OEWSN-BUILD.binding.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`

Execution outputs:

- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-004/20260802T022042Z/semantic-navigation-build-handle.json`
- `cyberAlchemy-v2/implementation/ontology-evidence-workbench/generated/runs/SWU-OEWSN-004/20260802T022042Z/dashboard-dist`
- `cyberAlchemy-v2/development/ontology-evidence-workbench-semantic-navigation/planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T022042Z/receipt.json`

## Validation surface

- `node --test cyberAlchemy-v2/implementation/ontology-evidence-workbench/test/thin-prototype-build.test.mjs`
- `node cyberAlchemy-v2/implementation/ontology-evidence-workbench/scripts/build-thin-prototype.mjs build-semantic-navigation --typed-receipt cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning/work-pack/session-evidence/SWU-OEWTP-001/20260729T190254Z/receipt.json --semantic-binding upstream/OEWSN-BUILD.binding.json --output generated/runs/SWU-OEWSN-004/20260802T022042Z/semantic-navigation-build-handle.json`
- JSON validation for the dedicated binding and generated handle.
- Exact three historical hashes and exact two-file patch inventory.
- Scoped whitespace and complete allowed-write reconciliation.

## Gaps and blockers

- None at context time. Any source-authority loss, binding drift, overlay
  collision, typed-test-count drift, undeclared output or failed build blocks.

## Authority precedence

1. Refreshed Task/SWU and mutation-admission contract.
2. Approved option-2 build-binding and OD-04 profile evidence.
3. Historical build inputs as read-only implementation evidence.

## Fallback exploration rule

Exploration is limited to a named failing obligation and must be reported.
No fallback may widen write scope or weaken a historical binding.

## Provenance

- Work Pack: `3832eed7756406df089196107bff92a980dfe6801863497a31a16cb37e9dc2ec`
- SWU manifest: `4c5c62c66fc60cbbdf6402afd63e874a203409e569bcbd65662393b14565aeb7`
- Admission contract: `6aee08ec32cf23978a641e7fef54c824981f74db5458e4bb40c2ed30cc634a60`
- Relations: `234ad4152b731edcb03cd1b45dfa21570bd37df741090ca6ca0940fd98c0ce00`
- Graph: `e8f754e6aed7b05759439df82db421eb51fa050c78b86b37d5d689e89a751433`
- Sidecar: `df72eeb1e07a62c1256d03cd313fb8f79e3a9f4bc2c13f5bdade277d14e8bc4f`
