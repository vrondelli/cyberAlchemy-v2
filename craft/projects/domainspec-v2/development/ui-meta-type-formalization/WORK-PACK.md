---
module: ui-meta-type-formalization
feature_code: UIF
version: current
status: completed-historical-superseded
updatedAt: 2026-07-17
docType: work-pack
---

# WORK-PACK: UI Meta-Type Formalization

> Successor direction (2026-07-17): this work-pack remains immutable evidence
> of the candidate/replication route, but its real-corpus gate no longer blocks
> UI implementation. The active plan is
> [Required UI Profile Work Pack](../ui-profile-implementation/WORK-PACK.md):
> all eleven concepts are required-by-design, synthetic evidence gates
> mechanics, and real-corpus evidence appends confidence.

Canonical executable plan for candidate UI formation research and evidence
hardening. Task Session owns execution one SWU at a time. Definitions-governance
owns any later DS-D1 promotion.

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | complete-superseded | UIF-010 remains accepted historical evidence; the zero-survivor result no longer gates the successor development profile. |
| complexity | medium | Eleven labels, experiments, candidate schemas, validators, replication, and multiple owners. |
| outputMode | split | Task and wave contracts live under `work-pack/`. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Choreography only; this file owns SWU contracts. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decision boundaries. |
| dispatchTechniqueTrace | [ui-meta-type-formalization.dispatch.json](ui-meta-type-formalization.dispatch.json) | Required because experiments use parallel lanes and owner handoffs. |
| distillValidationStatus | historical-flag | Preserved for the old evidence-to-promotion frame; successor Distill validation passes. |
| activeLayerWindow | closed | Historical experiment route is complete; empirical confidence may resume append-only. |
| readinessProfile | historical-evidence | Candidate evidence package, not the active implementation plan. |

## Objective Summary

Turn all 11 UI labels into falsifiable formation hypotheses, test them through
counterbalanced and parallel experiments, harden surviving candidates, and emit
a per-type owner-review packet without changing canonical authority.

Primary inputs:

- [Specification](SPEC.md)
- [Architecture](ARCHITECTURE.md)
- [Experiment plan](EXPERIMENTS.md)
- [Accepted UI11 findings](../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md)
- [Existing formalization method](../meta-type-formalization/DESIGN.md)
- [DS-D8 relationship authority](../../definitions/relationships/relationships.yml)

Success condition: all 11 labels have reproducible outcomes; every surviving
candidate has the full human/machine/fixture/test/replication contract; all
other labels have explicit correction and reroute evidence.

## Delivery Slices

| Slice ID | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-UIF-001 | Experiment method proves it can preserve and collapse candidates. | L0 | [W0](work-pack/waves/W0.md) | none | protocol review, YAML parse, deterministic E0 rerun |
| S-UIF-002 | Every UI label receives a provisional evidence outcome. | L1 | [W1](work-pack/waves/W1.md) | S-UIF-001 | result-schema validation, per-lane fixture checks, coverage audit |
| S-UIF-003 | Surviving candidates withstand schemas, validators, replication, and adversarial review. | L2 | [W2](work-pack/waves/W2.md) | S-UIF-002 | focused tests, instance round trip, second-corpus comparison |
| S-UIF-004 | Evidence recomposes into an authority-safe owner packet. | L3 | [W3](work-pack/waves/W3.md) | S-UIF-003 | traceability audit, docs/YAML/JSON parse, scoped diff review |

## Task Status Board

| Task ID | Goal | Layer | Complexity | Waves | Gate status | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [TASK-UIF-BASELINE](work-pack/tasks/TASK-UIF-BASELINE.md) | Freeze hypotheses, corpus contract, and E0 method proof. | L0 | medium | [W0](work-pack/waves/W0.md) | completed | completed |
| [TASK-UIF-LANES](work-pack/tasks/TASK-UIF-LANES.md) | Run three disjoint experiment lanes covering all 11 labels. | L1 | medium | [W1](work-pack/waves/W1.md) | completed | completed |
| [TASK-UIF-ADJUDICATE](work-pack/tasks/TASK-UIF-ADJUDICATE.md) | Join lane evidence into one provisional outcome per label. | L1/L2 | medium | [W2](work-pack/waves/W2.md) | completed | completed |
| [TASK-UIF-CANDIDATES](work-pack/tasks/TASK-UIF-CANDIDATES.md) | Draft and validate complete candidate twins for survivors. | L2 | medium | [W2](work-pack/waves/W2.md) | completed | completed |
| [TASK-UIF-REPLICATE](work-pack/tasks/TASK-UIF-REPLICATE.md) | Replicate surviving results and red-team non-collapse. | L2 | medium | [W2](work-pack/waves/W2.md) | accepted-review-zero-survivors | completed-with-repair-required |
| [TASK-UIF-PACKET](work-pack/tasks/TASK-UIF-PACKET.md) | Assemble per-type owner packet and route residue. | L3 | low | [W3](work-pack/waves/W3.md) | no-replicated-survivors | blocked |
| [TASK-UIF-VERIFY](work-pack/tasks/TASK-UIF-VERIFY.md) | Verify coverage, recomposition, and authority boundaries. | L3 | low | [W3](work-pack/waves/W3.md) | ready-after-packet | not-started |

## SWU Manifest

| SWU | Parent task | Dependencies | Write scope | Done criteria | Acceptance evidence | Validation surface | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SWU-UIF-001 | [BASELINE](work-pack/tasks/TASK-UIF-BASELINE.md) | none | development candidate matrix and decision ledger only | All 11 hypotheses, neighbors, allowed witnesses, forbidden shortcuts, and possible outcomes are frozen. | [Matrix](baseline/CANDIDATE-HYPOTHESIS-MATRIX.md) covers all labels and cites source pressure; [receipt](runs/SWU-UIF-001/TASK-SESSION-RESULT.md). | manual review; `git diff --check` | local-fallback | completed |
| SWU-UIF-002 | [BASELINE](work-pack/tasks/TASK-UIF-BASELINE.md) | UIF-001 | experiment manifest, corpus manifest, E0 fixtures | Result contract and expected outcomes are frozen before execution; provenance is explicit. | [Protocol](experiments/protocol.yml), [corpus](experiments/corpus.yml), [result schema](experiments/result.schema.yml), six fixtures, and [receipt](runs/SWU-UIF-002/TASK-SESSION-RESULT.md) validate. | YAML parse; fixture census review | local-fallback | completed |
| SWU-UIF-003 | [BASELINE](work-pack/tasks/TASK-UIF-BASELINE.md) | UIF-002 | E0 runner/prototype and E0 result paths | Form/Component and Adapter/Mapping results are repeatable and use one protocol version. | [Final summary](experiments/results/e0/final/SUMMARY.md), deterministic results, and [receipt](runs/SWU-UIF-003/TASK-SESSION-RESULT.md). | focused experiment command; result parse | local-fallback | completed |
| SWU-UIF-003A | [LANES](work-pack/tasks/TASK-UIF-LANES.md) | UIF-003; DEC-UIF-W1-RESULT-CONTRACT option 1 | shared W1 contract bridge only | A versioned W1 schema/protocol/runner exists beside immutable E0. | [W1 contracts](experiments/w1/) and [receipt](runs/SWU-UIF-003A/TASK-SESSION-RESULT.md). | YAML parse; runner syntax; E0 mutation guard | local | completed |
| SWU-UIF-004 | [LANES](work-pack/tasks/TASK-UIF-LANES.md) | UIF-003A | Page/Layout/Component fixtures and results only | Composition lane produces complete provisional results. | Three deterministic result records, correction routes, and [completion receipt](runs/SWU-UIF-004/TASK-SESSION-RESULT-COMPLETE.md). | lane experiment command; result-schema check | local-fallback | completed |
| SWU-UIF-005 | [LANES](work-pack/tasks/TASK-UIF-LANES.md) | UIF-003A | View Model/Form/Action/State Indicator fixtures and results only | Data/interaction lane produces complete provisional results. | Four deterministic result records, correction routes, and [receipt](runs/SWU-UIF-005/TASK-SESSION-RESULT.md). | lane experiment command; result-schema check | local-fallback | completed |
| SWU-UIF-006 | [LANES](work-pack/tasks/TASK-UIF-LANES.md) | UIF-003A | Hook/Guard/Binding/Adapter fixtures and results only | Integration/control lane produces complete provisional results. | Four deterministic result records, correction routes, and [receipt](runs/SWU-UIF-006/TASK-SESSION-RESULT.md). | lane experiment command; result-schema check | local-fallback | completed |
| SWU-UIF-007 | [ADJUDICATE](work-pack/tasks/TASK-UIF-ADJUDICATE.md) | UIF-004..006 | result synthesis and gap ledger only | Exactly one provisional outcome is recorded per label; disagreements and refutations remain visible. | [11-row verdict matrix](adjudication/VERDICT-MATRIX.md), [gap ledger](adjudication/GAP-LEDGER.md), and [receipt](runs/SWU-UIF-007/TASK-SESSION-RESULT.md). | coverage script/review; docs parse | local-manual | completed |
| SWU-UIF-008 | [CANDIDATES](work-pack/tasks/TASK-UIF-CANDIDATES.md) | UIF-007 | `candidate-meta-types/ui/`, survivor fixtures/tests | Every schema-ready label gets card, schema, malformed/neighbor fixtures, correction contract, and test. | Nine cards/schemas, 27 black-box fixtures, and [receipt](runs/SWU-UIF-008/TASK-SESSION-RESULT.md). | focused tools tests; content validation | local-fallback | completed |
| SWU-UIF-009 | [CANDIDATES](work-pack/tasks/TASK-UIF-CANDIDATES.md) | UIF-008 | bounded validator rule support and candidate instance tests | Only required bounded rules are added to the experiment harness; generated/mutated instances discriminate. | Total rule map, 9/9 generated accepts, 9/9 mutation rejects, and [receipt](runs/SWU-UIF-009/TASK-SESSION-RESULT.md). | tools tests; instance generate/validate | local-fallback | completed |
| SWU-UIF-010 | [REPLICATE](work-pack/tasks/TASK-UIF-REPLICATE.md) | UIF-008..009; execution-mode approval | second-corpus results and review artifacts only | Portability and non-collapse are independently reviewed; disagreements are adjudicated. | [Accepted findings](replication/findings.md), [replication matrix](replication/REPLICATION-MATRIX.md), and [completion receipt](runs/SWU-UIF-010/TASK-SESSION-RESULT-COMPLETE.md). | repeat experiment suite; review gate | subagent-strategy | completed-with-repair-required |
| SWU-UIF-011 | [PACKET](work-pack/tasks/TASK-UIF-PACKET.md) | UIF-010 with at least one replicated survivor | promotion/no-promotion packet and owner-route ledger only | All 11 labels have evidence, decision question, risks, and next owner. | Packet distinguishes candidate evidence from authority; no canonical mutation. | manual owner-readiness review; `git diff --check` | manual | blocked-no-replicated-survivors |

## Validation Strategy

- Planning artifacts: Markdown links, YAML/JSON parse, dispatch validation,
  `git diff --check`.
- Experiment substrate: manifest/result schema checks and deterministic reruns.
- Candidate criteria: positive, malformed-negative, nearest-neighbor, and
  seeded endpoint violations.
- Candidate instances: generation, validation, targeted mutation rejection.
- Portability: second framework style or justified neutral representation.
- Recomposition: 11-label coverage, no hidden outcomes, no authority leakage.

## Blockers And Gaps

| ID | Scope | State | Owner | Repair path |
| --- | --- | --- | --- | --- |
| GAP-UIF-REAL-CORPUS | experiment lanes | open, non-blocking for synthetic E0 | experiment owner | UIF-002 froze synthetic method fixtures; add real/owner-supplied specimens in type lanes or replication before promotion-ready claims. |
| GAP-UIF-RULE-KINDS | candidate validators | conditional | validation governance | SWU-UIF-009 adds only bounded, tested rules demanded by survivors. |
| GAP-UIF-DS8 | graph coherence | conditional | relationship authority | Emit a change request; never mutate DS-D8 in this package. |
| DEC-DSD1-UI11-PATH | promotion | unresolved outside package | definitions-governance owner | UI evidence may inform but does not consume SWU-DSD1-003. |
| DEC-UIF-W1-RESULT-CONTRACT | W1 experiment contract | resolved - option 1 | user / experiment owner | A versioned shared W1 contract was added beside immutable E0; see the [decision record](runs/SWU-UIF-004/DECISION-W1-RESULT-CONTRACT.md). |
| GAP-UIF-PROMOTION | authority | expected | definitions-governance | Owner reviews SWU-UIF-011 packet in a separate gate. |
| GAP-UIF-NONEMPTY | candidate validation | critical repair required | validation governance | Version presence criteria so empty and whitespace-only values reject, then rerun all candidate evidence. |
| GAP-UIF-REPLICATION-RECEIPTS | replication | major repair required | replication owner | Persist complete mutation, mapped reroute, separating-witness, and normalized corpus receipts before UIF-011. |

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation | Status |
| --- | --- | --- | --- |
| sequence | define to design to plan to Task Session | Every stage consumes explicit artifacts. | pass |
| scu_swu_reduction | hypothesis/result unit and SWUs | One type result is smallest meaningful evidence unit; E0 is smallest method proof. | pass |
| recomposition_proof | per-type results to 11-label packet | Every label appears exactly once in final adjudication. | pass |
| validation_loop | E0, lanes, schemas, replication | Each claim has an evidence and repair path. | pass |
| toy_game | counterbalanced E0 experiment | E0 can yield survival and collapse without protocol changes. | pass |
| owner_boundary_check | package to DS-D1/DS-D8 owners | No experimental artifact claims promotion. | pass |
| artifact_contract_bridge | results to cards/schemas/tests | Survivors require complete human/machine twins. | pass |
| execution_receipt_handoff | Task Session SWUs | Work-pack state advances only from receipts. | pass |
| residue_ledger | non-survivors and gaps | Every non-promotion outcome keeps owner and repair route. | pass |
| observability_grouping | parallel lanes | Receipts join under one dispatch ID and protocol version. | pass |

## Distill Validation

| Check | Result | Evidence or gap |
| --- | --- | --- |
| Smallest coherent unit | pass | One candidate hypothesis plus its full result record; smaller fragments cannot prove discrimination. |
| First executable proof | pass | UIF-001 then counterbalanced E0 avoids all-label overbuild. |
| Recomposition | pass | Lane partition covers 3 + 4 + 4 = all 11 labels and joins through UIF-007. |
| Hidden acceptance gaps | flag | Real corpus must be selected in UIF-002; promotion remains an external owner gate. |
| Deferred complexity | pass | Canonical mutation, semantic solvers, and DS-D8 changes stay outside. |
| Navigation | pass | `SWU-UIF-001..003A` are complete; resume ready lanes `SWU-UIF-004/005/006` using the shared W1 contract. |

Verdict: `flag`. L0 is executable. No promotion-capable route is executable
until experiments, replication, and the external owner decision complete.

## Gate Checks

1. Execute one selected SWU per Task Session receipt.
2. Do not start all-label lanes until E0 passes or a versioned protocol repair
   reruns E0.
3. Parallel lanes must keep disjoint fixture/result paths.
4. No candidate schema before UIF-007 records `candidate-schema-ready`.
5. No canonical schema, definition, registry, or DS-D8 mutation in this package.
6. No promotion packet without real-corpus evidence and portability for each
   proposed survivor.
7. Every rejected or deferred hypothesis remains in the final residue ledger.

## Required Links

- [Architecture](ARCHITECTURE.md)
- [Experiments](EXPERIMENTS.md)
- [Implementation layering](IMPLEMENTATION-LAYERING.md)
- [Distill validation](DISTILL-VALIDATION.md)
- [Execution pack](EXECUTION-PACK.md)
- [Shared context](work-pack/shared/context.md)
- [Cross-task gaps](work-pack/shared/cross-task-gaps.md)
- [Traceability](work-pack/shared/traceability.md)

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-11 | Initial parallel UI formalization work-pack. | invoke |
| 2026-07-11 | Completed SWU-UIF-001; froze 11-label hypothesis matrix and selected UIF-002 next. | task-session |
| 2026-07-11 | Completed SWU-UIF-002; froze E0 protocol/corpus/result contracts and six fixtures; selected UIF-003 next. | task-session |
| 2026-07-11 | Completed SWU-UIF-003; E0 repeated deterministically, W0 closed, and UIF-004/005/006 became ready. | task-session |
| 2026-07-11 | Blocked UIF-004..006 before execution because the frozen E0-only result schema cannot validate W1 records; opened DEC-UIF-W1-RESULT-CONTRACT. | task-session / decision-gate |
| 2026-07-11 | Resolved DEC-UIF-W1-RESULT-CONTRACT with option 1; completed SWU-UIF-003A sibling W1 contract bridge and restored lane readiness. | user / task-session |
| 2026-07-11 | Completed SWU-UIF-004; Page, Layout, and narrow Component produced deterministic provisional separation evidence. | task-session |
| 2026-07-11 | Completed SWU-UIF-005; View Model, Form, and Action produced schema-ready pressure while State Indicator retained split pressure. | task-session |
| 2026-07-11 | Completed SWU-UIF-006 and W1; Hook/Guard/Binding separated, Adapter collapse reproduced, and UIF-007 became ready. | task-session |
| 2026-07-11 | Completed SWU-UIF-007; adjudicated nine schema-ready candidates, Adapter merge, and State Indicator split with all residue retained. | task-session |
| 2026-07-11 | Completed SWU-UIF-008; generated nine candidate twins and passed 27 black-box positive/malformed/neighbor checks without shared validator edits. | task-session |
| 2026-07-11 | Completed SWU-UIF-009; total rule map confirmed, 9/9 instances accepted, 9/9 targeted mutations rejected, and UIF-010 reached its explicit runtime approval gate. | task-session |
| 2026-07-11 | Completed SWU-UIF-010 review with final auditor ACCEPT; all nine candidates remain deferred, zero reach the promotion lane, and UIF-011 is blocked on versioned repair and rerun. | task-session / subagent-strategy |
