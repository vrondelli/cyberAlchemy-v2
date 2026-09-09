---
tags: [cyberalchemy-v2, schema, taxonomy, human-view, machine-view, primitive-lifecycle, definitions-governance, research]
node_type: research
is_session: false
layer: knowledge-governance
nature: evidence
status: draft
created: 2026-06-21
dispatch_id: 2026-06-21-schema-taxonomy-view-primitives
dispatch_type: research
---

# Research Transcript - Schema / Taxonomy / Human View / Machine View Primitives

Dispatch: `2026-06-21-schema-taxonomy-view-primitives`

This file mechanically preserves the explorer returns for the research dispatch.
It is source evidence for the synthesized findings; it is not a canonical
definition, constitution, axiom, discipline, or ontology promotion.

## Abramsky, Samson - Schema-Law Explorer

Memory only affected the reading posture here: treat the formal/scientific voice
as the normative definition layer. I did not edit files.

**Verdict**

`build-from-owned`.

Schema is already deployed as an Arcanum-wide primitive, but CyberAlchemy v2
should not redefine it as a new top-level local primitive. Use
`DEF-ARC-SCHEMA` globally by reference, then add CyberAlchemy v2 subtypes only
where v2 needs extra authority behavior, such as `authority schema` or
`tower schema`.

**Boundary**

Schema vs contract: schema is shape law: fields, row families, types, enums,
references, cardinality, parse and validation rules. Contract is
behavior/authority law: promises, owner, evidence, pass/block/deferral
conditions. A schema can support a contract, but schema-valid does not mean
contract-satisfied.

Schema vs taxonomy: taxonomy is the controlled vocabulary of node/meta-types
and relation verbs. DS-D1 names allowed concept types; DS-D2 names allowed
relation verbs; DS-D8 checks whether an edge's endpoints match the relation
signature. Schema can encode/check those structures, but it is not the
vocabulary itself.

Schema vs machine view: a machine view/read model/projection/index can be
schema-valid while remaining derivative. Schema validates the shape of the
view; it does not make the view authoritative, canonical, or source-of-truth.

**Implications**

Definition: do not add `CAV2-Dxx: Schema` as a duplicate. If needed, add
narrow subtypes: `authority schema` for schemas whose validation result can
affect authority only through an explicit typed coupling and contract; `tower
schema` for reflection layers that name schema/data/validation/recomposition
obligations.

Constitution: current Schema Constitution is format governance, not semantic
governance. If schema becomes cross-system governance, split or extend via a
new semantic constitution covering schema evolution, compatibility, registry
behavior, source-of-truth posture, and schema-vs-contract limits.

Axiom: candidate axiom, not promoted yet: "Shape evidence is not authority
evidence." Companion laws: schema-level and instance-level validation remain
distinct; schema-to-contract effects must be explicit typed couplings; typed
edge admissibility is not runtime correctness.

**Source Refs**

- `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md:36-38,96-111` - schema already belongs to Arcanum; v2 should keep it by reference unless a subtype is needed.
- `arcanum/definitions/DEFINITIONS.md:86-114` - schema definition and boundary.
- `arcanum/definitions/DEFINITIONS.md:27-59` - contract definition and schema/contract non-collapse.
- `arcanum/definitions/DEFINITIONS.md:282-373,425-445` - DS-D1 taxonomy, DS-D2 relation vocabulary, DS-D8 edge signature validity.
- `arcanum/framework/SCHEMA-CONSTITUTION.md:9-18,32-34,68-79` - current constitution governs `.schema.yml` artifact format; semantic expansion is a split trigger.
- `implementation/domainspec/vault/ontology-conventions.md:75-123,169-181,652-661` - role/scope/format axes; schema-like form belongs under `nature`, not authority role.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:634-686` - CAV2-D16 typed coupling invariant; schema affecting contract must be explicit.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:702-739,960-978` - schema participates in reflection towers and Craft, while schema-level and instance-level validation stay separate.

**Residue**

Open questions: whether v2 needs one subtype or two (`authority schema` vs
`tower schema`); whether `relationship invariant` is distinct from CAV2-D16;
when the Schema Constitution should split into semantic governance; and which
owner route owns machine-checkable encodings of DS-D1/DS-D2/DS-D8.

## Tarski, Alfred - Semantic / Taxonomy Explorer

**Verdict**

Candidate subtype, with strong build-from-owned evidence. Taxonomy is already
deployed in DomainSpec as the DS-D1 meta-type catalog, but it is not already a
global CyberAlchemy v2 primitive. If promoted, it should mean a controlled
classification catalog: admissible kinds/statuses used to type or classify
things across surfaces. It should not absorb ontology, schema, or relation
catalogs.

**Boundary**

Taxonomy: names legal categories or statuses. It answers "what kind of thing is
this?" or "which bucket may this enter?" DomainSpec's `TAXONOMY.md` is
explicitly an explanatory catalog under DS-D1, not the normative source itself.

Schema: validates structural shape: fields, enums, references, cardinality,
parse rules. A schema may contain taxonomy labels as enum values, but schema
validity is only shape evidence, not meaning or authority.

Relation catalog: names legal edge verbs and signatures. It answers "what
relation may connect these typed endpoints?" DS-D2/DS-D7/DS-D8 keep relation
families and endpoint signatures from collapsing.

Ontology: meaning layer. It contains typed objects, typed relations,
branch/role assignment, provenance, confidence, promotion state, gates,
contradiction/drift/residue paths, and downstream use obligations. Taxonomy can
feed ontology, but a taxonomy alone is only a category vocabulary.

**Implications**

Definition implication: add only a candidate CyberAlchemy v2 term like
`taxonomy catalog` or `classification taxonomy`, scoped as "a governed category
vocabulary with owner, scope, membership rule, source posture, and promotion
state." Do not define it as "the ontology."

Constitution implication: require every cross-surface taxonomy to declare its
owner, scope, authority level, and whether it is normative, imported,
generated, or explanatory. No global category list by file adjacency.

Axiom implication: `taxonomic assignment != promotion`; `schema validation !=
taxonomic meaning`; `relation admissibility requires endpoint taxonomy plus
relation signature`; `ontology = taxonomy plus typed relations plus
evidence/governance/use obligations`, not taxonomy alone.

Workflow/task/system implication: tasks, workflows, systems, disciplines,
constitutions, and axioms may each have taxonomies, but only as typed
classification surfaces unless a promotion gate makes a specific taxonomy
authoritative.

**Source Refs**

- `.arcanum/inventory/queries/2026-06-21-schema-relationship-invariants/search-sequence.md:23` - lines 23-32, 43-54, 94-102, 110-111.
- `arcanum/definitions/TAXONOMY.md:1` - lines 1-5.
- `arcanum/definitions/RELATIONSHIPS.md:1` - lines 1-9, 44-53.
- `arcanum/definitions/DEFINITIONS.md:77` - schema lines 77-114; DS-D1/DS-D2/DS-D7/DS-D8 lines 293-326, 328-373, 400-445.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:8` - authority/promotion/import boundaries lines 8-16, 184-202, 259-282.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:626` - CAV2-D16 lines 626-658, 680-686.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:855` - CAV2-D19 lines 855-901, 935-940.
- `projects/framework-unification/CONCEPT-MAP.md:113` - lines 113-127, 140-145, 199-203.

**Residue**

Open question: whether CyberAlchemy v2 wants one reusable taxonomy primitive or
several scoped taxonomies: definition taxonomy, constitution taxonomy,
discipline taxonomy, task/workflow taxonomy, system taxonomy.

Open question: whether taxonomy should be promoted under definitions-governance
as a sibling to ontology, or as a subtype/support structure consumed by
ontology.

Open question: how to reconcile provenance-edge catalogs and domain-concept edge
catalogs under one type registry remains explicitly open in framework-unification.

## Simon, Herbert - Workflow / Human-View Explorer

**Verdict**

Build-from-owned. Human view is already deployed locally in Craft and in the
paired-view precedent, but it is not yet promoted as a global CyberAlchemy v2
primitive. The right move is to promote a constrained primitive: every
load-bearing concept, system, action, task, or workflow should declare a
human-continuation view, but not necessarily as a separate file. Sometimes it is
a section, table, rendered status block, or paired-view sibling.

The human question it answers is: "What is this, what can I trust, what blocks
me, what do I do next, and where is the evidence?"

**Boundary**

Human view: a governed reader/continuation surface for humans. It renders
purpose, current status, blockers, decisions, residue, next route, evidence
links, and authority posture. It may be authored or generated, but it does not
become source of truth by being readable.

Schema: the enforceable structural contract: fields, enums, required shape,
validation rules. If the human view needs new facts, schema/taxonomy must own
the shape.

Taxonomy / ontology view: the typed meaning layer: node kinds, edge legality,
relation rules, provenance, confidence, promotion state, use obligations. It
owns "what the thing is" and "how it relates."

Machine view: machine-readable ledger/index/signal state. In Craft,
`.craft/ledger.yml` can be the source of truth; `.craft/index.json` is
rebuildable lookup.

Generated projection: any rebuildable output from canonical sources. A human
view can be a generated projection, but then it must declare source, freshness,
and non-authority. Projection must not silently redefine the ledger, schema,
definitions, or ontology.

**Implications**

Add a candidate definition for `human view` or `human-continuation view`: a
governed view surface that renders a canonical object into human decision and
continuation affordances, with source refs, status, blockers, next route,
residue, and boundary notes.

Add a constitution rule: new load-bearing nodes must either provide
`human_view` or explicitly mark `human_view: not_applicable` with rationale.
Required handles: `source_of_truth`, `view_status`, `intended_decision`,
`current_status`, `next_route`, `blockers_or_residue`, `evidence_links`,
`generated_from` if applicable.

Add a discipline/check: "legibility/navigate gate" under stable repository
stewardship or validation. Framework-unification already flags that
navigability is asserted but not gated, so this should become a validation
obligation rather than another nice-to-have doc.

Use typed coupling: if human view, schema, machine view, and ontology view
constrain one another, record the relation explicitly: `renders`,
`derived-from`, `uses-terms-of`, `indexes`, `stale-if-source-changes`, etc.

**Source Refs**

- `cyberAlchemy-v2/README.md:60` - lines 60-67 separate homes for authority, specs, validation, implementation, operations even when they describe one system.
- `cyberAlchemy-v2/SOURCE-MAP.md:21` - lines 21-31 say evidence, ontology, definitions, generated projections, and authority have distinct postures.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:463` - lines 463-475 define Craft surface as ledger + derived index + linked human view; 488-492 blocks canonical overreach.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:960` - lines 960-978 define Craft method boundaries; 1011-1018 says humans/agents continue without guessing.
- `projects/framework-unification/CONCEPT-MAP.md:52` - lines 52-66 name `paired-views`; 91-105 gives the node envelope; 232-237 flags missing navigability gating.
- `projects/framework-unification/layers/dispatch-composition-attack/system-view.md:21` - lines 21-23 makes system-view stakeholder-visible but non-decisional; 224-239 separates shape, verdicts, mechanics, and terms.
- `projects/framework-unification/layers/dispatch-composition-attack/engineer-view.md:21` - lines 21-31 owns verdicts/schemas/mechanics and points elsewhere for shape/terms.
- `arcanum/arcana/craft/development/refinement-runs/20260614T200439Z-craft-feature-readiness-indexes/INVOKE-DESIGN.md:15` - lines 15-27 and 61-66 show Craft using human views/status surfaces to expose executable readiness without becoming the executor.

**Residue**

Open questions: whether this lands as `human view` directly or under a broader
`view surface` definition; what minimum view is required for small actions; how
to validate legibility without subjective review; how generated and curated
human views declare freshness; and how public/private scrub applies when the
human view is more readable than the machine source.

My recommendation: promote the primitive, but gate it as
"human-continuation view," not "documentation." That keeps it operational and
prevents the classic drift where the readable thing becomes trusted because it
is easier to read.

## Lawvere, F. William - Machine-View / Formalization Explorer

**Verdict**

Machine view should be a **build-from-owned** CyberAlchemy v2 primitive: yes,
but only as a parseable/checkable representation obligation, not as authority
or proof. It is not already globally deployed: `CONCEPT-MAP.md` says the node
envelope, validator, and typed-residue gate are still designed/not built, even
though the repo already owns the ingredients.

**Boundary**

- **Schema**: field/type/shape rules for valid instances. It gives "shape
  evidence," not execution, promotion, or authority proof.
- **Machine view**: a concrete parseable/checkable representation of one
  object/action/workflow: identity, typed classification, schema ref, typed
  edges/refs, provenance, validator/proof handles, projection status, and
  residue.
- **Ontology projection**: a derived/read-model slice for search/review. It may
  expose state, but cannot promote or decide authority.
- **Validation proof**: a specific check result: e.g. schema parse,
  `sigmaValid`, Lean typecheck, invariant pass. It proves only that named
  invariant, not total semantic adequacy. DomainSpec formalization explicitly
  keeps schema and instance residue separate.

**Implications**

Candidate definition: `machine view` = a source-linked, parseable/checkable
representation surface for a concept/system/action/task/workflow, with declared
schema, typed relationships, validator command/proof status, and residue.

Candidate constitution rule: every new governed object should declare taxonomy,
schema, human view, and machine view, or record missing facets as residue.
Machine views must name source of truth, generation/projection path, owner
route, and validation boundary.

Candidate axiom: machine-readable does not mean authoritative. A machine view
can support owner decisions, but cannot replace schema, contract, ontology
promotion, or validation proof.

**Source Refs**

- `.arcanum/inventory/schema.md:6` - inventory pages are generated read models; evidence cards/sets are non-authority handoffs at lines 83-103.
- `.arcanum/inventory/index.md:26` - authority-node evidence cards/sets are indexed as candidate read models; current gaps at lines 84-90 keep them non-promoting.
- `projects/framework-unification/CONCEPT-MAP.md:91` - node envelope shape and mechanically checkable drift at lines 91-109; ontology-view makes forbidden edges unconstructible at lines 124-145.
- `projects/framework-unification/CONCEPT-MAP.md:174` - built vs designed floor says node envelope, validator, typed-residue gate are not yet built.
- `implementation/domainspec/vault/ontology-conventions.md:291` - vault edges require bidirectional declarations and fixed edge catalogs; authoring rules at lines 638-642 forbid invented edges.
- `arcanum/definitions/DEFINITIONS.md:86` - schema is structural representation and shape evidence, not promotion proof; DS-D8 edge signatures at lines 425-445 define graph type-checking.
- `implementation/domainspec/internal_tools/lean-code-validator/README.md:1` - Lean validator is machine-checked structure; `sigmaValid` and `EdgeRow.wellTyped` at lines 40-48 make ill-typed edges unconstructible.
- `cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/findings.md:21` - ontology projections are read models and cannot promote by proximity; lines 70-78 preserve owner-route authority.

**Residue**

Open: whether machine view has one canonical envelope across all objects, or
multiple subtype envelopes. Open: whether schema/taxonomy/human/machine should
become one constitution group or separate definitions. Blocker: no global
machine-view validator yet. Formal warning: schema-level correctness and
instance-level correctness do not collapse into one proof; `domainspec-formalization`
keeps two residues, so the primitive must preserve that double audit.
