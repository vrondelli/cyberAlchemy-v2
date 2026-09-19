---
module: specified-first-order-logic-framework
status: current
updatedAt: 2026-07-23
docType: work-pack-context
---

# Shared Execution Context

## Authority and Claim Boundary

- [SPEC.md](../../SPEC.md) owns the planned DS-SFOL behavior and invariants.
- [DESIGN.md](../../DESIGN.md) owns component and dependency decisions.
- [WORK-PACK.md](../../WORK-PACK.md) is the canonical executable plan.
- DomainSpec aspect documents own adopter business meaning.
- Bindings, generated tests, observations, and receipts are adapters or
  evidence; none is semantic or promotion authority.
- Structural BTE remains a separate evidence lane.

## Brownfield Anchors

Execution-time Context Builder should resolve current selectors rather than
copying planning snapshots:

- `projects/domainspec-v2/impl/test-derivation-engine/src/formal/ast.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/formal/eval.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/bindings/`
- existing test-derivation engine validation scripts and tests

The current evaluator is useful compatibility evidence, not the DS-SFOL v1
authority. Existing first-match feature bindings must not be generalized into
the new exact-one binding contract.

## Global Invariants

1. `C_spec = C_parsed = C_typed = T_generated = C_bound = O_run = R_evaluated`
   by identity and compatible digest, not count alone.
2. Denominator code imports no generation/execution/evaluation output module.
3. Evaluator code imports no implementation target or consumer harness.
4. Bindings contain no expected answer or correctness predicate.
5. Unsupported or missing admitted evidence becomes failing typed residue.
6. Core code and corpus contain no adopter-specific vocabulary or paths.

## Validation Baseline

Each SWU runs its targeted tests, the engine typecheck, and the package plan
validator. Wave exits add the exact negative, mutation, and replay checks named
in their contracts. Existing aggregate `npm run validate` is supporting
evidence only and cannot replace omitted focused suites.

## Handoff Rule

Task Session builds a strict, live execution context from the selected task,
SWU, source anchors, current code, dependencies, and validation surfaces. It
executes one SWU and stops at the terminal receipt.
