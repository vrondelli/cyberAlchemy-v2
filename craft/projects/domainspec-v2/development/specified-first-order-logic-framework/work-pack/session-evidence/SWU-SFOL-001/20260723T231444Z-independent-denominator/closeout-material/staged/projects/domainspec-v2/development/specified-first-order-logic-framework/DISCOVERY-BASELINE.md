---
module: specified-first-order-logic-framework
version: 0.2.0
status: current
updatedAt: 2026-07-23
docType: discovery-baseline
authority: planning-evidence-only
---

# Discovery Baseline: Specified First-Order Logic Framework

## Question

What general framework is missing between DomainSpec behavioral declarations
and independently grounded executable tests?

## Live Evidence

| Evidence | Selector | Finding |
| --- | --- | --- |
| `impl/test-derivation-engine/src/formal/ast.ts` | `FormalAst`, parser scope | The current parser is a small expression grammar for ternary, range, count-cap, fold, and arithmetic forms. It is not a typed first-order language. |
| `impl/test-derivation-engine/src/formal/eval.ts` | `evalRational`, `evalArith` | Exact rational evaluation exists for a bounded arithmetic subset and correctly returns residue for partial evaluation. |
| `impl/test-derivation-engine/src/emit/tests.ts` | `emitHybridTests` | Runnable tests require both an evaluable source expression and an implementation binding; missing cases become explicit coverage gaps. |
| `impl/test-derivation-engine/bindings/financial-settlement.json` | bindings and `coverage_gaps` | Bindings name code targets without owning expected values, but they are first-match and feature-specific. |
| `validation/poker-team/docs/features/financial-settlement/TEST-SPEC.engine.md` | coverage summary | The feature has 79 behavioral obligations: 24 pure, 54 harness-dependent, and 1 explicitly unformalized. |
| `validation/poker-team/backend/src/domain/__derived__/financial-settlement.derived.test.ts` | generated header | Only 12 assertions and 1 property are runnable; 67 gaps remain. |
| `development/financial-settlement-executable-test-generation/SPEC.md` | non-goals | The completed 52-case package is explicitly structural and does not repair behavioral gaps. |
| `development/first-production-release/backend-type-test-engine-completeness/DEFINE.md` | claim boundary | The BTE package explicitly excludes business truth and FOL completeness. |
| `development/first-production-release/backend-type-test-engine-completeness/DESIGN.md` | reuse/extend/isolate | The current formal AST is reserved as a possible future evaluator adapter, while structural BTE remains independently bounded. |
| `impl/spec/minted-project/node.schema.json` | canonical node envelope | `minted-node/v1` is consumer-owned source, but its admitted per-kind bodies do not carry DS-SFOL logic. |
| `impl/spec/features/ui-profile-create-player/generated/{graph.json,source-manifest.json,build-receipt.json}` | canonical process witness | The node compiler already emits a graph, provenance manifest, and build receipt; downstream semantic work must consume this handle chain instead of parsing Markdown. |
| `development/first-production-release/backend-type-test-engine-completeness/REQUIREMENTS.md` | `DSV2-BTE-R-GRAPH-007` | A disconnected Markdown or feature-document graph cannot establish minted-project completeness. |
| `.craft/ledger.yml` | `FR-FPR-SOLVER-PROFILE` | General solver selection remains a separate blocked production concern; it must not be smuggled into this executable testing framework. |

## Problem Statement

The repository has three partial mechanisms but no one general semantic bridge:

1. deterministic behavioral obligation derivation;
2. a narrow expression evaluator;
3. feature-specific bindings and mixed runnable/skip emission.

The missing bridge is a versioned, typed, bounded specification logic carried
by canonical nodes, with independent clause accounting, exact binding, pure and
effectful observation contracts, deterministic evaluation, and fail-closed
test generation.

## Corrected Source Finding

The first package draft selected Markdown aspect extraction. That route is
invalid. It bypasses the canonical minted-node build, can produce a different
node/edge denominator, and repeats the current feature-projector defect. The
correct source path is:

```text
canonical node source
  -> canonical graph + source manifest + build receipt
  -> NodeLogicEnvelope
  -> DS-SFOL validation/type/evaluation
```

Current `minted-node/v1` has no admitted DS-SFOL payload, so framework-kernel
fixtures may proceed while real adopter execution remains fail-closed behind a
successor node-contract compatibility gate.

## Independent Baseline

The Financial Settlement counts are evidence, not the general denominator:

- 79 behavioral obligations;
- 24 classified pure;
- 54 classified as requiring a runtime/effect harness;
- 1 classified as requiring formalization;
- 12 generated assertions;
- 1 generated property;
- 67 explicit coverage gaps.

The reported 96% source-formalization metric counts only
`pure / (pure + needs-formal)`. It does not establish executable coverage and
does not include the 54 harness-dependent obligations.

## Discovery Verdict

`pass`: sufficient live evidence exists to Define, Design, and Plan a general
framework. No external research or solver choice is required for the first
bounded implementation layers.

## Boundary

- DomainSpec private implementation only.
- No public Arcanum source or private prose is copied into `arcanum/`.
- No full-FOL validity, satisfiability, theorem-proving, temporal-model-checking,
  release, or production claim.
- Financial Settlement is the first realistic adopter, not a core namespace or
  language assumption.
