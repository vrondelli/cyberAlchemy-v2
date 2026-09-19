---
node_type: research
is_session: false
status: captured
created: 2026-07-16
dispatch_id: 2026-07-16-domainspec-language-type-enforcement-proof
dispatch_type: research
source_boundary:
  - .arcanum/inventory/
  - projects/domainspec-v2/
  - projects/framework-unification/
authority: explorer transcript; non-authority research evidence
---

# DomainSpec Language Type Enforcement And Proof — Explorer Transcript

The strategist appended each explorer's initial return and post-discussion final
position verbatim. These returns are research evidence, not definition, schema,
implementation, or promotion authority.

## Agent 1 — Curry, Haskell

## Curry / Haskell — formal reconstruction

### Strongest coherent claim

Framework Unification specifies a candidate three-layer language model—semantic `contract`, structural `schema`, and governed `iteration`—but does not implement that language. The imported DomainSpec v2 Lean snapshot formalizes one narrower fragment: a decidable predicate for edge-signature admissibility over a finite, earlier vocabulary, plus internal metatheorems and positive/negative witnesses.

Together they support this claim:

> DomainSpec has a designed assurance language and a mechanized proof-of-concept for relative graph well-typedness. Given a graph, trusted node classifications, and the snapshot’s encoded signature table, Lean can decide whether every non-escape edge has an admitted endpoint pair and can prove selected internal properties of that encoded rule set.

They do **not** support the stronger claim that the current DomainSpec language makes intended structures unconstructible, proves the live 30-signature authority, preserves meaning through translation, establishes implementation conformance, predicts runtime behavior, or proves semantic correctness.

### Key findings

1. **The “language” is presently a stratified design, not a parser or operative type system.**
   Framework Unification deliberately separates semantic agreement from structural representation and change history: `projects/framework-unification/layers/domainspec-language/DOMAINSPEC-LANGUAGE-HANDOFF.md:33-82`. The refined package is explicitly “design only—no parser implemented,” with syntax and schema dialect still unresolved: `projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:1-11`, `:268-308`. Its smallest validator is structural only and explicitly defers obligations, authority, promotion, and inheritance: `DESIGN-PACKAGE.md:181-210`.

2. **The imported Lean artifact defines a validation predicate, not an intrinsically safe graph datatype.**
   `ConceptGraph` stores arbitrary `(source, Edge, target)` triples; `WellTyped` is a separate proposition checked afterward: `projects/domainspec-v2/formalization/DomainSpecEdgeSignature.lean:188-219`. Therefore invalid structure remains constructible: `badGraph` is a valid Lean value but fails `WellTyped`: `DomainSpecEdgeSignature.lean:342-349`. This is weaker than Framework Unification’s aspirational “forbidden edges unconstructible” language: `projects/framework-unification/CONCEPT-MAP.md:113-145`.

3. **The proved fragment is real but relative and deliberately permissive.**
   The file proves `WellTyped G ↔ residue G = []`, partition/family properties, counts, and non-vacuity witnesses: `DomainSpecEdgeSignature.lean:223-281`, `:289-317`, `:340-390`. But `WellTyped` accepts any `other` edge or edge touching `opaque`; `escapeGraph` and `opaqueGraph` are both well-typed while recording vocabulary failure: `DomainSpecEdgeSignature.lean:193-215`, `:359-376`. Thus “well-typed” means “admitted or explicitly escaped,” not “fully classified and conforms to intended structure.” Also, family-scoping says nothing about extension edges because the three implications are vacuous for `family = extension`: `DomainSpecEdgeSignature.lean:263-281`.

4. **Zero `sorry` is not current operational proof.**
   The imported folder declares itself a non-authoritative snapshot, unbuilt locally, with no local lakefile/toolchain and a pending source build-gate re-verification: `projects/domainspec-v2/formalization/README.md:1-8`, `:83-95`. More decisively, its 29-edge transcription is stale against the live 30-signature authority: `formalization/README.md:59-81`. Current authority names 30 signatures: `projects/domainspec-v2/definitions/relationships/relationships.yml:1-18`; examples of drift include widened `applies` and `queries`, new `owns`/`belongs-to`, and deprecated `enforces-cross`: `relationships.yml:164-177`, `:212-273`, `:525-531`. Absence of proof holes can establish completeness of the snapshot’s proof terms only after compilation; it cannot establish transcription fidelity to a different current authority.

5. **No preservation or semantic theorem bridges the designed language to artifacts, code, or behavior.**
   The current category-law route calls DomainSpec only a “typed composable graph fragment,” reserving identities, composition, closure, associativity, projection preservation, and obligation preservation for future work: `projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:13-23`, `:27-44`. The Inventory synthesis also marks the language/category bridge as candidate interpretation and its LLM/representability readings as unproved: `.arcanum/inventory/entries/category-theory-domainspec-language-synthesis.md:17-28`, `:64-77`, `:87-95`.

### Claim–evidence–gap table

| Assurance layer | Supported claim | Trusted assumptions | Counterexample or gap |
|---|---|---|---|
| Syntax / schema checking | A structural validator surface is designed. | Chosen syntax and schema dialect will faithfully realize the field model. | No parser exists; syntax and dialect remain open. Semantic obligations are deferred. |
| Typing judgment | `WellTyped G` is decidable relative to `τ` and snapshot `sig`. | Every node’s `τ` classification is correct; `sig` is the intended authority; escapes are acceptable. | `badGraph` is constructible. `escapeGraph` is well-typed despite an unknown relation. |
| Rule-set properties | Selected properties of the encoded finite rule set have proof terms and witnesses. | The source snapshot compiled under the claimed Lean/Mathlib environment; definitions encode the intended laws. | No local build metadata or fresh receipt. Internal consistency does not prove authority fidelity; the table is stale. |
| Translation preservation | None established generally. | A future mapping preserves types, status, scope, obligations, and authority. | Current route says only bounded checks exist; no general preservation theorem. |
| Implementation conformance | None follows from this Lean artifact. | Code-to-spec extraction is sound and complete enough for the claimed boundary. | No translator or relation between code and `ConceptGraph` is present here. |
| Runtime behavior | None. | Structural edges adequately model execution semantics, ordering, failures, and state. | A structurally admitted edge graph can still be implemented with wrong behavior. |
| Semantic correctness | None. Contracts name meaning and obligations, but current machine checks do not discharge them. | Human-authored contract captures true intent and obligation predicates faithfully formalize it. | A schema-valid, edge-well-typed system may encode the wrong business requirement; Layer B remains narrative review. |

### Local tensions

- “Forbidden edges unconstructible” conflicts with the imported representation, where arbitrary triples are constructible and rejected only by `WellTyped`.
- Framework’s older assurance material describes a different self-contained/no-Mathlib theorem surface, while this imported file explicitly imports Mathlib at `DomainSpecEdgeSignature.lean:35`; proof claims must not transfer between those artifacts without a named bridge.
- Inventory proposes reading the pipeline as categories, while current DomainSpec authority explicitly stops at a typed composable graph fragment.

### Questions for synthesis

1. Should `WellTyped` mean strict signature conformance, with escapes producing a separate degraded judgment, rather than counting escapes as well-typed?
2. What generated derivation or refinement proof will connect live `relationships.yml` authority to Lean `sig`, so theorem validity and authority fidelity cannot drift independently?
3. Is the intended enforcement model an intrinsically typed AST where bad edges are unrepresentable, or a permissive graph plus a rejecting validator?
4. What is the first addressable semantic judgment beyond shape—e.g. `artifact ⊨ obligation`—and what evidence is sufficient to discharge it?
5. Should “DomainSpec language” denote the contract/schema/iteration notation, the graph-signature calculus, or a composition of both with an explicit preservation boundary?

## Post-discussion final position — Curry, Haskell

### Agreements

- Shannon confirms the operational half my lane excluded: current validators do enforce normalized endpoint membership against the live 30-signature authority, with real positive and negative witnesses. This strengthens “bounded structural enforcement,” not the broader language/proof claim.
- Shannon’s ignored fields—multiplicity, `feature_scope`, semantics, composition, obligations—match the formal boundary: current authority itself calls DomainSpec a “typed composable graph fragment,” while general composition and obligation preservation remain unproved (`projects/domainspec-v2/definitions/reviews/2026-07-12-category-law-formalization-route.md:13-20`, `:27-44`).
- Spivak’s three-system decomposition is useful: designed document language, active typed graph fragment, and translation/minting machinery. I agree no governed preservation bridge currently makes them one language.
- I agree that transported declarations, IDs, digests, and provenance establish syntactic traceability only—not preservation of meaning.

### Specific disagreements

- I would not describe all negative tests as endpoint-type proof when Shannon finds six can pass through an unrelated global participation violation. A negative fixture is discriminating only if it proves the expected rejection cause; the formal snapshot’s `badGraph` is cleaner because the named theorem targets that exact judgment (`projects/domainspec-v2/formalization/DomainSpecEdgeSignature.lean:342-349`).
- I would qualify Spivak’s “Framework recon is stale” as “draft, design-only, and partly overtaken.” Staleness is proven for the imported Lean signature table (`projects/domainspec-v2/formalization/README.md:59-81`); the Framework language package instead explicitly remains parser-free with unresolved syntax/schema decisions (`projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:1-11`, `:268-308`).
- “Typed graph language” must not imply an intrinsically typed AST: arbitrary edge triples remain constructible, and `WellTyped` is a separate predicate (`DomainSpecEdgeSignature.lean:188-219`).

### What changed from my initial position

I now include two stronger, current facts: live endpoint enforcement exists independently of Lean, and narrow mint/translation machinery preserves explicit structural identifiers. I also downgrade fixture-count evidence where rejection causes are non-discriminating.

### Strongest surviving claim

DomainSpec currently has a live, bounded endpoint-membership validator over 30 authoritative signatures; a stale imported Lean snapshot proving internal properties of an earlier relative typing judgment; and a designed contract/schema/iteration language plus narrow structural translation machinery. These are complementary assurance fragments, not yet one governed language or proof chain. They enforce and prove selected structure, but do not establish full authority-field enforcement, translation preservation, implementation conformance, runtime behavior, or semantic correctness.

### Unresolved tensions

- Strict conformance versus `WellTyped` accepting tracked escapes.
- Current authority fields versus runtime checks that ignore most of them.
- Artifact-provenance versus domain-concept meanings inside one `connections` surface.
- Field transport versus obligation/meaning preservation.
- Validator rejection versus discriminating evidence of the intended rejection cause.

## Agent 2 — Shannon, Claude

## Explorer 2 initial return — current DomainSpec v2 enforcement

### Key findings

1. **Current enforcement is real but bounded to parsed structure.**
   Root `definitions/relationships/relationships.yml` is the active machine authority with 30 active signatures ([lines 1-18](projects/domainspec-v2/definitions/relationships/relationships.yml#L1)). The loader reads it directly, excludes deferred/deprecated signatures, and fails if `signature_count` differs from the active count ([impl/tools/lib/relationship-signatures.ts:85-143](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L85)). The default validator then checks authored graph triples and schema `source_of`/`target_of` projections ([validate-relationships.ts:24-65](projects/domainspec-v2/impl/tools/validate-relationships.ts#L24)).
   **Current observation, 2026-07-16:** `npm run validate:rels` passed with `3 specs checked, edgesChecked=14, canonicalSignatures=30`; the 8 focused relationship tests passed; financial-settlement content validation passed with 7 concepts and 5 edges. This establishes current executable structural enforcement, not merely design intent.

2. **A complete authority → positive → negative → receipt chain exists for endpoint typing.**
   `enforces` is currently `Rule → Operation` ([relationships.yml:84-97](projects/domainspec-v2/definitions/relationships/relationships.yml#L84)). The real financial-settlement pack supplies the positive witness `NoDuplicateMakeupRule --enforces--> GenerateSettlement` after registering the endpoints as Rule and Operation ([financial-settlement/SPEC.md:17-37](projects/domainspec-v2/impl/spec/features/financial-settlement/SPEC.md#L17)); its focused test requires success and 5 checked edges ([validate-content.test.ts:142-146](projects/domainspec-v2/impl/tools/tests/validate-content.test.ts#L142)). The one-axis negative uses `State Machine --enforces--> Operation` ([redcheck:3-14](projects/domainspec-v2/impl/spec/features/agent-execution-orchestrator/__redcheck__/run-state-machine-enforces-operation.md#L3)); the task receipt records exactly one expected rejection and explicitly says endpoint validation is not code-call proof ([TASK-SESSION-RESULT.md:64-97](projects/domainspec-v2/development/r3-closeout-plan/task-sessions/2026-07-12-swu-r3c-004/TASK-SESSION-RESULT.md#L64)).
   I reran both negative paths: each exited 1 with the expected `unconstructible-edge` and `expected rule -> operation`. This proves the parser rejects those endpoint tuples. It does **not** prove that a Rule actually gates an Operation, that the Operation exists in implementation, or that runtime behavior satisfies the prose semantics.

3. **The validator enforces less than the authority records.**
   DS-D8 defines a signature tuple containing verb, endpoint sets, scope, multiplicity, and lifecycle status ([DEFINITIONS.md:1123-1135](projects/domainspec-v2/definitions/DEFINITIONS.md#L1123)). Runtime matching, however, only compares normalized source and target type membership ([relationship-signatures.ts:474-499](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L474)). It does not evaluate `multiplicity`, `feature_scope`, `semantics`, `validation.obligations`, `composition`, or projection behavior. Schema participation likewise checks only derived `source_of`/`target_of` sets ([relationship-signatures.ts:248-297](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L248)).
   Therefore “30 signatures loaded” does not mean every recorded obligation is executable. Scope-sensitive orchestration, ordered multiplicity, semantic distinctions such as `owns` versus `belongs-to`, and composition consequences remain unproved by this checker.

4. **The witness set is discriminating but not signature-complete, and six negative tests can pass for the wrong reason.**
   The two real packs exercise 14 edges but only 9 distinct verbs; the committed positive relationship fixture exercises 6 verbs, bringing observed positive coverage to 12 of 30. No live pack exercises the UI or UI→backend signature families. The focused test locks the total count at 30, but it does not construct a positive and negative witness for every signature ([validate-relationships.test.ts:22-49](projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts#L22)).
   More subtly, each of six endpoint-negative tests asserts only exit 1 plus the presence of any `unconstructible-edge` ([lines 29-41](projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts#L29)). Every fixture run also performs global schema-participation validation, which emits the same class ([validate-relationships.ts:53-64](projects/domainspec-v2/impl/tools/validate-relationships.ts#L53)). If unrelated schema drift caused a failure while the bad triple were accidentally accepted, those tests could still pass. The generated-`owned-by` test is stronger because it also asserts the specific “Generated inverse” diagnostic.

5. **Neither object admissibility nor the imported Lean artifact closes the universal proof gap.**
   The content validator silently continues when a Concept Registry is missing or malformed, and silently skips a concept whose type has no loaded schema ([validate-content.ts:99-119](projects/domainspec-v2/impl/tools/validate-content.ts#L99)). Meanwhile DS-D1 says UI labels are candidate/deferred and not in the supported profile, even though DS-D8 uses them as endpoints ([meta-types.yml:13-36](projects/domainspec-v2/definitions/meta-types/meta-types.yml#L13)). The relationship checker does not read that maturity/profile authority, so endpoint-string membership is not a proof of profile-relative object closure.
   The Lean checker is explicitly an imported, unbuilt, stale 29-edge snapshot, while current authority has 30 signatures ([formalization/README.md:59-95](projects/domainspec-v2/formalization/README.md#L59)). Its source-level metatheorems therefore do not certify the live registry. General identity, composition, closure, associativity, path equations, and preservation remain expressly open ([DEFINITIONS.md:1001-1053](projects/domainspec-v2/definitions/DEFINITIONS.md#L1001)).

### Enforcement matrix

| Surface | What it currently rejects/proves | Evidence status | Universal claim it cannot establish |
|---|---|---|---|
| Authority loader | Missing/unparseable authority, missing signatures, signature without ID, active-count mismatch | **current executable** | Semantic validity or completeness of the 30 rows |
| Relationship triple checker | Generated/noncanonical labels, undeclared concepts, source/target type mismatch | **current executable; fixture-local and real-pack witnessed** | Scope, multiplicity, composition, behavior, meaning |
| Schema participation check | Drift between DS-D8 endpoint sets and schema `source_of`/`target_of` arrays | **current executable** | Correctness of schema criteria or concept formation |
| Content validator | Known schema shape predicates plus relationship triples | **current executable** | Unknown-type rejection, registry completeness, semantic satisfiability, runtime correctness |
| Focused tests/receipts | Selected positive and negative tuples, count lock, historical real-pack receipt | **current rerun + fixture-local; receipt dated 2026-07-12** | Exhaustive coverage of all 30 signatures or all parser shapes |
| Lean artifact | Rule-set theorems for its own transcribed 29-edge model | **imported-only, stale, not locally built** | Fidelity to current root authority or vocabulary adequacy |
| Category-law route | Explicit statements of needed identity/composition/preservation work | **designed/open** | Any current category or translation-preservation proof |

### Local tensions and gaps

- DS-D8 records scope and multiplicity, but the runtime checker consumes only verb and endpoint sets.
- DS-D1 marks UI types candidate/deferred while DS-D8 exposes active signatures over them; the relationship validator has no selected-profile or maturity gate.
- `sample/SPEC.md` calls itself “non-vacuously green” while declaring no relations ([lines 1-10](projects/domainspec-v2/impl/spec/features/sample/SPEC.md#L1)); real packs now prevent the aggregate run from being empty, but the statement remains misleading.
- Inventory is parseable but explicitly partial ([index.json:9999-10010](.arcanum/inventory/index.json#L9999)). Its edge-law entry still says the authoritative surface remains to be selected ([index.json:3633-3674](.arcanum/inventory/index.json#L3633)), contradicting current active root authority. It also lacks a direct entry for the imported `formalization/` status and the current enforcement chain.

### Questions for synthesis

1. Is the intended language checker profile-relative? If yes, must it reject DS-D8 edges whose endpoint types are candidate/deferred under DS-D1?
2. Are `feature_scope`, `multiplicity`, `composition`, and `validation.obligations` normative executable fields or descriptive metadata? Current files imply the former more strongly than runtime supports.
3. Should each active signature require an isolated positive witness and a named one-axis negative, with negative assertions tied to the exact triple rather than any global `unconstructible-edge`?
4. Is the imported Lean table meant to become generated from root authority, or remain only a drift exhibit? Until resolved, it must not certify current DS-D8.

**Bottom line:** a passing structural checker proves that the triples it successfully parsed match active endpoint tuples and that schema endpoint projections currently agree. It does not prove complete parsing, profile admissibility, implementation conformance, runtime behavior, relationship meaning, or general composition laws.

## Post-discussion final position — Shannon, Claude

### Agreements

- Curry is right that the imported Lean artifact proves properties only relative to its trusted `τ` and `sig` encoding. It is stale, unbuilt locally, non-authoritative, and has no theorem connecting graph typing to code, runtime behavior, or meaning ([formalization/README.md:59-95](projects/domainspec-v2/formalization/README.md#L59)).
- Spivak is right that the designed contract/schema/iteration language, active DS-D2/DS-D8 graph surface, and minted/derivation machinery are distinct systems without a governed preservation bridge.
- Both returns reinforce that “type-checked” must not collapse into “semantically correct” or “translation-preserving.”

### Specific disagreements and qualifications

- I qualify Curry’s “forbidden edges are constructible.” They are syntactically authorable as Markdown or Lean triples, then rejected by a post-parse admissibility predicate. In current TypeScript, the parser accepts table rows before `validateTriple` returns `unconstructible-edge` ([relationship-signatures.ts:170-189](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L170), [482-499](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L482)). Thus “unconstructible” is a repository violation class, not static prevention of representation.
- I qualify Spivak’s phrase “active DS-D1/DS-D2/DS-D8 graph language.” DS-D1 is maturity-split: 13 backend types are active, nine UI types candidate, and two UI types deferred, while DS-D8 still uses UI labels as endpoints ([meta-types.yml:13-36](projects/domainspec-v2/definitions/meta-types/meta-types.yml#L13)). The current validator does not enforce that maturity/profile boundary.
- DS-D8’s recorded tuple is richer than its executable interpretation: runtime checks verb plus endpoint sets, not scope, multiplicity, composition, or semantics ([DEFINITIONS.md:1123-1135](projects/domainspec-v2/definitions/DEFINITIONS.md#L1123); [relationship-signatures.ts:474-499](projects/domainspec-v2/impl/tools/lib/relationship-signatures.ts#L474)).

### What changed from my initial position

I now distinguish more sharply between:

1. syntactic representability;
2. post-parse endpoint admissibility;
3. theorem-level properties of a separately encoded checker; and
4. preservation across document, graph, minted, derivation, code, and runtime surfaces.

My initial result bounded runtime claims correctly, but underemphasized that three partially overlapping language systems—not one incomplete language—currently coexist.

### Strongest surviving claim

DomainSpec v2 currently has a bounded, executable, post-parse structural checker that reads live root authority and rejects noncanonical labels, undeclared concepts, and endpoint-type mismatches. It is currently green over 14 real-pack edges and discriminating negative fixtures. The imported Lean snapshot establishes stronger rule-set properties only for its stale encoding. Neither surface proves meaning, implementation behavior, translation preservation, or a unified DomainSpec language.

### Unresolved tensions

- Whether DS-D1 maturity/profile admission must gate DS-D8 endpoints.
- Whether scope, multiplicity, composition, and obligation fields are normative executable law or descriptive metadata.
- Whether the three language systems should be bridged, generated from one authority, or remain explicitly separate.
- How to obtain exact per-signature witnesses and preservation checks without turning fixture coverage into a universal semantic claim.

## Agent 3 — Spivak, David

## Spivak explorer return — cross-layer preservation map

### Bottom line

The two project trees do **not** yet form one coherent language. They contain three partially overlapping systems:

1. Framework Unification’s **designed document/governance language**: `contract`, `schema`, `iteration`, `example`, `use_case`, plus a universal artifact envelope.
2. DomainSpec v2’s **active domain-graph language**: DS-D1 node kinds, DS-D2 verbs, DS-D8 endpoint signatures, profile admission, and shape validators.
3. DomainSpec v2’s **translation/verification machinery**: minted-project compiler and test-derivation engine.

There are useful structural correspondences, but no governed translation states what must be preserved between these systems, and DomainSpec v2 explicitly denies any current functorial-preservation proof.

### Five key findings

1. **The proposed node envelope has a real but narrow descendant in minted-project.**
   Framework’s envelope proposes identity, intent, connections, body, residue, and epistemic proof metadata (`projects/framework-unification/layers/domainspec-language/SCHEMA-INVENTORY.md:86-114`). The minted node schema now requires `node_id`, `feature_id`, `kind`, `intent`, `body`, and `connections` (`projects/domainspec-v2/impl/spec/minted-project/node.schema.json:5-16`). That preserves the structural core, but drops lifecycle/promotion state, authority, typed references, residue, and epistemic proof. It is also bounded to an **experimental** profile of four kinds and three relationships with release admission explicitly withheld (`projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:18-67`).

2. **The identical-looking `connections` field hides a level error.**
   Framework’s envelope connections are artifact-provenance morphisms such as `derives-from`, `cites`, `implements`, and `supersedes`; it separately identifies domain-concept edges and leaves their reconciliation open (`projects/framework-unification/CONCEPT-MAP.md:113-126`, `:199-203`). Minted-project connections are source-owned DS-D8-style domain edges, admitted by profile and endpoint kind (`projects/domainspec-v2/impl/tools/minted-project/compiler.ts:315-359`). Reusing one envelope field does not unify the catalogs; without a typed level discriminator it risks collapsing provenance edges into domain edges.

3. **Contract/schema separation is conceptual in Framework Unification but distributed across v2 authority homes.**
   Framework defines contract as semantic obligation and schema as structural shape, with symmetric obligation-level links and explicit anti-collapse rules; those rules are blocked until prose invariants receive stable `obligation_id`s (`projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:102-132`). DomainSpec v2 instead distributes vocabulary/profile authority, source-schema authority, generated-view contracts, executable tooling, and witnesses across separate homes (`projects/domainspec-v2/authority/decisions/2026-07-14-minted-project-node-package.md:42-61`). This preserves separation of concerns, but not the proposed first-class `contract ↔ schema ↔ obligation` language relation. The v2 content validator is explicit that it validates shape, not semantic satisfiability (`projects/domainspec-v2/impl/tools/validate-content.ts:3-10`).

4. **Working translators preserve explicit structure and provenance, not semantic meaning or functor laws.**
   The derivation engine implements `parse → derive → obligation_key → emit` (`projects/domainspec-v2/impl/test-derivation-engine/src/index.ts:1-33`), records translation residue/provenance (`projects/domainspec-v2/impl/test-derivation-engine/src/README.md:73-93`), and supports refinement by preserving old obligations when a supported declaration is added. Its own boundary says this does not establish semantic refinement or implementation satisfaction (`projects/domainspec-v2/impl/test-derivation-engine/src/README.md:119-132`). The minted compiler similarly emits a digest-pinned generated graph and provenance manifest (`projects/domainspec-v2/impl/tools/minted-project/compiler.ts:363-440`). Framework Inventory’s functor-chain reading remains candidate synthesis, not authority (`.arcanum/inventory/entries/evidence-cards/2026-06-21-category-theory-domainspec-language-cards.md:140-159`), while v2 explicitly excludes any current functorial-preservation proof (`projects/domainspec-v2/definitions/DEFINITIONS.md:1019-1027`).

5. **Formalization proves properties of a stale transcription, not coherence between the languages.**
   The imported Lean file is marked non-authoritative and not built locally (`projects/domainspec-v2/formalization/README.md:1-8`, `:83-95`). Its 25/29-era table differs from current 30-signature authority (`projects/domainspec-v2/formalization/README.md:59-81`). It can inform a future generated-from-root drift gate, but presently neither certifies DS-D8 nor supplies the missing document-language ↔ domain-graph translation.

### Mapping table

| Framework concept | Current DomainSpec v2 surface | Assessment |
|---|---|---|
| Semantic `contract` document | Two-plane contract plane; authority decisions; DS-D8 called a typed contract | **Distributed / overloaded.** No single first-class contract document kind with addressable obligations. |
| Structural `schema` document | Per-meta-type `.schema.yml`; minted-project JSON Schemas; relationship registry | **Preserved, dialect-fragmented.** Framework’s schema-dialect decision remains unresolved (`DESIGN-PACKAGE.md:283-287`). |
| Separate `iteration` document | Decisions, source digests, residue receipts, refinement tests | **Missing as one language construct.** No surveyed live surface carries the proposed `prev_state`, `next_state`, typed deltas, and replay chain together. |
| Universal node envelope | Minted node source + generated graph | **Partially preserved.** Structural core exists; governance/epistemic fields are absent; profile is narrow and experimental. |
| Artifact references as morphisms | Framework provenance catalog | **Not mapped into v2 DS-D8.** The two catalogs remain separate and unreconciled. |
| Translator | Normalized-SPEC adapter, derivation engine, minted compiler | **Operationally present.** Preserves explicit declarations, stable obligations, digests, and provenance; semantic preservation remains unproved. |
| Functor / preservation law | Candidate Inventory synthesis; finite DS-D8 graph fragment | **Missing as authority.** V2 expressly disclaims general composition and functorial preservation. |
| Validation authority | DS-D1 criteria, DS-D8 root registry, validators, positive/negative fixtures | **Strong for bounded shape/admissibility.** Example rejection is executable (`projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts:22-49`), but it is not Layer-B obligation proof. |
| Formal proof | Imported Lean edge checker | **Supporting precedent only; drifted.** No current-root generation or local proof gate. |

### Drift and inconsistencies

- Framework’s recon still describes a 25-meta-type language, Saga as active, eleven UI types as uniformly deferred, and 29 edges (`projects/framework-unification/components/recon/MAP-domainspec-v2.md:3-5`, `:57-63`). Current v2 authority has 24 staged labels, 13 active backend types, a superseded Saga tombstone, differentiated UI candidates/deferred labels, and 30 active signatures (`projects/domainspec-v2/definitions/DEFINITIONS.md:1055-1068`, `:1140-1150`).
- Framework’s design says negative fixtures did not exist (`projects/framework-unification/layers/domainspec-language/research/DESIGN-PACKAGE.md:167-177`); v2 now has explicit negative endpoint fixtures and tests. The design package is therefore historical design evidence, not a current implementation inventory.
- The Framework functor-chain synthesis says stages are not yet declared as categories (`.arcanum/inventory/entries/evidence-cards/2026-06-21-category-theory-domainspec-language-cards.md:140-159`); v2’s canonical term remains only a finite typed composable graph fragment.

### Architecture constraints for synthesis

- DomainSpec v2 root definitions and profile authorities remain sovereign; Framework artifacts can propose mappings but cannot silently become v2 authority. The source spine requires local owner-route selection and says framework edges cannot promote authority (`projects/domainspec-v2/authority/source-spine.md:34-53`).
- Preserve the two-plane direction: contract authority may inform authoring, never the reverse (`projects/domainspec-v2/definitions/DEFINITIONS.md:183-207`).
- Keep artifact-provenance edges and domain-concept edges distinct unless a new typed bridge explicitly declares their levels and preservation law.
- Keep generated graphs, manifests, Markdown views, and receipts non-authoritative; v2 already marks them generated read models (`projects/domainspec-v2/impl/tools/minted-project/compiler.ts:374-418`).
- Any language claim must be profile-bounded. Existence in DS-D1/DS-D8 does not imply admission into the current minted-project profile.
- Separate four assurance claims: shape validity, endpoint admissibility, translation traceability, and semantic preservation. Current evidence does not justify collapsing them.

### Local tensions and questions for synthesis

1. Is the Framework language intended to type **pipeline artifacts**, **domain concepts**, or both through explicitly different universes? The current use of “node” for both is unsafe.
2. Should minted-project become a specialization of the universal envelope, or remain a separate consumer-project language? Specialization requires a rule for omitted `residue`, `epistemic`, lifecycle, authority, and reference fields.
3. What is the explicit translator between a semantic contract obligation and DS-D1/DS-D8 nodes/edges? Until stable obligation IDs exist, schema satisfaction cannot be traced back to contract meaning.
4. Is iteration a document-language concern, a derivation receipt, an authority decision log, or a temporal graph layer? Current v2 surfaces split these roles.
5. What finite preservation obligations would turn the existing compilers into a claimed functorial bridge? At minimum, the owner must name preserved node identity, edge typing, obligation identity, provenance, residue, and authority posture—and define counterexamples for each.

No files were modified.

## Post-discussion final position — Spivak, David

### Agreements

- Curry confirms the formal boundary: Framework’s contract/schema/iteration language is design-only, and the imported Lean checker proves only properties relative to its encoded signature table—not translation to code, behavior, or meaning. This matches v2’s explicit exclusion of functorial preservation (`projects/domainspec-v2/definitions/DEFINITIONS.md:1019-1027`).
- Shannon confirms the runtime boundary: current validators witness some endpoint rejection against 30-signature authority, but ignore multiplicity, scope, semantics, composition, and declared obligations. DS-D8 itself warns it is endpoint authority, not category-law proof (`projects/domainspec-v2/definitions/DEFINITIONS.md:1130-1150`).
- Both support the same drift conclusion: the Lean 29-edge snapshot is stale, unbuilt locally, and non-authoritative (`projects/domainspec-v2/formalization/README.md:59-95`).

### Specific disagreements

- I sharpen Curry’s “forbidden edges remain constructible” claim: it is correct for current representations, despite Framework I7 saying they should be unconstructible (`projects/framework-unification/CONCEPT-MAP.md:137-146`). Minted connection `type` is any non-empty string (`projects/domainspec-v2/impl/spec/minted-project/connection.schema.json:7-12`); only later does the compiler classify and reject it (`projects/domainspec-v2/impl/tools/minted-project/compiler.ts:323-352`). The current system implements **post-construction rejection**, not construction-by-typed-constructor.
- I disagree with any reading of Curry that translation is wholly absent. A working operational bridge preserves explicit declarations, stable obligations, source provenance, and visible residue; its own contract then stops before semantic refinement (`projects/domainspec-v2/impl/test-derivation-engine/src/README.md:73-93`, `:119-132`). What is absent is a governed preservation theorem, not all translation machinery.
- I disagree with treating Shannon’s green validator result as broad DS-D8 enforcement. The focused test asserts rejection classes (`projects/domainspec-v2/impl/tools/tests/validate-relationships.test.ts:22-49`), while Shannon identifies false-positive paths and parser skips. The defensible claim is sampled endpoint discrimination, not comprehensive enforcement of the root relation record.

### What changed from my initial position

I weaken “strong bounded shape/admissibility” to “real but sampled rejection evidence with known blind spots.” I also replace “typed edges become unconstructible” with the more accurate pipeline: permissive authored representation → parse → authority lookup → rejection. The three-language decomposition remains unchanged.

### Strongest surviving claim

Framework Unification’s artifact language, DomainSpec v2’s domain-graph authority, and v2’s translators are not yet one coherent language because no governed mapping states and checks what node identity, edge meaning, obligation identity, provenance, residue, lifecycle, or authority must be preserved across them.

### Unresolved tensions

- Typed construction versus validator-after-construction.
- Root-wide DS-D8 authority versus profile-bounded and parser-dependent enforcement.
- Formal rule-set metatheorems versus live authority fidelity.
- Structural translation receipts versus semantic preservation.
- Artifact-provenance edges versus domain-concept edges under the shared word `connections`.
