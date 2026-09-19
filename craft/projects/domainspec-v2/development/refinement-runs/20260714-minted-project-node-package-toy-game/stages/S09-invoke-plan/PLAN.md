# Invoke Plan — Minted Project Node Package

## Invoke Result

- Mode: `plan`
- Spell: `invoke`
- Canonical ID: `invoke`
- Scope: library
- Phase status: `pass`; `SWU-MNP-001` is selected and no SWU is executed
- Mode contract: `spells/invoke/plan.md`
- Outputs: `REFRESH-REPORT.md`, `refresh-report.json`, `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, `EXECUTION-PACK.md`, `EXECUTION-DISPATCH.json`, `DISTILL-VALIDATION.md`, `transport-report.json`
- Design views: six-view S06 design covered and S07/S08 repairs bound
- Glossary consistency: `pass with candidate terms`; no promotion
- Dispatch techniques: `sequence`, `scu_swu_reduction`, `recomposition_proof`, `validation_loop`, `owner_boundary_check`, `handle_handoff`, `residue_ledger`, `execution_receipt_handoff`, `authority_split_gate`; `EXECUTION-DISPATCH.json` validates `pass`
- Distill validation: `pass` for plan structure, recomposition, and one-SWU handoff readiness
- Implementation layering: L0–L3 defined with layer-mapped waves
- Work-pack: split, high complexity
- Complexity: `high`
- Per-layer planning: layer-mapped waves
- Implementation detail: task specs complete with owner-bound directory scopes and current repository verification commands
- Smallest working units: 7 defined; `SWU-MNP-001` is selected and not started
- Template/profile selection: existing standalone implementation-layering + work-pack + execution-pack companions; experimental `feature-with-independent-node-files` profile
- Validation strategy: schemas, compiler determinism, navigation/source binding, generated-view drift, minter containment, conformance corpus, and owner-bound release receipt
- Decisions: `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE` binds factory authority; `DEC-DSV2-MINTED-PROJECT-FIRST-SWU` selects `SWU-MNP-001`
- Unresolved gaps: release promotion, consumer-example destination, cross-feature proof, and independent edge lifecycle trigger
- Next route: strict Context Builder runtime pack for `SWU-MNP-001`, then one separately invoked bounded `task-session`

## Outcome

The plan is technically decomposed, binds the owner-approved authority homes,
and records `SWU-MNP-001` as selected. It is ready for strict runtime-context
construction, not implementation execution. It does not activate W1 as a whole,
create the experimental profile, move fixtures, admit a release, or execute a
Task Session.

## Implementation Objective

Turn the L0 toy result into a DomainSpec-owned mint contract that creates a consumer-owned, machine-first node package; validates admitted node formation and typed relationships; compiles deterministic graph/provenance/human projections; detects source/output drift; and never treats DomainSpec fixtures as consumer authority.

## Delivery Boundary

Included through the owner-approved homes when the selected SWU and its
dependency-gated successors are executed by their lifecycle owners:

- project, feature, node, and connection schema contracts;
- project-root-safe source resolver;
- selected layout-A reader with stable first-class edge IDs;
- admitted formation/profile and active relationship validation;
- normalized graph and source-manifest compiler;
- generated Markdown and build receipt verification;
- project minter/template with safe `generated_root` handling;
- conformance/mutation corpus and release/admission evidence.

Excluded:

- concrete consumer feature semantics inside DomainSpec;
- website/interactive graph implementation;
- cross-feature completeness until a separate witness passes;
- independent edge registry/service without lifecycle evidence;
- rewriting the current FPR-01 decision or authority census;
- task execution from this Refine run.

## Resolved Decision Bindings

| ID | Resolution | Planning consequence |
| --- | --- | --- |
| PLAN-B1 | resolved by `DEC-DSV2-MINTED-PROJECT-NODE-PACKAGE` Decision 1 | definitions own the profile registry; `impl/spec/minted-project/` owns contracts; `impl/tools/minted-project/` owns executable machinery; the derivation-engine minted-project fixture root owns conformance |
| PLAN-B2 | resolved by Decision 2 | `feature-with-independent-node-files` is experimental only; unsupported profile, unsupported kind, invalid shape, and non-active relationship remain distinct failures |
| PLAN-B3 | resolved by Decisions 3 and 4 | toy evidence stays development-scoped; engine fixtures remain witnesses; three `impl/spec/features/` packs are classified for future migration without authorizing movement |

There is no remaining acceptance-critical blocker to selecting `SWU-MNP-001`. Release promotion and actual fixture movement remain separately gated after their evidence and destinations exist.

## Execution Selection

- Decision: `DEC-DSV2-MINTED-PROJECT-FIRST-SWU`
- Selected unit: `SWU-MNP-001`
- State: selected, not started
- Resolved gate: `g03-explicit-swu-selection`
- Remaining runtime gate: `g04-strict-context`
- Selection effect: authorizes context preparation only; Task Session remains a
  separate invocation and must preserve the selected write scope.

## Dispatch Technique Trace

| Technique | Plan effect |
| --- | --- |
| `sequence` | Decision Gate → L0 contract/compiler → L1 views/minter → L2 conformance → L3 admission |
| `scu_swu_reduction` | seven SWUs; one owner decision or bounded implementation result per unit |
| `recomposition_proof` | schemas + resolver + compiler + views + minter + evidence recompose into the approved design |
| `validation_loop` | every SWU has positive/negative or deterministic evidence |
| `owner_boundary_check` | Invoke plans; Decision Gate binds authority; Task Session later executes one selected SWU |
| `handle_handoff` | future workers receive artifact paths and source anchors, not copied authority prose |
| `residue_ledger` | cross-feature and independent-edge triggers stay explicit |
| `execution_receipt_handoff` | each SWU defines expected result/receipt shape before execution |
| `authority_split_gate` | factory form remains separate from consumer content and generated views |

Full dispatch validation: the Refine route remains historical evidence;
`EXECUTION-DISPATCH.json` passes the deterministic Dispatch Spec validator. Its
human-selection gate is resolved by the selection decision; strict Context
Builder coverage remains mandatory before Task Session.

## Navigation

1. Read `IMPLEMENTATION-LAYERING.md` for the decision unlocked at each layer.
2. Read `WORK-PACK.md` for task/SWU state and blockers.
3. Read the linked task file for algorithm, write scope, edge cases, and verification.
4. Read `EXECUTION-PACK.md` for wave gates.
5. Read `REFRESH-REPORT.md` and the two authority decisions, then build the
   strict runtime context for selected `SWU-MNP-001`.
