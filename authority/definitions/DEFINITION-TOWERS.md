# CyberAlchemy v2 Definition Towers

Status: candidate tower map
Owner: invoke define + definitions-governance
Craft surface: [../../CRAFT.md](../../CRAFT.md)
Canonical definitions: [DEFINITIONS.md](DEFINITIONS.md)
Import ledger: [../imports/definitions/MANIFEST.md](../imports/definitions/MANIFEST.md)
Definition localization route: [DEFINITION-LOCALIZATION-ROUTE.md](DEFINITION-LOCALIZATION-ROUTE.md)

## Authority Rule

This file maps candidate definition towers for CyberAlchemy v2. It is not the
canonical definition source. Terms become normative only when promoted into
[DEFINITIONS.md](DEFINITIONS.md) through definitions-governance.

The towers exist to make the scattered definition corpus executable through the
Craft surface: each tower has a scope, source posture, owner route, current
content, and next review action.

## Definition Localization Rule

CyberAlchemy v2 should hold project-local representation for all imported
definition material needed by the stable repository consolidation. Local
representation does not equal local canon: source-cluster rows keep provenance,
source authority, tower assignment, local posture, and promotion route, while
only [DEFINITIONS.md](DEFINITIONS.md) holds promoted CyberAlchemy v2 definitions.

External authority terms, such as Arcanum or DomainSpec definitions, may be
represented inside v2 for Craft execution and search reduction without being
redefined as CyberAlchemy v2 authority.

## Tower Stack

| Tower | Altitude | Role | Source posture | Craft context |
| --- | --- | --- | --- | --- |
| T-1. Primordial semantic basis | primordial | Names the base invariants and primitive terms that should hold across every tower. | Candidate CyberAlchemy v2 authority; not canonical until promoted. | `CTX-CAV2-DEF-TOWERS` |
| T0. CyberAlchemy stable repository | umbrella | Names the repository thesis and the governance shape of the amalgamation. | Local CyberAlchemy v2 authority plus candidate synthesis. | `CTX-CAV2-DEF-TOWERS` |
| T1. Arcanum capability framework | pillar | Names public framework capabilities, contracts, routes, and lifecycle owners. | Public Arcanum authority for Arcanum terms only. | `CTX-CAV2-DEF-TOWERS` |
| T2. DomainSpec semantic/modeling spine | pillar | Names typed domain modeling, graph semantics, constitutions, and governance evidence. | Private implementation evidence unless separately boundary-scrubbed. | `CTX-CAV2-DEF-TOWERS` |
| T3. Craft execution surface | sub-tower | Names the recursive ledger surface used to execute this consolidation. | Arcanum Craft canonical source plus local ledger state. | `CTX-CAV2-CRAFT-SURFACE` |
| T4. Knowledge governance stack | bridge | Names inventory, ontology, evidence, confidence, branch, and promotion concepts. | Candidate read models until promoted by owners. | `CTX-CAV2-SPACES` |
| T5. Research and product towers | source-family | Names CyberAlchemy agentic-system, framework-unification, Ontologize, and research tower terms. | Candidate source evidence and research-local definitions. | `CTX-CAV2-SPACES` |
| T6. Validation, observability, and ops | execution evidence | Names proof, signal, validation, task-session, and extraction-operation terms. | Evidence and operating trace, not semantic authority. | `CTX-CAV2-EXECUTION` |

## Space Map

CyberAlchemy v2 now has three kinds of spaces to keep separate.

### Project Spaces

| Space | Current role | Tower touchpoints |
| --- | --- | --- |
| [authority/](../README.md) | Definitions, constitutions, promotion policy, and boundary decisions. | T0, T1, T2, T4 |
| [disciplines/](../../disciplines/DISCIPLINES.md) | Recurring governance practices. | T0, T3 |
| [research/](../../research/README.md) | Source-ledgered towers and non-canonical synthesis. | T4, T5 |
| [architecture/](../../architecture/README.md) | Candidate and promoted structure decisions. | T0, T4, T5 |
| [capabilities/](../../capabilities/README.md) | Capability contracts and generated-surface boundaries after promotion. | T1, T6 |
| [specs/](../../specs/README.md) | Domain, runtime, validation, and artifact contracts after promotion. | T1, T2, T6 |
| [implementation/](../../implementation/README.md) | Code/package work after implementation gates. | T2, T6 |
| [validation/](../../validation/README.md) | Fixtures, harnesses, and proof reports. | T6 |
| [inventory/](../../inventory/README.md) | Project-local exported read models. | T4 |
| [ontology/](../../ontology/README.md) | Candidate branch maps and promotion requests. | T4, T5 |
| [observability/](../../observability/README.md) | Signals, reflections, dispatch traces, and residue. | T6 |
| [ops/](../../ops/README.md) | Work-packs, task sessions, extraction plans, and handoffs. | T6 |

### Source Spaces

| Source space | Import role | Boundary |
| --- | --- | --- |
| [../../arcanum](../../../arcanum) | Public framework, method, capability, and governance source. | Public-safe; CyberAlchemy v2 should create local representation rows while preserving Arcanum authority for Arcanum-wide terms. |
| [../../../implementation/domainspec](../../../implementation/domainspec) | Private DomainSpec implementation, constitution, taxonomy, and graph evidence. | Private evidence; public derivatives require scrub and owner review. |
| [../../../cyberAlchemy](../../../cyberAlchemy) | Existing CyberAlchemy agentic-system method, ontology, and product/source material. | Candidate project authority until reviewed. |
| [../../../projects/framework-unification](../../../projects/framework-unification) | Two-axis architecture and intent-to-code engine synthesis. | Draft architecture synthesis. |
| [../../../projects/domainspec-v2](../../../projects/domainspec-v2) | Research-first DomainSpec v2 precedent. | Research-local until promoted. |
| [../../../projects/ontologize](../../../projects/ontologize) | Product/method ontology and delivery framing. | Candidate source evidence; boundary review needed. |
| [../../../research](../../../research) | Research towers and domain-specific definition corpora. | Research-local unless promoted. |
| [../../../validation/poker-team](../../../validation/poker-team) | Feature-pack validation shape and report precedent. | Private validation evidence. |

### Craft Execution Spaces

| Craft node | Executes | Output |
| --- | --- | --- |
| `CTX-CAV2-ROOT` | Stable repository consolidation state. | [../../CRAFT.md](../../CRAFT.md) |
| `CTX-CAV2-SPACES` | Project/source/tower space mapping. | This file and [../../SOURCE-MAP.md](../../SOURCE-MAP.md) |
| `CTX-CAV2-DEF-TOWERS` | Definition tower clustering and promotion queue. | This file and [DEFINITIONS.md](DEFINITIONS.md) |
| `CTX-CAV2-AUTHORITY-IMPORTS` | Import candidate clustering, dedupe, and owner classification. | [../imports/definitions/MANIFEST.md](../imports/definitions/MANIFEST.md) |
| `CTX-CAV2-CONSTITUTION-TOWERS` | Constitution, axiom, and quality rule clustering. | [../imports/constitutions/MANIFEST.md](../imports/constitutions/MANIFEST.md) |
| `CTX-CAV2-CRAFT-SURFACE` | Ledger execution, next moves, blockers, gaps, and recomposition. | [../../.craft/ledger.yml](../../.craft/ledger.yml) |
| `CTX-CAV2-BOUNDARY` | Public/private boundary and visible-hidden project-area decisions. | [../boundaries.md](../boundaries.md) |
| `CTX-CAV2-EXECUTION` | Future work-pack, task-session, validation, and extraction execution. | [../../ops/README.md](../../ops/README.md) |

## T0. CyberAlchemy Stable Repository

## T-1. Primordial Semantic Basis

### Scope

This tower owns the highest-altitude candidate terms that should hold across
method, representation, communication, epistemology, Craft execution, and
future implementation.

### Source Basis

- [source-clusters/primordial.md](source-clusters/primordial.md)
- `domainspec-formalization/README.md` (embedded local source evidence)
- `domainspec-lean-formalization/docs/reflection-tower-framework.md` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/Residue.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/EntropyAsFFResidue.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/SecondLawDiscrete.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/UniversalResidueFunctor.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/ResidueCat.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/ReflectionTower.lean` (embedded local source evidence)
- `domainspec-lean-formalization/lean-formalization/ReflectionTowerAnchored.lean` (embedded local source evidence)
- `domainspec-lean-formalization/THERMODYNAMICS.md` (embedded local source evidence)
- [../../../projects/framework-unification/CONCEPT-MAP.md](../../../projects/framework-unification/CONCEPT-MAP.md)
- [../../../arcanum/framework/CYBERALCHEMY-METHOD.md](../../../arcanum/framework/CYBERALCHEMY-METHOD.md)
- [../../../arcanum/arcana/craft/SKILL.md](../../../arcanum/arcana/craft/SKILL.md)
- [reviews/constitution-invariant-axiom-role-review.md](reviews/constitution-invariant-axiom-role-review.md)

### Active Local Terms

- typed coupling invariant - [CAV2-D16](DEFINITIONS.md#cav2-d16-typed-coupling-invariant)
- reflection tower method - [CAV2-D17](DEFINITIONS.md#cav2-d17-reflection-tower-method)
- residue - [CAV2-D18](DEFINITIONS.md#cav2-d18-residue)
- residue entropy - [CAV2-D27](DEFINITIONS.md#cav2-d27-residue-entropy)
- value-cycle edge guard - [CAV2-D28](DEFINITIONS.md#cav2-d28-value-cycle-edge-guard)
- four-facet action method - [CAV2-D21](DEFINITIONS.md#cav2-d21-four-facet-action-method)
- axis orthogonality invariant - [CAV2-D29](DEFINITIONS.md#cav2-d29-axis-orthogonality-invariant)
- bounded recursive self-application - [CAV2-D30](DEFINITIONS.md#cav2-d30-bounded-recursive-self-application)
- primitive type - [CAV2-D31](DEFINITIONS.md#cav2-d31-primitive-type)
- method - [CAV2-D32](DEFINITIONS.md#cav2-d32-method)
- definition - [CAV2-D33](DEFINITIONS.md#cav2-d33-definition)
- authority - [CAV2-D34](DEFINITIONS.md#cav2-d34-authority)
- provenance - [CAV2-D35](DEFINITIONS.md#cav2-d35-provenance)
- traceability - [CAV2-D36](DEFINITIONS.md#cav2-d36-traceability)
- gate - [CAV2-D37](DEFINITIONS.md#cav2-d37-gate)
- claim <= proof - [CAV2-D38](DEFINITIONS.md#cav2-d38-claim-proof-bound)
- intent - [CAV2-D39](DEFINITIONS.md#cav2-d39-intent)

### Remaining Candidate Local Terms

- artifact
- invariant - generic parent term under specific promoted invariants

### Boundary

Primordial terms may be represented here for local work, but this tower does
not promote them by itself. Candidate terms still need definitions-governance
promotion with complete voices, index sync, and drift review before they become
CyberAlchemy v2 authority.

### Next Review

Review `artifact` as the remaining T-1 candidate. Then resume import clustering
to determine whether lower candidates are primitives, aliases of existing
authority terms, source-local vocabulary, or lower-tower concepts.

### Scope

This tower owns the local vocabulary that explains what CyberAlchemy v2 is
trying to become and why source-ledgered consolidation matters.

### Current Active Terms

- `stable repository` - [CAV2-D1](DEFINITIONS.md#cav2-d1-stable-repository)
- `source-ledgered amalgamation` - [CAV2-D2](DEFINITIONS.md#cav2-d2-source-ledgered-amalgamation)
- `authority layer` - [CAV2-D3](DEFINITIONS.md#cav2-d3-authority-layer)
- `source spine` - [CAV2-D4](DEFINITIONS.md#cav2-d4-source-spine)
- `promotion gate` - [CAV2-D5](DEFINITIONS.md#cav2-d5-promotion-gate)
- `stable repository stewardship` - [CAV2-D6](DEFINITIONS.md#cav2-d6-stable-repository-stewardship)
- `authority import` - [CAV2-D7](DEFINITIONS.md#cav2-d7-authority-import)
- `import candidate` - [CAV2-D8](DEFINITIONS.md#cav2-d8-import-candidate)
- `CyberAlchemy v2` - [CAV2-D9](DEFINITIONS.md#cav2-d9-cyberalchemy-v2)
- `definition tower` - [CAV2-D10](DEFINITIONS.md#cav2-d10-definition-tower)
- `tower space` - [CAV2-D11](DEFINITIONS.md#cav2-d11-tower-space)
- `authority promotion queue` - [CAV2-D13](DEFINITIONS.md#cav2-d13-authority-promotion-queue)
- `source space` - [CAV2-D14](DEFINITIONS.md#cav2-d14-source-space)
- `project space` - [CAV2-D15](DEFINITIONS.md#cav2-d15-project-space)
- `authority model` - [CAV2-D41](DEFINITIONS.md#cav2-d41-authority-model)

### Candidate Terms

- source-ledgered repository extraction

### Next Review

Classify the remaining imported candidates now that the local top anchors are
promoted.

## T1. Arcanum Capability Framework

### Scope

This tower references Arcanum as the public capability framework: sigils,
spells, contracts, schemas, dispatch routes, native skills, lifecycle owners,
observability, and reflection.

### Source Basis

- [../../../arcanum/README.md](../../../arcanum/README.md)
- [../../../arcanum/framework/CYBERALCHEMY-METHOD.md](../../../arcanum/framework/CYBERALCHEMY-METHOD.md)
- [../../../arcanum/definitions/DEFINITIONS.md](../../../arcanum/definitions/DEFINITIONS.md)
- [../../../arcanum/registry/SIGILS.md](../../../arcanum/registry/SIGILS.md)
- [../../../arcanum/registry/SPELLS.md](../../../arcanum/registry/SPELLS.md)

### Active External Terms

- `contract` - Arcanum authority: `DEF-ARC-CONTRACT`
- `schema` - Arcanum authority: `DEF-ARC-SCHEMA`

### Candidate Local References

- Arcanum
- sigil
- spell
- skill
- dispatch route
- invoke
- refine
- task-session
- signal-observer
- workflow-reflect

### Boundary

CyberAlchemy v2 should not redefine Arcanum-wide terms. It should represent
them inside the v2 project space with source authority preserved, then promote
only explicit CyberAlchemy v2 adaptations through definitions-governance.

## T2. DomainSpec Semantic/Modeling Spine

### Scope

This tower references DomainSpec as the semantic modeling and governance spine:
meta-types, relationships, concept graphs, constitutions, code anchors, and
drift/governance gates.

### Source Basis

- [../../../implementation/domainspec/CONSTITUTION.md](../../../implementation/domainspec/CONSTITUTION.md)
- [../../../implementation/domainspec/AXIOMS.md](../../../implementation/domainspec/AXIOMS.md)
- [../../../implementation/domainspec/TAXONOMY.md](../../../implementation/domainspec/TAXONOMY.md)
- [../../../implementation/domainspec/RELATIONSHIPS.md](../../../implementation/domainspec/RELATIONSHIPS.md)
- [../../../arcanum/definitions/DEFINITIONS.md](../../../arcanum/definitions/DEFINITIONS.md)
- [reviews/constitution-invariant-axiom-role-review.md](reviews/constitution-invariant-axiom-role-review.md)

### Active External Terms

- `Meta-Type System` - DomainSpec wedge: `DS-D1`
- `Typed Relationship System` - DomainSpec wedge: `DS-D2`
- `Concept Graph` - DomainSpec wedge: `DS-D3`

### Candidate Local References

- DomainSpec
- typed concept graph
- meta-type
- typed relationship
- constitution
- axiom
- invariant
- governance gate
- domain anchor
- drift

### Boundary

The private implementation is evidence for CyberAlchemy v2, not public
authority. Any public-facing derivative requires scrub and owner review.

## T3. Craft Execution Surface

### Scope

This tower makes Craft the local execution and memory surface for the definition
tower work. Craft is treated as a sub-tower of Arcanum operational stewardship,
while this project gives it a high-priority local role.

### Source Basis

- [../../../arcanum/arcana/craft/SKILL.md](../../../arcanum/arcana/craft/SKILL.md)
- [../../../arcanum/arcana/craft/README.md](../../../arcanum/arcana/craft/README.md)
- [../../../arcanum/arcana/craft/templates/ledger.schema.yml](../../../arcanum/arcana/craft/templates/ledger.schema.yml)
- [reviews/ledger-primitive-review.md](reviews/ledger-primitive-review.md)

### Current Active Terms

- `Craft execution surface` - [CAV2-D12](DEFINITIONS.md#cav2-d12-craft-execution-surface)

### Candidate Local Terms

- Craft space
- Craft context
- ledger source of truth
- ledger - review-only candidate, not promoted
- human view
- next move
- recomposition residue

### Boundary

Craft may hold local candidate definitions and execution state, but Craft does
not promote definitions, constitutions, or architecture authority by itself.

## T4. Knowledge Governance Stack

### Scope

This tower groups inventory, ontology, evidence, confidence, branch, memory,
context selection, and promotion concepts.

### Source Basis

- [../../../.arcanum/inventory/index.md](../../../.arcanum/inventory/index.md)
- [source-clusters/house-project-vault.md](source-clusters/house-project-vault.md)
- [../../../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md](../../../.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md)
- [../../../arcanum/arcana/ontology-vault/README.md](../../../arcanum/arcana/ontology-vault/README.md)
- [../../../arcanum/spells/ontology-harness/README.md](../../../arcanum/spells/ontology-harness/README.md)
- [../../../arcanum/arcana/architecture-pattern-inventory/SKILL.md](../../../arcanum/arcana/architecture-pattern-inventory/SKILL.md)
- [../../../arcanum/arcana/ux-lessons/SKILL.md](../../../arcanum/arcana/ux-lessons/SKILL.md)
- [../../../arcanum/arcana/ux-evidence-validator/SKILL.md](../../../arcanum/arcana/ux-evidence-validator/SKILL.md)
- [../../../arcanum/projects/ui-prototyping-studio/ARCHITECTURE.md](../../../arcanum/projects/ui-prototyping-studio/ARCHITECTURE.md)
- [../../../arcanum/BUSINESS-ONTOLOGY.md](../../../arcanum/BUSINESS-ONTOLOGY.md)
- [../../../cyberAlchemy/agentic-system-inventory-ontology-pipeline.md](../../../cyberAlchemy/agentic-system-inventory-ontology-pipeline.md)
- [../../../cyberAlchemy/agentic-system-ontology-entry-model.md](../../../cyberAlchemy/agentic-system-ontology-entry-model.md)
- [../../../cyberAlchemy/ontology/README.md](../../../cyberAlchemy/ontology/README.md)
- [../../../projects/framework-unification/layers/dispatch-composition-attack/ontology-view.md](../../../projects/framework-unification/layers/dispatch-composition-attack/ontology-view.md)
- [../../../projects/ontologize/RECONCILIATION.md](../../../projects/ontologize/RECONCILIATION.md)
- [../../architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md](../../architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md)

### Current Active Terms

- `ontology` - [CAV2-D19](DEFINITIONS.md#cav2-d19-ontology)
- `orthogonal classification` - [CAV2-D22](DEFINITIONS.md#cav2-d22-orthogonal-classification)
- `authority lifecycle axis` - [CAV2-D23](DEFINITIONS.md#cav2-d23-authority-lifecycle-axis)
- `provenance-first navigation` - [CAV2-D24](DEFINITIONS.md#cav2-d24-provenance-first-navigation)
- `schema amendment witness` - [CAV2-D25](DEFINITIONS.md#cav2-d25-schema-amendment-witness)
- `append-only event ledger` - [CAV2-D26](DEFINITIONS.md#cav2-d26-append-only-event-ledger)
- `governed artifact tree` - [CAV2-D42](DEFINITIONS.md#cav2-d42-governed-artifact-tree)
- `pattern promotion lifecycle` - [CAV2-D43](DEFINITIONS.md#cav2-d43-pattern-promotion-lifecycle)
- `view-bearing concept` - [CAV2-D44](DEFINITIONS.md#cav2-d44-view-bearing-concept)
- `UX/UI knowledge governance` - [CAV2-D45](DEFINITIONS.md#cav2-d45-uxui-knowledge-governance)
- `experience evidence lifecycle` - [CAV2-D46](DEFINITIONS.md#cav2-d46-experience-evidence-lifecycle)
- `interface evidence boundary` - [CAV2-D47](DEFINITIONS.md#cav2-d47-interface-evidence-boundary)

### Candidate Local References

- inventory evidence substrate
- ontology candidate condensation
- evidence card
- evidence set
- branch ownership
- confidence split
- context solution
- memory observation
- architecture-view interface
- architecture pattern candidate
- UX lesson
- ux-pattern
- validator claim map
- interface evidence report

### Boundary

Inventory and ontology reduce search and condense candidate meaning. They do
not promote source authority, definitions, constitutions, or runtime contracts.
`OperationalOntology` is demoted as a standalone definition candidate; normalize
it into [CAV2-D19](DEFINITIONS.md#cav2-d19-ontology) ontology projection
language plus [CAV2-D23](DEFINITIONS.md#cav2-d23-authority-lifecycle-axis)
lifecycle-axis language.

## T5. Research And Product Towers

### Scope

This tower groups research/product meaning that may influence CyberAlchemy v2
without immediately becoming authority.

### Source Basis

- [../../VALUE-AND-PHILOSOPHY-PROPOSITION.md](../../VALUE-AND-PHILOSOPHY-PROPOSITION.md)
- [../../../cyberAlchemy/agentic-system-definition.md](../../../cyberAlchemy/agentic-system-definition.md)
- [../../../projects/framework-unification/CONCEPT-MAP.md](../../../projects/framework-unification/CONCEPT-MAP.md)
- [../../../projects/ide-ergonomics/PRODUCT-VIEW.md](../../../projects/ide-ergonomics/PRODUCT-VIEW.md)
- [../../../projects/ide-ergonomics/connective-task-manager/README.md](../../../projects/ide-ergonomics/connective-task-manager/README.md)
- [../decisions/2026-06-23-hmi-candidate-promotion-prep.md](../decisions/2026-06-23-hmi-candidate-promotion-prep.md)
- [../../../projects/ontologize/DEFINITIONS.md](../../../projects/ontologize/DEFINITIONS.md)
- [../../../projects/domainspec-v2/README.md](../../../projects/domainspec-v2/README.md)
- [../../../research](../../../research)

### Candidate Local References

- synergetic cybernetic human-machine integration
- governed human-machine integration
- governed human-machine integration for complex knowledge work
- Connective task manager
- AgenticSystem
- OperationalOntology
- ContextSolution
- TranslationResidue
- SchemaLayer
- EvidenceLayer
- two-axis architecture
- research tower

### Boundary

Research-local terms remain research-local until owner review decides they are
needed by CyberAlchemy v2 authority.

## T6. Validation, Observability, And Ops

### Scope

This tower groups execution proof terms: validation harnesses, reports, signals,
task sessions, work-packs, extraction plans, and observability traces.

### Source Basis

- [../../../validation/poker-team](../../../validation/poker-team)
- [../../../arcanum/spells/observed-invocation-loop/README.md](../../../arcanum/spells/observed-invocation-loop/README.md)
- [../../../arcanum/arcana/task-session/README.md](../../../arcanum/arcana/task-session/README.md)
- [../../ops/README.md](../../ops/README.md)

### Candidate Local References

- validation evidence
- task-session receipt
- signal envelope
- workflow reflection
- extraction plan
- standalone repository readiness

### Boundary

Validation and observability prove behavior or trace decisions. They do not
define semantic authority unless a promotion route consumes them.

## Promotion Queue

| Queue | First work | Owner route | Gate |
| --- | --- | --- | --- |
| Q1. Top anchors | Promoted CyberAlchemy v2, definition tower, tower space, Craft execution surface, authority promotion queue, source space, project space, and authority model as CAV2-D9 through CAV2-D15 plus CAV2-D41. | definitions-governance + Craft ledger | Pass for local definitions; broader import clustering still open. |
| Q1a. Primordial basis | Promoted `typed coupling invariant` as CAV2-D16, `reflection tower method` as CAV2-D17, `residue` as CAV2-D18, `Craft method` as CAV2-D20, `four-facet action method` as CAV2-D21, `residue entropy` as CAV2-D27, `axis orthogonality invariant` as CAV2-D29, `bounded recursive self-application` as CAV2-D30, `primitive type` as CAV2-D31, generic `method` as CAV2-D32, `definition` as CAV2-D33, `authority` as CAV2-D34, `provenance` as CAV2-D35, `traceability` as CAV2-D36, `gate` as CAV2-D37, `claim <= proof` as CAV2-D38, and `intent` as CAV2-D39. | definitions-governance | Flag until the remaining T-1 candidate is classified: artifact. |
| Q1b. Knowledge governance basis | Promoted `ontology` as CAV2-D19 and demoted `OperationalOntology` into D19/D23 language; next review `ContextSolution`, evidence card, evidence set, branch ownership, and confidence split. | definitions-governance + ontology-vault | Flag until source-specific branch terms are classified against CAV2-D19 and promotion boundaries. |
| Q1b-arch. Architecture knowledge governance | Promoted `governed artifact tree`, `pattern promotion lifecycle`, and `view-bearing concept` as CAV2-D42 through CAV2-D44 so architecture-pattern-inventory can serve as a lens-specific governance interface without becoming authority. | definitions-governance + architecture route + constitution-governance | Pass for local definitions; implementation of machine-checkable architecture cards and cross-context pattern evidence remains open. |
| Q1b-ux-ui. UX/UI knowledge governance | Promoted `UX/UI knowledge governance`, `experience evidence lifecycle`, and `interface evidence boundary` as CAV2-D45 through CAV2-D47 so ux-lessons, ux-evidence-validator, and ui-prototyping-studio can form a governed experience-knowledge view without collapsing browser evidence, subjective UX, and authority. | definitions-governance + UX/UI route + constitution-governance | Pass for local definitions; executable validator, fixture calibration, and cross-session promotion evidence remain open. |
| Q1c. Ledger primitive review | Reviewed `ledger` as a candidate cross-method evidence/state register; canonical promotion deferred. | definitions-governance + robot-talks + Craft schema review | Block until inheritance relations and local Craft ledger conformance are settled; `CAV2-D30` resolves the recursivity-name blocker. |
| Q1d. Schema and relationship invariant search sequence | Filed an inventory-backed search ladder for schema, typed relationships, taxonomy, graph admissibility, and relationship invariant evidence. | inventory + definitions-governance | Flag until evidence-cards distinguish `relationship invariant` from `CAV2-D16` and keep `schema` as Arcanum authority or a named v2 subtype. |
| Q1e. Imported vault value concepts | Promoted `orthogonal classification`, `authority lifecycle axis`, `provenance-first navigation`, `schema amendment witness`, and `append-only event ledger` as CAV2-D22 through CAV2-D26 from the house_project vault source cluster. | definitions-governance + constitution-governance | Pass for local definitions; validator-backed constitutions and generic `ledger` remain open. |
| Q2. Framework source cluster | Create v2-local representation rows for Arcanum-wide definitions, starting with `DEF-ARC-CONTRACT`, `DEF-ARC-SCHEMA`, `DEF-ARC-GOAL-SPELL`, `DEF-ARC-STAGED-DELTA`, and `DEF-ARC-APPROVAL-TOKEN`. | Craft + definitions-governance | Pass if source authority remains external and local promotion is explicit. |
| Q3. DomainSpec references | Classify DomainSpec terms as private evidence or local references. | boundary review + definitions-governance | Block for public use until scrubbed. |
| Q4. Imported term clusters | Cluster 149 definition candidates by tower, term type, and authority posture. | Craft + definitions-governance | Flag until dedupe complete. |
| Q4a. CyberAlchemy product/philosophy candidates | Prepare `synergetic cybernetic human-machine integration` from [source-clusters/cyberalchemy.md](source-clusters/cyberalchemy.md) as a product/philosophy proposition candidate, with scope, spelling, proof surface, and public-safe wording resolved in [the HMI decision record](../decisions/2026-06-23-hmi-candidate-promotion-prep.md). | definitions-governance + boundary review | Flag until canonical definition draft, index sync, drift audit, and Connective proof fixture or explicit owner promotion. |
| Q4b. Constitution, invariant, and axiom role split | Use [the role review](reviews/constitution-invariant-axiom-role-review.md) to decide whether CAV2 needs generic `invariant`, `axiom`, and `constitution` definitions, or only source-local references plus specific promoted invariant instances. | definitions-governance + constitution-governance | Flag until local-vs-external authority is decided and private DomainSpec evidence is boundary-reviewed. |
| Q5. Constitution clusters | Cluster 106 constitution/axiom candidates by rule type, scope, and owner. | constitution-governance | Flag until pack composed. |
| Q6. Execution readiness | Convert tower work into bounded work-pack or task-session slices. | Craft + invoke plan/task-session | Deferred until Q1-Q5 classify enough terms. |

## Open Questions

### OQ-1. Is Craft a peer tower or an execution sub-tower?

Recommended answer: treat Craft as an Arcanum-owned execution sub-tower with a
high-priority local role in CyberAlchemy v2.

### OQ-2. Which imported definition clusters should be promoted first?

Recommended answer: the top anchors are promoted. Next process framework,
DomainSpec, knowledge governance, research/product, and validation/ops clusters.

### OQ-3. Should `inventory/` and `ontology/` stay visible project spaces?

Recommended answer: keep them visible while CyberAlchemy v2 is staged inside
the private parent, then decide before standalone extraction.
