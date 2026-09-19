# Source Contracts

## 1. FormalClaimIntake/v1

Owner: formal-claims semantics for source meaning; TDE for intake validation.

Required fields: source claim id/digest, FormalClaimSourcePayload/v2 digest, logic id, semantics-profile id/digest, exact assumptions/domain/universe bindings, source_authority_count, relationship handles, and currentness receipt.

Rules:

- source_authority_count must equal 1;
- canonical relation direction is ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning;
- executable_profile and derived capability never enter the source payload;
- TDE rejects rather than repairs missing or stale identity.

## 2. TdeCapabilityDisposition/v1

Owner: validation governance for policy; TDE for deterministic interpretation.

It binds one exact FormalClaimCapabilityAssessment/v1. Primary classification is exactly one of executable-bounded, solver-admissible, proof-provider-required, unsupported, or indeterminate.

The TDE execution slice accepts only an explicitly policy-admitted executable-bounded disposition plus an admissible projection. Solver-admissible remains an EVF/provider route unless separately projected into the TDE slice. Proof-provider-required routes to EVF. Unsupported and indeterminate block.

Typed needs_formal reasons are missing-formal-statement, outside-executable-profile, implementation-oracle-dependence, unsupported-theory-or-language, and indeterminate-classification.

## 3. TdeExecutableProjectionIntake/v1

Owner: validation governance.

This wraps one ExecutableProjectionBinding/v1 with:

- source, assessment, projection, validator, and certificate digests;
- exact purpose and target TDE profile;
- preservation kind and direction;
- assumptions, domain, finite bound, or fixture universe;
- exact-equivalent, counterexample-preserving, witness-preserving, or one-way implication semantics;
- currentness and ceiling.

If preservation is not syntactic by construction, a separately owned certificate/receipt is mandatory. No certificate means no projection. A bounded projection receipt may claim only the declared bound, never the global FormalClaim.

## 4. TdeNeutralObligationIR/v1

Owner: TDE.

Each immutable IR document contains:

- schema/version/digest;
- exact source, assessment, and projection handles;
- obligation_id and case_id;
- normalized inputs, partitions, expected relation or oracle requirement;
- source/projection provenance;
- typed derivation status and residue;
- claim ceiling.

The IR contains no TypeScript, Python, Rust, Lean, SMT, or FOL execution branch. Stable identical admitted inputs produce byte-identical IR.

## 5. TdeImplementationProfileDescriptor/v1

Owner: language profile owner plus validation governance admission.

Required:

- stable profile_id and exact version, never latest;
- descriptor digest and predecessor/compatibility declaration;
- supported obligation/case/evidence kinds;
- renderer adapter id/digest;
- runtime/toolchain binding id/digest;
- provider id/version/digest;
- fixture and receipt normalization contracts;
- admission and currentness receipts;
- unsupported behavior and claim ceiling;
- authority_effect none.

Registry resolution fails on unknown, duplicate id, duplicate axis, conflicting version, stale digest, missing provider, missing admission, or ambient discovery.

## 6. TdeRendererAdapter/v1

Owner: language profile owner.

The adapter is a pure function from neutral IR plus exact descriptor to a rendered artifact and render receipt. It may choose native syntax and framework conventions but cannot change obligation meaning, drop cases, invent expected values, widen the projection, or claim execution.

## 7. TdeRuntimeBinding/v1

Owner: provider owner.

It binds rendered artifact digest, runtime/toolchain identity and digest, provider identity and digest, exact command/entrypoint, environment and fixture digests, timeout policy, raw evidence path/digest, supported result algebra, and ceiling. It is independent for TypeScript, Python, and Rust.

## 8. TdeNormalizedEvidenceReceipt/v1

Owner: TDE normalizer; raw semantics remain provider-owned.

Total outcomes include passed, failed, counterexample-observed, unsupported, indeterminate, timeout, malformed, stale, and provider-error. Only passed within the exact projection/profile/runtime ceiling is a positive TDE execution result. Raw evidence remains reachable.

## 9. TdeSemanticParityReceipt/v1

Owner: parity validator.

For every required lane, compare exact source/projection/neutral-IR identity, obligation IDs, case IDs, normalized outcome class, evidence class, and ceiling. Source bytes and framework-specific diagnostics need not match. Missing lanes, majority-only agreement, case loss, ceiling widening, or stale identity block.

## 10. EvfEvidencePort/v1

Owner: EVF.

TDE emits immutable normalized evidence handles and typed residue. EVF owns provider selection/evidence routing and performs its own source, profile, provider, currentness, and ceiling joins.

The separate Lean path carries exact FormalClaimLeanBinding/v1 and theorem-request/evidence handles. TDE never runs Lean, converts Lean into an ordinary renderer profile, or treats theorem evidence as runtime conformance.

## 11. Existing capability preservation

The current closed-form arithmetic/fold evaluator, exact rational semantics, deterministic ordering, obligation keys, and honesty guard are predecessor capabilities. New contracts wrap or reuse them; they are not reimplemented.

## Contract validation rule

Every future schema and validator needs positive, exact-cause negative, stale, unknown, duplicate, malformed, timeout, and ceiling fixtures where applicable. All Design witnesses in this run are planned, unimplemented, and unexecuted.
