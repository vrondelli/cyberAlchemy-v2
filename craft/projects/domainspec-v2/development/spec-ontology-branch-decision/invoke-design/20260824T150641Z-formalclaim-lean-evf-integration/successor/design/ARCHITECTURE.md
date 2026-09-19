---
candidate_id: dsv2-formalclaim-multiformalism-lean-extension@3
status: invoke-design-successor-candidate
evidence_state: authored-complete
authority_effect: none
updatedAt: 2026-08-24
docType: architecture-bundle
---

# Architecture — FormalClaim Multi-Formalism, Lean, Category Profiles, and EVF

## Design intent

Preserve @2's one-source, logic-semantics, capability-assessment, projection,
and EVF evidence boundaries while adding one separately typed Lean theorem lane.
The smallest coherent unit is the source-to-evidence contract family: splitting
it would hide either semantic mapping or evidence-ceiling behavior.

## 1. Context view

```text
BusinessMeaning
      ^ formalizes
      |
FormalClaimSourcePayload/v2
      |  one canonical formal-language profile
      |  +-- FOL source profile
      |  `-- Lean dependent-type-theory source profile
      ^
      | derived_from
ProofObligation
      |
      +-- bounded projection/SMT/TDE lanes retained from @2
      |
      `-- FormalClaimLeanBinding/v1
             |-- native Lean source
             `-- accepted non-native-to-Lean mapping
                    |
                    v
              LeanTheoremRequest/v1
                    |
              LeanProviderManifest/v1
                    |
              LeanTheoremReceipt/v1
                    |
              EVF evidence handle

Separate runtime-conformance lane -----------------> EVF evidence join
```

Research sources may inform the Design but never enter the evidence handle as
proof or ontology authority.

## 2. High-level structure view

| Plane | Owns | Must not own |
| --- | --- | --- |
| Business meaning | business interpretation and fidelity acceptance | formal syntax, proof, discharge |
| FormalClaim source | one canonical proposition, language semantics, assumptions, source identity | proof declaration, provider result, executable profile |
| cross-language mapping | exact source/target proposition join, preservation/loss, owner acceptance | a second canonical source or undeclared equivalence |
| category-model admission | exact local category structure and law ceiling | global DomainSpec category status |
| proof bridge | ProofObligation and exact `derived_from` lineage | source meaning or self-discharge |
| EVF | evidence routing, normalized bounded outcome, immutable evidence handle | Lean semantics, provider lifecycle, promotion |
| Lean provider lifecycle | manifest admission, exact request execution, build/theorem/axiom/currentness receipt | business correspondence, runtime conformance, discharge |
| runtime conformance | parser, adapter, generated/runtime/deployed identity and observations | formal theorem or category admission |
| authority owner | later admission/discharge/promotion decisions | retroactive widening of evidence |

### Capability-state table

| Surface | Current source evidence | This validated Design may establish | Planned implementation | Explicitly absent here |
| --- | --- | --- | --- | --- |
| FOL FormalClaim profile | preserved @2 candidate | logic-neutral coexistence with Lean profile | schemas/validators/mappings | owner admission |
| Lean source profile | existing Lean propositions and theorem examples | source/proof identity separation | `LeanDTTFormalLanguageProfile/v1` | canonical ontology admission |
| category model | genuine local `SchemaInstance` laws; bounded refinement examples | category admission contract and global non-inflation rule | profile registry/validator | proof DomainSpec is globally a category |
| Lean theorem provider | staging packages and existing theorem files | request/manifest/receipt design | provider adapter and validators | registered EVF provider or run |
| EVF | bounded current lanes described by EVF | separate theorem-provider interface | exact evaluator/evidence-handle join | theorem execution/discharge |
| runtime conformance | explicit `PermGuard` trust boundary | independent conformance contract | parser/runtime adapter evidence | deployed-policy correctness |

## 3. Low-level component view

### Source and mapping components

1. `FormalClaimSourcePayload/v2` owns one canonical proposition and semantics.
2. `LeanDTTFormalLanguageProfile/v1` defines stable environment-bound source
   proposition identity, not a path or pretty printer.
3. `FormalClaimLeanBinding/v1` selects `native-lean` or `translated-to-lean`.
4. `FormalizationProjection/v1` records non-native mapping, loss,
   preservation direction, assumptions, owner acceptance, and currentness.
5. `CategoryModelProfile/v1` admits categorical vocabulary only after all
   structural fields, laws, witnesses, and ceiling are explicit.

### Provider components

1. `LeanProviderManifest/v1` binds provider id/version, Lean toolchain bytes,
   project config, dependency lock, source/import policy, permitted axioms,
   `sorry`/unsafe policy, resource bounds, commands, and authority none.
2. `LeanTheoremRequest/v1` binds obligation, source proposition, Lean binding,
   theorem declaration target, expected elaborated type identity, exact source
   and import closure, manifest, currentness, and ceiling.
3. `LeanTheoremReceipt/v1` binds request, toolchain/dependency/source/import
   digests, declaration identity, actual theorem type, build artifacts,
   axiom audit, unsafe/`sorry` audit, total outcome, residue, and ceiling.
4. `LeanRuntimeConformanceBinding/v1` is separately owned and connects model
   identities to exact parser/serialization/adapter/runtime/deployment evidence.

### Source proposition versus theorem declaration

```text
FormalClaim source proposition
  identity = normalized elaborated proposition + exact environment digest

Lean theorem request
  target = named declaration + expected theorem-type identity

Lean theorem receipt
  evidence = actual declaration/type/proof/build/axiom/currentness inspection
```

The declaration may prove the source proposition, but it cannot become the
source proposition by success or naming convention.

## 4. Workflow process view

```text
1. Author and separately accept BusinessMeaning correspondence.
2. Author one FormalClaim source under FOL, Lean/DTT, or another admitted profile.
3. Derive one exact ProofObligation from that claim.
4. Select native Lean or translated-to-Lean binding.
5. For translation, require current mapping acceptance and exact loss ceiling.
6. If categorical vocabulary is material, require CategoryModelProfile admission.
7. EVF issues LeanTheoremRequest against one exact admitted provider manifest.
8. Provider builds and inspects the exact source/import/dependency/toolchain closure.
9. Reject `sorry`, unexpected axioms, unsafe declarations, mismatch, or stale bytes.
10. Normalize to theorem-checked, counterexample-theorem-checked, unresolved, or stale.
11. EVF joins only current exact identities and the narrowest ceiling.
12. A separate conformance lane may bind the theorem model to runtime evidence.
13. A separate owner may later decide obligation posture; no receipt self-discharges.
```

## 5. Decision-flow view

```text
Exact current FormalClaim and accepted formalizes/derived_from lineage?
  no -> block
  yes -> formal-language profile?
    Lean/DTT -> native Lean binding
    non-Lean -> exact accepted translation available?
      no -> no Lean route
      yes -> translated Lean binding with explicit loss/direction

Categorical claim?
  yes -> complete admitted category-model profile?
    no -> typed-graph-fragment or analogy only
    yes -> permit exact local categorical proposition

Provider request exact and current?
  no -> stale or unresolved
  yes -> build and inspect
    failed build -> unresolved, never false
    sorry/unexpected axiom/unsafe/mismatch -> unresolved non-pass
    exact theorem checked -> theorem-checked under exact ceiling

Runtime claim requested?
  yes -> separate current conformance receipt required
  no or missing -> theorem-only ceiling
```

## 6. Dependency and interface view

| Producer | Contract | Consumer | Allowed inference | Forbidden inference |
| --- | --- | --- | --- | --- |
| formal-claims owner | source payload | proof bridge/Lean binding | exact source proposition | theorem exists or runtime conforms |
| mapping owner | formalization projection | Lean binding | declared preservation under exact assumptions | silent exact equivalence |
| category-model owner | category profile | Lean request | local category-law vocabulary | global DomainSpec category |
| proof bridge | ProofObligation | EVF | exact proposition lineage | source mutation or discharge |
| EVF | Lean request | Lean provider | requested proof meaning and ceiling | provider admission or theorem result |
| provider lifecycle | provider manifest | runner/inspector | exact admitted environment | business fidelity or release |
| Lean provider | theorem receipt | EVF | exact theorem outcome or typed non-pass | parser fidelity/runtime behavior |
| conformance owner | runtime binding/receipt | EVF/lifecycle owner | exact model-to-runtime evidence | theorem or source meaning |
| EVF evidence join | immutable handle | lifecycle owner | narrowest current evidence claim | promotion or self-discharge |

### Category admission example

For `SchemaInstance.pullback_comp`, the category profile binds small-category
schemas, functor schema morphisms, functor-valued instances, functor equality,
identity, composition, closure, and associativity from the exact Lean/Mathlib
environment. The proof ceiling is the stated pullback-composition equality.
It does not prove actual DomainSpec migrations implement that model.

### Collapse-test examples

- `ScopedContextReindexing` already proves its bounded identity/composition and
  no-grant-creation laws through list filtering; it is explicitly not a
  fibration. Category terminology adds no evidence there.
- `ContextAugmentationSafety` uses `Function.FactorsThrough`; it explicitly
  makes no Kan-extension or global-recomposition claim.
- `AgentPermissionKernelRefinementFibre` supplies a bounded refinement-system
  interpretation but makes no security or global DomainSpec claim.

## Significant behavior scenario

Stimulus: a native Lean FormalClaim states the exact proposition corresponding
to `SchemaInstance.pullback_comp`. EVF requests the exact named declaration.
The provider verifies the declared Lean toolchain, Mathlib revision, source and
import closure, elaborated proposition identity, theorem declaration/type,
absence of `sorry` and unsafe declarations, and allowed axiom closure.

Expected evidence: `theorem-checked` for only that proposition/environment. A
separate adapter fixture must then demonstrate that one exact runtime schema
migration serializes and behaves according to the proved model. Either receipt
may exist without the other; only a typed exact join may support a combined
claim.

## Concern-to-view trace

| Concern | Class | View | Owner | Planned evidence |
| --- | --- | --- | --- | --- |
| one source proposition, separate theorem evidence | authority | context/low-level | formal-claims owner | native-binding and co-canonical-negative fixtures |
| native and translated Lean paths | integration | workflow/dependency | formalization-bridge owner | positive path fixtures and mapping negatives |
| bounded category admission | authority/validation | low-level/decision | category-model owner | profile completeness and global-inflation negatives |
| fail-closed Lean receipts | validation | workflow/decision | Lean provider owner | stale, `sorry`, axiom, unsafe, mismatch fixtures |
| proof versus runtime conformance | integration | dependency/scenario | runtime-conformance owner | separate positive conformance receipt and substitution negative |

## Implementation-layering seed

The separate [IMPLEMENTATION-LAYERING-SEED.md](IMPLEMENTATION-LAYERING-SEED.md)
names candidate L0-L3 responsibility boundaries without creating Plan tasks or
implementation readiness.

## Design evidence ceiling

These six views and planned contracts may reach local
`design-validator-pass`. Every witness remains unimplemented and unexecuted;
the parent Balancer, exact-byte owner, and independent verifier gates remain
separate.
