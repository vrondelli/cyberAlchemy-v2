---
task: TASK-SFOL-PURE
layer: L1
slice: S-03
status: dependency-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-PURE

## Objective

Prove a repeatable pure path from typed node clauses to raw implementation
observations, independent judgments, exact proof receipts, and replay.

## Source Contracts

- [SPEC node authoring contract](../../SPEC.md#node-authoring-contract)
- [DESIGN observation boundary](../../DESIGN.md#observation-boundary)
- [interfaces runner interfaces](../../interfaces.md#runner-interfaces)
- [traceability](../shared/traceability.md)

## Dependencies and Gaps

All W0 SWUs must be closed. This task uses core-corpus target fixtures, not an
adopter implementation.

## SWU-SFOL-006

- Primary behavior: resolve exactly one expected-value-free pure binding for
  each executable case role.
- Independent acceptance boundary: exact stable identities resolve; zero,
  multiple, stale, first-match, subset/predicate, wrong-type, and
  expected-value-bearing entries fail.
- Split analysis: registry schema and resolver were considered; only their
  joined resolution proves the behavior.
- Dependencies: SWU-SFOL-005.
- Source anchors: `SPEC.md` invariants 1 and 4; `DESIGN.md` D-SFOL-03.
- Related context: current Financial Settlement first-match binding is a
  negative migration example, not a contract.
- Write scope: `src/sfol/bindings/` and binding fixtures/tests.
- Done criteria: typed role registry, exact identity/digest matching,
  deterministic ordering, explicit stale diagnostics, schema forbids oracle
  fields.
- Acceptance evidence: negative binding matrix, schema test, execution receipt.
- Validation surface: binding tests, typecheck, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-007.

## SWU-SFOL-007

- Primary behavior: derive finite pure cases, call the bound symbol, preserve a
  raw observation, independently judge it, exact-join proof receipts, and
  replay.
- Independent acceptance boundary: one adopter-neutral vertical corpus reaches
  `C_spec = C_projected = C_validated = C_typed = T_generated = C_bound
  = O_run = R_evaluated`; missing, extra, duplicate, skipped, todo, stale,
  indeterminate, and target mutations fail.
- Split analysis: derivation, runner, join, and replay were considered as
  children. This SWU is retained as the minimum end-to-end behavior proving
  that a real target cannot supply its own oracle; isolated plumbing cannot
  answer the L1 decision.
- Dependencies: SWU-SFOL-006.
- Source anchors: `SPEC.md` Definition Of Complete; `DESIGN.md` Workflow
  Process.
- Related context: framework corpus and existing engine emitter/runner
  conventions.
- Write scope: `src/sfol/cases/`, `src/sfol/runners/pure/`,
  `src/sfol/proof/`, focused test emitter/runner integration, corpus tests.
- Done criteria: finite deterministic case IDs, raw-only runner, evaluator
  isolation, exact-set join, allowlisted replay, negative and mutation corpus.
- Acceptance evidence: full pure corpus result/receipts, mutation detection,
  replay output, execution receipt.
- Validation surface: focused integration tests, engine typecheck, dependency
  scans, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-008.

## Synchronization

No adopter-specific rule or path may enter core. The task must not modify
effect contracts or DomainSpec node authoring.
