---
artifact_kind: invoke-design
status: authored-not-executed
evidence_state: design-validator-pass
authority_effect: none
---

# Design — Ontology-Driven Enum Architecture Realization

## Plain-language contract

This design turns one owner-approved Enum definition into TypeScript source and
then proves, independently, that the source still means the same thing.

For the first proof, the ontology-side definition says that `OrderStatus` has
two stable semantic members:

- `status.pending` means `pending`;
- `status.paid` means `paid`.

The TypeScript target binding separately decides that those members are written
as `Pending` and `Paid`. The emitter produces the already selected runtime
shape:

```ts
export const OrderStatus = defineEnum({
  Pending: "pending",
  Paid: "paid",
} as const);

export type OrderStatus = EnumValue<typeof OrderStatus>;
```

The generator does not declare this output correct. A compiler, the current
source adapter, and an independent obligation evaluator must establish that.
The negative proof removes only `Paid`; TypeScript compilation is expected to
remain green, while architecture evaluation must fail with
`ARCH_ENUM_MEMBER_MISSING` for `status.paid`.

## Claim ceiling

This artifact designs one direct TypeScript Enum realization proof. It does not
publish a canonical ontology instance, implement an emitter, run compilation,
prove the obligation, select an SWU, promote authority, release a package, or
establish Python/Rust parity. All named contracts below are proposed until an
implementation work unit publishes and validates them.

## View 1 — Context

### Problem boundary

The current TypeScript runner demonstrates that hand-authored source can be
inspected against Enum architecture expectations. It does not demonstrate that
a canonical ontology definition is transformed into source, compiled, observed,
judged against an independently frozen obligation, mutated causally, and replayed
from raw evidence.

The new boundary is an **architecture realization compiler plus independent
proof route**. It sits between canonical semantic input and the existing
architecture-conformance provider. It consumes meaning but owns no canonical
meaning. It emits target source but owns no acceptance verdict.

### Current evidence reused, not relabeled

- The DomainSpec meta-type identity and active TypeScript Enum profile remain
  upstream inputs.
- `defineEnum({...} as const)` plus `EnumValue<typeof X>` remains the admitted
  TypeScript representation. Native TypeScript `enum` is not the target.
- The current TypeScript adapter remains a fact source over real source text.
- The existing runner remains prototype/migration evidence; it is not treated as
  ontology-to-source proof.
- The BTE obligation/case/evidence/mutation/replay discipline is reused as a
  process precedent. The architecture contracts remain architecture-owned and
  do not ask BTE to choose semantic or profile policy.

### Authority boundaries

| Authority | Owns | Must not own |
|---|---|---|
| Canonical-definition owner | stable concept, member identity, semantic value, definition version | TypeScript names, output layout, pass/fail |
| Architecture-profile owner | admitted target protocol and representation constraints | canonical member meaning |
| Target-binding owner | module/export/type/member identifiers and provider imports | semantic identity or proof result |
| Obligation-catalogue owner | full expected obligation payload and diagnostic contract | emitted source or observed facts |
| Realization compiler owner | derived IR and deterministic source bytes | expected truth or acceptance |
| Compiler/provider owner | compile, type, runtime, and source observations | ontology meaning |
| Evaluator owner | exact joining and findings | source generation or canonical promotion |
| Proof/replay owner | evidence lineage and reconstruction | release, deployment, or authority transition |

All generated IR, observations, findings, and receipts have
`authority_effect: none`.

### In scope

- One direct `OrderStatus` definition with two members.
- A minimal portable Enum IR with no TypeScript syntax.
- One owner-frozen TypeScript target binding.
- Deterministic `as const` source emission.
- Pinned compilation, compile-time type witness, runtime import/freeze witness.
- Real generated-source observation through a separate adapter surface.
- Independent full-payload obligation evaluation.
- One fresh-child mutation and isolated replay.

### Deferred

- Enum composition, aliasing, ordered Enum semantics, persistence, package
  publication, UI, deployment, Python/Rust emitters, cross-language parity,
  other meta-types, and automatic ontology promotion.

## View 2 — High-level structure

```text
EnumDefinitionSnapshot/v1 ------------+
ArchitectureRealizationSpec/v1 -------+---> portable normalizer
                                       |
                                       v
                              EnumRealizationIR/v1
                                       |
TypeScriptTargetBinding/v1 ---------->+----> TypeScript emitter
                                                |
                                                v
                                     source bytes + source manifest
                                                |
                      +-------------------------+---------------------+
                      v                         v                     v
                pinned compiler         source adapter       receipt binder
                      |                         |                     |
                      v                         v                     |
                CompileResult/v1       ObservationProjection/v1     |
                      |                         |                     |
                      +-------------------------+                     |
                                                v                    |
ArchitectureObligationCatalogue/v1 --> independent evaluator        |
                                                |                    |
                                                v                    v
                                     ArchitectureEvaluation/v1 --> proof receipt
                                                |
                                                v
                                      mutation + isolated replay
```

### Component ownership and import rules

1. `contracts/realization` publishes schemas and validation only.
2. `realization/spec` projects exact ontology/profile handles into a bounded
   architecture-realization specification.
3. `realization/enum` reads the definition snapshot plus realization spec and
   emits the portable IR.
4. `typescript/generator/enum` reads the IR and target binding and emits bytes.
5. `typescript/compiler/enum` invokes the pinned compiler/runtime witness in an
   isolated workspace; it does not interpret ontology semantics.
6. `typescript/adapter/enum` reads generated source and emits source facts; it
   does not import the emitter.
7. `evaluator/enum` reads the independent catalogue and observed evidence; it
   must not import the normalizer, emitter, compiler implementation, or adapter
   implementation.
8. `mutation/enum` derives a child artifact from an exact green parent and
   records a single delta.
9. `replay/enum` reconstructs from persisted raw handles in a new workspace; it
   calls public contracts, not in-memory objects from the original run.

Forbidden-import checks are acceptance-critical. Directory separation alone is
not evidence of independence.

### Proposed integration shape

The implementation should extend the existing
`impl/architecture-conformance/` ownership surface rather than introduce a new
package root solely for this feature:

```text
impl/architecture-conformance/
  contracts/realization/
  realization/spec/
  realization/enum/
  typescript/generator/enum/
  typescript/compiler/enum/
  typescript/adapter/enum/          # existing surface, extended by contract
  evaluator/enum/
  mutation/enum/
  replay/enum/
  test/enum-realization/
```

The exact file list is a Plan concern. This structure is a design boundary, not
authorization to move existing files.

## View 3 — Low-level contracts and components

### `EnumDefinitionSnapshot/v1`

Owner-frozen semantic input projection:

```text
schema_version
definition_id
definition_version
concept_id
composition_kind = direct
order_semantics = none
members[] {
  member_id
  semantic_value
}
definition_sha256
authority_ref
authority_status = candidate-fixture | owner-issued
authority_effect = none
```

Validation requires a nonempty member list, unique `member_id`, unique
`semantic_value`, exactly one semantic value per member, and a digest over the
complete snapshot payload. It has no language, filename, export, or identifier
fields. The first `OrderStatus` instance is a candidate-local fixture referencing
the active Enum meta-type identity; this package does not claim that a canonical
owner has issued the concrete domain definition. A later owner-issued snapshot
uses the same shape and a stronger external authority reference without changing
compiler semantics.

### `ArchitectureRealizationSpec/v1`

This is the missing ontology-to-compiler boundary. A deterministic projector
reads exact candidate architecture ontology and active profile handles and emits:

```text
schema_version
spec_id
ontology_ref {ontology_id, schema_version, sha256}
profile_ref {profile_id, version, sha256}
realization_type = architecture.EnumImplementation
definition_type_ref = DS-D1.3
required_properties[] {
  property_id
  value_type
  observation_stage
  owner_route
  forbidden_inference
}
required_relations[]
constraint_operators[]
composition_kind = direct
unsupported_outcomes[]
spec_sha256
authority_effect = none
```

For the first unit, the required property denominator includes the current
ontology's binding and Enum surfaces: `binding.concept_id`, `binding.current`,
`binding.expected_enum_values`, `enum.implemented_values`,
`enum.implemented_members`, and `enum.composition_kind`, plus the selected
profile's representation protocol constraints. `required_relations` is empty for
the direct proof; the existing `architecture.composed_from` relation remains
deferred, not lost.

The projector fails if the ontology lacks the Enum realization type, required
properties, type applicability, owner/forbidden-inference metadata, or an
operator needed by the selected profile. It never adds ontology concepts. The
first Plan gate must prove whether the current ontology is sufficient; only a
separate ontology-owner SWU may repair a real schema gap.

The catalogue owner independently reads the same frozen ontology/profile inputs.
It must not import the realization-spec projector or accept its output as the
expected oracle. Exact digest agreement proves shared sources; independent code
paths preserve separation.

### `EnumRealizationIR/v1`

Derived, portable, non-authoritative material:

```text
schema_version
definition_ref {definition_id, definition_version, definition_sha256}
realization_spec_ref {spec_id, spec_sha256}
concept_id
composition_kind = direct
order_semantics = none
members[] {member_id, semantic_value}
ir_sha256
authority_effect = none
```

Canonical serialization orders members by `member_id` because the selected
profile says order carries no meaning. The serializer must explicitly record
that order was normalized; it must not silently imply source order preservation.
Every definition member maps to exactly one IR member and vice versa. The IR is
never the evaluator's expected oracle.

### `TypeScriptTargetBinding/v1`

Owner-frozen target choices:

```text
schema_version
binding_id
definition_ref
language = typescript
module_path
export_name
type_name
member_names {member_id -> TypeScriptIdentifier}
provider_module_specifier
protocol_ref
profile_ref
provider_ref
emitter_version
emitter_config_digest
format_version
binding_sha256
authority_effect = none
```

The member-name map is total over the definition member IDs and injective over
TypeScript identifiers. The emitter may validate names; it may not invent
missing names or infer semantic values from them.

Before emission, validation rejects absolute or escaping module paths, unadmitted
provider specifiers, invalid or reserved TypeScript identifiers, unsafe object
keys, control characters, and non-string semantic values. String literals are
emitted through one tested serializer or compiler-printer path, never direct
interpolation. Emitted bytes are reparsed and must reproduce the validated target
binding and member values exactly. Hostile path, identifier, quote, newline,
Unicode escape, and `__proto__` fixtures are required negative witnesses.

### `ArchitectureObligationCatalogue/v1`

Independently frozen expectation set:

```text
schema_version
catalogue_id
catalogue_version
definition_ref
profile_ref
obligations[] {
  obligation_key
  contract_version
  subject_ref
  operator
  expected_payload
  failure_codes[]
}
catalogue_sha256
owner_ref
authority_effect = none
```

The first obligation is `enum.member-bijection@1`. Its expected payload is the
complete member-ID/value relation derived by the catalogue owner from the
definition snapshot plus independently read ontology/profile handles, not a key
or value supplied by the emitter. The digest covers full payloads. A same-key but
changed expected payload must fail exact admission.

### `ArchitectureRealizationCase/v1`

Pre-run, immutable join:

```text
case_id
definition_ref
realization_spec_ref
ontology_ref
catalogue_ref
obligation_keys[]
ir_contract_ref
target_binding_ref
profile_ref
provider_ref
emitter_ref
compiler_ref
adapter_ref
evaluator_ref
mutation_plan_ref
case_sha256
```

The case is created before generation. Any stale or missing handle blocks the
run instead of being repaired during evaluation. It also declares the legal
lifecycle:

```text
prepared -> generated -> compiled -> observed -> evaluated
         -> mutation-killed -> replayed -> proof-complete
```

Every nonterminal state may transition to terminal `blocked`. Only the proof
binder may publish `proof-complete`, and only when every declared obligation and
witness is accounted exactly once.

### Source and generation contracts

`GeneratedSourceManifest/v1` binds the virtual module path, exact source SHA256,
export/type names, emitted member-name mapping, formatting version, and source
byte length. It records bytes, not merely a generator claim.

`GenerationReceipt/v1` binds:

- definition, ontology, realization spec, catalogue, IR, target binding,
  profile, and provider digests;
- emitter version and configuration digest;
- source manifest and exact output-byte digest;
- deterministic re-emission result; and
- `authority_effect: none`.

Changing any one handle makes the receipt stale.

### `CompileResult/v1`

The compiler boundary records:

- exact `tsc` executable/version and compiler configuration digest;
- isolated workspace layout and input source digests;
- process exit status and normalized diagnostics;
- an independently owned compile-time witness that the derived value type is exactly
  `"pending" | "paid"`;
- a runtime import witness that the exported object contains the expected
  runtime values; and
- a runtime freeze witness consistent with the active provider contract.

Compilation success is necessary but not sufficient. The missing-`Paid`
mutation is intentionally expected to compile, proving the architecture
evaluator contributes information that TypeScript compilation alone cannot.

The emitter cannot author the type witness. The proof harness derives the
expected union from the frozen definition/catalogue, writes a separately
digest-bound witness that imports only the generated public export, and supplies
both source and witness to the compiler boundary.

### `ObservationProjection/v1`

The adapter emits source-derived facts with provenance:

```text
observation_id
source_manifest_ref
protocol_ref
facts[] {
  fact_type
  semantic_member_id_or_null
  target_identifier
  runtime_value
  source_span
  confidence = exact
}
unsupported[]
diagnostics[]
observation_sha256
authority_effect = none
```

The current `projectTypeScriptEnum` entry point accepts caller-supplied
`expectedValues`; it remains legacy regression evidence and is not an expectation
source for this proof. A generated-source observation entry point emits observed
member records only. The independent evaluator joins those records with the
owner-frozen binding and catalogue. It rejects or ignores any caller-supplied
expected-value fact rather than comparing one caller value to another.

The binding may map target identifiers back to semantic member IDs, but exact
cardinality and uniqueness are checked before converting to any set-like view.
Duplicate facts, unmapped identifiers, ambiguous aliases, and unsupported
syntax fail closed. Source ordering is recorded as non-semantic evidence only.

### `ArchitectureEvaluation/v1`

The independent evaluator exact-joins case, catalogue, compiler result, source
manifest, and observation by digest. For `enum.member-bijection@1`, it checks:

- expected and observed member IDs form a bijection;
- each member has exactly one observed runtime value;
- each expected semantic value equals the observed runtime value;
- no duplicate value or identifier collapsed before comparison;
- all required input handles match the pre-run case; and
- unsupported adapter outcomes are absent.

Exact failure codes include:

- `ARCH_ENUM_MEMBER_MISSING`;
- `ARCH_ENUM_MEMBER_UNEXPECTED`;
- `ARCH_ENUM_VALUE_MISMATCH`;
- `ARCH_ENUM_MEMBER_DUPLICATE`;
- `ARCH_ENUM_BINDING_AMBIGUOUS`;
- `ARCH_ENUM_OBSERVATION_UNSUPPORTED`;
- `ARCH_REALIZATION_HANDLE_STALE`.

### Mutation and replay contracts

`ArchitectureMutation/v1` binds green-parent source digest, child source digest,
normalized delta digest, operation, selected member ID, expected compile phase,
expected failure code, and mutation-tool version. The first mutation deletes the
single `Paid: "paid"` property from a fresh child of the exact green source. The
mutator parses the parent, locates the property through the frozen target binding,
removes that one AST node, prints and reparses the child, and proves that the
normalized AST delta contains exactly one property deletion and no other semantic
change.

`ArchitectureProofReceipt/v1` binds all raw and normalized handles, positive
verdict, mutation death, diagnostic exactness, and replay result. It cannot be
emitted if the mutation does not compile, kills more than the named obligation,
or fails with a different code.

`ReplayResult/v1` is created by a separate process in a clean workspace. It must
reconstruct the definition snapshot, ontology/spec, IR, source bytes, compiler invocation, observation,
evaluation, mutation lineage, and tool/configuration handles from persisted raw
artifacts. Reusing original in-memory results is forbidden.

### Evidence workspace and publication

One run-scoped evidence writer creates a mirrored isolated workspace containing
exact copies of the provider, profile, activation receipt, generated source, and
independent compiler witness at deterministic repository-relative paths. This
preserves the current adapter's exact provider-path/digest check. Symlinks,
absolute paths, `..` traversal, and source roots outside the workspace are
rejected.

The writer is single-owner and publishes through write-temp, validate, then
atomic rename. It never overwrites a completed run; repair creates a superseding
run linked by digest. Raw source, compiler, observation, evaluation, mutation,
and tool/configuration handles are retained until explicit owner-approved
supersession. Normalized diagnostics use opaque repository-relative references
and never copy arbitrary source fragments. Partial workspaces cannot carry a
`proof-complete` receipt.

## View 4 — Workflow process

### Positive proof

1. Freeze and schema-validate the candidate `EnumDefinitionSnapshot/v1`.
2. Read exact ontology/profile handles and derive the bounded realization spec.
3. Independently freeze the full obligation catalogue from the definition and
   the same raw ontology/profile sources.
4. Freeze the TypeScript target binding and active provider handles.
5. Exact-join all handles into an immutable `prepared` realization case.
6. Normalize definition plus realization spec into the minimal portable IR.
7. Validate hostile binding inputs; emit, reparse, and deterministically re-emit
   source bytes and manifest.
8. Mirror exact dependencies into a path-safe isolated workspace.
9. Independently derive the compile-time witness from definition/catalogue.
10. Compile with pinned tool/configuration handles.
11. Execute separate literal-union, exact-provider-import, runtime-value, and
    runtime-freeze witnesses.
12. Observe the generated source through the no-expectations adapter boundary.
13. Evaluate the frozen obligation without importing generator components.
14. Persist raw inputs, outputs, diagnostics, and normalized evidence atomically.

### Negative proof

15. Copy the exact green source into a fresh child workspace.
16. Remove only the emitted `Paid` AST property and bind parent/child/delta
    digests plus the normalized one-node delta.
17. Re-run compilation; require it to pass.
18. Re-run observation and evaluation; require only
    `ARCH_ENUM_MEMBER_MISSING` for `status.paid`.
19. Reject a same-key catalogue with changed expected payload to prove full
    payload admission.

### Replay and closeout

20. Start a separate replay entry point with no original process memory.
21. Reconstruct the positive and negative paths from raw persisted handles.
22. Compare normalized receipts byte-for-byte where deterministic fields apply.
23. Emit the proof receipt only when positive, negative, isolation, forbidden-
    import, and reconstruction witnesses all pass.

The first successful proof closes only the one direct member-bijection unit.
Composition and additional obligations remain open.

## View 5 — Decision and failure flow

```text
definition snapshot valid and authority-bounded?
  no  -> block ENUM_DEFINITION_SNAPSHOT_INVALID
  yes -> ontology/profile realization spec complete?
           no  -> block ARCH_REALIZATION_SPEC_INCOMPLETE
           yes -> independent catalogue full-payload match?
                    no  -> block ARCH_OBLIGATION_CATALOGUE_STALE
                    yes -> target binding total and injective?
                    no  -> block ARCH_ENUM_BINDING_AMBIGUOUS
                    yes -> pre-run handles exact?
                             no  -> block ARCH_REALIZATION_HANDLE_STALE
                             yes -> deterministic emission?
                                      no  -> block ARCH_ENUM_EMISSION_NONDETERMINISTIC
                                      yes -> positive compilation/witnesses pass?
                                               no  -> block compile-specific code
                                               yes -> observation supported?
                                                        no  -> block ARCH_ENUM_OBSERVATION_UNSUPPORTED
                                                        yes -> independent evaluation pass?
                                                                 no  -> block exact semantic code
                                                                 yes -> causal mutation compiled and killed exact obligation?
                                                                          no  -> block mutation-specific code
                                                                          yes -> isolated replay reconstructed evidence?
                                                                                   no  -> block ARCH_REPLAY_MISMATCH
                                                                                   yes -> emit bounded proof receipt
```

No fallback converts unsupported syntax, missing evidence, changed digests, or
ambiguous mappings into a warning. The stop condition preserves raw evidence for
repair and supersession.

## View 6 — Dependencies and interfaces

| Producer | Consumer | Contract | Allowed knowledge | Forbidden coupling |
|---|---|---|---|---|
| Definition owner | normalizer, catalogue owner | `EnumDefinitionSnapshot/v1` | semantic identity/value snapshot | target naming, verdict, canonical promotion |
| Ontology/profile owners | spec projector, catalogue owner | raw ontology/profile handles | realization properties/operators | generated output, verdict |
| Spec projector | normalizer | `ArchitectureRealizationSpec/v1` | ontology-derived realization denominator | canonical mutation, expected verdict |
| Profile/binding owner | emitter, adapter | `TypeScriptTargetBinding/v1` | target syntax/name choices | canonical mutation |
| Normalizer | emitter, receipt binder | `EnumRealizationIR/v1` | portable direct Enum facts | TypeScript imports or expectation oracle |
| Catalogue owner | evaluator | `ArchitectureObligationCatalogue/v1` | full expected payload | generated source/imports |
| Emitter | compiler, adapter | source bytes + manifest | target output | acceptance verdict |
| Compiler | evaluator | `CompileResult/v1` | tool/type/runtime evidence | ontology judgment |
| Adapter | evaluator | `ObservationProjection/v1` | source facts/provenance | expected outcome |
| Evaluator | proof binder | `ArchitectureEvaluation/v1` | exact findings | source emission |
| Mutator | compiler/adapter | `ArchitectureMutation/v1` + child bytes | one causal delta | expectation rewrite |
| Proof binder | replay | raw handle index + proof receipt | complete lineage | in-memory original state |

### Import-boundary validation

The implementation plan must include a structural test that enumerates imports
for the evaluator and replay entry points. The evaluator may depend on shared
contract validators and pure comparison utilities, but never on normalizer,
emitter, compiler implementation, adapter implementation, fixture expected
values, or mutation expected-output helpers. Replay may orchestrate public
interfaces but may not deserialize an already computed evaluator verdict as its
new verdict.

### Compatibility posture

- Existing adapter/provider contracts are extended only through versioned input
  or observation contracts; silent shape replacement is forbidden.
- Existing hand-authored runner fixtures remain regression evidence until an
  explicit migration SWU decides otherwise.
- The first emitter produces source into a test-owned isolated workspace. It
  returns exact bytes and manifests; it does not write generated source into a
  canonical product tree during the first proof.
- `as const` proves compile-time literal preservation only. Runtime immutability
  is a separate `Object.isFrozen` witness over the exact owned `defineEnum`
  provider result. A native `enum` or plain const object satisfies neither the
  complete owned protocol nor this proof.
- A later production-output policy requires a separate owner decision covering
  checked-in versus ephemeral generation, stale-file removal, formatting, and
  package exports.

## Architecture obligation and test derivation

The process mirrors the proven obligation/test-derivation structure, translated
to architecture realization:

| Proof concept | Architecture realization equivalent |
|---|---|
| frozen obligation catalogue | independently owned full-payload architecture obligations |
| deterministic pre-run case | immutable definition/ontology/spec/catalogue/binding/tool join |
| executable positive | emitted source compiles, imports, freezes, observes, and evaluates |
| discriminating negative | one-member removal stays compilable but fails the exact obligation |
| mutation lineage | green parent, fresh child, one delta, exact code |
| proof object | digest-bound architecture proof receipt |
| independent replay | separate process reconstructs raw source, compiler, observation, and evaluation |

This is stricter than “the ontology enum compiles to an enum.” The ontology tells
the compiler which realization properties and profile constraints apply; the
definition snapshot supplies the domain members. The proof claim is: an
owner-frozen semantic Enum snapshot, interpreted through the exact architecture
ontology/profile, realizes into the selected TypeScript runtime/type protocol
without losing, adding, duplicating, or changing a member, and the result is
independently reconstructible.

## Planned witnesses

The machine-readable planned witness set is in
`DESIGN-PLANNED-WITNESSES.json`; the human checklist is in
`PLANNED-WITNESSES.md`. They are design contracts only and claim no executed
evidence.

## Design acceptance

Design is acceptable for Plan only if:

- all six views remain mutually consistent;
- the concern denominator is extracted from exact digest-bound inputs;
- the deterministic selection validator reaches a two-pass fixed point;
- every reviewer blocker is represented by a contract, workflow gate, or planned
  witness;
- no proposed contract is described as already published or proven; and
- the first Plan units prove ontology sufficiency, publish contracts, and freeze
  an independent red denominator before emitter implementation.

## Frame expiry

Re-run Design if canonical member identity changes, Enum order becomes semantic,
composition enters the first proof, the TypeScript runtime protocol changes,
the existing adapter cannot observe generated source without semantic inference,
or catalogue/evaluator ownership can no longer remain independent.
