---
task: TASK-SFOL-EFFECTS
layer: L2
slice: S-04
status: dependency-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-EFFECTS

## Objective

Add bounded, explicit effect observation without weakening pure semantics or
claiming effects the harness cannot observe.

## Source Contracts

- [SPEC language boundary](../../SPEC.md#language-boundary)
- [DESIGN observation boundary](../../DESIGN.md#observation-boundary)
- [interfaces runner interfaces](../../interfaces.md#runner-interfaces)

## Dependencies and Gaps

W1 must be closed. Consumer-specific effect adapters are deferred to adoption.

## SWU-SFOL-008

- Primary behavior: represent finite typed pre/post/effect traces and evaluate
  order-sensitive source relations over them.
- Independent acceptance boundary: complete traces evaluate deterministically;
  missing, extra, reordered, wrong-type, or undeclared observations fail or
  become admitted indeterminate residue.
- Split analysis: effect schema and effect evaluator were considered; one
  without the other cannot express or judge a specified effect.
- Dependencies: SWU-SFOL-007.
- Source anchors: `SPEC.md` DS-SFOL effect relations; `DESIGN.md` Evaluation
  Algebra.
- Related context: L1 value and diagnostic algebra.
- Write scope: `src/sfol/runners/effect/contracts.ts`, evaluator effect
  extensions, effect corpus/tests.
- Done criteria: finite event algebra, explicit ordering semantics, typed
  pre/post projections, observation completeness diagnostics, pure corpus
  non-regression.
- Acceptance evidence: effect relation positive/negative corpus and execution
  receipt.
- Validation surface: effect evaluator tests, pure regression tests, typecheck,
  plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-009.

## SWU-SFOL-009

- Primary behavior: provide a contained harness SPI that captures declared
  pre/post state, calls, writes, events, and errors as raw observations.
- Independent acceptance boundary: one reference harness completes
  setup/run/capture/teardown; leakage, incomplete teardown, undeclared effects,
  timeout, and partial trace each fail visibly.
- Split analysis: setup, run, and teardown were considered; containment is one
  transaction and no phase is independently safe.
- Dependencies: SWU-SFOL-008.
- Source anchors: `interfaces.md` Runner Interfaces; `DESIGN.md` Observation
  Boundary.
- Related context: repository-local test harness conventions resolved at
  execution time.
- Write scope: `src/sfol/runners/effect/` and contained reference-harness tests.
- Done criteria: versioned adapter SPI, resource/timeout policy, deterministic
  trace capture, guaranteed teardown attempt, raw-only output.
- Acceptance evidence: containment matrix, incomplete trace failures, execution
  receipt.
- Validation surface: harness lifecycle tests, typecheck, open-resource checks,
  plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-010.

## Synchronization

Effect work cannot add expected results to adapters or change pure evaluator
meaning. Any required external service is a blocker; the reference harness
must be local and deterministic.
