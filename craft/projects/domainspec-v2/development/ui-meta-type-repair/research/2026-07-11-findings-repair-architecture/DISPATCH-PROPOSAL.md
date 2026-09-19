---
dispatch_id: 2026-07-11-uif-findings-repair-architecture-research
dispatch_type: research
status: closed-resolved
created: 2026-07-11
working_folder: projects/domainspec-v2/development/ui-meta-type-repair/research/2026-07-11-findings-repair-architecture/
max_loops: 1
final_approver: Vlachopulos, Ioannis
---

# UIF Findings Repair Architecture Research Dispatch

## Goal

Identify a build-from-owned, evidence-complete solution architecture for the
seven UIF-010 repair obligations, then provide an accepted source contract for
Invoke define/design/plan without mutating UI candidates, shared validators,
DS-D1, or DS-D8.

## P1 Trigger

Dispatch: **yes**.

- Synthesis: six precedent families and seven repair obligations must be joined.
- Context protection: raw validator, research, corpus, and relationship evidence
  is substantially larger than the parent synthesis should carry.
- Isolation: solution options need independent falsification before planning.
- Parallelism: validator, formation, corpus, and relationship lanes are
  independent at exploration time.

## Global Anti-Bias

Composite theme: repair effectiveness versus authority safety and reproducibility.

## Group 1 - Solution Explorers

- Role: four `explorer` agents in parallel.
- `robot_talks: true`.
- Anti-bias: composite `methodology + source-corpus`.
- Output: precedent-backed solution patterns, rejected alternatives, interface
  contracts, blast-radius notes, validation evidence, and exact source refs.

| Agent | Angle | Expected output |
| --- | --- | --- |
| Turing, Alan | computational validator and mutation-harness analysis over backend meta-type, UIF, and R3 tooling | Compare candidate-local predicate, global semantic change, and compositional rule options; design deterministic mutation/result storage and migration impact. |
| Lakatos, Imre | historical/adversarial concept-formation analysis over first-class-category and Saga adjudication precedents | Define finite non-circular separating-witness and typed-negative contracts; identify kill/defer/survive conditions. |
| Simon, Herbert | empirical source-corpus analysis over Body War, Savvy, E0/W1, and prior normalization practices | Design a no-invented-metadata corpus receipt, portability sample rules, missing-evidence vocabulary, and reproducible replay boundary. |
| Fong, Brendan | formal/applied typed-graph analysis over R3 edge laws, DS-D8 signatures, and external destinations | Design bidirectional reroute receipts, local/external destination interfaces, and bounded relationship-owner packets. |

### Predicted Disagreements

- Turing runs computational validator mechanics while Lakatos runs adversarial
  formation-law analysis on the `methodology` axis; a bias toward validator
  completeness in Turing would be exposed by Lakatos's non-circular identity test.
- Turing runs current tooling corpora while Simon runs real-source normalization
  on the `source-corpus` axis; a bias toward generated fixtures in Turing would
  be exposed by Simon's prohibition on invented source metadata.
- Turing runs node-rule mechanics while Fong runs typed-edge ownership on the
  `methodology + source-corpus` axis; a bias toward encoding every repair as a
  node predicate in Turing would be exposed by Fong's relation-owner boundary.
- Lakatos runs historical/adversarial promotion precedents while Simon runs
  empirical corpus replay on the `methodology` axis; a bias toward abstract
  witness sufficiency in Lakatos would be exposed by Simon's reproducibility gaps.
- Lakatos runs DS-D1 concept-formation precedent while Fong runs R3/DS-D8 graph
  precedent on the `source-corpus` axis; a bias toward typehood in Lakatos would
  be exposed by Fong's relation-not-node alternatives.
- Simon runs observed implementation evidence while Fong runs formal destination
  interfaces on the `methodology` axis; a bias toward corpus-local naming in
  Simon would be exposed by Fong's finite signature and external-owner checks.

## Group 2 - Synthesizer

- Agent: Noether, Emmy.
- Role: `synthesizer`.
- Dependency: sequential after explorers and their robot-talks return.
- Purpose: reconcile the seven solution families into one candidate architecture
  with alternatives, compatibility costs, and a proposed Invoke source contract.

## Group 3 - Research Reviewers

- Role: three `skeptic` agents in parallel.
- Anti-bias: `attack-vector`.
- Dependency: zig-zag after the synthesizer, `loop_cap: 1`.

| Agent | Gate | Expected output |
| --- | --- | --- |
| Russell, Bertrand | precedent | Mark each solution `already-deployed`, `build-from-owned`, or `precedent-clean`; identify the actual owner and reusable source. |
| Popper, Karl | non-vacuity | Build the smallest concrete witness or closed negative for every proposed solution contract; KILL unwitnessed mechanisms. |
| Quine, Willard Van Orman | definitional-soundness | Attack circular identity, renamed existing rules, and node/relation collapse; KILL tautological solution claims. |

### Predicted Disagreements

- Russell tests ownership while Popper tests executable witnesses on the
  `attack-vector` axis; a bias toward citation-as-sufficiency in Russell would
  be exposed by Popper's concrete counterexamples.
- Russell tests precedent while Quine tests definitional collapse on the
  `attack-vector` axis; a bias toward adopting an owned name in Russell would
  be exposed if Quine shows it adds no distinct contract.
- Popper runs non-vacuity, Quine runs definitional soundness on the
  `attack-vector` axis; a bias toward mechanically witnessed but circular
  contracts in Popper would be exposed by Quine.

## Group 4 - Findings Writer

- Agent: Mac Lane, Saunders.
- Role: `writer`.
- Dependency: sequential after the reviewed synthesis.
- Purpose: write cited `findings.md` with a seven-row verdict matrix, chosen
  architecture primitives, rejected options, remaining decisions, and an
  explicit source contract for Invoke.

## Group 5 - Final Auditor

- Agent: Vlachopulos, Ioannis.
- Role: `auditor` and dedicated `final_approver`.
- Dependency: sequential after the writer.
- Purpose: verify source coverage, verdict discipline, all seven repair
  obligations, no authority leakage, and Invoke readiness.

## Dependency Flow

1. `solution-explorers -> synthesizer`: sequential.
2. `synthesizer -> research-reviewers`: zig-zag, `loop_cap: 1`.
3. `research-reviewers -> findings-writer`: sequential.
4. `findings-writer -> final-auditor`: sequential.
5. `final-auditor -> findings-writer`: conditional feedback, `loop_cap: 1`.

## Research Verdict Candidates

| Candidate | Required question |
| --- | --- |
| S1 nonempty predicate | Which semantic and ownership boundary rejects blank values without unsafe global drift? |
| S2 mutation ledger | What deterministic contract makes all criterion/value mutations reproducible and reviewable? |
| S3 reroute receipt | How are local destination acceptance and external destinations represented without false completeness? |
| S4 separating-witness dossier | What finite non-label-derived evidence proves identity or forces collapse/defer? |
| S5 corpus normalization receipt | How can source facts be normalized without invented DomainSpec metadata? |
| S6 relationship-owner packet | What exact DS-D8 handoff resolves externally owned questions without direct mutation? |
| S7 rerun/invalidation envelope | How are prior results preserved while repaired criteria produce a new evidence generation? |

## Invoke Handoff After Accepted Research

Target package: `projects/domainspec-v2/development/ui-meta-type-repair/`.

Planned authoring sequence:

1. `invoke define`: `SPEC.md`, `GLOSSARY.md`, source/evidence contracts,
   explicit authority boundary, and repair acceptance criteria.
2. `invoke design`: six-view `ARCHITECTURE.md`, component/interface contracts,
   decision log, risks, glossary consistency, and design transport.
3. `invoke plan`: `IMPLEMENTATION-LAYERING.md`, split
   `WORK-PACK.md`/`work-pack/`, `EXECUTION-PACK.md`, dispatch technique trace,
   Distill validation, and Task Session handoff.

Invoke remains planning-only. Candidate/schema/validator/authority mutation is a
later Task Session concern behind the resulting work-pack gates.

## Gate And Ledger State

- Inventory lookup: complete; see `INVENTORY-LOOKUP.md`.
- Check-tension round 1: reviewer PASS; checker reproved one Popper-Quine
  Test-4 sentence; exact wording repair applied.
- Check-tension round 2: checker PASS and reviewer PASS across all nine pairs
  and global coherence.
- Gate infrastructure: 4 spawned, 4 joined, 4 closed, 0 open.
- Human confirmation: received on 2026-07-11; sheet frozen.
- Registration: appended exactly once.
- Dispatch ledger rows: one registration row; one close row.
- Runtime agents: 10 spawned, 10 joined, 10 closed, zero open.
- Final audit: ACCEPT; no writer feedback loop required.
- Closeout expectation: exactly one registration and one close row; all runtime
  agents joined and closed; Inventory and observability synchronized.
