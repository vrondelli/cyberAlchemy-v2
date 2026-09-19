# TASK-SFOL-EFFECT-PROOF

## Objective

Complete the generic effect path promised by `DeriveEffectCases` without
consumer-specific semantics.

## Dependencies

SWU-SFOL-008, SWU-SFOL-009, and SWU-SFOL-010 pass. BC-001 is not a causal
dependency; it precedes this unit only by the selected execution policy.

## SWU-SFOL-BC-003

- Primary behavior: derive, bind, run, evaluate, receipt, and replay finite
  effect cases with exact-set closure.
- Inputs: typed module, effect denominator, input-only `EffectFixture`,
  independently sourced `EffectContractAdmission`, trace contracts, effect
  binding selectors, contained harness.
- Outputs: derived effect cases, exact-one bindings, raw observations,
  evaluations, proof receipt, replay receipt.
- Algorithm:
  1. Require every `EffectTraceContract` to appear in an independent contract
     admission bound to its source/proposal digest and proof context. Reject an
     unadmitted contract or contract/source digest mismatch.
  2. Require fixture coverage to equal the effect denominator exactly and emit
     `DerivedEffectCase` bound to module, clause, fixture, and trace-contract
     digests.
  3. Resolve one `EffectBindingRequest` to one `ResolvedEffectBinding` and one
     adapter without expected values.
  4. Carry the admitted contract digest through the derived case, resolved
     binding, raw observation, evaluation, and proof receipt.
  5. Execute the contained harness and preserve raw trace.
  6. Evaluate the clause independently over pre/post/effects/return.
  7. Join case, binding, adapter, contract, trace, and evaluation identities.
  8. Compare all eight stage sets exactly and emit an `EffectProofReceipt`.
  9. Rebuild the receipt from immutable raw artifacts during replay. A fresh
     asynchronous harness run remains separate execution evidence.
- Edge cases: missing/extra/duplicate fixture, unadmitted trace contract,
  contract/source digest mismatch, stale digest, unsupported role, wrong trace
  order/type, implementation mutation, replay mutation.
- Failure modes: expected values in bindings, harness verdict authority,
  partial stage sets, or consumer vocabulary in core.
- Split analysis: derivation and proof cannot pass independently because the
  acceptance boundary is the end-to-end expected-free vertical; evaluator and
  harness already exist as separate prior SWUs.
- Write scope: generic `src/sfol/cases`, `bindings`, `proof`, effect tests, and
  BC-003 session evidence.
- Done criteria: positive exact-set proof/replay passes; trace-contract digest
  is bound to the case and proof; every named negative fails; no Financial
  Settlement identifier appears in core.
- Acceptance evidence: focused suite, engine typecheck, vocabulary scan,
  execution receipt.
- Validation surface: targeted effect-flow test, all SFOL tests, engine
  typecheck.
- Execution owner: local-fallback.
- Handoff: refresh closes G-SFOL-BC-EFFECT and returns SWU-SFOL-BC-004.
