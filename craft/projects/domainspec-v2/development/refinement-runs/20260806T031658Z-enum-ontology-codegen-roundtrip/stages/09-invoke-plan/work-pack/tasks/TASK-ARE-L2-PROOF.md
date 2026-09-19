# TASK-ARE-L2-PROOF — Prove, Mutate, Persist, and Replay Independently

## Objective

Turn generated-source evidence into a discriminating architecture verdict whose
lineage and reconstruction do not depend on compiler self-authorship. Layer L2,
slice S2, wave W2.

## Smallest Working Units

### SWU-ARE-010 — Implement the independent member-bijection evaluator

- Primary behavior: exact-join frozen catalogue and observed facts and emit total
  `ArchitectureEvaluation/v1` findings.
- Independent acceptance: positive `OrderStatus` passes; missing, unexpected,
  changed, duplicate, ambiguous, unsupported, and stale-handle fixtures each
  yield the exact code/cardinality.
- Split analysis: exact admission, cardinality preservation, identifier mapping,
  and value comparison are inseparable parts of one bijection decision; splitting
  them would expose partial pass states.
- Dependencies: SWU-ARE-009 and snapshot-bound active catalogue SWU-ARE-015.
- Algorithm: validate all case handles; reject caller expectation facts; preserve
  arrays and duplicate counts; map target IDs through binding; construct expected
  and observed relations; compare both directions and per-value; account every
  obligation once.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-evaluation.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/evaluator/evaluate-enum-bijection.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/evaluator/forbidden-imports.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/evaluator.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-010.json`
- Done criteria: evaluator imports only contracts/pure comparison utilities;
  full matrix exact; unaccounted obligations zero; authority effect none.
- Validation: focused `evaluator.test.ts` plus shared typecheck; forbidden-import
  test enumerates transitive imports and fails on any forbidden surface.
- Execution owner: `subagent` or Task Session local fallback, distinct conceptual
  owner from the emitter.
- Expected result shape: standard SWU receipt with case/code matrix and import
  graph digest.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-010`.

### SWU-ARE-011 — Derive one causal AST member-removal mutation

- Primary behavior: derive a fresh child by removing exactly the binding-selected
  `Paid` property from the exact green source.
- Independent acceptance: normalized AST delta is exactly one property deletion;
  child reparses and compiles; evaluator yields only
  `ARCH_ENUM_MEMBER_MISSING` for `status.paid`.
- Split analysis: AST derivation and exact mutation death must remain one unit;
  otherwise a syntactic deletion could be accepted without proving semantic
  causality.
- Dependencies: SWU-ARE-010 and green source/compile evidence from SWU-ARE-008.
- Edge cases: multiple Paid nodes, missing binding, text occurrence outside object,
  printer changes beyond normalized formatting, child identical to parent,
  compiler failure, extra evaluator codes.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-mutation.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/mutation/remove-enum-member.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/mutation.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-011.json`
- Done criteria: parent/child/delta/tool digests; fresh child target; exact phase and
  code; no test oracle rewritten.
- Validation: focused `mutation.test.ts` plus shared typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt plus `ArchitectureMutation/v1`
  payload and positive/mutant evaluation refs.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-011`.

### SWU-ARE-012 — Enforce proof lifecycle and atomic evidence publication

- Primary behavior: admit only legal proof-state transitions and atomically
  publish a complete run evidence index.
- Independent acceptance: the positive/mutation input reaches
  `mutation-killed`; skipped/out-of-order state, duplicate completion, concurrent
  writer, partial temp target, overwrite, symlink, path escape, or missing handle
  terminates blocked without `proof-complete`.
- Split analysis: lifecycle guard and writer publication are one completion
  boundary because a state is trustworthy only when its raw evidence is durably
  bound; neither can independently authorize completion.
- Dependencies: SWU-ARE-011.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-realization-case.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/architecture-proof-receipt.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/evidence/proof-state.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/evidence/write-proof-run.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/evidence-writer.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-012.json`
- Done criteria: single-writer temp/validate/rename; no overwrite; opaque paths and
  normalized diagnostics; explicit supersedes link; proof-complete impossible
  before replay.
- Validation: focused `evidence-writer.test.ts` plus shared typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt with state-transition matrix and
  atomic-publication fixture refs.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-012`.

### SWU-ARE-013 — Reconstruct raw evidence in a separate replay process

- Primary behavior: recompute definition/spec/IR/source/compiler/observation/
  evaluation/mutation outputs from raw handles in a new workspace and process.
- Independent acceptance: normalized positive and mutation results are
  byte-identical; deleting a raw input or substituting a precomputed verdict
  blocks with exact replay codes.
- Split analysis: child-process isolation and complete reconstruction are one
  independence claim; either alone permits receipt-only replay.
- Dependencies: SWU-ARE-012.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/replay-result.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/replay/replay-enum-proof.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/replay/child-entry.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/replay.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-013.json`
- Done criteria: separate PID/workspace evidence; no original in-memory objects;
  all raw handles reachable; exact missing/tampered handle failures; transition to
  `replayed`, not yet end-to-end closeout.
- Validation: focused `replay.test.ts` plus shared typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt plus `ReplayResult/v1` and child
  process/workspace handles.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-013`.

## Synchronization

W2 is sequential. Evaluator and catalogue imports remain independent; mutation
derives only from a green parent; replay reads only atomic run evidence.
