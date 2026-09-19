---
module: language-type-enforcement-parser-experiment
feature_code: LTE
version: current
status: planned
updatedAt: 2026-07-17
docType: work-pack
authority: non-authority execution plan
---

# WORK-PACK: Language Type-Enforcement Parser Experiment

## Start Here

Read [CONTEXT.md](CONTEXT.md), [ARCHITECTURE.md](ARCHITECTURE.md), this file,
then the selected task contract. The only selected mutation-capable handoff is
[SWU-LTE-001](work-pack/tasks/TASK-LTE-01-REGISTRY-KERNEL.md#swu-lte-001).

## Control Fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | `pass` | Independent Proposer and Balancer reconciliation passed; execution still requires the dirty-overlap preflight. |
| complexity | `medium` | More than two implementation artifacts and algorithmic parser work require split planning. |
| outputMode | `split` | Task/SWU detail and wave choreography are separated. |
| executionPackRef | [EXECUTION-PACK.md](EXECUTION-PACK.md) | Required medium-complexity handoff. |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) | L0-L3 decision boundaries. |
| dispatchTechniqueTrace | `sequence`, `scu_swu_reduction`, `recomposition_proof`, `validation_loop`, `owner_boundary_check`, `handle_handoff`, `residue_ledger`, `execution_receipt_handoff` | Mapped below. |
| distillValidationStatus | `pass` | Recomposition closes with zero acceptance-critical residuals. |
| activeLayerWindow | `L0` | No L1-L3 source work is authorized. |
| lastUpdatedAt | `2026-07-17` | Planning date. |
| readinessProfile | `pilot` | This is an experiment, not a release claim. |

## Objective Summary

- Objective: implement and witness `RegistryParsedCompletely(spec)` through one
  shared pure kernel and both current consumer surfaces.
- Primary inputs: accepted findings, the Distill-passed architecture, current
  validator/parser implementations, and existing tests.
- Success condition: eight isolated registry mutations reject with the same
  frozen code through both consumers; all three current packs preserve exact
  positive declarations/counts/results; no profile/schema decision enters the
  kernel.

## Complexity Decision

This plan is `medium`: it has four tasks, but implementation produces or changes
more than two artifacts (kernel, package export, two adapters, focused tests,
parity harness). It has no cross-repository change, migration, irreversible
operation, cross-team ownership, or unresolved acceptance blocker, so it is not
high complexity.

## Delivery Slices

| Slice | Outcome | Layer | Wave | Dependencies | Validation |
| --- | --- | --- | --- | --- | --- |
| S-001 | Pure kernel deterministically classifies the frozen grammar with exact accounting. | L0 | [W0](work-pack/waves/W0-L0-FOUNDATION.md) | approved design | focused kernel tests, root/engine typecheck, engine build |
| S-002 | Content validator consumes the kernel and fails closed with compatible code-bearing output. | L0 | [W1](work-pack/waves/W1-L0-CONSUMER-PARITY.md) | SWU-LTE-001 | focused content-validator tests |
| S-003 | Normalized parser consumes the kernel and both consumer surfaces demonstrate eight-case parity without positive drift. | L0 | [W1](work-pack/waves/W1-L0-CONSUMER-PARITY.md) | SWU-LTE-001, SWU-LTE-002 | engine tests, consumer parity harness, three-pack snapshots |
| S-004 | L0 evidence is independently rerun and recorded. | L0 | [W1](work-pack/waves/W1-L0-CONSUMER-PARITY.md) | SWU-LTE-003 | full validation matrix and Task Session receipt |

## Task Status Board

| Task | Goal | Layer | Complexity | Wave | Gate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [TASK-LTE-01](work-pack/tasks/TASK-LTE-01-REGISTRY-KERNEL.md) | Implement the pure kernel and supported package export. | L0 | medium | W0 | ready; SWU-LTE-001 selected | not-started |
| [TASK-LTE-02](work-pack/tasks/TASK-LTE-02-CONTENT-ADAPTER.md) | Replace content-validator silent skips with total kernel mapping. | L0 | medium | W1 | waits for SWU-LTE-001 | not-started |
| [TASK-LTE-03](work-pack/tasks/TASK-LTE-03-ENGINE-PARITY.md) | Integrate the normalized parser and witness consumer-surface parity. | L0 | medium | W1 | waits for SWU-LTE-001/002 | not-started |
| [TASK-LTE-VERIFY](work-pack/tasks/TASK-LTE-VERIFY.md) | Rerun and record the complete L0 evidence matrix. | L0 | medium | W1 | waits for SWU-LTE-003 | not-started |

## SWU Manifest

| SWU | Parent | Goal | Dependencies | Write scope | Done criteria | Acceptance evidence | Validation | Owner | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **SWU-LTE-001** | [TASK-LTE-01](work-pack/tasks/TASK-LTE-01-REGISTRY-KERNEL.md) | Pure frozen-grammar classifier and package subpath. | none | `impl/test-derivation-engine/package.json`; new `src/grammar/concept-registry-parser.ts`; new focused test | all grammar branches, primary precedence, accounting, purity, and export compile | canonical positive; eight exact code/subject/detail rows; multi-fault precedence | focused test; root/engine typecheck; engine build; root and subpath runtime smoke imports | `subagent` preferred, `local-fallback` allowed | **selected**; Task Session builds strict context from task anchors |
| SWU-LTE-002 | [TASK-LTE-02](work-pack/tasks/TASK-LTE-02-CONTENT-ADAPTER.md) | Content adapter consumes result and stops malformed-file work. | SWU-LTE-001 | `impl/tools/validate-content.ts`; `impl/tools/tests/validate-content.test.ts` | total code mapping, compatible carrier/prose/exit, eight cases, positive counts preserved | CLI assertions on status/output plus current pack regression | `node --import tsx --test tools/tests/validate-content.test.ts` | `subagent` preferred, `local-fallback` allowed | ready after SWU-LTE-001 receipt |
| SWU-LTE-003 | [TASK-LTE-03](work-pack/tasks/TASK-LTE-03-ENGINE-PARITY.md) | Engine adapter plus end-to-end parity and three-pack equality. | SWU-LTE-001, SWU-LTE-002 | `impl/test-derivation-engine/src/grammar/index.ts`; `src/grammar/normalized-spec.test.ts`; new `impl/tools/tests/concept-registry-parity.test.ts` | total engine mapping, early rejected-file stop, all parity rows exact, existing graph/obligation evidence unchanged | focused engine assertions, spawned CLI parity matrix, declaration/node/count snapshots | focused engine test + parity test + `npm run engine:test` | `subagent` preferred, `local-fallback` allowed | ready after SWU-LTE-002 receipt |

TASK-LTE-VERIFY is closure-only and has an SWU exemption: it mutates no source,
adds no domain logic, and only reruns the declared commands and records their
results in the owning Task Session receipt.

## Dependency Plan

```text
SWU-LTE-001 kernel/export
  -> SWU-LTE-002 content adapter
    -> SWU-LTE-003 engine adapter + consumer parity
      -> TASK-LTE-VERIFY closure receipt
```

The sequence is intentionally serial because later tasks import and test prior
write scopes. No parallel source mutation is planned.

## Validation Strategy

Run from `projects/domainspec-v2/impl` unless stated otherwise:

1. focused kernel: `npm -w @domainspec/test-derivation-engine run test -- src/grammar/concept-registry-parser.test.ts`;
2. content surface: `node --import tsx --test tools/tests/validate-content.test.ts`;
3. engine surface: `npm -w @domainspec/test-derivation-engine run test -- src/grammar/normalized-spec.test.ts`;
4. parity surface: `node --import tsx --test tools/tests/concept-registry-parity.test.ts`;
5. build/type: `npm run typecheck`, `npm -w @domainspec/test-derivation-engine run typecheck`, and `npm -w @domainspec/test-derivation-engine run build`;
6. relevant full suites: `npm run validate:content`, `npm run tools:test`, and `npm run engine:test`;
7. planning/docs closeout from the repository root: `npm --prefix projects/domainspec-v2/impl run validate:docs` and scoped `git diff --check`.

Exact-cause acceptance requires the expected `[LTE-*]` code, the expected
status, and absence of unrelated schema/graph/profile failures. A broad failing
exit or full-suite green result cannot substitute for the parity assertions.

## Blockers, Gaps, And Residue

| ID | Scope | State | Owner | Route |
| --- | --- | --- | --- | --- |
| LTE-G1 | profile/schema admission, including unknown types | deferred; non-blocking for L0 | FPR-02/profile owner | resume only through FPR-02 Decision Gate |
| LTE-G2 | durable parser manifest/receipt schema | deferred; non-blocking | parser/observability owners | reconsider after L0 evidence |
| LTE-G3 | TypeScript/Lean or other projection | deferred; non-blocking | formalization/definitions owners | L3 only after explicit preservation design |
| LTE-G4 | concurrent edits to any planned source file | runtime preflight; potentially blocking | Task Session coordinator | block, refresh context, and replan overlap; never merge silently |
| LTE-G6 | current `tools:test` baseline is 99/101 because four FPR backend-completeness files are unclassified by the retired-orchestration guard | non-blocking for SWU-LTE-001; blocking for final L0 close while unresolved | FPR backend-completeness / retired-orchestration guard owner | classify or explicitly adjudicate the four files in a separate owner route; do not widen LTE source scope |

There is no unresolved blocker to planning or SWU-LTE-001. LTE-G4 is a
fail-closed execution precondition, not current evidence of overlap. LTE-G6 is
a pre-existing, out-of-scope closure gap discovered after plan Distill; the
experiment may execute focused SWUs, but L0 cannot claim complete validation
while the baseline remains red.

## Dispatch Technique Trace

| Technique | Applied to | Validation expectation | Status |
| --- | --- | --- | --- |
| `sequence` | W0 -> W1 -> verification | dependency order matches imports and receipts | pass |
| `scu_swu_reduction` | one selected SWU-LTE-001 | first handoff is independently executable and meaningful | pass |
| `recomposition_proof` | kernel -> adapters -> parity -> L0 judgment | all three SWUs close the approved design without adding profile logic | pass |
| `validation_loop` | every slice/SWU | each has exact commands and evidence | pass |
| `owner_boundary_check` | L0 vs FPR-02 and authority definitions | no admission/promotion work appears | pass |
| `handle_handoff` | design paths -> Work Pack -> task/SWU | workers navigate by links/selectors, not copied hidden context | pass |
| `residue_ledger` | LTE-G1-G4 | every deferral has owner and route | pass |
| `execution_receipt_handoff` | Task Session closure | execution reports files, commands, codes, counts, residue | pass |

A full dispatch JSON remains unnecessary: one serial repository-local route has
no parallel agent graph, protected-context transfer, promotion stage, or
multi-owner handoff.

## Distill Validation

Independent Proposer and Balancer reconciliation returned `PASS`. The selected
SWU closes as a pure buildable parser/export unit; the serial SWU chain
recomposes into the approved L0 evidence boundary. See
[PLAN-DISTILL-VALIDATION.md](PLAN-DISTILL-VALIDATION.md).

## Mutation-Capable Handoff Gate

Before executing the selected SWU, Task Session must:

1. build strict Markdown plus JSON/index context from the task anchors;
2. confirm the working tree still has no concurrent modifications in the
   selected SWU write scope;
3. select exactly SWU-LTE-001 and no later SWU;
4. preserve all unrelated dirty work; and
5. return the standard SWU result shape: ID, result, files touched, validation,
   blockers, residue, reroute, and handoff note, using
   [the shared receipt schema](work-pack/shared/execution-receipt-schema.md).

## Coordinator Synchronization Boundary

SWU implementers are restricted to their task-local source write scopes. After
each worker returns, the parent Task Session coordinator alone may write:

- `projects/domainspec-v2/development/language-type-enforcement-parser-experiment/runs/<SWU-ID>/TASK-SESSION-RESULT.md`;
- this Work Pack's status fields and boards;
- the executed task contract's status;
- the active wave status; and
- the Execution Pack wave board.

Those coordinator writes record receipts and state only; they may not repair
source or widen an SWU. The concrete receipt path is fixed before execution and
returned in `receipt_artifact`.

## Expected Diagnostic Matrix

Every row binds the kernel result and both emitted consumer surfaces. `Subject`
is exact. `Required detail` is an exact stable fragment; source label and line
number remain carrier fields and may differ by fixture path.

| Mutation | Code | Subject | Required detail |
| --- | --- | --- | --- |
| missing section | `LTE-REGISTRY-MISSING-SECTION` | `Concept Registry` | `normalized dialect requires a Concept Registry table; section is missing` |
| duplicate section | `LTE-REGISTRY-AMBIGUOUS-STRUCTURE` | `Concept Registry` | `multiple Concept Registry sections` |
| missing table | `LTE-REGISTRY-MISSING-TABLE` | `Concept Registry` | `normalized dialect requires a Concept Registry table; section contains no table` |
| multiple table blocks | `LTE-REGISTRY-AMBIGUOUS-STRUCTURE` | `Concept Registry` | `multiple Concept Registry table blocks` |
| non-canonical header | `LTE-REGISTRY-NONCANONICAL-HEADER` | `Concept Registry` | `non-canonical Concept Registry; expected Concept|Type` |
| non-canonical separator | `LTE-REGISTRY-NONCANONICAL-SEPARATOR` | `Concept Registry` | `Concept Registry separator requires exactly two cells with at least three dashes` |
| empty registry | `LTE-REGISTRY-EMPTY` | `Concept Registry` | `Concept Registry must declare at least one concept` |
| incomplete row | `LTE-REGISTRY-INCOMPLETE-ROW` | `Concept Registry` | `Concept Registry row requires exactly one non-empty Concept and Type` |

An assertion on code/status without the bound subject and cause/detail is
insufficient. Adapter prose may add carrier context but may not replace these
fragments.
