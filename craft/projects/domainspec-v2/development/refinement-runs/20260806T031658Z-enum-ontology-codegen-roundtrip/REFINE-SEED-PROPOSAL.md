---
run_id: 20260806T031658Z-enum-ontology-codegen-roundtrip
capability: refine
status: strategy-confirmed-dispatch-pending
preset: standard
research_mode: research-if-gap-appears
authority_effect: none
---

# Refine Seed Proposal — Ontology Enum To Architecture Realization

## Confirmed operator intent

Refine a new architecture-realization path that can consume an authoritative
DomainSpec Enum definition, generate the admitted TypeScript owned const-object
representation, compile it, observe it through the existing adapter, evaluate
it independently, mutate it causally, and replay the proof.

The design must reuse the Backend Type Test Engine proof discipline in
architecture terms:

```text
independent architecture obligation catalogue
  -> ArchitectureRealizationCase
  -> exact role and tool bindings
  -> generation and compilation
  -> adapter observation
  -> independent evaluation
  -> reason-specific MutationResult
  -> ArchitectureProofReceipt
  -> independent ArchitectureReplayResult
```

## Target

- Project: `projects/domainspec-v2`
- Existing feature context:
  `development/architecture-pattern-enforcement/`
- Existing TypeScript evidence:
  `impl/architecture-conformance/typescript/`
- Existing proof precedent:
  `development/first-production-release/backend-type-test-engine-completeness/`
  and `impl/test-derivation-engine/src/bte/`
- Refinement output: this run folder only.

## Source-backed starting facts

1. The current TypeScript lane observes and evaluates existing source; it does
   not generate TypeScript from an ontology definition.
2. The admitted TypeScript representation is
   `typescript.owned-const-object-enum/v1`, implemented with `defineEnum`,
   `composeEnum`, and `EnumValue`, not native TypeScript `enum`.
3. `binding.expected_enum_values` is owner-resolved while
   `enum.implemented_members` is observation evidence. Generated code must not
   redefine canonical Enum meaning from implementation evidence.
4. Stable code-facing member names are not yet supplied by the current
   expected-value contract. Generation therefore needs an authoritative member
   identity contract or an explicit owner-approved naming rule.
5. The BTE precedent keeps obligation, TestCase, binding, ExecutionResult,
   independent evaluation, MutationResult, ProofReceipt, and ReplayResult as
   separate objects and proves one complete unit before breadth.

## Refinement obligations

| ID | Obligation |
| --- | --- |
| R-01 | Separate canonical domain definition, architecture obligations, generation IR, target source, observation, evaluation, and evidence authority. |
| R-02 | Define the minimum canonical Enum member identity needed for deterministic generation without inferring meaning from implementation. |
| R-03 | Compare direct ontology-to-TypeScript generation with a language-neutral architecture realization IR. |
| R-04 | Map the BTE obligation-to-replay chain into architecture terms with an independent expected catalogue and evaluator. |
| R-05 | Define the TypeScript emitter for the admitted owned const-object protocol, including imports, exports, type alias, composition, provenance, and deterministic bytes. |
| R-06 | Define compilation, adapter observation, semantic exact-join, mutation, receipt, and replay boundaries. |
| R-07 | Prove the mechanism first with one `OrderStatus` obligation before widening to the complete Enum denominator. |
| R-08 | Preserve an extension boundary for Python, Rust, and later meta-types without putting TypeScript syntax in the portable ontology. |
| R-09 | Produce an implementation-ready non-executed Work Pack with atomic SWUs, validation commands, owner boundaries, and Task Session closeout contracts. |
| R-10 | Preserve candidate-local and no-authority claim ceilings; generation and proof evidence cannot promote ontology or release a package. |

## Write and forbidden scope

Authorized refinement write scope:

```text
projects/domainspec-v2/development/refinement-runs/
  20260806T031658Z-enum-ontology-codegen-roundtrip/**
```

Forbidden during Refine:

- `projects/domainspec-v2/impl/**`
- `projects/domainspec-v2/development/implementation-conformance/**`
- `projects/domainspec-v2/development/architecture-pattern-enforcement/**`
- `projects/domainspec-v2/development/first-production-release/**`
- `arcanum/**`
- Git commits, pushes, publication, deployment, promotion, and external writes.

Existing modified or untracked bytes outside this run folder are preserved as
prior state and are not attributed to this run.

## Research decision

Default to local repository evidence. External research is allowed only if a
named acceptance-critical gap appears and a later explicit confirmation
authorizes the bounded source scope.

## Done criteria

- The ten-stage Refine loop has an artifact or exact blocked reason per stage.
- The architecture proof chain is expressed in Definition, Design, and Plan.
- One independently reviewed synthesis selects a coherent design and records
  rejected alternatives.
- The first SWU proves one complete architecture obligation through replay.
- Later Enum breadth and cross-language work are separate successors.
- The final result recommends but does not execute Task Session work.

