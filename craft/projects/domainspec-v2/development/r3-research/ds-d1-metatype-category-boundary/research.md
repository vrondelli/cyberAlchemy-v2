---
node_type: research-transcript
is_session: false
status: candidate
created: 2026-07-02
dispatch_id: 2026-07-02-dsv2-metatype-category-boundary
transcript_scope: explorer returns only
---

# Research Transcript - DS-D1 Meta-Type Category Boundary

This file mechanically preserves the explorer returns for dispatch
`2026-07-02-dsv2-metatype-category-boundary`. Synthesis, review, and final findings belong
in `findings.md`.

## Agent 1 - Abramsky, Samson

**Verdict**
DS-D1 meta-types should be treated as **first-class authority when they change admissibility**: what a spec can form, reject, relate, generate, test, or route to an owner. Current DS-D1 has a strong backend candidate surface, but most schemas are deliberately **shape-only**, so the right posture is **active-harden**, not "mathematically complete."

**1. Formal Precedent Criteria**
| Criterion | Formal precedent | DS-D1 authority test |
| --- | --- | --- |
| Formation | Type theory, algebraic specification sorts/signatures | Is there a declared schema/grammar for forming the concept? |
| Use/elimination | ADTs, dependent type eliminators, OBJ/CASL operations | Does the type enable specific relations, generators, tests, or projections? |
| Equality/identity | Type theory equality, observational equivalence, DDD identity | Does it define sameness, distinction, or substitution behavior? |
| Satisfaction | Institutions, model theory, algebraic specs | Can an aspect concept satisfy or fail the meta-type criterion? |
| Primitive vs derived | Definitional extension, desugaring, institution morphisms | Does removing it change validation or generation, or is it metadata sugar? |
| Operational behavior | Plotkin SOS, Hoare/Dijkstra, design by contract | Does it impose pre/postconditions, transitions, effects, or invariants? |
| Behavioral equivalence | Milner/Park bisimulation, trace/refinement traditions | Does it change observable traces, allowed behaviors, or failure handling? |
| Coherence/composition | Typed graph/category-theory discipline | Do relations compose meaningfully without endpoint ambiguity? |

This matches the local promotion rubric: stable contrast, typed signature, concrete downstream obligation, and witnessed decision pressure in [first-class boundary findings](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:22).

**2. DS-D1 General Application**
The current root DS-D1 registry says the meta-type system is the node alphabet of 25 concept types, but the checked root member list currently covers **14 backend types** from Entity through State Machine in [meta-types.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.yml:10) and [meta-types.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.yml:244). The broader 25-type claim, including 11 UI types, lives in [TAXONOMY.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/TAXONOMY.md:3).

So: DS-D1 backend meta-types are **first-class candidate authority** because they have schemas, distinguishers, fixtures, challenge/confirm contracts, and relation participation. But they are not full semantic authorities yet: the schemas repeatedly declare "shape only" and keep satisfiability/proof behind the engine moat, e.g. Entity in [entity.schema.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/structural/entity.schema.yml:4), Rule in [rule.schema.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/rule.schema.yml:3), Workflow/Saga in their companion notes.

The relationship surface is more deployed: [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:4) is active and carries 31 signatures. That means type authority and relation authority must be kept coherent.

**3. Per-Type Risks And Verdicts**
| Type | Risk under first-class rubric | Verdict |
| --- | --- | --- |
| Saga | If only `scope=cross-feature`, it collapses into Workflow metadata. Needs participant set, compensation mapping, failure/residue behavior, temporal safety, and cross-owner boundary. | **active-harden** |
| Workflow | If it includes compensation and multi-step flow without ownership boundary law, it overlaps Saga. Needs ordered step semantics and same-feature constraint. | **active-harden** |
| Operation | `state_change=yes` is declared, not proved. Needs postconditions, frame/effect discipline, produced events, and mutation targets. | **active-harden** |
| Entity | Identity field is strong formation authority, but lifecycle/ownership consequences must be observable. | **active-harden** |
| Event | `temporal=past` distinguishes from Operation, but payload, producer, transition, and causality laws need hardening. | **active-harden** |
| Rule | Boolean return type is a useful authority gate, but satisfaction is not checked. Must remain `enforces`, not `applies`. | **active-harden** |
| Policy | Strategy return type is distinct from Rule, but needs strategy codomain, priority, determinism, and conflict behavior. | **active-harden** |
| State Machine | Most formally promising, but `has_transitions=yes` is too thin without state set, transition relation, guards, effects, invariants, invalid transitions. | **active-harden** |
| Query | Read-only declaration needs observational purity/read-model semantics if used for tests or caching. | **active-harden** |
| Calculation | Value-return declaration needs purity/determinism law to avoid becoming "Operation without state_change." | **active-harden** |
| Value Object | Equality clause is declared, not proved; still load-bearing because it governs identity/equality contrast with Entity. | **active-harden** |
| Enum | No active relationship endpoint in current relation set; first-class as closed finite codomain, but harden only if exhaustiveness/codegen depends on it. | **active-harden / defer deeper laws** |
| Interface | Boundary criterion is useful; needs contract/refinement obligations if treated as behavioral authority. | **active-harden** |
| Mapping | Direction criterion is useful; needs field-level totality/partiality/error semantics if generated. | **active-harden** |
| UI types | Page/Layout/Component/View Model/Hook/Form/Action/Guard/Binding/Adapter/State Indicator are in the 25-type taxonomy and active relationship endpoints, but not root schema-backed cards yet. | **active-harden or defer as DS-D1 authority until schemas exist** |

**4. Saga/Workflow -> `orchestrates` Coherence**
Current root relationships have two active `orchestrates` rows: `Workflow -> Operation` same-feature in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:138), and `Saga -> Operation` cross-feature in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:154). That is the right direction.

Coherence implications:

- Signature identity must be keyed by full typed signature, not `id` alone: `(orchestrates, Workflow, Operation, same-feature)` vs `(orchestrates, Saga, Operation, cross-feature)`. Otherwise duplicate `id: orchestrates` can collapse.
- `Workflow --[orchestrates]--> Operation[]` should mean ordered intra-feature operation coordination.
- `Saga --[orchestrates]--> Operation[]` must add cross-feature participant and compensation obligations, not merely reuse Workflow with broader scope.
- If those Saga laws are not added, formal precedent says **collapse** Saga into Workflow + `scope` metadata.
- `Event --[triggers-cross]--> Operation` and `Operation --[produces]--> Event` should remain separate from orchestration; do not make Saga orchestrate Events unless a new law is introduced.

**5. Verdict Suggestions**
- **already-deployed:** root relationship authority, typed composable graph fragment wording, `produces`/`emits` endpoint split, generated `owned-by` as view-only.
- **active-harden:** all 14 schema-backed backend DS-D1 types, especially Saga, Workflow, Operation, Entity, Event, Rule, Policy, State Machine.
- **active-harden:** UI DS-D1 endpoint types if the 25-type claim is canonical; otherwise **defer** them as first-class DS-D1 authority until root cards and schemas exist.
- **defer:** `depends-on`, operation-returned Value Object as an edge, event payload/publisher composite; these are already listed under deferred relationship residue in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:517).
- **collapse:** `enforces-cross` into `enforces` with feature-scope metadata; Saga into Workflow only if participant/compensation laws are not hardened.
- **reject:** full "category" authority language for current DS-D1, notation-as-authority, `Operation --[emits]--> Event`, and `Rule --[applies]--> Operation`.

## Agent 2 - Fong, Brendan

**Verdict**

DS-D8 is already first-class relationship authority: active root signatures, typed endpoints, projection rules, and validator consumption. DS-D1 is not uniformly active: backend `DS-D1.1..14` are formalized candidate meta-types; UI `DS-D1.15..25` are deferred, even though DS-D8 already uses some UI types as endpoints. Full "category" authority is not yet deployed; the current sound phrase is "typed composable graph fragment." See [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:703), [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:761), and [relationships.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.md:3).

**1. Authority Criteria**

A type/category is authority when it changes what the system can form, reject, compose, preserve, project, or route to an owner. Applied categorical modeling supports this: schema objects/arrows are authority when every valid instance or migration must preserve them; views/queries are derived when recoverable without new constraints. Precedent families: categories/functors/path laws, ologs, categorical databases/CQL/FQL, RDF/RDFS/OWL class/property axioms, institutions/specifications, and wiring diagrams. Local corpus states the same boundary: repetition is evidence, laws and preservation justify authority ([research.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/research.md:20), [research.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/research.md:54)).

Promote when there is stable contrast, examples/non-examples, typed endpoints, inverse/generated-view policy, downstream validation/composition/projection obligation, and witnessed pressure ([findings.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:22)). Defer or collapse when the distinction is only an attribute, label, reverse navigation, markdown notation, implementation pointer, or query/view.

**2. DS-D1 And DS-D8**

DS-D1 is the node alphabet, but current root text explicitly says backend `DS-D1.1..14` are candidate and UI `DS-D1.15..25` are deferred ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:713)). So backend meta-types should be treated as first-class candidates with machine criteria, not as fully confirmed category law.

DS-D8 is active endpoint authority: an edge is constructible iff the verb is active and source/target concept types match an active signature ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:772)). Root `relationships.yml` is active, has 31 signatures, and separates generated/deferred entries ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:1), [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:506)). I also verified read-only: `npm run validate:rels` passes with `canonicalSignatures=31`.

**3. Per-Type Implications**

| Type | Implication | Verdict |
| --- | --- | --- |
| Entity | Strong object authority: declared identity + typed fields; participates in `owns`, `belongs-to`, `contains`, `emits`, etc. | active-harden |
| Value Object | First-class value object when equality/no-identity matters; not just a field bundle. | active-harden |
| Enum | Closed value set; currently little DS-D8 relation role. | active-harden as field domain; defer relation authority |
| Operation | Write-side action; many active DS-D8 endpoints. | already-deployed as endpoint; active-harden as DS-D1 |
| Query | Read-only behavior; `queries`, `exposes`, `fetches`. | active-harden |
| Calculation | Pure value derivation; do not turn "returns Value Object" into an edge yet. | active-harden; defer extra edge |
| Rule | Boolean guard; source of `enforces`, not Policy. | active-harden |
| Policy | Strategy selector; source of `applies`, not boolean gate. | active-harden |
| Workflow | Same-feature ordered orchestration. | already-deployed relation; active-harden scope law |
| Saga | Cross-feature orchestration with compensation pressure; current criterion is only `scope=cross-feature`. | active-harden, not done |
| Interface | Boundary object exposing Operation/Query. | active-harden |
| Event | Past fact; endpoint split `Operation produces Event` vs `Entity emits Event` is sound. | already-deployed endpoint; active-harden |
| Mapping | Shape transform with direction. | active-harden |
| State Machine | Lifecycle object with transitions; best candidate for future path laws. | active-harden |
| UI 11: Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Adapter, State Indicator | Load-bearing in DS-D8, but DS-D1 criteria are deferred; shadows must not collapse into backend counterparts because they carry distinct edges ([LEARNING-ORDER.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/LEARNING-ORDER.md:57)). | defer DS-D1 promotion; active-harden if UI validator depends on them |

**4. Coherence Rules**

1. A Concept Registry type declaration must precede relationship checking; endpoints are checked by declared type, not heading prose ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:524)).
2. Root DS-D8 owns relationship law; markdown, impl docs, and per-type `edge_participation` slices are projections/evidence, not independent authority ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:791)).
3. `orchestrates` must be keyed by full typed signature, not verb alone: Workflow->Operation is same-feature; Saga->Operation is cross-feature ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:138)).
4. Saga remains first-class only if participant set, ordered operations, compensation mapping, failure/residue behavior, temporal safety, and cross-feature ownership become structural obligations.
5. `owned-by` is generated navigation; `belongs-to` is distinct and must not be treated as `owns^-1` ([relationships.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.md:67)).
6. Promote path laws only when finite checks exist. Until then, keep category theory as a test generator, not deployed authority.

**5. Verdict Suggestions**

Already deployed: DS-D2 verb set, DS-D8 relationship signature authority, typed composable graph fragment wording, `produces`/`emits` endpoint split, Workflow and Saga `orchestrates` signatures.

Active-harden: backend DS-D1.1..14, Saga laws, `owns` observable obligations, `belongs-to` disambiguation, UI endpoint categories if DS-D8 continues to depend on them.

Defer: full category laws, DS-D1.15..25 criterion authority, `depends-on`, `operation-returns-value-object`, `event-payload-publisher-composite`, arbitrary path equations.

Collapse: `enforces-cross` into `enforces` + scope metadata; collapse Saga into Workflow only if compensation/participant laws stay non-structural.

Reject: broad recurrence as authority, `Source --[verb]--> Target` notation as authority, authored `owned-by`, `Operation --[emits]--> Event`, and full "category" wording for current R3/L2.

## Agent 3 - Wittgenstein, Ludwig

**1. Meaning/Use Criteria**
A type word becomes governing authority when it stops being a helpful noun and starts acting as grammar: it permits, forbids, routes, or corrects moves in the DomainSpec language game.

Use these criteria:

- Stable contrast: examples and non-examples show it does not collapse into another type, field, status, edge, or display label.
- Correction norm: someone can say "not Event, Operation" or "not Rule, Policy," and the validator/owner route has a consequence.
- Bounded context: meaning is local to DomainSpec, not general English or software jargon. This matches DDD ubiquitous-language practice.
- Institutional status: an authorized owner can promote/challenge it; calling something `Saga` creates obligations.
- Machine consequence: removing the word changes reject/allow behavior, edge participation, generation, projection, or ownership.
- Relation coherence: the word has legal neighboring relations, inverse/dual policy, and composable paths.
- Maintenance route: challenge, confirm, fixture, and residue paths exist.

Local precedent already states this tightly: first-class authority begins when a candidate changes "reject, require, compose, preserve, project, or route to an owner" in [findings.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/l2-first-class-categories-cross-domain/findings.md:16), and the promotion rubric requires stable contrast, examples/non-examples, typed signatures, inverse policy, obligations, and witnessed pressure in [findings.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:26). Precedent families: Wittgenstein/use and family resemblance, DDD bounded context, ISO terminology concept systems, Austin/Searle institutional status, Brandom-style correction norms, and category/ACT schema-law tests.

**2. Application To DS-D1**
DS-D1 should be treated as first-class authority where the type word fixes concept well-formedness, edge participation, and code pattern. That is already the formal DS-D1 claim in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:230).

The backend 14 are formalized enough to govern use: each has a card, criterion schema, challenge contract, confirm contract, and validator-facing discriminator. But their status is still candidate/owner-reviewed, so the right stance is "active hardening," not casual finality. See the backend/UI split in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:713).

The relationship surface is already more active: `definitions/relationships/relationships.yml` is root authority with 31 signatures, while markdown notation is projection only in [relationships.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.md:3). That makes DS-D1 type/relation coherence a live governance surface, not a glossary exercise.

**3. Semantic / Polysemy Risks**
| Type word | Main risk | Treatment |
| --- | --- | --- |
| `Saga` | Could mean any cross-step process, or merely Workflow with `scope=cross-feature`. Current schema checks scope, while prose adds compensation. | Active-harden: make participant/compensation/failure laws structural; duplicate `orchestrates` id needs identity policy. |
| `Workflow` | Can mean UI flow, business process, or orchestration. | Already-deployed for same-feature operation orchestration; keep bounded to intra-feature scope. |
| `Operation` | Can mean method, endpoint, CRUD action, command. | Already-deployed as state-changing business action; preserve split from Query and Action. |
| `Entity` | Can mean database row, object, actor, noun. | Active-harden around declared identity/lifecycle; do not infer from nounhood. |
| `Event` | Can mean UI event, message, notification, or fact. | Already-deployed as past fact; keep `Operation --[produces]--> Event` separate from `Entity --[emits]--> Event` in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:26). |
| `Rule` | Can mean law, policy, validation, inference rule. | Active-harden as boolean block/allow guard only. |
| `Policy` | Often used synonymously with rule. | Active-harden as strategy selector, not boolean gate. |
| `State Machine` | Often collapses into Enum/status list. | Already-deployed if transitions are explicit; otherwise collapse to Enum. |
| `Value Object` / `Enum` | "Object" and "type" are overloaded. | Keep DDD-style value equality and closed value-list criteria. |
| `Interface` / `Mapping` / `Adapter` | Boundary vs transform vs UI adapter can blur. | Require boundary/transform context and endpoint obligations. |
| `owns` / `belongs-to` | English ownership, membership, classification, assignment, inverse navigation blur together. | `owns` needs observable ownership consequences; `belongs-to` must not be `owns^-1`. Generated `owned-by` is navigation only in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:506). |
| UI types | `Page`, `Component`, `Hook`, `Form`, `Action`, `Guard`, `Binding`, `Adapter`, `View Model`, `State Indicator` are familiar framework words. | They are graph-active but definition-deferred; harden if active relationships depend on them. TAXONOMY lists 14 backend + 11 UI in [TAXONOMY.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/TAXONOMY.md:3). |

**4. Governance Implications**
Keep three separations strict: meta-type vs concept instance, relation verb vs node kind, category/grouping vs authority word. DS-D1 itself warns not to conflate these in [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:242).

Validators should consume structured authority, not markdown notation. For each active relation/type, require: id, endpoint type(s), direction, multiplicity/order, scope, inverse policy, examples, non-examples, validation obligations, composition behavior, projection rule.

The biggest coherence checks now are: `Saga` identity/laws, `belongs-to` sense-splitting, observable `owns` obligations, UI endpoint type hardening, and keeping deferred residues out of canonical authority.

**5. Verdict Suggestions**
| Surface | Verdict |
| --- | --- |
| First-class authority rubric | already-deployed |
| Root relationship authority | already-deployed |
| Backend DS-D1.1-14 | active-harden |
| DS-D1.15-25 UI types | defer formal cards, active-harden where active relations depend on them |
| Operation / Query / Event endpoint split | already-deployed |
| Workflow `orchestrates` | already-deployed |
| Saga `orchestrates` | active-harden |
| `owns` | active-harden |
| `belongs-to` | active-harden or split into narrower relations |
| `depends-on` | defer / reject current promotion |
| Operation-returned Value Object | defer |
| Event payload/publisher composite | defer |
| `enforces-cross` | collapse into `enforces` |
| Full "category" authority language | reject for now; use "typed composable graph fragment" |

## Agent 4 - Peirce, Charles Sanders

**Verdict**

No files written. The 14-vs-25 mismatch is confirmed.

DS-D1's live root registry and formal schemas cover **14 candidate meta-types**, while the DS-D1 prose says "25 DomainSpec concept types" in [meta-types.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.yml:6) and [meta-types.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.md:12). DS-D8 is already **active** with **31 active signatures** in [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:4), and it uses the missing UI/cross-layer endpoint types.

**Concrete Local Facts**

- DS-D1 machine status is `candidate`; all 14 listed members are `candidate`: [meta-types.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/meta-types/meta-types.yml:8).
- There are 14 `.schema.yml` meta-type schemas and 28 meta-type fixtures, exactly 2 fixtures per formalized type.
- DS-D8 declares `signature_count: 31`, and actual parsed signatures also count to 31: [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:7).
- `validate:rels` passed: `canonicalSignatures=31`.
- `validate:content` passed: `schemas=14`, `7 concept(s) checked`, `5 edge(s) checked`.
- DS-D8 endpoint universe contains 24 active endpoint types. The missing DS-D1 cards/schemas are: `Action`, `Adapter`, `Binding`, `Component`, `Form`, `Guard`, `Hook`, `Layout`, `Page`, `State Indicator`, `View Model`.
- `Enum` is in DS-D1 but is not an active DS-D8 relationship endpoint.
- [LEARNING-ORDER.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/LEARNING-ORDER.md:51) explains the missing 11 as UI types, but it is stale where it still says "29 edges" and "edge_participation slices are known-inconsistent": [LEARNING-ORDER.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/LEARNING-ORDER.md:10), [LEARNING-ORDER.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/LEARNING-ORDER.md:71).

**Schema Coherence**

The `.schema.yml` files are currently coherent with DS-D8 `relationships.yml`: I found no current schema `edge_participation` mismatch. The old Operation mismatch cited by the novice handoff is resolved in the schema: [operation.schema.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml:21).

But the criteria are shallow: most are single declared-attribute checks, not obligation checks. Entity and Value Object are slightly stronger table-shape checks; they still avoid semantic proof.

**Shallow / Missing Obligations**

- `Workflow`: criterion is only `scope = intra-feature`; DS-D8 `orchestrates` assumes ordered operation coordination. Missing: ordered step structure and operation membership obligations.
- `Saga`: criterion is only `scope = cross-feature`; DS-D8 adds participant and compensation semantics: [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:162). Missing: participants, compensation map, failure/residue behavior, temporal safety.
- `Operation`: criterion is only `state_change = yes`; DS-D8 also treats Operation as read-capable for `queries`, callable by bindings/interfaces, and event-producing.
- `Event`: criterion is only `temporal = past`; DS-D8 assumes produced/emitted transition facts, but payload/source/consumer obligations are not in the type criterion.
- `Interface`: only requires `interface_kind`; DS-D8 assumes exposed operation/query contracts and form contracts.
- `Mapping`: only requires `direction`; DS-D8 assumes real field/shape transformation.
- `State Machine`: only requires `has_transitions = yes`; no state/transition table is required.
- `Entity`: identity/typedness is coherent, but `owns`/`belongs-to` laws assume lifecycle/custody/membership meanings beyond the Entity criterion.

**Contradictory Prose Surfaces**

The contradiction is not in current `.schema.yml`; it is in companion `.md` files:

- `operation.md` still says Operation source edges include `performs` and `emits`, contradicting root DS-D8.
- `workflow.md` and `saga.md` say SOURCE `performs` / TARGET `applies`; root says SOURCE `orchestrates`.
- `calculation.md`, `entity.md`, `enum.md`, and `value-object.md` also carry stale edge slices.
- Several connective/lifecycle companions say edge participation is deferred, while schemas now contain current slices.

Treat companion `.md` edge slices as stale prose, not authority.

**Saga / Workflow**

`relationships.yml` has two active signatures with duplicate `id: orchestrates`: Workflow->Operation and Saga->Operation: [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:138), [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:154). This is coherent only if tooling keys by full typed signature, not `id` alone.

Verdict: Workflow `orchestrates` is already-deployed but should harden ordered steps. Saga `orchestrates` is active-harden; collapse Saga into Workflow+scope if participant/compensation law is not made structural.

**Verdict Suggestions**

| Surface | Verdict |
| --- | --- |
| DS-D8 root relationship authority | already-deployed |
| 31 active signatures | already-deployed |
| 14 formal DS-D1 schemas | already-deployed as candidate; active-harden before promotion |
| "25 meta-types" claim | active-harden: add 11 missing DS-D1 cards/schemas or narrow the claim |
| UI/cross-layer endpoint types | active-harden; defer strict type validation until criteria exist |
| Schema `edge_participation` slices | already-deployed/currently coherent |
| Companion `.md` edge slices | reject as current authority; refresh from root |
| Workflow `orchestrates` | already-deployed, active-harden ordered-step obligations |
| Saga `orchestrates` | active-harden or collapse |
| `owns` | active-harden observable ownership consequences |
| `belongs-to` | active-harden; split or require `belonging_kind` |
| `produces` / `emits` split | already-deployed |
| `Operation --[emits]--> Event` | reject |
| `depends-on`, operation-returned Value Object, event payload/publisher composite | defer |

---

## Explorer Robot-Talks Final Positions

The explorer group was declared with `robot_talks: true`; these final positions preserve the
post-discussion stance for downstream synthesis.

### Agent 1 Final - Abramsky, Samson

1. **Final Position**

DS-D1 meta-types are first-class **candidate authority** where they change formation, rejection, relation admissibility, projection, generation, or owner routing. DS-D8 relationship authority is already active; DS-D1 is not uniformly active because backend DS-D1.1-14 are schema-backed candidates while UI DS-D1.15-25 remain deferred despite being used as DS-D8 endpoints.

Keep the phrase **typed composable graph fragment**, not full category law. Treat backend DS-D1 as **active-harden**; treat UI endpoint types as either **active-harden now** or narrow the 25-type claim. Treat Saga as first-class only if participant, compensation, failure/residue, temporal safety, and cross-owner laws become structural.

2. **What I Revise After Seeing Sibling Returns**

I revise the emphasis from "schemas may be incoherent with relationships" to: current `.schema.yml` edge participation appears coherent with root DS-D8; the stale surface is companion `.md` prose. So synthesis should not chase an old Operation/Workflow/Saga schema mismatch unless it reappears in validation.

I strengthen Fong's point that DS-D8 has outrun DS-D1: active relationship signatures depend on endpoint types whose DS-D1 cards/schemas are missing for UI. That is a real authority dependency, not a documentation nicety.

I adopt Wittgenstein's correction-norm framing: a meta-type is authority when someone can say "not Event, Operation" or "not Rule, Policy" and the system/owner route has consequence.

I adopt Peirce's concrete split: `validate:rels` and `validate:content` passing means the current machine surface is operationally consistent, while the 14-vs-25 claim remains unresolved governance debt.

3. **Strongest Disagreement / Tension To Preserve For Synthesis**

The strongest tension is: **DS-D8 is active endpoint authority while DS-D1 endpoint authority is incomplete.** Relationships use 24 endpoint types; DS-D1 root cards/schemas formalize only the 14 backend types. That means the graph can be active before all node kinds have first-class formation criteria.

Preserve this as a real design tension, not a bug to hand-wave: either DS-D1.15-25 must be promoted into root cards/schemas, or DS-D8 must explicitly mark UI endpoint typing as provisionally relationship-owned.

4. **One Must-Not-Lose Claim**

First-class authority is not recurrence, jargon, markdown notation, or category-theory flavor; it begins only when a type word changes what DomainSpec can **reject, require, compose, preserve, project, generate, or route to an owner**.

### Agent 2 Final - Fong, Brendan

1. **Final Position**

DS-D8 is already first-class relationship authority. DS-D1 is not yet uniformly first-class category authority: the 14 backend meta-types are schema-backed candidate authorities that should be **active-hardened**, while the 11 UI types remain a live gap because DS-D8 uses them but DS-D1 has not carded/schema-backed them.

Current wording should stay: **typed composable graph fragment**, not full category law. Full category authority requires identity, composition, closure, associativity, path equations, and preservation checks that are not yet finite validator obligations.

2. **What I Revise After Seeing Sibling Returns**

Peirce changes my local diagnosis: the current `.schema.yml` `edge_participation` slices are coherent with DS-D8; the stale/inconsistent surface is mainly companion `.md` edge prose and older learning-order text. So the synthesis should not indict schemas broadly.

Abramsky sharpens the verdict language: most DS-D1 criteria are declared shape checks, not semantic satisfaction checks. That makes "active-harden" the right posture even for strong types like Operation, Event, Workflow, Saga, and State Machine.

Wittgenstein sharpens the meaning boundary: a meta-type is authority only when it becomes DomainSpec grammar: it permits correction, owner routing, and validator consequences. This is especially important for overloaded words like Event, Rule, Policy, Interface, Action, and Guard.

3. **Strongest Disagreement/Tension To Preserve For Synthesis**

The main tension is: **DS-D8 is active over endpoint types whose DS-D1 authority is uneven.** It has 31 active signatures and uses UI/cross-layer types, but DS-D1 root authority only fully lists 14 schema-backed backend candidates while the 11 UI types are deferred.

A close second is Saga: DS-D8 treats `Saga --[orchestrates]--> Operation[]` as active, but DS-D1's Saga criterion is only `scope = cross-feature`. Either participant/compensation/failure laws become structural, or Saga should collapse into Workflow + scope metadata.

4. **One Must-Not-Lose Claim**

Do not let active relationship authority silently promote missing or shallow type authority. DS-D8 can be deployed, but DS-D1 still needs hardening: every endpoint type used as law must have a stable criterion, examples/non-examples, stale-prose cleanup, and validator-visible obligations.

### Agent 3 Final - Wittgenstein, Ludwig

1. **Final Position**

DS-D1 meta-type words are first-class **candidate grammar** when they change admissibility: what can be formed, rejected, related, generated, tested, or owner-routed. DS-D8 relationship authority is already active; DS-D1 is unevenly mature. Backend `DS-D1.1..14` are schema-backed candidates to active-harden, while UI `DS-D1.15..25` remain deferred despite DS-D8 using UI endpoint types. Do not call the current surface full category law; keep "typed composable graph fragment." Evidence: Abramsky at [research.md](research.md:19), Fong at [research.md](research.md:84), Peirce at [research.md](research.md:210).

2. **What I Revise After Seeing Sibling Returns**

I strengthen my earlier "meaning/use" position with Peirce's operational facts: the mismatch is not just semantic risk but a live authority-stage gap. `validate:rels` and `validate:content` pass, schemas are coherent with DS-D8, but the schema criteria are shallow and companion `.md` edge slices are stale prose, not authority. That means synthesis should distinguish: current machine coherence, shallow obligation depth, and stale human projection surfaces. Evidence: [research.md](research.md:217), [research.md](research.md:225), [research.md](research.md:240).

3. **Strongest Disagreement / Tension To Preserve For Synthesis**

The synthesis must preserve the tension between **active use** and **definition authority**: DS-D8 actively uses 24 endpoint types and 31 signatures, including UI/cross-layer types, while DS-D1 root cards/schemas only formalize 14 backend types. This is not fatal, but it is load-bearing. Either add cards/schemas for the 11 UI types, or narrow the "25 meta-types" authority claim. Evidence: [research.md](research.md:219), [research.md](research.md:263).

4. **One Must-Not-Lose Claim**

A type word becomes authority only when it creates correctable consequences. If `Saga`, `Policy`, `State Machine`, `belongs-to`, or `Page` does not change validation, composition, projection, generation, or owner routing, it is vocabulary, not law. That claim keeps the whole DS-D1 effort from becoming a polished glossary with validator-shaped clothing.

### Agent 4 Final - Peirce, Charles Sanders

1. **Final Position**

DS-D8 is already deployed relationship authority; DS-D1 is first-class candidate authority, not complete category law. The 14 backend schemas govern formation and endpoint typing, but mostly as shape-only signs. The 25-type claim is real but underformalized: DS-D8 already uses the 11 UI/cross-layer types before DS-D1 has root cards/schemas for them.

So the correct synthesis posture is: **active-harden, do not overclaim**. Keep "typed composable graph fragment," reject full category language for now, and make every active type/relation earn authority through reject/allow, composition, projection, fixture, generation, or owner-route consequences.

2. **What I Revise After Seeing Sibling Returns**

I revise my prior emphasis from "14-vs-25 mismatch" toward "staged authority mismatch." The sibling returns make clear that 14-vs-25 is not merely a count defect; it is a governance staging problem: DS-D1.1-14 are schema-backed candidates, DS-D1.15-25 are taxonomy/learning-order/UI-deferred, while DS-D8 has already made several of them graph-active.

I also soften "shallow" into "shape-only by current contract." Shape-only criteria are not failures if treated as formation authority. They become failures only when the system reads semantic obligations into them without adding structural checks.

3. **Strongest Disagreement / Tension To Preserve For Synthesis**

Can active relationship law outrun type law?

DS-D8 says UI/cross-layer endpoints and Saga orchestration are active relationship facts. DS-D1 says only 14 backend meta-types are schema-backed candidate authority, and Saga is still only `scope=cross-feature`. That creates the central tension: either DS-D8 may provisionally govern endpoint names before DS-D1 has full type criteria, or every active endpoint type must become schema-backed before relationship validation can be considered sound.

Do not smooth this over. This is the load-bearing synthesis question.

4. **One Must-Not-Lose Claim**

First-class authority is not recurrence, notation, or a familiar noun. It begins only where a type or relation changes what DomainSpec can **reject, require, compose, preserve, project, generate, or route to an owner**.

## Synthesizer Pass - Noether, Emmy

### Citation Key

- Abramsky final: [research.md:287](research.md:287)
- Fong final: [research.md:315](research.md:315)
- Wittgenstein final: [research.md:341](research.md:341)
- Peirce final: [research.md:359](research.md:359)
- DS-D1 registry: [meta-types.yml:4](../../../definitions/meta-types/meta-types.yml:4)
- DS-D8 authority: [DEFINITIONS.md:761](../../../definitions/DEFINITIONS.md:761), [relationships.yml:1](../../../definitions/relationships/relationships.yml:1)

### Central Tension

DS-D8 is active endpoint authority over a graph whose DS-D1 endpoint authority is uneven. The relationship layer has 31 active signatures and uses UI/cross-layer endpoint types, while DS-D1 root authority has only 14 schema-backed backend candidates and defers UI `DS-D1.15..25`. This is not just a count mismatch; it is a staged-authority mismatch.

Reviewer-safe formulation: DS-D8 may be deployed, but it must not silently promote missing or shallow DS-D1 type authority. Either add DS-D1 cards/schemas for the 11 UI endpoint types, or explicitly mark those endpoint types as provisionally relationship-owned until DS-D1 catches up.

### Candidate DS-D1 Authority Rubric

| Gate | Reviewer attack question | Pass condition |
| --- | --- | --- |
| Admissibility consequence | What changes if this type word is removed? | It changes reject/allow, required structure, relation admissibility, projection, generation, fixture behavior, or owner routing. |
| Formation criterion | Is there a machine-visible way to form/check it? | Backend 14 pass as schema-backed candidate formation authority; UI 11 do not yet pass as DS-D1 formation authority. |
| Correction norm | Can an owner/validator say "not X, Y" with consequence? | The type supports correction like "not Event, Operation" or "not Rule, Policy." |
| Relation dependency | Do active edges depend on this type? | DS-D8 endpoint use must cite a DS-D1 maturity stage: schema-backed candidate, deferred UI endpoint, or rejected/collapsed. |
| Obligation depth | Is it more than declared shape? | Shape-only is valid formation authority, but semantic obligations must become structural before stronger claims are made. |
| Category language | Are full category laws checked? | Use "typed composable graph fragment," not full category law, until identity/composition/closure/associativity/path checks are finite validator obligations. |

### Type/Relation Coherence Rule

A relationship edge is constructible only when the verb is active and the source/target concepts' declared meta-types match an active DS-D8 signature. DS-D8 owns that endpoint law. DS-D1 owns the formation and correction criteria for the endpoint types, but current DS-D1 authority is staged: backend 14 are schema-backed candidates, UI 11 are deferred.

Operational refinements:

| Rule | Consequence |
| --- | --- |
| Root `definitions/relationships` owns relationship authority; markdown notation is projection only. | Do not let companion prose override root relationship law. |
| Do not use schema `edge_participation` as independent authority; it is evidence checked against DS-D8. | Treat slices as projection/evidence, not duplicate source of truth. |
| Current `.schema.yml` slices appear coherent; stale risk is mainly companion `.md` prose and older learning-order text. | Fix projection drift without blaming the schema layer broadly. |
| Duplicate verbs must be keyed by full signature, not verb alone; `orchestrates` has Workflow and Saga rows. | Signature identity is `(verb, source_type(s), target_type(s), feature_scope, multiplicity)`. |
| Generated/deferred/deprecated entries are not canonical authored edges. | Keep generated inverse views and future labels outside active authored law. |

### Per-Type Verdict Matrix

| Type | Evidence state | Reviewer risk | Verdict |
| --- | --- | --- | --- |
| Entity | Schema-backed candidate; identity and typed fields. | Entity-to-Entity relations assume ownership/membership semantics beyond identity. | active-harden; endpoint use already deployed. |
| Value Object | Schema-backed candidate; no identity and equality clause. | Equality is declared, not semantically proved. | active-harden. |
| Enum | Schema-backed candidate; closed value table. | No active DS-D8 endpoint role; can blur with State Machine. | active-harden as value domain; defer relation authority. |
| Operation | Schema-backed candidate; `state_change=yes`. | DS-D8 treats it as callable, read-capable, event-producing; criterion is shape-only. | already-deployed as endpoint; active-harden DS-D1 law; reject `Operation --[emits]--> Event`. |
| Query | Schema-backed candidate; `state_change=no`. | Read-only/purity remains declared shape. | active-harden. |
| Calculation | Schema-backed candidate; returns value. | Determinism/purity and return-shape obligations are thin; returned Value Object edge is deferred. | active-harden; defer extra return edge. |
| Rule | Schema-backed candidate; boolean predicate. | Must not collapse into Policy or become target of `applies`. | active-harden; `enforces` endpoint already deployed. |
| Policy | Schema-backed candidate; selects strategy. | Strategy codomain/conflict behavior not structural. | active-harden. |
| Workflow | Schema-backed candidate; `scope=intra-feature`; active `orchestrates`. | DS-D8 assumes ordered operation coordination not fully required by DS-D1 criterion. | already-deployed relation; active-harden ordered-step law. |
| Saga | Schema-backed candidate; `scope=cross-feature`; active `orchestrates`. | DS-D8 has participant/compensation semantics; DS-D1 only checks scope. | active-harden; collapse into Workflow+scope if laws stay non-structural. |
| Interface | Schema-backed candidate; boundary marker. | Exposed contract/refinement obligations are not structural. | active-harden. |
| Event | Schema-backed candidate; `temporal=past`. | Payload/source/causality obligations are outside the criterion. Endpoint split is active. | already-deployed endpoint split; active-harden type law. |
| Mapping | Schema-backed candidate; direction present. | Field-level totality/error semantics not structural. | active-harden. |
| State Machine | Schema-backed candidate; `has_transitions=yes`. | Actual state set, transition relation, guards, invariants are not required by current criterion. | active-harden; collapse to Enum if transitions are absent. |
| UI/cross-layer 11: Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Adapter, State Indicator | Listed in taxonomy and used by active DS-D8 UI/cross-layer signatures. | DS-D1 cards/schemas missing; shadow types must not collapse into backend counterparts because they carry distinct edges. | defer DS-D1 formation authority unless carded now; active-harden DS-D8 endpoint staging; reject silent backend-shadow collapse. |

### Verdict Buckets

| Bucket | Contents |
| --- | --- |
| already-deployed | DS-D8 root relationship authority, 31 active signatures, typed composable graph fragment wording, `produces`/`emits` endpoint split, generated `owned-by`, and active Workflow/Saga `orchestrates` relationship signatures. |
| active-harden | Backend DS-D1.1-14 as schema-backed candidate authority; Saga/Workflow/Operation/Event/State Machine obligation depth; `owns` and `belongs-to`; UI endpoint staging if the 25-type claim is retained. |
| defer | Full category laws; DS-D1.15-25 strict formation authority until cards/schemas exist; `depends-on`; operation-returned Value Object edge; event payload/publisher composite. |
| collapse | `enforces-cross` into `enforces` with scope metadata; Saga into Workflow+scope if participant/compensation/failure laws are not structural; State Machine into Enum when no transitions are explicit. |
| reject | Recurrence/notation/jargon as authority; full "category" authority for current R3; stale companion `.md` edge prose as authority; authored `owned-by`; `Operation --[emits]--> Event`; `Rule --[applies]--> Operation`; silent DS-D8 promotion of missing DS-D1 types. |

### Top Attention Points

1. Resolve staged endpoint authority. Either add DS-D1.15-25 cards/schemas or mark UI endpoint typing as provisionally DS-D8-owned.
2. Separate shape-only formation from semantic obligation. Shape-only criteria are acceptable candidate formation law, but DS-D8 must not read stronger semantics from them without structural checks.
3. Harden Saga or collapse it. Active DS-D8 Saga orchestration needs participant set, compensation map, failure/residue behavior, temporal safety, and cross-owner law in DS-D1 or a companion structural contract.
4. Clean projection surfaces without blaming schemas. Current diagnosis is not broad schema/DS-D8 incoherence; it is coherent machine slices plus stale companion prose/older learning-order wording.
5. Keep DS-D8 relation law precise. Signature identity, inverse/generated-view policy, deprecated/deferred labels, and Entity-to-Entity semantics must stay explicit so active relationship authority remains attackable and finite.

## Reviewer Attack Pass

### Agent 6 - Russell, Bertrand

**Overall:** AMEND.

The synthesis is directionally right, not KILL. It preserves the main live tension: DS-D8 is active relationship authority while DS-D1 type authority is staged. But `findings.md` is not acceptable until the writer tightens precedent ownership and stops making existing authority look newly synthesized.

**Strongest precedent/ownership objections:**

1. DS-D8 already owns relationship signatures. The findings must not imply DS-D8 can provisionally own UI type formation. DS-D8 can reference endpoint labels; DS-D1 owns type formation/correction criteria.
2. Saga collapse is under-specified. `Saga --[orchestrates]--> Operation[]` is already active in root authority, alongside Workflow's own `orchestrates` signature. If collapse is recommended, that is an owner-routed KILL/COLLAPSE recommendation against active DS-D8 authority, not a casual conditional.
3. `owns`, `belongs-to`, and `depends-on` are not open labels to re-mint. `owns` and `belongs-to` are active; `owned-by` is generated; `depends-on` is deferred.
4. "Category" is already a local method term, not a new authority bucket. Build from `meta-type`, `category`, `formal criterion`, DS-D1, DS-D2, and DS-D8. Keep "typed composable graph fragment" as inherited root wording, not a new theoretical verdict.

**Preserve:** DS-D8 active / DS-D1 staged; backend 14 as shape-only candidate formation authority; UI 11 as active endpoint labels but missing DS-D1 cards/schemas; "typed composable graph fragment"; full-signature identity for duplicate verbs; `produces`/`emits` split; `owned-by` as generated view; `depends-on` as deferred.

**Required writer changes:** add an ownership table; replace "provisionally relationship-owned endpoint types" with "DS-D8 references provisional UI endpoint labels, but does not confer DS-D1 formation authority"; split active, generated, deprecated, and deferred authority; force Saga into a real fork: preserve active DS-D8 and harden DS-D1 obligations, or explicitly recommend owner-routed collapse/deprecation.

### Agent 7 - Searle, John

**Overall:** AMEND.

The synthesis is not empty overall. It has real witnesses for DS-D8 and backend schema-backed candidates, but it still lets several polished labels pass as "authority" without saying exactly what they can reject, generate, project, fixture, or route.

**Strongest non-vacuity objections:**

1. `first-class candidate authority` is too smooth. Backend 14 pass only as shape/fixture-backed formation candidates, not semantic authorities. The validator checks declared shape, not satisfiability or engine semantics.
2. UI endpoint types are graph-active but DS-D1-thin. `Page`, `Component`, `Guard`, and peers appear in active DS-D8 signatures, but DS-D1 says UI `DS-D1.15..25` are deferred, and unformalized meta-types are skipped by content validation. They cannot be called DS-D1 authority yet.
3. Saga vs Workflow is the live danger. Saga's DS-D1 schema witness is only `scope=cross-feature`; DS-D8 prose adds participant/compensation obligations, but those are not structurally checked. Saga survives only as "active relation signature plus under-hardened type law," not as proven distinct semantics.
4. "Typed composable graph fragment" is acceptable wording only as finite endpoint-signature law. Do not let `composition` strings masquerade as category law.
5. The per-type matrix needs a witness column. `active-harden` is a bucket, not a proof.

**Concrete witnesses to preserve:** DS-D8 active endpoint authority (`signature_count: 31`); endpoint-law rejection through relationship-signature validator/tests; backend 14 schema/fixture witnesses; `produces`/`emits` split; generated/deferred/deprecated boundaries (`owned-by`, `depends-on`, `enforces-cross`).

**Required writer changes:** add a concrete witness column to the rubric and per-type matrix; demote UI 11 to "DS-D8 endpoint-used / DS-D1 formation-deferred"; rewrite Saga as conditional; split every backend claim into shape witness vs semantic obligation not yet witnessed; mark category/composition language as finite-validator obligation or rationale only; state that `owned-by` is generated navigation and rejected as authored canonical edge.

### Agent 8 - Lawvere, F. William

**Overall:** AMEND.

The synthesis is directionally sound, not kill-worthy, but `findings.md` should not accept it yet. The problem is that "active-harden" is doing too much work: several proposed first-class meta-types are allowed to survive before their finite formation/correction laws and relation consequences are stated.

**Strongest definitional objections:**

1. Tautology risk: the rubric says a type is authority if it changes admissibility, but it must name the actual finite check and consequence. Otherwise "authority changes authority" becomes circular.
2. Saga does not yet survive as first-class. Current Saga formation is only `scope = cross-feature`, while DS-D8 relation prose adds participant/compensation obligations. Without structural participants, compensation map, failure/residue, temporal safety, and cross-owner law, Saga collapses to Workflow + scope metadata.
3. State Machine is under-lawed. `has_transitions=yes` is not enough to distinguish it from Enum unless there is a finite state set, transition relation, invalid-transition rejection, guards/effects/invariants, and consequences for `Event --[transitions]--> State Machine`.
4. Rule/Policy, Operation/Event, and UI Action/Operation distinctions are asserted but not fully disciplined. The writer must state the correction consequence when a boolean guard, strategy selector, state-changing action, past fact, or UI action is mislabeled.
5. Signature identity is close but incomplete. It must become a normalized validator rule, especially for duplicate `orchestrates` signatures, source/target arrays, direction, and active-vs-generated/deferred status.
6. Category theory should remain deferred. "Typed composable graph fragment" is acceptable local wording, but the `composition` fields in DS-D8 are obligation labels, not checked categorical composition, identity, closure, associativity, or path equations.

**Preserve:** staged-authority diagnosis; root-relationship source of truth; rejection of stale companion `.md` edge slices; `produces`/`emits` split; `enforces-cross` collapse; warning against silent UI endpoint promotion.

**Required writer changes:** rewrite every "active-harden" survivor into finite formation rule, finite correction rule, relation consequence, and collapse/defer condition; add a hard rule that no first-class meta-type survives if it is merely another type plus metadata; add normalized signature identity; defer full category laws until finite validator obligations exist.

## Reviewer Robot-Talks Final Positions

### Russell Final

**Final verdict:** AMEND.

The synthesis is usable input to the writer only after a hard ownership pass. The reviewers converge that the central tension is right, but `active-harden` currently hides too much.

`findings.md` must say:

1. DS-D1 owns meta-type formation/correction; DS-D2 owns canonical relationship labels; DS-D8 owns active endpoint signatures; TAXONOMY/LEARNING-ORDER/impl companions are projections or aids.
2. Backend `DS-D1.1..14` are schema-backed shape candidates, not proven semantic authorities.
3. UI `DS-D1.15..25` are DS-D8 endpoint-used but DS-D1 formation-deferred.
4. Every survivor needs finite formation rule, correction/rejection consequence, relation consequence, and collapse/defer condition.
5. Saga must be a real fork: harden participant/compensation/failure/temporal/cross-owner law, or explicitly owner-route collapse/deprecation into Workflow + scope.
6. Keep active/generated/deprecated/deferred separate: `owned-by` generated, `depends-on` deferred, `enforces-cross` deprecated.
7. "Typed composable graph fragment" means finite relationship-signature law only.

**Forbidden overclaims:** do not say DS-D8 provisionally owns UI type formation; do not let active DS-D8 edges silently promote missing DS-D1 law; do not treat `active-harden` as proof; do not claim full category law, checked path composition, or Saga distinctness from `scope=cross-feature` alone.

**Must-not-lose claim:** a type or relation becomes first-class authority only when it changes what DomainSpec can reject, require, compose, preserve, project, generate, fixture, or route to an owner.

### Searle Final

**Final verdict:** AMEND.

Noether is usable input, but only after the ownership correction and finite-law correction are baked into `findings.md`.

`findings.md` must say:

1. DS-D8 is already active relationship-signature authority; DS-D1 is staged type-formation authority.
2. Backend 14 are schema/fixture-backed, shape-only candidate authorities, not proven semantic authorities.
3. UI 11 are active DS-D8 endpoint labels but DS-D1 formation-deferred. DS-D8 may reference them; it does not promote them.
4. Every survivor needs a concrete witness: validation consequence, fixture, schema criterion, endpoint signature, projection/generation behavior, or owner route.
5. Saga is not casually collapsible: both Workflow and Saga `orchestrates` signatures are active. Either harden Saga with participant set, compensation map, failure/residue, temporal safety, and cross-owner law, or make an explicit owner-routed collapse/deprecation recommendation.
6. Full category law is deferred. Current wording is only "typed composable graph fragment."
7. Preserve active/generated/deprecated/deferred splits: `owns` and `belongs-to` active, `owned-by` generated, `depends-on` deferred, `enforces-cross` deprecated.

**Forbidden overclaims:** do not say DS-D1 is uniformly first-class, that UI endpoint types have DS-D1 authority, that Saga is distinct beyond `scope=cross-feature` without added laws, or that DS-D8 `composition` strings are checked categorical composition/path laws.

**Must-not-lose claim:** the central finding is the staged-authority mismatch: DS-D8 has outrun DS-D1 by actively using endpoint types whose DS-D1 formation/correction authority is uneven.

### Lawvere Final

**Final verdict:** AMEND.

Noether is usable as input to writer, but only after reviewer constraints are made explicit. The synthesis preserves the right tension, but it still lets `active-harden` blur proof, ownership, and aspiration.

`findings.md` must say:

1. DS-D8 is already active relationship authority; DS-D1 owns type formation/correction. DS-D8 may reference UI endpoint labels, but it does not confer DS-D1 formation authority on UI types.
2. Backend DS-D1.1-14 are schema/fixture-backed candidate formation authorities, mostly shape-only. They are not semantic authorities until their stronger obligations are structural and finite.
3. UI 11 are `DS-D8 endpoint-used / DS-D1 formation-deferred`, unless cards/schemas are added. Do not call them first-class DS-D1 meta-types yet.
4. Saga is the live fork: preserve active DS-D8 `Saga --[orchestrates]--> Operation[]` and harden DS-D1 participant/compensation/failure/residue/temporal/cross-owner laws, or explicitly recommend owner-routed collapse/deprecation. No casual "collapse if weak."
5. Every survivor needs a witness: finite formation rule, correction rule, relation consequence, and collapse/defer condition. This is mandatory for Saga, Workflow, Operation, Event, Rule, Policy, State Machine, and UI endpoint types.
6. Signature identity must be normalized by full active signature, not verb alone: verb, source/target type or type arrays, direction, multiplicity, feature scope, status, and generated/deferred/deprecated policy.
7. Active/generated/deferred/deprecated must stay separated: `owns` and `belongs-to` active; `owned-by` generated view; `depends-on` deferred; `enforces-cross` deprecated into `enforces`.

**Forbidden overclaims:** forbid "full category law," "UI types are DS-D1 authority because DS-D8 uses them," "`composition` strings are categorical composition," and "Saga is proven distinct from Workflow." The only safe phrase is inherited: `typed composable graph fragment`.

**Must-not-lose claim:** a meta-type is authority only where it changes what DomainSpec can reject, require, compose, preserve, project, generate, fixture, or route to an owner. Otherwise it is vocabulary wearing a badge.
