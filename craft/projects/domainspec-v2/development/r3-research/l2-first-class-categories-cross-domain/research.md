---
node_type: research-transcript
is_session: false
status: candidate
created: 2026-07-02
dispatch_id: 2026-07-02-r3-l2-first-class-precedent
transcript_scope: explorer returns only
---

# Research Transcript — L2 First-Class Categories Cross-Domain

This file mechanically preserves the explorer returns for dispatch
`2026-07-02-r3-l2-first-class-precedent`. Synthesis, review, and final findings
belong in `findings.md`.

## Agent 1 — Lawvere, F. William

**Research Result**

The clean category-theoretic answer is: repetition is evidence, not authority. A relation/category becomes first-class when it has typed boundaries, composition or substitution behavior, identities/units where applicable, laws, and semantics that other structures must preserve.

1. **Naturality and the birth of category theory.** Eilenberg-Mac Lane made “natural” transformations precise; categories and functors first appeared to type and control those transformations, then became mathematical objects themselves. Criteria: stable source/target categories, functorial translation, naturality squares, no hidden arbitrary choices.  ([sas.rochester.edu](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/Riehl-CTC.pdf))

2. **Basic category axioms.** A category is not just morphisms: it needs objects, domain/codomain, identities, composition, and associativity/unitality. Riehl also notes that morphisms can take primacy because the algebra of morphisms determines the category. Criteria: closure under composition, identity arrows, typed endpoints, and laws. ([sas.rochester.edu](https://www.sas.rochester.edu/mth/sites/doug-ravenel/otherpapers/Riehl-CTC.pdf))

3. **Lawvere algebraic theories.** Lawvere treats an algebraic theory as a small category where operations are morphisms, presentations are operation symbols plus equations, models are product-preserving functors, and homomorphisms are natural transformations. Criteria: arity, equations on composites, model category, preservation functors.

4. **Universal properties / representability / Yoneda.** Universal properties make an object authoritative by its mapping behavior, not its implementation. Representations characterize objects up to unique isomorphism. Criteria: a candidate construction earns first-class status if it solves a stable mapping problem and is invariant under equivalent implementations.

5. **Sketches.** Barr and Wells present sketches as a way to turn finite descriptions into mathematical objects; sketches use graphs, diagrams, cones, and cocones to specify model constraints. Criteria: the candidate has a finite structural signature, explicit diagrammatic constraints, and a category of models/homomorphisms.

6. **Categorical logic and internal languages.** Lawvere’s hyperdoctrine/topos tradition treats logic through adjoints, functorial semantics, internal languages, and categorical models. Criteria: terms/propositions are first-class when they support substitution, interpretation, quantification/connective structure, and sound model semantics.

7. **Allegories / relation calculus.** Freyd and Scedrov’s allegories make relations, not just functions, into typed categorical arrows with relation operations. Criteria: relations deserve first-class treatment when they need relational composition, converse, intersection/order, tabulation, and laws.

8. **Fibrations / indexed categories.** Fibrations make context-dependent structure first-class via cartesian morphisms and pullback/reindexing. Criteria: “belongs-to” or “owned-in-context” relations become category-level only when movement across contexts is stable and preserved, not merely named.

On the proposed phrase, “a new category is a defined set of morphisms that repeat with broad application”: category theory would call this a useful candidate, not a definition. If the morphisms are closed under identity and associative composition, it may be a category or subcategory. If they need generators plus equations, it is closer to a presentation or Lawvere theory. If they are relation-like, it may need allegory/profunctor/equipment treatment. If they vary by context, look at fibrations. Broad repetition justifies research attention; laws and preservation justify authority.

**DomainSpec L2 Implications**

Promote a relation candidate when it has: typed endpoints, explicit composition/identity or justified absence, invariants, enforcement or derivation role, preservation under projections/build steps, and an owner-routed promotion decision. `depends-on` is promotable if it supports transitive composition, acyclicity/build-order semantics, and enforcement. `owns`/`belongs-to` is promotable if it controls authority movement, uniqueness/transfer/delegation, and context reindexing. Workflow/transaction relations are promotable if sequencing has laws: no-op identity, associativity of composition, failure/compensation rules, and invariant preservation.

Build from owned surfaces when existing DomainSpec authority, promotion, ledger, or enforcement machinery already carries the behavior and the new relation is mainly a clearer categorical presentation.

Defer when the relation is only vocabulary, tag, evidence link, implementation convenience, or repeated prose without laws. In category-theory terms: do not confuse a frequently drawn arrow with a category.

Uncertainty: the sources do not use DomainSpec’s “first-class authority” phrase; that is an operator reading from formal traditions. Also, exact promotion decisions require reading the live R3/L2 artifacts and owner files, which I did not do because this lane was read-only research.

## Agent 2 — Spivak, David

**Read-Only Research Result**

Core ACT precedent: a relation becomes first-class when it is part of the *schema/law that every valid model must preserve*, not merely a repeated observation. Frequency is evidence; authority begins when the relation has typed endpoints, compositional behavior, constraints/equations, migration obligations, or validator consequences.

**Precedents**

1. **Ologs.** Spivak/Kent present ologs as category-theoretic knowledge representation, similar to relational schemas and usable as data repositories; the basic pattern is types/objects, aspects/arrows, and facts as commutative diagrams. This implies: promote a term/relation when it is a stable typed distinction with functional aspect semantics and facts/laws, not just vocabulary. Sources: [Ologs](https://arxiv.org/abs/1102.1889), [formalized ologs as linguistic functors](https://arxiv.org/abs/1503.08326).

2. **Schemas as categories.** In functorial data migration, a database schema is a small category and an instance is a Set-valued functor; schema morphisms induce canonical data-migration functors. Criterion: schema relations are the arrows every instance must interpret. Derived joins/projections belong in migration/query space unless they need to constrain all instances. Source: [Functorial Data Migration](https://arxiv.org/abs/1009.1166).

3. **Graph schemas plus path equations.** Spivak/Wisnesky treat graph-based schemas as finitely presented categories: nodes/arrows plus path equations. Criterion: a relation is first-class when paths through it must obey equality/closure laws. Source: [Relational Foundations for Functorial Data Migration](https://arxiv.org/abs/1212.5303).

4. **CQL/FQL practice.** CQL schemas contain entities, attributes, foreign keys, and equations; examples show path equations enforcing business rules and compile-time rejection of invalid mappings. Criterion: promote if the relation should participate in theorem-proved integrity, lineage, or generated migration; otherwise keep it as view/query/doc. Sources: [CQL](https://categoricaldata.net/), [CQL examples](https://categoricaldata.net/examples.html).

5. **Queries and constraints as lifting problems.** Spivak models SPARQL-like graph queries and constraints categorically and distinguishes direct database access from a derived database of queries. Criterion: if the relationship can be recovered as a query/lift over existing schema, it should usually remain derived. Source: [Database queries and constraints via lifting problems](https://arxiv.org/abs/1202.2591).

6. **Algebraic databases / sketches.** Algebraic databases say schemas are generally modeled as categories or sketches, while instances assign examples; algebraic theories add concrete operations and constraints. Criterion: promote operations/relations when constraints and queries need them as reusable law. Source: [Algebraic Databases](https://arxiv.org/abs/1602.03501).

7. **RDF/OWL/KG-style modeling.** RDF predicates denote properties/binary relations; RDFS adds domain/range/subproperty; OWL adds inverse, functional, reflexive, symmetric, asymmetric, and transitive property axioms. Criterion: a predicate becomes vocabulary/schema authority when axioms or entailment depend on it. Labels/comments remain documentation. Sources: [RDF Concepts](https://www.w3.org/TR/rdf11-concepts/), [RDFS](https://www.w3.org/TR/rdf-schema/), [OWL 2 Syntax](https://www.w3.org/TR/owl2-syntax/).

8. **Wiring diagrams / open processes.** Spivak’s wiring-diagram operads model composable systems; temporal wiring diagrams model processes with inputs/outputs and macro-process composition. Criterion: workflow/transaction relations become first-class when composition through interfaces, temporal flow, or compensation laws matter. Sources: [Wiring diagrams](https://arxiv.org/abs/1305.0297), [Temporal wiring diagrams](https://arxiv.org/abs/1307.6894).

**Schema Vs Derived/View**

Put a relation in the schema when every valid instance must interpret it, migrations must preserve it, validators/reasoners can reject misuse, or path/property laws depend on it. Keep it derived/query/view/documentation when it is a reverse navigation, denormalized convenience, report query, label/comment, or implementation pointer recoverable from stronger primitives.

**DomainSpec L2 Implications**

Promote: root-owned finite relationship signatures with typed endpoints, direction, multiplicity, inverse policy, examples/non-examples, and validator consequences. `owns` promotes if it means lifecycle/custody/write responsibility. `belongs-to` promotes only if it means membership/classification/home assignment, not automatic inverse of `owns`.

Build from owned: use “typed composable graph fragment” as the immediate law surface; reserve full “category” until identities, composition, closure, associativity, and path equations are explicitly specified. Treat implementation relationship docs as projections from root authority.

Defer: `depends-on` until a concrete dependency kind, cycle/order rule, and reject/allow behavior exist. Generic `references` should remain projection/detail. Workflow/transaction promotion needs distinct composition law: Saga deserves first-class status only if cross-boundary participants, compensation, temporal safety, or rollback obligations are irreducible to Workflow metadata.

**Uncertainty**

ACT gives formal promotion tests, not DomainSpec owner authority. Also, ologs are strongest for functional aspects; many DomainSpec relations are many-to-many, so CQL/OWL-style property axioms may be the better precedent for `owns`/`belongs-to`. OWL’s open-world semantics should not be imported wholesale into closed-world validators.

## Agent 3 — Abramsky, Samson

Read-only completed; no files edited. I treated the live DomainSpec context as: root relationship authority in [relationships.md](../../../definitions/relationships/relationships.md) / [relationships.yml](../../../definitions/relationships/relationships.yml), with [impl/spec/RELATIONSHIPS.md](../../../impl/spec/RELATIONSHIPS.md) as projection.

**Precedents**
1. **Type theory: formation/introduction/elimination/equality rules.** In Martin-Löf style type theory, a type former earns primitive status by having rules for forming it, constructing canonical elements, eliminating/using it, and computing with it. That maps cleanly to DomainSpec: a relation is first-class only if authors can form it, instantiate it, use it downstream, and know what validation/projection consequences follow. Otherwise it is notation or a derived predicate. Source: Martin-Löf’s rule pattern for operations.

2. **Algebraic theories and algebraic specifications.** Lawvere theories treat algebraic structure through operation symbols plus equations; Guttag/Horning-style ADTs split syntactic operation signatures from semantic axioms, and correctness means implementations satisfy those axioms.   For DomainSpec, a relation becomes primitive when it is in the signature and has laws; it is derived when definable from existing operations/signatures without new obligations.

3. **Institutions / specification logic.** Goguen-Burstall institutions separate signatures, sentences, models, and satisfaction, with satisfaction stable under change of notation.  Criteria implied: first-class authority belongs to the signature/model-satisfaction interface, not to one renderer or implementation projection. This strongly supports DomainSpec’s root-authority vs impl-projection split.

4. **Type classes / interfaces.** Wadler and Blott’s type classes make ad-hoc polymorphism less ad hoc by giving overloaded operations a named class constraint.  Haskell’s report also states expected laws for classes such as `Monad`, even though ordinary Haskell does not prove arbitrary user instances satisfy them.  Translation: a DomainSpec relation/interface is first-class when consumers can rely on its operations and laws; if laws are only prose hopes, they are obligations to test or prove, not proven authority.

5. **Relation algebra.** Tarski’s calculus treats binary relations as algebraic objects closed under finite operations, with equations and derived concepts such as symmetric/transitive/order/function-like relations. It also shows not every property expressible in richer logic is expressible in the calculus, so primitive selection matters.  DomainSpec implication: do not add a relation because it is describable in English; add it if it fits the finite algebra of supported relation operations and constraints.

6. **Structural operational semantics.** Plotkin’s SOS gives language constructs authority by transition/inference rules that specify execution.  Conservative-extension work asks whether adding rules changes the meaning of old terms.  DomainSpec criterion: a relation is primitive if it changes admissible transitions/workflows/validation; a helper is derived if it desugars to existing relations without changing old meanings.

7. **Contracts, behavioral subtyping, refinement.** Hoare logic makes program constructs reasoned about through proof rules over pre/postconditions.  Liskov/Wing make subtype authority behavioral: preconditions, postconditions, invariants, and history properties must be preserved.  Abadi/Lamport refinement mappings turn implementation-vs-spec correspondence into a proof obligation over behavior/state mapping.  DomainSpec: first-class relations should create explicit conformance obligations, not just nicer vocabulary.

8. **Abramsky / denotational and observational semantics.** Abramsky’s “Domain Theory in Logical Form” bridges denotational domains, operational behavior, and program logics through observable properties.  Full-abstraction work treats semantic equality/order as authoritative only when it matches observational behavior/definability.  DomainSpec criterion: a relation earns authority when it preserves observable distinctions that users/tools actually rely on.

**Primitive Vs Derived**
Primitive/signature/interface/proof-obligation when it has typed endpoints, direction, multiplicity/order, examples and non-examples, inverse/dual policy, laws, and at least one downstream consequence: validation, code generation, projection sync, proof, workflow transition, or conformance check.

Derived theorem/query/helper when it is definable from existing signatures, only helps navigation/display, is a generated inverse, is a field-level pointer, or does not change reject/allow behavior. Broad recurrence is evidence to investigate, not enough for promotion.

**DomainSpec L2**
**Promote:** `owns` and `belongs-to` as distinct Entity-to-Entity signatures if their current meanings remain separate: lifecycle/custody/write responsibility vs membership/classification/home assignment. Promote `produces` vs `emits` endpoint split because source type changes admissibility. Promote Saga orchestration only where cross-feature participants, compensation, and failure obligations differ from Workflow.

**Build From Owned:** keep `Source --[verb]--> Target` as notation projected from root machine authority. Build validators from `relationships.yml`: endpoint admissibility, inverse policy, multiplicity/order, status, examples/non-examples, and projection sync. Use “typed composable graph fragment” now; reserve full “category” language until identity arrows, composition closure, and associativity are explicitly formalized.

**Defer:** `depends-on` until a witness proves it differs from field reference or generic dependency by validation behavior, cycle/order law, or implementation obligation. Defer broad category laws unless they produce finite checks rather than explanatory elegance.

**Uncertainty**
I did not find one formal tradition using the exact phrase “first-class authority”; the rubric is a synthesis across semantics/specification traditions. Type classes are mixed evidence because mainstream Haskell often relies on law conventions rather than proof-carrying instances. Relation algebra is strong precedent for relations as algebraic objects, but DomainSpec’s relation graph is typed and governance-oriented, so it should borrow the discipline, not the whole calculus.

## Agent 4 — Peirce, Charles Sanders

Read-only: no files changed. I used memory only to recover the repo’s “build-from-owned / precedent label” framing, then verified the live local authority files.

**Precedents**
1. Peirce / semiotics: a sign is not just label-to-object; it is sign, object, and interpretant, so meaning exists through constrained interpretation by sign users. Peirce’s typology also treats symbols/legisigns as convention-bearing sign types. Criteria: object, interpretant, repeatable convention, and downstream interpretive effect.

2. Saussure / structural linguistics: language is a social institution and system of signs; value comes from position inside a system, not isolated naming. Criteria: collective acceptance, contrast with neighboring terms, and stable place in a sign system.

3. Wittgenstein / use and language-games: meaning is embedded in activities, forms of life, and rule-governed practices; many categories work by family resemblance rather than essence. Criteria: actual use, correction norms, and whether participants can distinguish valid from invalid uses in practice.

4. Austin/Searle / speech acts and social ontology: some utterances create obligations or statuses only under felicity conditions; Searle’s constitutive-rule pattern is “X counts as Y in C.” Criteria: accepted procedure, eligible actor, context, uptake, and deontic consequence.

5. Grice / pragmatics: implied meaning depends on cooperative purpose, maxims, context, and inference. Criteria: recoverable intention and context-sensitive uptake. But implicature is weak precedent for authority unless made explicit, because inferred meaning can overgenerate or clash.

6. Hermeneutics / Gadamer: interpretation is conditioned by tradition, language, and historical transmission; tradition can be a source of truth without being an unquestionable foundation. Criteria: lineage, inherited practice, situated application, and challengeability.

7. Terminology / controlled vocabularies / SKOS: terminology work systematizes concepts and designations; controlled vocabularies require construction, testing, maintenance, labels, notes, and explicit semantic relations. Criteria: concept identity, preferred/alternate labels, definitions, scope notes, relationships, governance, and maintenance.

8. DDD and standards practice: DDD’s ubiquitous language is model-backed and bounded-context-local; standards turn terms into authority via conformance text, normative keywords, and declared interpretation rules. Criteria: bounded context, model/code/document use, conformance effect, and explicit normative marking.

**Rubric**
A term/relation becomes meaning-bearing authority when it has: a stable concept distinct from the label; a system position among neighboring concepts; a bounded context of use; an owner or eligible declaring actor; explicit definition and scope; typed relations or signatures; operational consequences; consumers that can pass/fail/route on it; and a maintenance/promotion route.

It remains ordinary vocabulary when it is only explanatory prose, metaphor, local shorthand, inferred implication, or a useful but unpromoted candidate. Locally, that matches CyberAlchemy’s authority-layer rule: evidence can cite authority, but does not become authority until promoted by the responsible owner [DEFINITIONS.md](../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md). Promotion gates are the crossing point from evidence/candidate meaning into local authority or implementation work [DEFINITIONS.md](../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md).

**DomainSpec L2**
Build from owned first. DomainSpec already has a 25-type / 29-edge relationship system and explicitly says larger edge/category extensions are deferred, not canonical [DEFINITIONS.md](../../../../../arcanum/definitions/DEFINITIONS.md). The live taxonomy and relationship catalog already define the current category/edge field [TAXONOMY.md](../../../../../implementation/domainspec/TAXONOMY.md), [RELATIONSHIPS.md](../../../../../implementation/domainspec/RELATIONSHIPS.md).

Promote/build-from-owned:
`depends-on` should be build-from-owned as a typed coupling relation, not a casual edge. CyberAlchemy already requires non-orthogonal dependency/constraint/co-change links to record endpoints, direction, owner, evidence, and validation/promotion effect before they govern work [DEFINITIONS.md](../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md).

Promote/build-from-owned:
`owns` is strong if it means authority/routing responsibility, not possession. It should carry owner route, scope, and allowed decisions, aligning with promotion gates and authority lifecycle axes [DEFINITIONS.md](../../../../../cyberAlchemy-v2/authority/definitions/DEFINITIONS.md).

Defer or split:
`belongs-to` is too ambiguous. It may mean membership, containment, classification, scope, provenance, or ownership. Split into more precise candidates such as `member-of`, `contained-in`, `scoped-to`, `classified-as`, or `owned-by`.

Build-from-owned:
workflow/transaction candidates should reuse `Workflow`, `Saga`, `orchestrates`, `transitions`, `produces-for`, `triggers-cross`, and `enforces-cross` unless a new relation adds enforceable consistency/compensation semantics beyond the current graph.

Promote only with laws:
category laws should become L2 authority only when they constrain valid instances or compositions, like DS-D8’s edge-signature operator, where endpoint meta-types determine whether an edge is valid [DEFINITIONS.md](../../../../../arcanum/definitions/DEFINITIONS.md).

**Gaps**
Primary Austin, Searle, Wittgenstein, Gadamer, and Evans texts are partly copyright/paywalled, so I used SEP, official standards pages, and stable PDFs where available. ISO 704 itself would be worth a deeper pass if the final L2 rubric needs terminology-standard exactness.
