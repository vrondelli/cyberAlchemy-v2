---
task: TASK-SFOL-LANGUAGE
layer: L0
slice: S-02
status: dependency-gated
updatedAt: 2026-07-23
---

# TASK-SFOL-LANGUAGE

## Objective

Implement the bounded DS-SFOL v1 language pipeline without expanding into full
FOL, external solvers, or implementation execution.

## Source Contracts

- [SPEC language boundary](../../SPEC.md#language-boundary)
- [DESIGN typed representations](../../DESIGN.md#typed-intermediate-representations)
- [operations](../../operations.md)
- [shared decisions](../shared/cross-task-decisions.md)

## Dependencies and Gaps

SWU-SFOL-001 must be closed before the first language mutation. No feature
source approval is needed because this task uses the adopter-neutral core
corpus.

## SWU-SFOL-002

- Primary behavior: define the versioned discriminated AST, type/sort shapes,
  source spans, diagnostic algebra, value algebra, and profile registry.
- Independent acceptance boundary: representative v1 structures compile,
  serialize deterministically, and exhaustively reject unknown tags/versions.
- Split analysis: AST and diagnostics were considered separately, but callers
  require one closed result/failure contract to use either safely.
- Dependencies: SWU-SFOL-001.
- Source anchors: `SPEC.md` Language Boundary and Source Authoring Contract.
- Related context: current `src/formal/ast.ts` is compatibility input, not a
  shape constraint.
- Write scope: `src/sfol/language/ast.ts`,
  `src/sfol/language/contracts.ts`, profile registry, and focused tests.
- Done criteria: exhaustive v1 nodes, no `any` escape, deterministic JSON
  shape, source identity preserved, unsupported versions fail closed.
- Acceptance evidence: compile/type tests, schema snapshots, exhaustive-switch
  test, execution receipt.
- Validation surface: targeted Node tests, engine typecheck, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-003.

## SWU-SFOL-003

- Primary behavior: parse and normalize `domainspec-logic` text into the
  versioned parsed representation with source spans.
- Independent acceptance boundary: the v1 positive corpus normalizes
  deterministically and the negative corpus emits stable diagnostics without a
  partial admitted module.
- Split analysis: lexer and parser children were considered; neither alone
  accepts or rejects a coherent source clause.
- Dependencies: SWU-SFOL-002.
- Source anchors: `SPEC.md` Language Boundary; `DESIGN.md` Language Kernel.
- Related context: simple current formal expression examples.
- Write scope: `src/sfol/language/parser.ts`, normalization helpers, parser
  fixtures/tests.
- Done criteria: all admitted v1 syntax parsed, comments/spacing normalize,
  duplicate declarations fail, spans remain stable, unsupported syntax is
  typed residue.
- Acceptance evidence: golden normalized corpus, negative diagnostic corpus,
  execution receipt.
- Validation surface: parser corpus tests, typecheck, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-004.

## SWU-SFOL-004

- Primary behavior: resolve every declaration, term, quantifier universe,
  effect field, and result to a closed type or reject the module.
- Independent acceptance boundary: a parsed corpus yields a fully typed module;
  unknown fields, ambiguous numerics, incompatible comparisons, unbounded
  quantifiers, and invalid effects fail.
- Split analysis: general type resolution and finite-domain validation were
  considered; both are required for one closed executable typed module.
- Dependencies: SWU-SFOL-003.
- Source anchors: `SPEC.md` Language Boundary and invariant 8.
- Related context: fixture universe contract in `GLOSSARY.md`.
- Write scope: `src/sfol/language/typecheck.ts`, type environment helpers, type
  fixtures/tests.
- Done criteria: no unresolved type variables, explicit rational coercions,
  finite quantifiers, exhaustive clause-kind rules, stable diagnostics.
- Acceptance evidence: positive/negative type corpus and execution receipt.
- Validation surface: typechecker tests, engine typecheck, plan validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-005.

## SWU-SFOL-005

- Primary behavior: independently evaluate typed pure terms and predicates over
  a finite environment using exact integer/rational values.
- Independent acceptance boundary: the evaluator passes an adopter-neutral
  semantic corpus and returns typed `indeterminate` for absent or unsupported
  evidence without importing target code.
- Split analysis: arithmetic and predicate evaluators were considered; their
  shared exact value/error algebra and nested expressions form one smallest
  coherent semantic boundary.
- Dependencies: SWU-SFOL-004.
- Source anchors: `SPEC.md` Language Boundary and invariant 3;
  `DESIGN.md` Evaluation Algebra.
- Related context: current `src/formal/eval.ts` as brownfield compatibility
  evidence.
- Write scope: `src/sfol/evaluator/` and evaluator corpus/tests.
- Done criteria: exact rational arithmetic, deterministic folds and finite
  quantifiers, total typed outcomes, no target/harness imports, negative
  dependency test.
- Acceptance evidence: semantic corpus, mutation cases, dependency scan,
  execution receipt.
- Validation surface: evaluator tests, typecheck, dependency scan, plan
  validator.
- Execution owner: local-fallback.
- Handoff: terminal receipt; refresh selects SWU-SFOL-006.

## Synchronization

Each SWU may use contracts closed by predecessors but cannot revise them
silently. A required contract change opens a blocker and returns to Invoke
refresh.
