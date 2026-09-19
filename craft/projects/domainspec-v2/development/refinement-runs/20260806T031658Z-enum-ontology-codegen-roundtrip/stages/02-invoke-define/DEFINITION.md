---
artifact_kind: invoke-define
run_id: 20260806T031658Z-enum-ontology-codegen-roundtrip
step_id: s02-define
status: pass
authority_effect: none
---

# Definition — Architecture Realization Compiler And Proof

## Simple definition

An architecture realization compiler turns an authoritative DomainSpec concept
definition into code that follows one language's approved architecture pattern.
Its proof system then checks, independently, that the generated code preserved
the intended architecture properties.

## Precise definition

The architecture realization system is a deterministic, evidence-separated
pipeline that:

1. consumes an owner-authorized canonical domain-definition handle;
2. resolves portable architecture obligations and a target language profile;
3. realizes the definition as deterministic target source through a versioned
   compiler boundary;
4. compiles and observes that source through target-native tools;
5. exact-joins observed architecture facts against an independently frozen
   obligation catalogue;
6. derives one pre-run realization case per admitted obligation;
7. executes reason-specific mutations;
8. emits a bounded proof receipt; and
9. independently replays raw inputs, bindings, outputs, observations, joins,
   mutations, and scopes.

It is not a general application generator, an ontology authority, a proof of
business behavior, or a replacement for target-language compilers.

## Problem

The completed TypeScript Enum lane can prove that existing TypeScript source
matches the ontology-guided Enum profile. It cannot currently accept a
canonical Enum definition and emit that source. Adding only a formatter or
template would create a false green: the same implementation could generate
the code, derive its expected facts, evaluate itself, and write a passing
receipt.

The missing feature is therefore not merely code generation. It is an
architecture realization compiler plus an independent obligation-to-replay
proof boundary.

## Primary outcome

For one canonical `OrderStatus` Enum definition, the future implementation can
produce a TypeScript module using the active owned const-object protocol,
compile it, observe it through the existing adapter, prove the exact
architecture obligations with causal negative evidence, and replay the result
without trusting generator-authored expectations.

## Actors and owners

| Owner | Responsibility | Prohibited authority |
| --- | --- | --- |
| DomainSpec definition owner | Authorizes concept identity, member identity, values, and semantic relationships | target syntax, proof result |
| Architecture contract owner | Publishes portable realization contracts and diagnostic registry | target source, owner decisions |
| Architecture obligation catalogue owner | Freezes expected obligation keys and metadata independently | generator code and observations |
| Realization compiler owner | Resolves definition and profile into target-neutral or target-bound realization data | expected proof result and ontology promotion |
| TypeScript emitter owner | Emits deterministic source, manifest, and provenance for the admitted profile | portable semantic meaning |
| TypeScript compiler owner | Reports target-native parse/type diagnostics | ontology satisfaction |
| TypeScript adapter owner | Projects source into declared architecture observations | expected values or proof admission |
| Independent evaluator owner | Joins frozen expectations to raw observations and emits reason codes | generator imports and self-authored fixtures |
| Mutation owner | Creates fresh child-lineage defects tied to one obligation | reuse of generator pass literals |
| Receipt owner | Binds allowlisted raw handles | admission, promotion, aggregate breadth |
| Replay owner | Recomputes bytes, joins, scope, and results independently | trusting receipt `pass` fields |

## Core objects

### `CanonicalEnumDefinition`

An owner-authorized portable source record. At minimum it needs:

- stable concept identity;
- stable member identity, including an owner-provided code-facing name or an
  independently governed naming decision;
- canonical member value;
- declared semantic composition references when composition is part of the
  domain definition;
- source/provenance handles; and
- contract version.

The exact durable owner and schema are Design decisions. This Definition only
establishes that values alone cannot support deterministic, reversible code
generation without an explicit naming contract.

### `ArchitectureObligationCatalogue` (`A_spec`)

The independent expected set of formation, realization, type, runtime,
composition, provenance, and non-collapse obligations for one definition and
target profile. It is frozen before TestCase materialization and cannot be
written by the generator or evaluator.

### `ArchitectureRealizationCase`

A pre-run instruction for exactly one obligation key. It identifies inputs,
required role bindings, expected phase/code, raw evidence contract, one primary
mutation family, and allowed scope. It contains no execution result.

### `ArchitectureRealizationIR`

A possible versioned boundary between portable semantic input and target
emitters. Whether it is mandatory or whether the first slice uses a direct
TypeScript realization record remains a Distill selection. Any selected IR
must carry only information justified by a present consumer and must not
smuggle TypeScript syntax into the portable ontology.

### `ArchitectureBuild`

Generated target source plus a source manifest, exact profile/provider/compiler
bindings, deterministic build result, and raw diagnostic handles. It is
compiler evidence, not proof admission.

### `ArchitectureObservation`

The existing observation projection or its versioned successor, produced from
real generated source by a target adapter. Observations are facts about the
implementation, never the canonical definition.

### `ArchitectureExecutionResult`

A post-run record binding one realization case to generation, compilation,
observation, and evaluator results with exact phase and diagnostic codes.

### `ArchitectureMutationResult`

A fresh child-lineage defect targeting one obligation, with expected phase,
code, semantic delta, observed result, and killed/survived status.

### `ArchitectureProofReceipt`

A bounded envelope over allowlisted raw handles, exact obligation and result
sets, tool/config digests, mutation results, and claim ceiling. It cannot admit,
promote, or aggregate itself.

### `ArchitectureReplayResult`

An independent recomputation of contracts, source bytes, generated bytes,
bindings, observations, joins, mutation lineage, scopes, and proof digest. It
must not trust receipt counts or pass fields.

## Architecture obligation families

| Family | Question |
| --- | --- |
| formation | Is the canonical Enum definition complete, unambiguous, and version-valid? |
| realization | Did the selected compiler and target emitter implement the admitted profile? |
| member preservation | Did every canonical member map exactly once with stable identity and value? |
| type preservation | Does the exported TypeScript value type equal the canonical closed value set? |
| runtime preservation | Does the runtime object have the expected entries, ownership, and immutability? |
| composition | Are semantic and representation composition preserved without cycles, duplicates, overlap, or invented membership? |
| provenance | Can every emitted member and observation trace to the canonical source and exact compiler/profile/provider bindings? |
| non-collapse | Was Enum kept distinct from native enum, bare constants, standalone union, Value Object, and State Machine shapes? |
| determinism | Do definition normalization, realization, emission, observation, evaluation, and replay reproduce exact bytes or canonical semantics as declared? |
| scope | Did the run read and write only the declared paths and evidence handles? |

## Mandatory invariants

1. `A_spec` is independently frozen before any realization TestCase runs.
2. The generator cannot write `A_spec`, expected observations, evaluator
   outcomes, or replay verdicts.
3. The evaluator cannot import the generator or accept generator-authored pass
   values.
4. The adapter cannot define canonical member identity or expected membership.
5. Generated source cannot promote or mutate the ontology.
6. One required obligation key has exactly one pre-run case, primary execution
   result, primary mutation result, proof projection, and replay projection.
7. Exact-set equality covers missing, extra, duplicate, stale, and mismatched
   obligations; count equality is insufficient.
8. A mutation is killed only by its declared phase, reason code, and semantic
   delta.
9. Compilation success is necessary target evidence but is not architecture
   conformance by itself.
10. One `OrderStatus` proof establishes mechanism only; full Enum breadth,
    cross-language parity, later meta-types, promotion, and release remain
    separate.

## Process correspondence with BTE

```text
BTE O_spec                -> ArchitectureObligationCatalogue
BTE O_gen                 -> obligations recomposed from build and observation handles
BTE TestCase              -> ArchitectureRealizationCase
BTE role binding          -> definition/profile/compiler/emitter/adapter/evaluator bindings
BTE ExecutionResult       -> ArchitectureExecutionResult
BTE independent evaluation-> generator-independent architecture evaluator
BTE MutationResult        -> ArchitectureMutationResult
BTE ProofReceipt          -> ArchitectureProofReceipt
BTE ReplayResult          -> ArchitectureReplayResult
```

## Target TypeScript behavior

The first target remains the active owned const-object protocol. Illustrative
output, not yet generated evidence:

```ts
import { defineEnum, type EnumValue } from "<admitted-provider>";

export const OrderStatus = defineEnum({
  Pending: "pending",
  Paid: "paid",
} as const);

export type OrderStatus = EnumValue<typeof OrderStatus>;
```

The target is not a native TypeScript `enum`. Imports, filenames, ordering,
formatting, provenance headers, and generated-file policy remain Design
concerns.

## Alternatives retained for Distill

### A. Direct TypeScript realization compiler

Normalize the canonical definition and emit TypeScript directly. This is the
smallest first implementation, but it risks coupling portable semantics to the
first language and duplicating normalization in Python/Rust.

### B. Portable realization IR plus TypeScript backend

Normalize canonical definitions into a target-neutral realization IR, then
emit TypeScript. This gives later languages a shared semantic boundary, but an
IR is unjustified if it only renames the input or carries TypeScript concepts.

### C. Target-specific IR behind a stable compiler interface

Use a minimal compiler interface now and keep the first IR TypeScript-owned,
promoting only proven shared fields after Python/Rust evidence. This minimizes
premature universality but may require a later controlled migration.

Distill must select the smallest coherent option using proof independence,
information preservation, current consumer need, later-language evolution,
implementation cost, and migration risk.

## Non-goals

- Full application generation.
- Business behavior derivation.
- Native TypeScript `enum` generation.
- Python or Rust implementation in the first slice.
- Generic compiler plugin host.
- General theorem proving, SMT, Datalog, or whole-program equivalence.
- Ontology promotion, package release, deployment, or production readiness.

## Definition exit

The target, actors, objects, obligation families, invariants, alternatives,
non-goals, and evidence ceiling are defined. Design must still select the
realization boundary, assign the canonical definition contract owner, resolve
composition and generated-file policies, and plan independent witness
contracts.

