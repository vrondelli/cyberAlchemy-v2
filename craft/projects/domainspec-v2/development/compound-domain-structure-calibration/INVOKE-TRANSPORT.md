---
observed_capability: invoke
invoke_modes: [define, design, plan]
phase_status: pass
target_artifact: compound domain structure calibration experiment package
target_owner: DomainSpec v2 compound-domain-structure calibration development cycle
next_route: task-session SWU-CDSC-001
---

# Invoke Transport

## Intent And Approval

The user explicitly requested Invoke `define`, `design`, and `plan` after
confirming the accepted compound-structure research. That request supplies
authoring approval. No blocker ambiguity remained, so the structured interview
gap check emitted no additional question.

## Context Builder Selection

The bounded authoring context used:

- accepted compound-structure findings and transcript;
- current DS-D1/DS-D8 authority boundaries;
- the completed UI evidence-repair package as local Invoke precedent;
- the repository-local Inventory entries for UI repair and compound-structure
  research;
- Invoke Define, Design, and Plan contracts and selected templates.

Fixture implementation files were not loaded beyond cited selectors needed to
define source boundaries. No whole-repository context pack was created.

## Discovery And Template Selection

The accepted research finding satisfies the Define discovery soft gate; no
discovery waiver is needed.

| Stage | Selection | Eligibility evidence |
| --- | --- | --- |
| Define | DomainSpec spec baseline plus local glossary/decision/gap companions | bounded DomainSpec development experiment with explicit invariants and owner boundaries |
| Design | DomainSpec six-view architecture profile | context, structure, components, workflow, decisions, and interfaces all affect execution |
| Plan | standalone implementation-layering and split work-pack plus DomainSpec execution pack | medium complexity, seven SWUs, four L0-L3 waves, one parallel fixture wave |

No eligible-template tie remained. The research-family template was considered
and skipped because research is complete and the requested output is an
executable experiment package, not another research brief.

## Outputs

- Define: `SPEC.md`, `GLOSSARY.md`, `DECISION-LEDGER.md`, `GAP-LEDGER.md`.
- Design: `ARCHITECTURE.md`, `GLOSSARY-CONSISTENCY.md`.
- Plan: `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `work-pack/`,
  `EXECUTION-PACK.md`, `DISTILL-VALIDATION.md`, and
  `compound-domain-structure-calibration.dispatch.json`.

## Technique Trace

| Technique | Activation | Effect and validation |
| --- | --- | --- |
| `sequence` | define -> design -> plan -> Task Session | fixes source and gate order |
| `scu_swu_reduction` | experiment spans contracts, three receipts, evaluation, audit | seven bounded SWUs with 001 as smallest coherent start |
| `recomposition_proof` | split L1 fixture lanes | Distill maps every SWU back to one suite result and audit |
| `validation_loop` | every layer and SWU | task-local schema, outcome, replay, and boundary checks |
| `owner_boundary_check` | fixture, DS-D1, DS-D8, pattern, candidate owners | package-only writes and stop conditions |
| `handle_handoff` | Invoke -> Task Session and L1 join | artifact handles replace copied authority context |
| `residue_ledger` | experiment and portability uncertainty | named gaps, owners, and repair paths |
| `execution_receipt_handoff` | one-SWU runtime route | required Task Session/subagent receipt shape |
| `authority_split_gate` | results -> later research/governance | no direct promotion route |
| `artifact_contract_bridge` | research envelope -> schemas and receipts | finite contract and semantic digest plan |
| `concrete_path_evidence` | fixture and task boundaries | exact read and write scopes |
| `observability_grouping` | full dispatch and future runs | dispatch-ID grouped events and receipts |

`frame_handoff` was skipped because this is not a session split.
`handle_handoff` owns the existing lifecycle transition. No technique is listed
without an artifact, gate, evidence check, or runtime boundary.

## Full Dispatch

A full dispatch is required because the plan crosses Invoke and Task Session,
contains an optional subagent fanout, reads evidence from two fixture owners,
and preserves protected canonical authority boundaries.

- Path: `compound-domain-structure-calibration.dispatch.json`
- Validation: `pass`, zero blocks, zero flags.

## Stage Results

| Stage | Result | Basis |
| --- | --- | --- |
| Define | pass | purpose, envelope, fixtures, outcomes, acceptance, invariants, and scope fixed |
| Design | pass | all six views, deterministic algorithm, data contracts, alternatives, risks, and interfaces present |
| Plan | pass | medium split plan, L0-L3 waves, detailed task specs, seven complete SWUs, execution pack, and validation strategy |
| Distill | pass | smallest coherent start, complete navigation, recomposition, zero hidden authoring gaps |

## Gap Ownership

Invoke-specific gaps: none.

Target-artifact gaps are expected experiment inputs: source pins, reviewed
predicate matrices, independent replay, portability, and Page/Layout pattern
replication. Each has an owner in `GAP-LEDGER.md`; none blocks 001.

## Handoff

Next route: `task-session` for `SWU-CDSC-001` only. Later W1 subagent execution
requires separate explicit permission after W0 passes. Invoke does not execute
the experiment or pre-generate runtime context packs.
