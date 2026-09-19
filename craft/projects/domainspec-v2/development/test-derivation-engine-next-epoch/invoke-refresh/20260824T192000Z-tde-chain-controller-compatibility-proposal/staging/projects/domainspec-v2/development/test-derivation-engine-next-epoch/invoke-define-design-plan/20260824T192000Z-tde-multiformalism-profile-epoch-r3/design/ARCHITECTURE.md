# Architecture: TDE Multiformalism Profile Epoch

## Design intent

Add one fail-closed bridge from exact FormalClaim/capability evidence to deterministic, language-neutral test derivation and independently governed TypeScript, Python, and Rust rendering. Source meaning, capability policy, evidence routing, and provider execution remain outside TDE ownership.

## View 1 — Context

Formal-claims semantics publishes one exact FormalClaim source payload. Validation governance assesses it and may publish one preservation-backed executable projection. TDE validates those immutable handles, derives neutral obligations and cases, resolves one exact implementation profile, and asks a registered provider to execute rendered artifacts. EVF receives normalized evidence and residue.

Lean/DTT follows a different branch: TDE carries exact handles and residue to EVF; the Lean provider owns theorem execution. Lean is not a fourth renderer.

## View 2 — High-level structure

The target separates:

1. SourceIntakeBoundary for FormalClaim, assessment, and projection identity/currentness.
2. TdeProfileRegistry for explicit descriptor admission and resolution.
3. NeutralObligationDeriver for deterministic obligation/case IR.
4. RendererAdapter ports for TypeScript, Python, and Rust.
5. RuntimeBinding ports for language-native toolchains and providers.
6. EvidenceNormalizer for stable receipt and typed residue shapes.
7. SemanticParityEvaluator for cross-language obligation/case/outcome comparison.
8. EvfEvidencePort for downstream routing, including a separate theorem-handle path.

No core component imports a language renderer or theorem provider. Cross-language acceptance is semantic parity of obligations, cases, normalized evidence, and exact claim ceilings; it is never source-text equality.

## View 3 — Low-level components

| Component | Input | Output | Owns | Does not own |
| --- | --- | --- | --- | --- |
| SourceIntakeBoundary | exact source, assessment, optional projection | validated intake or typed block | identity and currentness checks | source meaning or capability policy |
| AssessmentInterpreter | total assessment classification and reasons | TDE slice disposition | deterministic interpretation of admitted policy | policy authorship |
| TdeProfileRegistry | exact profile descriptor and admission receipt | resolved immutable profile | non-ambient lookup and duplicate rejection | profile admission |
| NeutralObligationDeriver | admitted executable projection and fixtures | neutral obligations and cases | stable IDs, partitions, provenance, ceiling | solver or theorem execution |
| RendererAdapter | neutral IR and exact profile | language-native test artifact | pure rendering | runtime result |
| RuntimeBinding | rendered artifact, exact provider/toolchain | raw native receipt | provider call boundary | execution semantics |
| EvidenceNormalizer | raw provider receipt and source identities | normalized TDE receipt/residue | total normalization | EVF composition |
| SemanticParityEvaluator | normalized lane receipts | parity receipt or mismatch residue | obligation/case/evidence parity | syntax equality |
| EvfEvidencePort | normalized receipt or theorem handle | immutable EVF intake | transport binding | evidence routing policy |

### Core contracts

- FormalClaimIntake/v1
- TdeCapabilityDisposition/v1
- TdeExecutableProjectionIntake/v1
- TdeNeutralObligationIR/v1
- TdeImplementationProfileDescriptor/v1
- TdeRendererAdapter/v1
- TdeRuntimeBinding/v1
- TdeNormalizedEvidenceReceipt/v1
- TdeSemanticParityReceipt/v1

## View 4 — Workflow

1. Verify source_authority_count equals 1.
2. Recompute source, semantics-profile, assessment, projection, and currentness identities.
3. Interpret validation-governance classification.
4. Stop with typed needs_formal residue unless the TDE slice is executable and an admissible projection exists.
5. Resolve one exact, admitted, current implementation profile; reject latest, unknown, duplicate, stale, conflicted, or provider-absent entries.
6. Derive neutral obligations and cases without language branching.
7. Render through one profile adapter.
8. Execute only through that profile's exact runtime/provider binding.
9. Normalize native evidence without hiding raw diagnostics.
10. Route normalized evidence to EVF.
11. When multiple language lanes are required, compare semantic obligation/case/evidence parity under exact ceilings.
12. Close only when all required lanes and shared gates join; no majority vote.

## View 5 — Decision and state flow

Intake state is:

received -> identity-checked -> assessed -> projection-admitted -> profile-resolved -> derived -> rendered -> provider-observed -> normalized -> routed.

Every step has a typed blocked branch. Unsupported and indeterminate assessments, absent preservation evidence, stale bindings, unknown profiles, missing providers, malformed receipts, timeouts, and parity mismatches remain non-pass.

TypeScript establishes the first renderer/normalization trust gate. After its shared-contract receipt freezes the neutral IR and adapter contract, Python and Rust may proceed independently. Neither lane can change the frozen neutral contract. A required repair reopens the trust gate and invalidates dependent evidence.

## View 6 — Dependency and interface

| Boundary | From owner | To owner | Contract | Gate |
| --- | --- | --- | --- | --- |
| FormalClaim source | formal-claims semantics | TDE intake | exact FormalClaimSourcePayload/v2 handle | one authority and current digest |
| capability policy | validation governance | TDE assessment interpreter | FormalClaimCapabilityAssessment/v1 | total classification and exact policy digest |
| projection | validation governance | TDE derivation | ExecutableProjectionBinding/v1 | preservation evidence and scoped ceiling |
| profile admission | profile owner plus validation governance | TDE registry | TdeImplementationProfileDescriptor/v1 | exact version, digest, provider, runtime, and admission |
| rendered artifact | TDE renderer | provider owner | TdeRuntimeBinding/v1 | independent native validation |
| native receipt | provider owner | TDE normalizer | raw and normalized receipt contract | no hidden failures |
| normalized evidence | TDE | EVF | immutable evidence handle | source/profile/provider/currentness join |
| Lean theorem handle | TDE intake | EVF theorem lane | exact @3 Lean binding/request handle | no Lean execution in TDE |

## Profile-family design

### TypeScript

The first trust-building profile validates the neutral IR, registry contract, renderer port, Vitest-style output boundary, exact toolchain/provider binding, and evidence normalization. Existing TypeScript TDE output is evidence, not automatic admission into this new profile.

### Python

Python has an independent descriptor, renderer, native syntax/static/runtime checks, fixture normalization, and evidence receipt. It cannot inherit TypeScript admission. Dynamic import or unresolved runtime behavior returns typed unsupported/indeterminate residue.

### Rust

Rust has an independent descriptor, renderer, Cargo/rustc binding, compile-negative fixtures where applicable, and evidence receipt. It cannot inherit TypeScript or Python admission. Feature, macro, generated-code, or conditional-compilation ambiguity blocks unless explicitly supported by the exact profile.

### Future Kotlin fixture

Kotlin appears only as an unregistered negative fixture. The core must reject it without modification. A future Kotlin lane would require its own descriptor, adapter, runtime binding, normalization, independent validation, and admission.

## Capability-state honesty

Observed TypeScript, Python, and Rust architecture profiles are candidates with authority effect none. Several mapping/interface/event/operation/state-machine/workflow overlays have implemented-candidate evidence. Calculation, policy, query, value-object, and entity remain candidate-protocol-only with provider absent; Python and Rust enum protocols are also provider absent. Exact pure-Boolean rule adapter bindings exist for all three languages. The next epoch may use these as substrate only after TDE-specific admission/currentness.

## Failure containment

- Source or assessment failure stops before registry resolution.
- Profile failure stops before rendering.
- Rendering failure stops before provider execution.
- Provider failure is normalized but never converted into a semantic pass.
- One language failure does not mutate another lane; required parity remains blocked.
- Lean/provider failures stay in EVF's theorem lane and cannot contaminate code-emission results.

## Claim ceiling

Design may claim only a locally validated architecture candidate. It cannot claim @3 admission, profile admission, executable readiness, implementation, provider registration, successful product execution, theorem discharge, migration, release, or publication.
