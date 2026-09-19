# Source and Interface Contracts — FormalClaim Lean/EVF @3

Status: candidate Design contracts; unimplemented, unexecuted, and unadmitted

## 1. `FormalClaimSourcePayload/v2`

Owner: `formal-claims-owner`

Required blocks are immutable identity/lifecycle, exact BusinessMeaning and
accepted `formalizes` bindings, one formal-language profile, one canonical
proposition identity, interpretation environment/assumptions, and claim
ceiling. Provider, proof, discharge, executable capability, and promotion fields
are forbidden.

The source proposition identity algorithm is profile-defined and versioned. For
Lean it must bind normalized elaborated proposition structure to the exact
environment; pretty-print text, source path, line number, declaration name, or
any combination of those alone is insufficient.

## 2. `LeanDTTFormalLanguageProfile/v1`

Owner: `lean-formal-language-profile-owner`

Required fields:

- profile id/version/digest and Lean language/foundation identity;
- exact Lean toolchain ref/digest;
- project configuration and dependency lock refs/digests;
- source-set and import-closure construction policies;
- namespace, open/scoped declarations, universe parameters, and relevant
  elaboration option bindings;
- canonical proposition normalization/id algorithm and version;
- normalized proposition bytes/digest, elaborated type digest, and exact
  environment digest;
- permitted axiom policy, `sorry` policy, unsafe-declaration policy;
- currentness, owner, authority none, and claim ceiling.

Type theory is the Lean proof foundation. DomainSpec DS-D8 endpoint checking is
a separate domain-level type discipline and cannot satisfy this contract by
name similarity.

## 3. `FormalClaimLeanBinding/v1`

Owners: formal-claims owner plus proof-provider boundary owner

Required common fields bind binding id/version/digest, path kind, exact claim
and source proposition identity, target Lean proposition identity/environment,
purpose, assumptions, currentness, supersession, owner receipts, and ceiling.

### Native path

`path_kind=native-lean` requires identity equality between the source Lean
proposition and request proposition under the same environment contract. It
contains no translation and cannot use a named theorem as the source identity.

### Translation path

`path_kind=translated-to-lean` requires `FormalizationProjection/v1` with exact
source/target digests, translator id/version/source digest, mapping rule,
purpose, domain, assumptions, preservation class/direction, declared loss,
mapping evidence, separate source and target owners, independent validator,
currentness, and exact acceptance refs/digests.

Missing correspondence acceptance, stale mapping, or lossy-as-exact labeling
blocks the route. Native Lean categorical claims do not require FOL projection.

## 4. `CategoryModelProfile/v1`

Owner: `category-model-profile-owner`

Required blocks:

- carrier/object definition and identity;
- morphism definition and source/target typing;
- morphism equality/equivalence;
- identity morphisms;
- composition operation, domain, and closure;
- associativity and identity law propositions;
- interpretation of every claimed functor, natural transformation, adjunction,
  fibration, or other structure;
- exact formal-language/environment binding;
- positive, negative, and collapse-test fixtures;
- owner, currentness, authority none, and claim ceiling.

If any required category component is missing, the admissible classification is
`typed-graph-fragment` or a narrower named functional/order model. Research
language and repeated arrows are not admission evidence.

## 5. `LeanProviderManifest/v1`

Owner: `lean-provider-lifecycle-owner`

Required fields bind provider id/version, runner/inspector implementation
digests, Lean toolchain, project config, dependency lock, package/source root,
source-set and import-closure policies, allowed commands/options/resources,
network policy, permitted axioms, forbidden `sorry`/unsafe behavior, result
vocabulary, normalization policy, currentness, and authority none.

The manifest admits one provider boundary only after separately executed
runtime admission. This Design does not perform or imply that admission.

## 6. `LeanTheoremRequest/v1`

Owner: EVF proof-evaluator contract owner

Required fields:

- exact ProofObligation and `derived_from` relation refs/digests;
- exact FormalClaim, `formalizes`, source language profile, source proposition
  identity, assumptions, and ceiling;
- exact `FormalClaimLeanBinding/v1`;
- target Lean proposition identity and expected elaborated type digest;
- theorem declaration name plus environment-bound declaration identity;
- provider manifest ref/digest;
- project/toolchain/dependency/source/import closure refs/digests;
- axiom, `sorry`, unsafe, resource, and currentness policies;
- request id/version/digest, expected outcome family, authority none, and
  narrowest ceiling.

The theorem declaration target is evidence identity. It cannot override the
FormalClaim source proposition.

## 7. `LeanTheoremReceipt/v1`

Owner: Lean provider owner; EVF validates the consumer join

Required fields bind request, run/attempt, provider manifest, exact command,
toolchain, project config, dependency lock, source set, import closure,
environment, source proposition, theorem declaration, actual elaborated theorem
type, build outputs, proof/checker output, axiom closure, `sorry` scan, unsafe
scan, timestamps/resources, replay/currentness, residue, normalized outcome,
authority none, and ceiling.

Normalized outcomes:

| Outcome | Meaning | Maximum ceiling |
| --- | --- | --- |
| `theorem-checked` | exact requested proposition checked under exact environment and allowed axioms | proposition-under-exact-formal-boundary-only |
| `counterexample-theorem-checked` | exact negative/counterexample proposition checked | that negative proposition only |
| `unresolved` | build/check/audit/identity evidence cannot support a proposition result | no-property-claim |
| `stale` | current inputs no longer match request/receipt identities | no-current-property-claim |

A nonzero build, missing declaration, elaboration failure, theorem-type mismatch,
`sorry`, unexpected axiom, unsafe declaration, incomplete import/source closure,
path-only identity, stale digest, or ceiling inflation cannot produce a checked
outcome. A failed build is unresolved, not proposition false.

## 8. `LeanRuntimeConformanceBinding/v1`

Owner: `runtime-conformance-owner`

This separate contract binds formal model/proposition and theorem receipt to
exact parser, serialization, JSON/input normalization, code generation,
adapter, executable, deployed policy/configuration, runtime target, mediation,
IO, fixture, observed output, and currentness evidence. It declares preserve,
drop, and trust-border obligations and has an independent validator/receipt.

No theorem receipt substitutes for this evidence. The contract may remain
absent while theorem evidence remains valid within its narrower boundary.

## 9. EVF integration

EVF routes one `LeanTheoremRequest/v1` to one admitted provider and consumes one
`LeanTheoremReceipt/v1`. It normalizes the exact outcome, rechecks source,
obligation, binding, environment, currentness, and ceiling identities, and may
issue an immutable `EVFFormalEvidenceHandle/v1` at the narrowest ceiling.

Lean is a separate provider lane. The current
`GraphLawProviderReceipt/v1` provider enum and Datalog/Alloy native-result
semantics remain unchanged and cannot be reused for Lean.

## 10. Preserved @2 contracts

`FormalClaimCapabilityAssessment/v1`, `ExecutableProjectionBinding/v1`,
`DS-SFOLFormalClaimProjection/v1`, SMT/provider/factory seams, and the FOL
semantics profile remain preserved. This successor changes their shared source
envelope only as needed to make the multi-formalism boundary explicit; it does
not admit or execute them.

## Contract validation rule

Every planned schema and validator must test positive and negative fixtures,
bind raw SHA-256 identities rather than paths alone, preserve each failure, and
fail before owner admission when any claim could exceed its proof. All such
validators and witnesses remain unimplemented and unexecuted in Design.
