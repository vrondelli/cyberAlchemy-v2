---
candidate_id: dsv2-formalclaim-multiformalism-lean-extension@3
status: invoke-design-successor-candidate
authority_effect: none
predecessor_candidate: dsv2-formalclaim-fol-profile-extension@2
predecessor_effect: preserved-unaccepted-source-candidate-no-acceptance-inheritance
updatedAt: 2026-08-24
docType: domainspec-define-successor
---

# FormalClaim Multi-Formalism and Lean Evidence Extension

## Outcome

`FormalClaim` remains the canonical home of one exact formal proposition and
the exact formal-language semantics that interpret it. This successor preserves
the @2 many-sorted FOL profile and adds a native Lean dependent-type-theory
profile without defining every FormalClaim as FOL.

Lean is a separate EVF theorem-provider lane. Category theory is an optional
theory/model profile expressed and checked in Lean; it is not EVF's universal
workflow and it does not make the whole DomainSpec graph a category.

## Canonical ontology chain

The authored relationship direction remains:

```text
ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning
```

Generated inverses are navigation only. `formalizes` records accepted scoped
correspondence, not truth, proof, equivalence, discharge, or authority transfer.
`derived_from` records exact obligation lineage, not evidence or discharge.

## Contract 1 — logic-neutral FormalClaim source

`FormalClaimSourcePayload/v2` contains one canonical proposition with:

- immutable claim identity, version, owner, currentness, supersession, digest,
  source BusinessMeaning, accepted `formalizes` relation, and claim ceiling;
- one selected `formal_language_profile_ref` and digest;
- one exact proposition representation plus a profile-defined stable semantic
  identity and digest;
- exact signature, theories, imports or interpretation environment, assumptions,
  universe/configuration bindings, and model-profile bindings required to
  interpret that proposition.

The source payload cannot contain a proof term, theorem declaration, proof
result, provider admission, `executable_profile`, derived decidability,
evidence, obligation discharge, promotion, publication, or release state.

One FormalClaim version has one canonical source representation. Cross-language
forms are separately versioned, digest-bound mappings; they never become silent
co-canonical formulae.

### FOL profile retained

The @2 standard many-sorted FOL-with-equality profile remains valid. It supports
typed first-order terms, functions, predicates, equality, Boolean connectives,
and nested first-order quantifiers under exact theory and domain assumptions.
It excludes higher-order quantification, temporal/modal operators, fixed points,
and native transitive closure. Executability remains downstream assessment.

### Native Lean dependent-type-theory profile

`LeanDTTFormalLanguageProfile/v1` interprets a proposition/type in one exact
Lean environment. Its source identity is not a pretty-printed theorem or file
path. It binds:

- normalized kernel/elaborator-facing proposition expression bytes and digest;
- Lean toolchain, project configuration, dependency lock, source-set, import
  closure, namespace/open/scoped options, universe parameters, and relevant
  elaboration-option digests;
- the exact proposition type after elaboration plus an environment digest;
- an independent source owner and claim ceiling.

A proof term or named theorem declaration belongs to a provider request and
receipt. Proving a theorem cannot replace or mutate the source proposition.

## Contract 2 — Lean binding paths

`FormalClaimLeanBinding/v1` supports exactly two typed paths.

### Path A — native Lean/DTT

The FormalClaim source itself selects the Lean DTT profile. The binding joins
the source proposition identity to an exact Lean theorem request. The theorem
declaration is evidence-target identity only; it is not a second meaning source.

### Path B — translated or projected to Lean

A non-native source such as FOL may be mapped into Lean only through a separate
digest-bound semantic mapping. The binding records source and target proposition
identities, translation implementation and version, assumptions, purpose,
domain, currentness, declared loss, preservation class and direction, mapping
evidence, independent validator, and exact owner acceptance.

Allowed preservation classes include exact equivalence under declared
assumptions, one explicitly named implication direction, witness preservation,
and counterexample preservation. A lossy mapping cannot be labeled exact.
Missing or stale mapping acceptance yields no theorem route.

Native categorical or dependent-type claims are not forced through FOL merely
to obtain a uniform pipeline.

## Contract 3 — category-model admission

`CategoryModelProfile/v1` is required before a FormalClaim uses categorical
language as more than analogy. It declares and binds:

1. objects;
2. morphisms;
3. equality or equivalence of morphisms;
4. identities;
5. composition and its domain;
6. closure;
7. associativity;
8. interpretation of functors, natural transformations, or other claimed
   structure;
9. owner and claim ceiling; and
10. non-vacuity witnesses and counterexamples.

Without this admission the model status is `typed-graph-fragment`, not
`category`. `SchemaInstance` supplies one genuine bounded category profile:
schemas are small categories, instances are functors into `Type`, schema
morphisms are functors, and pullback respects identity and composition.

DomainSpec endpoint typing is a separate domain-level type discipline. Lean's
dependent type theory is the proof foundation. Neither fact makes the global
DomainSpec graph a category.

## Contract 4 — EVF Lean theorem-provider lane

The planned lane is:

```text
ProofObligation + FormalClaim + FormalClaimLeanBinding
  -> LeanTheoremRequest/v1
  -> exact registered Lean provider selected from LeanProviderManifest/v1
  -> build and kernel/theorem inspection
  -> LeanTheoremReceipt/v1
  -> EVF identity/currentness/ceiling join
  -> immutable EVF evidence handle
```

This is a new theorem-provider family. It does not add `lean` to the current
`GraphLawProviderReceipt/v1`, whose provider and native-result meanings are
closed over Datalog and Alloy.

### Lean outcomes

The normalized outcomes are:

- `theorem-checked` — the requested proposition is checked under the exact
  admitted environment and allowed axiom closure;
- `counterexample-theorem-checked` — an exact negative/counterexample
  proposition is checked, with no automatic converse or global claim;
- `unresolved` — build, elaboration, theorem inspection, dependency, axiom, or
  identity evidence cannot support a proposition result;
- `stale` — one or more exact source, environment, import, declaration, or
  toolchain identities no longer match.

A failed build is `unresolved`; it is never classified as proposition false.

### Fail-closed receipt identity

An accepted receipt binds raw digests for the toolchain, project configuration,
dependency lock, full source set, import closure, theorem declaration identity,
elaborated theorem type, source proposition identity, proof artifact/build
outputs, axiom audit, and currentness check. Path-only identity is forbidden.

The lane fails closed on `sorry`, unexpected axioms, unsafe declarations,
declaration/type mismatch, stale identity, incomplete imports, or a claimed
ceiling wider than the narrowest input.

## Contract 5 — theorem versus runtime conformance

Lean theorem evidence proves only the requested proposition under its exact
formal model, assumptions, environment, checker, and axiom closure. Separate
runtime-conformance evidence must bind the formal model to exact current parser,
JSON/serialization, adapter, generated code, deployed policy, IO/mediation,
runtime target, and observed result identities.

A theorem does not establish parser fidelity, empirical adequacy, business
correspondence, deployed-policy identity, non-bypassable mediation, obligation
discharge, promotion, release, deployment, or production behavior. For example,
`AgentPermissionKernel.decidePolicy_sound` covers its Lean structures while
`PermGuard` explicitly leaves JSON and deployed-runtime boundaries uncertified.

## Plain-language examples

- Native Lean: `SchemaInstance.pullback_comp` is a Lean/DTT FormalClaim about a
  category-model profile. Lean may check the theorem directly without a FOL
  detour.
- Translated FOL: an FOL settlement invariant may be mapped to a Lean proposition
  only after the exact translation and its semantic preservation are accepted.
- Type discipline: `Instance : Schema -> Type` prevents silently using an
  instance under the wrong schema in the formal model.
- Collapse test: if a proposed categorical scope rule reduces entirely to list
  filtering, use the ordinary functional model; do not inflate it to a
  fibration.

## Invariants

1. FormalClaim source meaning and Lean proof evidence are different artifacts.
2. One claim version has one canonical source proposition.
3. A theorem declaration cannot become a co-canonical source proposition.
4. Native Lean and translated-to-Lean paths are explicit and non-interchangeable.
5. Translation loss and direction are exact, accepted, and non-inflating.
6. Category status requires an admitted model profile; a typed graph is not
   automatically a category.
7. Research is candidate input only, never proof or ontology authority.
8. Lean is a distinct EVF provider family; graph-provider receipts are not reused.
9. Failed builds, stale evidence, `sorry`, unsafe declarations, and unexpected
   axioms never become proposition results.
10. Proof evidence and runtime conformance remain separately closable.
11. No proof self-discharges or promotes its obligation.
12. The @2 candidate remains preserved and unaccepted; its digests do not admit
    these @3 bytes.

## Completion ceiling

This Invoke Design successor may establish authored candidate contracts and a
local `design-validator-pass`. It does not change canonical ontology, admit a
provider, execute Lean, prove a new theorem, establish runtime conformance,
discharge an obligation, authorize migration, implement schemas or validators,
promote, publish, release, deploy, or reach production readiness.
