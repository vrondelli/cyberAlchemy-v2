# TASK-ARE-L1-COMPILER — Build the Positive TypeScript Realization Path

## Objective

Turn frozen definition plus ontology-derived architecture requirements into real,
safe, compiled, observed TypeScript. Layer L1, slice S1, wave W1.

## Smallest Working Units

### SWU-ARE-006 — Normalize portable Enum realization IR

- Primary behavior: exact-join definition snapshot and realization spec into the
  minimal target-neutral `EnumRealizationIR/v1`.
- Independent acceptance: two member pairs survive bijectively; ordering is
  normalized and recorded non-semantic; TypeScript fields and authority claims
  are rejected.
- Split analysis: join validation and IR emission cannot pass independently
  because the IR digest is the join's acceptance artifact.
- Dependencies: SWU-ARE-005.
- Source anchors: Design `EnumRealizationIR/v1`; L0 frozen artifacts.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/enum-realization-ir.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/realization/enum/normalize-enum-realization.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/normalize-enum.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-006.json`
- Done criteria: exact input handles, no target fields, deterministic digest,
  duplicate/cardinality/type mismatch deaths.
- Validation: focused `normalize-enum.test.ts` Vitest plus shared typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt with IR digest and negative matrix.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-006`.

### SWU-ARE-007 — Emit safe deterministic owned const-object TypeScript

- Primary behavior: emit exact provider import, const export, and `EnumValue`
  type export from IR plus target binding.
- Independent acceptance: output reparses to the admitted structure and two
  consecutive emissions are byte-identical; every hostile input dies before
  usable source publication.
- Split analysis: emission, safe literal encoding, and post-print reparse are one
  data-to-code safety boundary; separating them permits unvalidated bytes.
- Dependencies: SWU-ARE-006.
- Algorithm: validate handles; construct AST or safe-printer nodes; serialize;
  parse; re-extract import/export/member records; exact-compare; canonical-format;
  re-emit and compare.
- Edge cases: quotes/newlines/Unicode escapes, `__proto__`, reserved identifiers,
  path traversal, import impersonation, missing/extra members, nondeterministic
  object iteration.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/generated-source.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/generator/enum/emit-enum.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/emitter.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-007.json`
- Done criteria: emitted source is the selected `defineEnum({...} as const)` plus
  `EnumValue<typeof OrderStatus>` protocol, never native `enum`; no catalogue or
  expected-results import.
- Validation: focused `emitter.test.ts` Vitest plus shared typecheck and a
  structural forbidden-import check in the test.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt with source digest, repeat digest,
  hostile case count, and reparse result.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-007`.

### SWU-ARE-008 — Compile in a mirrored workspace with independent witnesses

- Primary behavior: create one safe isolated workspace and record pinned compile,
  literal-union, exact-provider, runtime-value, and runtime-freeze evidence.
- Independent acceptance: positive source compiles; independently derived type
  witness proves exactly `"pending" | "paid"`; runtime object has exact values and
  `Object.isFrozen(...) === true`.
- Split analysis: workspace mirroring and compiler/runtime execution form one
  reproducible build boundary because exact provider path/digest validation
  depends on the mirrored layout. Witness assertions remain separately
  digest-owned inside that boundary.
- Dependencies: SWU-ARE-007 and snapshot-bound active catalogue SWU-ARE-015.
- Edge cases: pre-existing target, symlink, `..`, absolute path, stale provider
  digest, different tsc/config, witness emitted by generator, plain `as const`
  object, native enum.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/realization/contracts/compile-result.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/compiler/enum/compile-generated-enum.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/compiler/enum/derive-type-witness.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/compiler.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-008.json`
- Done criteria: exact byte refs for copied inputs and tool/config; normalized
  diagnostics; no source fragments; workspace outside canonical product output;
  cleanup limited to its authenticated exact target.
- Validation: focused `compiler.test.ts` Vitest plus shared typecheck.
- Execution owner: `subagent` or Task Session local fallback.
- Expected result shape: standard SWU receipt plus `CompileResult/v1` fixture and
  exact tool/workspace handles.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-008`.

### SWU-ARE-009 — Add a no-expectations generated-source observation entry point

- Primary behavior: observe actual generated member records/provenance without a
  caller-supplied expected value set.
- Independent acceptance: generated source yields exactly `Pending/pending` and
  `Paid/paid`; attempted expected-value injection is absent or rejected; legacy
  adapter tests remain green.
- Split analysis: new entry point and regression test share the one compatibility
  boundary; the change is incomplete if either new semantics or legacy behavior
  is unverified.
- Dependencies: SWU-ARE-008.
- Write scope:
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/adapter/enum/index.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/realization-tests/enum/generated-observation.test.ts`
  - `projects/domainspec-v2/impl/architecture-conformance/typescript/adapter-tests/enum/adapter.test.ts`
  - `projects/domainspec-v2/development/architecture-realization-compiler/receipts/SWU-ARE-009.json`
- Done criteria: legacy exported behavior remains compatible; new contract emits
  only observed/provenance facts; exact provider identity check remains strict;
  unsupported forms fail closed.
- Validation:
  - focused `generated-observation.test.ts`;
  - existing `architecture-conformance/typescript/adapter-tests/enum/adapter.test.ts`;
  - shared realization and existing adapter test `tsconfig.json` typechecks.
- Execution owner: `subagent` or Task Session local fallback; inspect live dirty
  state before touching the shared adapter files.
- Expected result shape: standard SWU receipt with new/legacy test counts and
  before/after shared-file baseline.
- Closeout: `../shared/CLOSEOUT-CONTRACT.md#swu-are-009`.

## Synchronization

W1 is sequential. The compiler and observation entry points consume source bytes
from the emitter but never catalogue expectations. Shared adapter changes require
exact baseline capture and must preserve unrelated user edits.
