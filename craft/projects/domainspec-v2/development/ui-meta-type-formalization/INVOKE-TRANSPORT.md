---
module: ui-meta-type-formalization
status: draft
updatedAt: 2026-07-11
docType: invoke-transport
observed_capability: invoke
invoke_modes: [define, design, plan]
---

# Invoke Transport: UI Meta-Type Formalization

## Target Provenance

- Target artifact: UI meta-type formalization candidate package.
- Target type: DomainSpec v2 development specification, architecture, experiment
  program, and executable work-pack.
- Lifecycle owner: DS-D1 definitions-governance for eventual promotion;
  validation-governance for validator changes; relationship authority for any
  DS-D8 repair.
- Observed authoring capability: `invoke`.
- Mutation boundary: development package only.

## Define Result

- Phase status: pass.
- Discovery: satisfied by accepted UI11 review, candidate list, existing
  formalization research, and current DS-D8 signatures.
- Template: implemented DomainSpec specification family, adapted to a
  research/formalization package.
- Outputs: `SPEC.md`, `GLOSSARY.md`.
- Distill sanity: pass; one per-type hypothesis/result contract is the coherent
  definition unit.
- Decision: experiments are mandatory promotion evidence.

## Design Result

- Phase status: pass.
- Profile: DomainSpec six-view architecture bundle.
- Outputs: `ARCHITECTURE.md`, `EXPERIMENTS.md`.
- Six views: context, high-level structure, low-level components, workflow,
  decision flow, dependency/interface.
- Glossary consistency: linked for existing terms; package-only terms remain
  candidate.
- Distill result: pass at design scale with E0 as the smallest method proof;
  full plan trace is in `DISTILL-VALIDATION.md`.
- Architecture boundary: evidence may inform authority but cannot write it.

## Plan Result

- Phase status: flag.
- Complexity: medium; split output.
- Outputs: `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `EXECUTION-PACK.md`,
  task/wave/shared contracts, and `ui-meta-type-formalization.dispatch.json`.
- Layer coverage: L0 method proof, L1 all-label breadth, L2 hardening and
  replication, L3 owner handoff.
- SWU coverage: 11 non-exempt SWUs plus one closure-only VERIFY exemption.
- First executable unit: `SWU-UIF-001`.
- Distill validation: `flag`; the plan and first unit close, while real-corpus
  selection and external promotion remain named gaps.
- Flag: real-corpus selection occurs in UIF-002; canonical promotion remains an
  external owner decision.

## Template Selection Evidence

Inventory lookup found no competing UI-specific Invoke template. The installed
Invoke package identifies the DomainSpec specification family as the define and
design baseline and requires the standalone implementation-layering/work-pack
companions plus DomainSpec execution-pack for medium complexity. No tie required
a user template decision.

## Dispatch Techniques

Selected: `sequence`, `scu_swu_reduction`, `recomposition_proof`,
`validation_loop`, `toy_game`, `owner_boundary_check`,
`artifact_contract_bridge`, `execution_receipt_handoff`, `residue_ledger`, and
`observability_grouping`.

Full dispatch is required because W1 and parts of W2 permit parallel subagent
lanes and the route crosses Invoke, Task Session, validation governance,
definitions governance, and relationship authority.

## Decisions And Assumptions

- The package remains parallel and candidate-only while
  `DEC-DSD1-UI11-PATH` is unresolved.
- `Form`/`Component` and `Adapter`/`Mapping` are experiment contrasts, not pilot
  promotion ordering.
- Experiments may eliminate labels; all-eleven promotion is not a success
  condition.
- Real-corpus sources are selected during UIF-002 and must retain provenance.

## Unresolved Gaps

- Target gap: real UI specimens are not yet selected.
- Target gap: surviving schemas may require new bounded validator rules.
- Target gap: some evidence may reveal DS-D8 signature changes, owned elsewhere.
- Invoke gap: none identified; current templates support the package shape.

## Next Route

Run `task-session` for `SWU-UIF-001`. Later subagent fan-out requires explicit
runtime approval and uses the validated dispatch strategy.
