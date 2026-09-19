---
module: financial-settlement-executable-test-generation
version: 0.1.0
status: complete
updatedAt: 2026-07-23
docType: work-pack
---

# WORK-PACK: Financial Settlement Executable Test Generation

## Control Fields

| Field | Value |
| --- | --- |
| workPackGateStatus | pass |
| complexity | low |
| outputMode | single-file |
| executionPackRef | n/a |
| layeringArtifactRef | [IMPLEMENTATION-LAYERING.md](IMPLEMENTATION-LAYERING.md) |
| dispatchTechniqueTrace | [DISPATCH-TRACE.md](DISPATCH-TRACE.md) |
| distillValidationStatus | pass |
| swuAtomicityStatus | pass |
| firstUnitNarrownessStatus | pass |
| closeoutSyncStatus | pass |
| activeLayerWindow | L2 |
| readinessProfile | pilot |

## Objective

Generate one runnable structural test for every registered Financial Settlement
node and authored edge, with exact source membership and honest red diagnostics.

## Delivery Slices And Task Board

| Task | Outcome | Layer | Dependency | Status |
| --- | --- | --- | --- | --- |
| TASK-FSTG-SUBSET | Feature-sized exact subset mode without full-profile regression | L0 | none | completed |
| TASK-FSTG-CONFORMANCE | Collecting, full per-node/per-edge evaluators | L1 | SUBSET | completed |
| TASK-FSTG-PROJECT | Exact Financial Settlement source projection | L1 | CONFORMANCE | completed |
| TASK-FSTG-EMIT | Runnable 52-case structural module and report | L2 | PROJECT | completed |
| TASK-FSTG-VERIFY | End-to-end and regression closeout | L2 | EMIT | completed |

## Task Session Closeout Sync Contract

All mutation-capable SWUs use lifecycle owner route
`invoke:refresh:apply-approved` and terminal source receipt contract
`task-session-execution-receipt/v1`. Baselines are the live SHA-256 digests of
the exact target inventory captured during Task Session preflight. The only
admitted deltas are `evidence_added`, `blocker_opened`, `blocker_resolved`,
`status_changed`, and `route_changed`.

| SWU | Declared Target Inventory | Owner Validation | Expected Owner Receipt | Successor Policy |
| --- | --- | --- | --- | --- |
| SWU-FSTG-001 | `WORK-PACK.md`; `INVOKE-EVIDENCE.json` | `python3 projects/domainspec-v2/development/financial-settlement-executable-test-generation/scripts/validate-closeout-state.py` | `refreshes/2026-07-23-swu-fstg-001-closeout/REFRESH-APPLY-RECEIPT.json` | unique declared dependency-ready `SWU-FSTG-002` |
| SWU-FSTG-002 | `WORK-PACK.md`; `INVOKE-EVIDENCE.json` | same validator | `closeouts/SWU-FSTG-002/INVOKE-REFRESH-RECEIPT.json` | unique declared dependency-ready `SWU-FSTG-003` |
| SWU-FSTG-003 | `WORK-PACK.md`; `INVOKE-EVIDENCE.json` | same validator | `closeouts/SWU-FSTG-003/INVOKE-REFRESH-RECEIPT.json` | unique declared dependency-ready `SWU-FSTG-004` |
| SWU-FSTG-004 | `WORK-PACK.md`; `INVOKE-EVIDENCE.json` | same validator | `closeouts/SWU-FSTG-004/INVOKE-REFRESH-RECEIPT.json` | unique declared dependency-ready `SWU-FSTG-VERIFY` |
| SWU-FSTG-VERIFY | `WORK-PACK.md`; `INVOKE-EVIDENCE.json` | same validator | `closeouts/SWU-FSTG-VERIFY/INVOKE-REFRESH-RECEIPT.json` | none; captured frontier complete |

The contract is closeout-only. It grants no implementation, source correction,
promotion, publication, deployment, destructive cleanup, policy, or cost/risk
authority.

## SWU Manifest

### SWU-FSTG-001 — Declared-Subset Mode

- Status: completed; execution and owner closeout receipts joined.
- Parent: TASK-FSTG-SUBSET
- Primary behavior: admit and replay an exact non-empty declared subset while
  keeping complete-profile mode unchanged.
- Independent acceptance: focused subset tests and existing 13/16 test both pass.
- Split analysis: mode envelope and replay identity cannot pass independently;
  splitting would allow an unreplayable mode.
- Dependencies: none.
- Source anchors:
  [`development-engine.ts`](../../impl/test-derivation-engine/src/bte/development-engine.ts),
  [`development-engine.test.ts`](../../impl/test-derivation-engine/src/bte/development-engine.test.ts)
- Write scope:
  `projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.ts`,
  its focused tests, and package scripts only.
- Done: explicit mode, non-empty allowed subset validation, receipt/replay
  binding, complete-profile non-regression.
- Evidence: focused tests plus `npm run verify:bte`.
- Verification:
  `npm --prefix projects/domainspec-v2/impl run verify:bte`
- Execution owner: local-fallback.
- Handoff: start here; do not touch Financial Settlement source.

### SWU-FSTG-002 — Collecting Instance Evaluators

- Status: completed; execution and owner closeout receipts joined.
- Parent: TASK-FSTG-CONFORMANCE
- Primary behavior: materialize independent node/edge conformance results
  without losing sibling cases after one failure.
- Independent acceptance: body and relationship mutants fail their own cases;
  valid siblings remain materialized.
- Split analysis: node and edge validation share the collecting result contract
  but can be implemented in separate commits; retain one SWU because the
  acceptance boundary is complete instance collection.
- Dependencies: SWU-FSTG-001.
- Source anchors:
  [`development-engine.ts`](../../impl/test-derivation-engine/src/bte/development-engine.ts),
  [`proof-engine.ts`](../../impl/test-derivation-engine/src/bte/proof-engine.ts)
- Write scope: BTE development/proof engine modules and focused tests.
- Done: reusable validators, stable diagnostics, compiler parity, full instance
  execution, mutants.
- Evidence: focused mutation and sibling-preservation tests.
- Verification:
  `npx vitest run projects/domainspec-v2/impl/test-derivation-engine/src/bte`
- Execution owner: local-fallback.

### SWU-FSTG-003 — Financial Settlement Projector

- Status: completed; execution and owner closeout receipts joined.
- Parent: TASK-FSTG-PROJECT
- Primary behavior: project every registered node and feature-graph row with
  contained source evidence.
- Independent acceptance: exact 10 nodes/9 kinds/7 edges/6 families and no
  silently dropped row.
- Split analysis: registry, graph, and formation evidence are child stages, but
  none is an executable feature projection alone.
- Dependencies: SWU-FSTG-002.
- Source anchors:
  [Financial Settlement SPEC](../../../../validation/poker-team/docs/features/financial-settlement/SPEC.md),
  [DESIGN.md](DESIGN.md#3-low-level-components-view)
- Write scope: new BTE feature-projector module and its fixtures/tests only.
- Done: deterministic project, provenance, diagnostics, exact census, current
  mapping incompatibility preserved.
- Evidence: projection snapshot and negative containment/anchor tests.
- Verification: focused projector Vitest command defined with the implementation.
- Execution owner: local-fallback.

### SWU-FSTG-004 — Runnable Structural Emission

- Status: completed; execution and owner closeout receipts joined.
- Parent: TASK-FSTG-EMIT
- Primary behavior: emit and run one Vitest case per exact structural TestCase.
- Independent acceptance: 52 unique cases, zero structural todo/skip, stable
  bytes, current invalid edge red.
- Split analysis: rendering and report serialization are one output contract;
  separating them permits count drift.
- Dependencies: SWU-FSTG-003.
- Source anchors:
  [`emit/tests.ts`](../../impl/test-derivation-engine/src/emit/tests.ts),
  [PLAN.md](PLAN.md#task-4--runnable-structural-emitter-and-cli)
- Write scope: new structural emitter/pipeline modules, CLI script, focused
  tests, package script, and selected generated test output.
- Done: CLI, file, report, replay, exact counts, behavioral report unchanged.
- Evidence: transpile, execution, byte-stability, and report assertions.
- Verification: new `verify:bte:financial-settlement` command plus
  `npm --prefix projects/domainspec-v2/impl run engine:test`.
- Execution owner: local-fallback.

### SWU-FSTG-VERIFY — Closure

- Status: completed; execution and owner closeout receipts joined.
- Parent: TASK-FSTG-VERIFY
- Exemption: closure-only VERIFY unit.
- Dependencies: SWU-FSTG-004.
- Write scope: tests/scripts only if a BTE-owned failure requires repair.
- Done: focused route and full engine regression pass; current source reds and
  behavioral gaps are reported, not repaired.
- Evidence:
  `verify:bte:financial-settlement`, `verify:bte`, `engine:test`, targeted
  TypeScript check, whitespace/JSON checks.
- Execution owner: local-fallback.

## Validation And Gate Checks

1. Execute SWUs sequentially in manifest order.
2. One failing source case does not block complete test materialization.
3. Missing or extra structural coverage keys fail generation.
4. Complete-profile counts remain 13 kinds, 16 families, and 89 obligations.
5. Financial Settlement structural target remains 52 exact cases.
6. Behavioral counts remain independently visible.
7. No source, public Arcanum, release, or production mutation is authorized.

## Blockers And Residue

| ID | Type | Description | Route |
| --- | --- | --- | --- |
| R-FSTG-001 | expected structural red | `SettlementRequestToInput maps SettlementResult` conflicts with the current endpoint contract. | Emit the failing test; decide source correction vs contract change separately. |
| R-FSTG-002 | behavioral gap | 67 obligations lack current executable oracles. | Existing hybrid coverage-gap ledger; outside this work-pack. |

## Next Route

The captured work-pack frontier is complete. All five SWUs have joined
execution and lifecycle-owner receipts. The exact 52-case output is verified as
51 passing cases plus the one declared expected red; source or contract repair
for `R-FSTG-001` remains a separate decision outside this work pack.
