---
module: test-derivation-engine-next-epoch
candidate_id: dsv2-tde-multiformalism-profile-epoch@1
status: pre-admission-plan-candidate
authority: private-development-candidate
updatedAt: 2026-08-24
---

# Specification: TDE Multiformalism Profile Epoch

## Problem

The current Test Derivation Engine deterministically derives tests from a bounded document and expression grammar. FormalClaim @3 now supplies a logic-neutral source envelope that can contain FOL or native Lean/DTT propositions, while implementation-conformance work supplies candidate TypeScript, Python, and Rust profile substrate. TDE needs one explicit boundary for consuming these inputs without becoming a general theorem prover, SMT solver, FOL solver, or source-meaning owner.

## Objective

Given one exact current FormalClaim, its logic-semantics profile, a validation-governance capability assessment, and zero or one admitted preservation-backed executable projection, TDE will:

1. verify source_authority_count equals 1 and all identities are exact and current;
2. deterministically classify whether its declared slice may derive test obligations;
3. produce one language-neutral obligation/case IR;
4. render semantically equivalent test cases through separately admitted TypeScript, Python, and Rust output profiles; and
5. return normalized evidence or typed non-pass residue to EVF.

## Plain-language model

FormalClaim is the legal text. Validation governance is the clerk who says which court can hear it. TDE is a form generator: it may turn an admitted, meaning-preserving slice into test cases. TypeScript, Python, and Rust render those same cases in their own native form. EVF carries the receipts, while providers run the actual tools.

For example, an admitted bounded projection of price >= 0 can produce cases for a negative price, zero, and a positive price. A source claim such as forall account exists owner is valid FOL, but it is not automatically executable by TDE. A Lean theorem handle is carried to EVF's theorem-provider lane; TDE does not turn Lean into ordinary Python, Rust, or TypeScript tests.

## Inputs

### FormalClaim source envelope

The source envelope is FormalClaimSourcePayload/v2 from @3:

- one canonical proposition;
- one exact logic identifier and semantics-profile identity;
- exact declarations, assumptions, domain/universe configuration, and source digest;
- source_authority_count equal to 1.

It contains source meaning. It never contains executable_profile, solver outcomes, derived decidability, provider admission, or test results.

### Capability assessment

FormalClaimCapabilityAssessment/v1 is downstream, immutable, and owned by validation governance. Its primary classification is total:

- executable-bounded;
- solver-admissible;
- proof-provider-required;
- unsupported;
- indeterminate.

It carries typed needs_formal reasons:

- missing-formal-statement;
- outside-executable-profile;
- implementation-oracle-dependence;
- unsupported-theory-or-language;
- indeterminate-classification.

Unsupported, indeterminate, unknown, timeout, malformed, stale, or missing evidence never passes.

### Executable projection

ExecutableProjectionBinding/v1 is downstream and separate from source meaning. It must bind:

- exact source and assessment digests;
- projection purpose;
- preservation kind and direction;
- assumptions and domain/bound;
- target executable profile, version, and digest;
- preservation certificate or syntactic-by-construction receipt;
- currentness and validator identity.

If no admissible preservation evidence exists, there is no projection and TDE keeps needs_formal. A bounded projection proves only its declared bound and cannot be reported as the global source claim.

### Implementation profile

Each TDE implementation profile descriptor binds a language family, exact version and digest, supported obligation/case kinds, renderer adapter, runtime/toolchain binding, fixture normalization, evidence normalization, provider identity, and admission/currentness receipt.

The currently observed TypeScript, Python, and Rust architecture profiles are candidate substrate with authority effect none. They are not globally complete or admitted. Some overlays are implemented-candidate; several remain candidate-protocol-only with provider absent. TDE-specific activation must therefore be exact and per profile.

## Required behavior

### Fail-closed intake

TDE blocks derivation when:

- source_authority_count is not exactly 1;
- any identity uses latest, floating paths, or unresolved aliases;
- source, assessment, projection, profile, provider, or runtime is stale;
- classification is unsupported or indeterminate;
- the projection's preservation evidence is missing or exceeds its domain;
- a registry entry is missing, unknown, duplicate, conflicted, or not admitted.

### Language-neutral derivation

The derivation core consumes only admitted projection semantics plus normalized fixtures. It emits stable obligation IDs, case IDs, input partitions, expected relation/oracle requirements, source and projection provenance, and claim ceilings. It has no branch on TypeScript, Python, or Rust syntax.

### Independent rendering

Renderer adapters translate the neutral IR into language-native test artifacts. TypeScript is the first trust-building lane. Python and Rust are independent successor lanes against the frozen neutral contract. Cross-language acceptance compares obligation IDs, case IDs, outcomes, evidence classes, and ceilings; it does not require byte-identical source.

### Extensibility

A future profile such as Kotlin can be added without changing the core classifier or derivation rules only by contributing an independently validated descriptor, renderer, runtime binding, normalization contract, fixtures, and admission receipt. An unregistered Kotlin fixture must be rejected. Ambient plugin discovery is forbidden.

### Lean and theorem evidence

Lean/DTT remains a separate formalism and theorem-provider integration family through EVF. TDE may carry exact Lean binding, obligation, and theorem-evidence handles plus typed residue. It does not parse, elaborate, build, or execute Lean and does not normalize Lean into a fourth ordinary code-emission backend.

## Existing behavior preserved

- deterministic closed-form arithmetic, piecewise, and bounded fold recognition;
- exact rational evaluation;
- null/non-derivable handling for partial operations;
- the honesty guard that co-emits a counted coverage gap when a property stands in for a missing exact value;
- existing obligation-key stability and deterministic ordering.

This candidate does not duplicate those completed capabilities.

## Separate debts preserved

- progression prose outside the executable fragment;
- missing per-row postcondition/workflow/query/mapping IDs;
- E2 usability evidence from at least three non-author testers.

These remain independent gaps and cannot be closed by profile integration.

## Acceptance

The Design candidate is acceptable when six views, source contracts, total concerns, planned witnesses, scope extraction, and two-pass selection validate.

The Plan candidate is structurally complete only when it has atomic SWUs, independent profile lanes, explicit validation and closeout contracts, and a blocked execution entry.

Activation remains blocked until exact @3 Rondelli owner-role admissions, a Rondelli-assigned verification level, and Victor Boscaro structural verification exist. A later Invoke Refresh must regenerate current Plan evidence before Distill/WPRA/Implementation Readiness may run.

## Non-goals and claim ceiling

This candidate does not implement TDE changes, admit @3 or any profile, register providers, execute product tests, run theorem tools, prove FormalClaims, close legacy debts, migrate data, promote, publish, release, deploy, commit, push, or append telemetry.
