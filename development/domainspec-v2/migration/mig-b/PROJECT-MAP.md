# DomainSpec v2 Source Project Map

Status: **evidence-assessed live inventory at 2026-08-31T02:01:05Z**
Authority effect: **none**
Source: `projects/domainspec-v2`
Machine view: [PROJECT-MAP.json](PROJECT-MAP.json)
Machine-view SHA-256: `b92bb9af7f4074dac78532fe4acbd98bf79a70e58ae4ef8a755ae7c683d5c6be`

## Purpose

This map is the first MIG-B migration artifact. It inventories the working DomainSpec v2 project by
project area and by each immediate directory under `development/`. It does not rebuild DomainSpec,
create a new product version, admit a successor baseline, switch authority, or delete the source.

Directory names, plans, and local status labels are evidence inputs, not completion proof. Each
development directory is classified from terminal evidence at its bounded claim ceiling. In particular,
`completed` never means live-product implementation unless the live dependency evidence separately says so.

## Coverage

- 27925 files and symlinks, 1849163667 bytes.
- 11 root areas, including root-level files.
- 53 immediate `development/` directories; every live directory is represented once.
- Lifecycle distribution: `completed`: 16 · `active`: 13 · `blocked`: 14 · `superseded`: 4 · `historical`: 6.
- Migration distribution: `archive-historical-provenance`: 6 · `archive-superseded-provenance`: 4 · `carry-forward-active-dependency`: 1 · `carry-forward-continuation`: 26 · `preserve-completed-provenance`: 16.
- Source aggregate SHA-256: `185225b5af32b7c7adf26288ecb7051b22dc25bc992d892b8184983f958eb304`.
- Git dirty-state availability: `unavailable-git-not-installed-in-runtime`; source bytes were not changed.
- Excluded only: `.git directory metadata`, `node_modules dependency directories`.

## Project areas

| Area | Observed responsibility | Files | Bytes | Dirty paths |
| --- | --- | ---: | ---: | ---: |
| `(root)` | product-navigation-runtime-and-teaching-views | 15 | 553733 | unavailable |
| `.craft` | development-ledger-and-non-authority-state | 12 | 399804 | unavailable |
| `architecture` | system-and-pattern-architecture | 27 | 180903 | unavailable |
| `authority` | owner-decisions-and-axioms | 29 | 148808 | unavailable |
| `definitions` | canonical-vocabulary-and-language-definitions | 25 | 416385 | unavailable |
| `development` | development-history-evidence-and-active-work | 24322 | 1560627105 | unavailable |
| `discovery` | project-discovery-evidence | 2 | 28214 | unavailable |
| `formalization` | formalization-method-contracts-and-profiles | 71 | 664840 | unavailable |
| `impl` | active-private-runtime-and-cli | 3204 | 284375729 | unavailable |
| `ontology` | canonical-product-and-system-ontology | 32 | 165514 | unavailable |
| `research` | research-towers-and-source-evidence | 186 | 1602632 | unavailable |

## Development directory map

| Directory | Primary evidence title | Lifecycle | Bounded outcome | Files | Canonical refs | All external refs | Migration disposition |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `2026-07-06-write-right-share-substrate` | findings.md — Two-Tier Share Substrate (write→read machine) | **historical** | The research dispatch was repaired and accepted at its evidence-synthesis boundary. | 4 | 0 | 0 | archive-historical-provenance |
| `agent-spec-conformance` | Define — Agent⊨Spec Conformance Verifier (the runtime action plane) | **active** | Define and Design are authored for the agent-spec conformance pipeline. | 2 | 1 | 18 | carry-forward-continuation |
| `architecture-pattern-enforcement` | Architecture-Pattern Enforcement | **active** | Operation and Workflow profile work is terminal at its recorded local evidence ceiling. | 2385 | 11 | 262 | carry-forward-continuation |
| `architecture-realization-compiler` | architecture-realization-compiler | **completed** | The bounded TypeScript Enum realization compiler proof completed with mutation and replay checks. | 35 | 14 | 290 | preserve-completed-provenance |
| `backend-meta-type-conformance` | backend-meta-type-conformance | **blocked** | A historical conformance snapshot identified backend binding findings. | 2 | 1 | 32 | carry-forward-continuation |
| `code-tag-conformance` | Code-Tag Conformance — Work-Pack | **active** | The taxonomy and first deletion-landmine slice are closed. | 5 | 1 | 24 | carry-forward-continuation |
| `compound-domain-structure-calibration` | Compound Domain Structure Calibration Specification | **completed** | The calibration work pack records a complete, passing generation boundary. | 407 | 1 | 4 | preserve-completed-provenance |
| `comprehension-novice-test` | Work-Pack — Comprehension Novice-Witness Test | **superseded** | The package explicitly identifies its Saga-era baseline as historical and non-rerunnable. | 8 | 4 | 12 | archive-superseded-provenance |
| `decisions` | decisions | **completed** | The FMP-EVF ownership boundary decision passed and records the selected separation. | 6 | 0 | 24 | preserve-completed-provenance |
| `definitions-governance-enhancement` | definitions-governance-enhancement — staging | **blocked** | A private definitions-governance enhancement proposal and handoff were authored. | 3 | 1 | 12 | carry-forward-continuation |
| `ds-d1-improvement-plan` | WORK-PACK: DS-D1 Improvement Plan | **active** | The DS-D1 improvement plan has begun its bounded execution history. | 26 | 2 | 20 | carry-forward-continuation |
| `durable-compensation-concepts` | Durable Compensation Concept Model | **completed** | Recovery Intent, Claim, Lease, durable compensation, and related definitions were admitted into canonical authority and ontology sources. | 4 | 2 | 17 | preserve-completed-provenance |
| `evf-factory-obligation-evidence-adapter` | evf-factory-obligation-evidence-adapter | **active** | The adapter design selected a bounded ownership-preserving seam. | 24 | 0 | 12 | carry-forward-continuation |
| `evolvable-validation-framework` | Evolvable Validation Framework (EVF) | **blocked** | Several bounded EVF slices and dirty-baseline repairs pass at their recorded ceilings. | 1767 | 30 | 175 | carry-forward-continuation |
| `financial-settlement-executable-test-generation` | Financial Settlement Executable Test Generation | **completed** | The financial-settlement executable-test generation work pack and closeouts are complete. | 128 | 0 | 2 | preserve-completed-provenance |
| `first-production-release` | first-production-release | **blocked** | FPR-01 and the UI development lane closed at their recorded local ceilings. | 626 | 17 | 204 | carry-forward-continuation |
| `formal-model-proof-provider` | formal-model-proof-provider | **blocked** | The six-unit TLA/TLC provider candidate is contractually ready at a frozen-input planning ceiling. | 191 | 0 | 25 | carry-forward-continuation |
| `format-honesty` | WP-FMT-001 — Format honesty and generated meta-type cards | **blocked** | SWU-FMT-001 and its dependency-free checker pass at the focused evidence ceiling. | 22 | 2 | 14 | carry-forward-continuation |
| `implementation-conformance` | DomainSpec Implementation Conformance | **active** | The admitted meta-type baseline, realization kernel, conformance assets, and first CLI slices are the current implementation-conformance surface. | 563 | 26 | 1178 | carry-forward-active-dependency |
| `invoke-define-cli-modeling-experiment` | Invoke Define CLI Modeling Experiment | **completed** | The private non-authority CLI-modeling experiment completed deterministic ontology validation. | 49 | 0 | 0 | preserve-completed-provenance |
| `language-type-enforcement-parser-experiment` | Architecture Bundle: Language Type-Enforcement Parser Experiment | **active** | A serial L0 parser and consumer-parity plan is ready for its first focused SWU. | 21 | 0 | 5 | carry-forward-continuation |
| `make-it-green` | Make `impl/` Green — Work-Pack | **active** | G1 through G3 are closed and the project validation foundation is green at that boundary. | 2 | 1 | 16 | carry-forward-continuation |
| `meta-type-closure-epoch` | meta-type-closure-epoch | **blocked** | The E2 closure plan passes readiness checks and binds the corrected owner baseline. | 1893 | 0 | 1 | carry-forward-continuation |
| `meta-type-complete-implementation` | Meta-Type Complete Implementation | **completed** | A reusable twelve-SWU development package for one future meta-type was authored and validated. | 44 | 0 | 3 | preserve-completed-provenance |
| `meta-type-definitions` | Meta-Type Definitions — Work-Pack | **completed** | The current meta-type definition set is closed at its development-package boundary and is represented in canonical sources. | 4 | 2 | 36 | preserve-completed-provenance |
| `meta-type-factory-reproducibility` | meta-type-factory-reproducibility | **completed** | The factory reproducibility prototype completed its declared validation surface. | 1063 | 4 | 43 | preserve-completed-provenance |
| `meta-type-formalization` | Meta-Type Formalization — Work-Pack | **completed** | MT0 through MT4 and MT-INST are closed for the current backend formalization scope. | 22 | 10 | 65 | preserve-completed-provenance |
| `meta-type-instantiation-cli` | WP-MTCLI-001 — frozen meta-type instantiation CLI | **active** | Canonical documents and implemented baseline v2 are admitted, and MTCLI-002 is closed. | 34 | 17 | 27 | carry-forward-continuation |
| `meta-type-realization-factory` | meta-type-realization-factory | **completed** | The legacy realization-factory lane records MTF-001 through MTF-029 complete with an empty remaining set. | 63 | 8 | 69 | preserve-completed-provenance |
| `ontology-form-decisions` | DomainSpec Ontology Form Decision Campaign | **superseded** | The 0-ready and 13-blocked implementation queue remains recorded as historical provenance. | 62 | 5 | 154 | archive-superseded-provenance |
| `operational-resilience-observability-deployment-integration` | operational-resilience-observability-deployment-integration | **blocked** | Definition, design, planning, and bounded offline prototype evidence exist for ORODI. | 319 | 1 | 4 | carry-forward-continuation |
| `proof-obligation-substrate` | proof-obligation-substrate | **blocked** | The shared-syntax adoption candidate received DomainSpec owner acceptance. | 1 | 2 | 4 | carry-forward-continuation |
| `r3-closeout-plan` | WORK-PACK: R3 Closeout Plan | **active** | R3 closeout has passed its L1 integrity receipt and retains a named next unit. | 52 | 3 | 31 | carry-forward-continuation |
| `r3-l2-relationship-hardening` | WORK-PACK: R3/L2 Relationship Hardening | **active** | A bounded L2 relationship-hardening work pack exists with a serial continuation. | 20 | 1 | 7 | carry-forward-continuation |
| `r3-research` | r3-research | **historical** | The R3 category-boundary and cross-domain investigations produced findings. | 4 | 1 | 21 | archive-historical-provenance |
| `refinement-runs` | refinement-runs | **historical** | The directory aggregates completed and superseded refinement-run evidence across multiple capabilities. | 3380 | 38 | 747 | archive-historical-provenance |
| `reformulate-batch1` | Reformulate Batch-1 Spec Docs — Work-Pack | **active** | R0, R1, and CT1 are closed in the batch-one reformulation sequence. | 46 | 7 | 43 | carry-forward-continuation |
| `relationship-constraint-decisions` | relationship-constraint-decisions | **blocked** | N05 through N45 produced selected relationship semantics and a candidate closure-evidence chain. | 1052 | 2 | 38 | carry-forward-continuation |
| `remaining-meta-types` | remaining-meta-types | **completed** | WP-RMT-002R reconciliation closed all eight receipt-only units with a terminal receipt. | 5132 | 129 | 707 | preserve-completed-provenance |
| `research` | research | **historical** | The directory preserves DomainSpec research towers and source-first findings used by later designs. | 636 | 10 | 74 | archive-historical-provenance |
| `reviews` | reviews | **historical** | Independent review evidence records the first-production-stable assessment at its historical snapshot. | 193 | 1 | 22 | archive-historical-provenance |
| `saga-removal` | WORK-PACK: Remove Active Saga Surfaces | **completed** | All eight Saga-removal units completed and the full declared validation passed. | 59 | 5 | 13 | preserve-completed-provenance |
| `spec-comprehension-model` | Work-Pack — Spec Comprehension Model (M1–M4) | **superseded** | The comprehension model is bound to a historical Saga-era corpus and candidate plan. | 5 | 3 | 10 | archive-superseded-provenance |
| `spec-ontology-branch-decision` | spec-ontology-branch-decision | **blocked** | The owner selected one connected semantic graph and recorded the aggregate decision. | 496 | 6 | 84 | carry-forward-continuation |
| `specified-first-order-logic-framework` | DS-SFOL Framework Package | **blocked** | The experimental C3/P4 scope and SWU-SFOL-001 through 010 are complete. | 317 | 0 | 11 | carry-forward-continuation |
| `system-integration-contract-layer` | system-integration-contract-layer | **blocked** | The generic-factory repair candidate revalidated with zero local blockers. | 1607 | 1 | 50 | carry-forward-continuation |
| `test-derivation-engine-next-epoch` | test-derivation-engine-next-epoch | **blocked** | The R4 multiformalism profile epoch is an exact plan candidate with repaired lifecycle contracts. | 1012 | 4 | 5 | carry-forward-continuation |
| `ui-candidate-formalization-experiments` | UI Candidate Formalization Experiments | **completed** | The deferred-confidence experiment lane closed its active window and recorded its empirical evidence. | 69 | 1 | 3 | preserve-completed-provenance |
| `ui-meta-type-formalization` | Specification: UI Meta-Type Formalization | **superseded** | The historical UIF lane completed its zero-survivor evidence boundary. | 216 | 3 | 26 | archive-superseded-provenance |
| `ui-meta-type-repair` | UI Meta-Type Evidence Repair Specification | **completed** | UIR-011 and the declared focused and aggregate tests completed with PASS. | 189 | 4 | 24 | preserve-completed-provenance |
| `ui-profile-implementation` | Required UI Profile Architecture | **completed** | The UI development work pack closed through SWU-UIP-007 with aggregate validation passing. | 45 | 7 | 46 | preserve-completed-provenance |
| `validation-architecture-roadmap` | validation-architecture-roadmap | **active** | The current roadmap maps the source-to-evidence architecture and its serial and parallel lanes. | 3 | 1 | 2 | carry-forward-continuation |
| `workflow-reflections` | workflow-reflections | **historical** | The decision-gate maintenance reflection was approved as workflow-improvement evidence. | 4 | 0 | 0 | archive-historical-provenance |

## Lifecycle interpretation

- **Completed:** the directory reached its stated development outcome; consult `lifecycle.residue` before using it.
- **Active:** a current continuation exists.
- **Blocked:** evidence exists, but an explicit gate prevents the continuation.
- **Superseded:** newer operative state replaced it; preserve only as superseded provenance.
- **Historical:** research, review, or workflow evidence with no current continuation.

The machine view carries each row's confidence, exact evidence refs, residue, external-reference areas,
canonical-consumer samples, and migration disposition.

## What must still be determined before materialization

1. Resolve every active runtime and canonical consumer reference into an exact dependency closure.
2. Separate canonical product assets from implementation, development provenance, research, and
   transient or staged duplicates.
3. Copy the admitted working bytes into CyberAlchemy's layers and validate them in place. Do not
   regenerate the product merely to produce another candidate number.

## Current hard boundary

The selected MIG-B route permits additive successor materialization and preparation. It does not
permit source deletion, baseline admission, authority switching, publication, release, deployment,
or copying private DomainSpec content into public Arcanum.
