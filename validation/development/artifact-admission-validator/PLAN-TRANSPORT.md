# Invoke Plan Transport: Artifact Admission Validator

## Provenance

- Observed capability: `invoke`
- Invoke mode: `plan`
- Target artifact: artifact admission validator
- Target type: repository-local validation tool and fixture package
- Target owner: CyberAlchemy v2 validation route
- Lifecycle owner after planning: `task-session`, one SWU at a time
- Authority owners retained: constitution-governance, discipline-governance, definitions-governance, ontology route

## Source Selection

- [CAV2-C18](../../../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c18-artifact-admission-before-mutation)
- [Artifact Tree Admission discipline](../../../disciplines/cards/artifact-tree-admission.md)
- [CAV2-D42/D51/D52](../../../authority/definitions/DEFINITIONS.md)
- [Canonical Kinds](../../../ontology/canonical-kinds/CANONICAL-KINDS.md)
- [Validation boundary](../../README.md)

Excluded from plan context: unrelated CAV2 research, implementation projects,
private source imports, and public Arcanum mutation surfaces.

## Governed Artifact Tree Admission

This planning folder self-applies C18 and C14.

| Field | Admission |
| --- | --- |
| classification | governed |
| canonical posture | explicit non-canonical planning material; Invoke plan/work-pack is not currently an enumerated CAV2 canonical kind |
| owner route | CyberAlchemy v2 validation route for plan custody; Invoke authors the plan |
| parent entrypoint | `cyberAlchemy-v2/validation/` |
| canonical source or boundary | C18, the discipline card, D42/D51/D52, and Canonical Kinds; this folder is not authority |
| view roles | planning control panel, layer map, task/SWU contracts, dispatch route, validation receipt |
| evidence inputs | source contracts above and repository validator precedents |
| promotion path | none automatic; owner routes review evidence after implementation |
| validation surface | dispatch validator, local-link checks, work-pack/SWU checks, Distill review |
| challenge contract | challenge scope, rule mapping, parser assumptions, SWU boundary, or owner split through the named source owner |
| drift route | invoke refresh for plan evidence; constitution/discipline/ontology owners for source changes |
| allowed uses | Task Session planning, execution-time Context Builder selection, implementation review |
| blocked uses | authority promotion, direct CAV2 definition changes, public publication, CI enforcement without approval |

## Template Selection

- Implementation layering: standalone Invoke template; mandatory for plan mode.
- Work-pack: standalone split template; medium complexity because outputs exceed two and policy logic is algorithmic.
- Execution pack: DomainSpec execution-pack shape used only for wave choreography.
- Task files and waves: required by medium-complexity SWU policy.

No template tie required a user choice.

## Dispatch And Distill

- Full dispatch required: cross-capability owners, private context, reusable validator route.
- Dispatch: [artifact-admission-validator.dispatch.json](artifact-admission-validator.dispatch.json), schema validation pass
- Selected techniques: `sequence`, `scu_swu_reduction`, `recomposition_proof`, `validation_loop`, `owner_boundary_check`, `handle_handoff`, `residue_ledger`, `execution_receipt_handoff`, `authority_split_gate`, `artifact_contract_bridge`.
- Distill verdict: [pass](DISTILL-VALIDATION.md); first unit is `SWU-AAV-001`.

## Handoff

Next owner: `task-session` for `SWU-AAV-001` only.

Expected runtime context selection:

- C18 rule text and adapter row;
- D51 canonical-artifact schema and D52 durability boundary;
- Canonical Kinds contract and OQ-3;
- TASK-AAV-001 and the SWU-AAV-001 manifest row;
- this package's authority and mutation boundaries.

## Gaps

Target-artifact gaps are G-AAV-001 through G-AAV-004 in the work-pack. No Invoke
contract gap blocks the first SWU.
