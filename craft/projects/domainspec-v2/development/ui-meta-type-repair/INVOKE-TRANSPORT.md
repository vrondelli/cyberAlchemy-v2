---
observed_capability: invoke
invoke_modes: [define, design, plan]
phase_status: flag
target_owner: DomainSpec v2 UI meta-type repair development cycle
next_route: task-session SWU-UIR-001
---

# Invoke Transport

## Inputs And Selection

The accepted repair-architecture finding supplies a complete source contract.
Inventory selected existing DomainSpec formalization, edge-law, category-boundary,
Saga adjudication, UI11, and UIF-010 precedents. The DomainSpec spec,
architecture-bundle, implementation-layering, split work-pack, and execution-pack
templates were selected; no template tie remained.

## Outputs

- Define: `SPEC.md`, `GLOSSARY.md`, `EVIDENCE-CONTRACTS.md`,
  `DECISION-LEDGER.md`, `GAP-LEDGER.md`.
- Design: `ARCHITECTURE.md`, `GLOSSARY-CONSISTENCY.md`, this transport.
- Plan: `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `work-pack/`,
  `EXECUTION-PACK.md`, `DISTILL-VALIDATION.md`, and
  `ui-meta-type-repair.dispatch.json`.

## Technique Trace

| Technique | Activation | Effect / validation |
| --- | --- | --- |
| sequence | define -> design -> plan -> Task Session | source and gate order is explicit |
| scu_swu_reduction | broad S1-S7 architecture | ten bounded SWUs, one parent each |
| recomposition_proof | split producer lanes | Distill maps every obligation to 010 |
| validation_loop | every delivery slice | task-local positive/negative/replay checks |
| owner_boundary_check | validator, DS-D1, DS-D8 | stop conditions and prohibited inferences |
| handle_handoff | external destinations | typed pending-owner handles |
| residue_ledger | unresolved gates | decision and gap ledgers |
| execution_receipt_handoff | Invoke -> Task Session | one-SWU receipt contract |
| authority_split_gate | evidence -> definitions/relations | no authority inference |
| artifact_contract_bridge | research -> schemas/receipts | EVIDENCE-CONTRACTS plus traceability |
| concrete_path_evidence | every task | declared source/output/write paths |

`frame_handoff` was skipped because the target is an existing development
cycle, not a new session split. `observability_grouping` is present in the full
dispatch rather than as a planning abstraction.

## Gates And Result

- Define: pass; outcome, scope, acceptance, and prohibitions are explicit.
- Design: pass; all six views and boundary interfaces are present.
- Plan: flag; SWU-001 is ready, downstream claims retain named owner gates.
- Distill: flag with complete recomposition and owned repair paths.
- Full dispatch: required because the route crosses Invoke, Task Session,
  validator, DS-D1, and DS-D8 boundaries.
- Dispatch validation: `pass`, zero blocks, zero flags.

The package is not mutation-ready in general. Only SWU-UIR-001 is ready for a
bounded Task Session.
