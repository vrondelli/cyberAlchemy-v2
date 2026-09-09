# CyberAlchemy-lab Context and Artifact Architecture Research

## Agent 1

Agent: Tarski, Alfred
Role: explorer
Angle: artifact-centered governed package—inventory the existing semantic and artifact surfaces, then test the smallest package protocol that recomposes artifact types and instances without inventing a governed-artifact primitive.

## Scope and evidence posture

- `TARSKI-1` — **observed / knowledge-backed:** the packet is research-only (`authority_effect: none`); it neither selects Lab architecture nor admits any source. Its listed source digests, including both Lab foundations, match the current bytes. [strategy-inventory-packet.json §claim_ceiling, §target_boundary; CyberAlchemy-lab/README.md §Foundation boundary; CyberAlchemy-lab/docs/decisions/0001-repository-foundation.md §Explicitly unauthorized effects]
- `TARSKI-2` — **observed / knowledge-backed:** the Lab is a clean-history successor. A cited v2 artifact is evidence or an external source until exact-byte selection, validation, and owner decision occur. [CyberAlchemy-lab/README.md §Foundation boundary; `0001-repository-foundation.md` §Decision]
- `TARSKI-3` — **derived / concept-claim:** “exhaustive” here means exhaustive across the packet’s enumerated files and selectors. The family-root strings are discovery categories, not permission to traverse unenumerated trees.

## Surface inventory

| Class | Semantic shape | Authority / owner | Canonical direction and schema | Lifecycle, projection, enforcement, residue |
|---|---|---|---|---|
| Definitions | Normative semantic unit with identifier, voices, boundary, provenance, consumers, index, and drift route. | `Definition`; definitions-governance. | Canonical Markdown `authority/definitions/DEFINITIONS.md`; documentary schema handles. | Active definitions govern meaning; indexes are lookup views. A candidate, inventory card, or generated index cannot redefine a term. [DEFINITIONS.md §CAV2-D33 Definition] |
| Axioms | Foundational world/domain proposition from which premises, invariants, and constitution rules may derive. | Presently rolls up to `Definition`, not a separate authority kind. | Definition source; no separate admitted artifact root shown in packet. | Distinct from system behavior constraints; first-class-kind question remains open. [DEFINITIONS.md §CAV2-D53 Axiom; AUTHORITY-MODEL.md §Invariant, Axiom, Constitution, §Open Questions] |
| Invariants | Constraint on what must remain true / what counts as drift. | Presently `Definition`, not a separate authority kind. | Definition source; can be carried into a constitution and validator/gate. | Cannot silently become enforcement or an authority-kind split. [DEFINITIONS.md §CAV2-D54 Invariant; AUTHORITY-MODEL.md §Invariant, Axiom, Constitution] |
| Premises | Derived, revisable contextual assumption between axiom and downstream reasoning. | Semantic shape under definitions; no separate authority kind evidenced. | Definition source and documentary schema handle. | Must not be mistaken for axiom-level commitment or validation proof. [DEFINITIONS.md §CAV2-D55 Premise; strategy packet §T2-semantic-shape-versus-authority-kind] |
| Schemas | Structural contract: fields, relations, cardinality, and check surface. | Semantic definition; schema files are not automatically authority decisions. | Machine-readable schema candidates / handles; D21 requires a schema facet. | Schema conformance does not promote, implement, or prove runtime behavior. [DEFINITIONS.md §CAV2-D56 Schema, §CAV2-D21 Four-Facet Action Method] |
| Constitutions | Owner-adopted scoped operational rule derived from / linked to an invariant. | `Constitution`; constitution-governance. | `authority/constitutions/`; selected validator or gate separately checks it. | Constitution constrains future artifacts but does not prove its motivating source claim. Namespace collision remains latent, not tripped. [DEFINITIONS.md §CAV2-D58 Constitution; AUTHORITY-MODEL.md §Authority Kinds, §Non-Collapse Rules; constitution-namespaces-and-axioms-role-synthesis.md §1, §Residue] |
| Decisions | Immutable owner resolution of a contested movement or option. | `Decision`; decision-gate. | `authority/decisions/`; Lab decision is canonical only for its stated local foundation effect. | Does not authorize successor effects. [AUTHORITY-MODEL.md §Authority Kinds, §Narrowest Owner Rule; `0001-repository-foundation.md` §Decision, §Remaining gates] |
| Canonical kinds | Closed enumerated kind set; instance kinds roll up to coarse authority kinds. | Candidate table/view cannot itself create authority. | Canonical artifact references `CANONICAL-KINDS.md`; type-to-authority rollup is derived. | Unenumerated authority kind defaults blocked; validation is review-mode. [DEFINITIONS.md §CAV2-D51 Canonical Artifact; AUTHORITY-MODEL.md §Authority Kinds] |
| Canonical artifacts | Typed instance with enumerated kind, exact owner-admitted process origin, durability, and authority state. | Instance is not authority merely because canonical. | `CA(a)` record shape and `ProcessOrigin`; origin references must be exact and digest-bound. | `declared`, `integrity-bound`, and `actor-attested` do not prove execution, truth, promotion, or publication. [DEFINITIONS.md §CAV2-D51 Canonical Artifact] |
| Durability | Intended-lifespan axis: ephemeral or perennial. | Orthogonal to authority kind and maturity. | Inherited/declared on canonical-artifact instances. | Ephemeral material may preserve live contradictions; perennial material may not. [DEFINITIONS.md §CAV2-D52 Artifact Durability] |
| Governed artifact tree | Interface obligation for a load-bearing tree: owner, source, views, evidence, promotion, validation, challenge, drift, uses. | Does not itself create authority. | Tree-level declaration, not a new primitive or ontology-node type. | Missing fields leave it a useful draft/context, not a reusable authority surface. [DEFINITIONS.md §CAV2-D42 Governed Artifact Tree] |
| Product thesis document | Product-direction carrier with identity, commitment, owner, evidence, counterevidence, and challenge route. | Candidate `Spec` posture; product owner / decision gates remain separate. | **Markdown carrier canonical** (`PRODUCT-THESIS.md`); JSON sibling is a projection. | Commitment lifecycle is separate from authority state and implementation. [PRODUCT-THESIS-DOCUMENT-TYPE.md §Carrier And Machine Record, §Lifecycle, §Authority Boundary] |
| Product, capability, and Context | Product Capability is stable product outcome; Context is a durable work frame belonging to exactly one Product and optionally Project/Goal. | Capability / Context definitions carry no implementation authority. | Context has documentary schema and a candidate machine contract; it may reference, but is not, a DDD Bounded Context. | Material anchor change creates successor identity; active Context does not make sources true/current/accepted. [DEFINITIONS.md §CAV2-D66 Context, §CAV2-D67 Product Capability; context/README.md §Context versus DDD Bounded Context, §Claim Ceiling] |
| Governance and product ontology packages | Candidate machine-readable package sources and projected/readable package documentation. | Governance owner, product owner; neither package currently supplies admitted enforcement. | Registry/package files and schemas named in their READMEs. | Ontology can map authority but cannot decide it; runtime is candidate evidence only. [ontology/governance/README.md §Core Model, §Package Files, §Current Boundary; ontology/product/README.md §machine-readable package source, §Governance Enforcement Inside The Product] |
| Generated views and evidence | Projections, Inventory entries, research, validation, receipts, telemetry. | `Projection`, `Evidence`, or `Residue`; owners vary. | Generated views support navigation/traceability; source provenance and checks must be explicit. | Cannot promote or replace owner decision; source/evidence/generated/local-runtime state must remain distinct. [AUTHORITY-MODEL.md §Authority Postures, §Non-Collapse Rules; arcanum-framework-artifact-governance.md §Arcanum framework artifact governance] |
| Validators and negative tests | Validator/gate is the checking mechanism, not the semantic owner. | Validator owner plus relevant authority owner. | Exact expected source/schema/selector and receipt references required for a credible machine claim. | Packet records that Lab has no generator, validator, drift rejection, or negative tests yet. [DEFINITIONS.md §CAV2-D21 Four-Facet Action Method, §CAV2-D65 DomainSpec-Governed Construction Invariant; strategy-inventory-packet.json §open_gaps] |
| D65 construction binding | Ordered evidence chain: definitions → capability → business ontology → DomainSpec source → graph/ontology → implementation binding → conformance. | Owner-bound ConstructionBinding; no stage implies a successor stage. | Exact refs/digests for authored source, compiler, graph, ontology, binding, and evidence. | Missing/stale predecessor means blocked or `not_evaluable`; generated does not imply implemented or conformant. [DEFINITIONS.md §CAV2-D65 DomainSpec-Governed Construction Invariant] |

## Machine-canonical / generated-human conflict map

- `TARSKI-4` — **contradicted / knowledge-backed:** the user-selected Lab posture requires a machine-canonical artifact with generated human projection, but the existing Product Thesis type says the Markdown carrier is canonical and JSON is its projection. This is a real source-direction conflict, not a cosmetic format preference. [strategy-inventory-packet.json §T1-machine-source-posture; PRODUCT-THESIS-DOCUMENT-TYPE.md §Carrier And Machine Record]
- `TARSKI-5` — **observed / knowledge-backed:** D21 requires both human-continuation and machine-checkable facets, but does not prescribe which is canonical; it permits missing facets only as typed residue. Thus D21 supports either direction only when the direction is explicit and checkable. [DEFINITIONS.md §CAV2-D21 Four-Facet Action Method]
- `TARSKI-6` — **observed / knowledge-backed:** “canonical artifact” does not mean “canonical source.” It means a typed instance with an owner-admitted process-origin declaration and is decoupled from authority. Reusing this term for file-source direction would create semantic collision. [DEFINITIONS.md §CAV2-D51 Canonical Artifact §Boundary]
- `TARSKI-7` — **derived / concept-claim:** a Lab machine-first policy must declare a distinct source-direction field, rather than overload `canonical`, authority state, durability, or origin assurance. Those axes are independently variable under D29/D16. [DEFINITIONS.md §CAV2-D16 Typed Coupling Invariant, §CAV2-D29 Axis Orthogonality Invariant]
- `TARSKI-8` — **observed:** no cited Lab generator proves `artifact.json → ARTIFACT.md`, and no cited Lab validator rejects projection drift or human hand-edits. The desired rule is therefore unimplemented and unadmitted. [strategy-inventory-packet.json §open_gaps]

## Artifact-centered Tournament track

`TARSKI-9` — **derived / concept-claim:** the smallest coherent candidate is an **artifact package protocol**, not a new `GovernedArtifact` primitive.

Its minimum package is:

```text
ArtifactType (separate, enumerated/owned type declaration)
  -> ArtifactInstance (one machine-canonical record)
       -> schema_ref + exact origin + owner route + lifecycle axes
       -> generated HumanProjection
       -> validator / drift receipt / negative-test receipt
       -> residue and challenge route
  -> optional typed relations to other instances
```

This recomposes cleanly:

- Type answers “what sort of artifact is this?” and supplies its permitted shape, default durability, authority-kind rollup, and allowed producers.
- Instance answers “which exact artifact, from which exact producer/process, with which owner and state?”
- Projection answers “how can a human inspect the same instance?” and is derived from, never superior to, the machine record.
- Receipt answers “what exact checks ran against which bytes?” and remains evidence rather than authority.
- Owner decision, if later needed, stays a distinct authority artifact rather than a field that the package can self-promote.

`TARSKI-10` — **observed / knowledge-backed:** this follows the existing distinction between canonical-kind enumeration and canonical instance; it does not add a novel authority kind or a new governed-object primitive. [DEFINITIONS.md §CAV2-D51 Canonical Artifact; AUTHORITY-MODEL.md §Authority Kinds; governed-artifact-primitive-formalization/findings.md §Collapse And Kill Decisions, §Surviving Candidate]

`TARSKI-11` — **derived / concept-claim:** a package instance becomes recursive only when it explicitly names altitude, parent/child ownership, carried residue, recomposition path, and stop condition. Copying the same directory shape at each level fails the recursion test. [DEFINITIONS.md §CAV2-D30 Bounded Recursive Self-Application, §CAV2-D64 Recursive Instance Ownership Invariant; strategy-inventory-packet.json §T4-recursion-versus-copying]

## Distill trace — Tournament, artifact-centered track

- **Objective/output:** falsifiable candidate package protocol for Lab artifact types and instances; not an architecture selection.
- **Budget:** Tournament context; this explorer completed one artifact-centered track and leaves comparison against the bounded-cell and shared-kernel tracks to the join.
- **Proposer claim:** an `artifact.json`-style machine record plus a generated human view is the minimum package that can join type, instance, source direction, origin, lifecycle, residue, and evidence without making the package itself an authority kind.
- **Balancer objection — semantic collision:** `canonical artifact` is already an instance/origin predicate, not canonical-source direction. **Reconciliation:** keep “machine-canonical” as an explicit source-direction relation, not a renamed D51 field.
- **Balancer objection — hidden authority:** a receipt or type registry might self-promote the artifact. **Reconciliation:** retain owner decision/promotion as a separate edge and enforce default-deny for unenumerated authority kinds.
- **Balancer objection — premature generality:** a universal artifact metamodel could repeat the rejected governed-artifact primitive. **Reconciliation:** constrain the candidate to the minimal protocol and use existing D21/D51/D52/D16/D29 roles.
- **Always-on checks:** abstraction-level guard **pass**; recomposition proof **pass**; evolution profile **flag** (future variants and producer sets are plausible but unselected); frame-expiry **flag**; navigation **pass**.
- **Triggered checks:** cognitive-load **triggered** (many axes); requisite-variety **triggered** (different owners/lifecycles); boundary-object **triggered** (machine record/human view bridge); concept-vs-knowledge **triggered** (candidate is concept-claim); premortem **triggered**; set tournament **partial** (two tracks remain independently assessed).
- **Verdict:** **flag**. The protocol is coherent, but no Lab artifact-type metamodel, source-direction manifest, generator, validator, or owner-selected architecture exists. [strategy-inventory-packet.json §open_gaps, §tournament_seed]

### Elimination conditions

Reject the artifact-centered candidate if any of these is evidenced:

1. A required field cannot be placed on type, instance, projection, receipt, or typed relation without inventing hidden glue.
2. Source-direction determinism cannot be proven from the machine record to the human projection, including drift and hand-edit negative tests.
3. A package must self-authorize promotion, admission, or implementation to be useful.
4. The same purpose is already completely supplied by a selected owner-local Context cell or shared kernel with lower coupling/cognitive cost.
5. Recursive instances cannot declare altitude, ownership, recomposition, and stopping conditions.
6. The proposal requires a new authority kind or a new governed-artifact primitive despite the existing kind/instance/projection/evidence separation.
7. The type/instance division collapses authority, lifecycle, durability, origin assurance, or source direction contrary to D16/D29.

### Explicit residue

- No admitted Lab type registry, package schema, generator, drift validator, negative-test suite, or source-direction manifest.
- No selected answer on whether Product/Governance are bounded contexts, modules, products, or orthogonal roles.
- No owner decision selecting an artifact-centered architecture or admitting any v2 source bytes.
- The detailed Distill technique reference named by the generated skill was unavailable inside its generated package; the checks above use the loaded skill’s stated contracts only.
- Evidence emission and telemetry: **not configured**; no run-local artifact was created.

Dissent: the bounded-context recursive-cell explorer will reasonably argue that owner-local lifecycle packages produce better locality than a cross-cutting artifact protocol; the shared-kernel-plus-context-instances explorer will reasonably argue that this candidate still centralizes too much schema/projection machinery. My strongest reply is conditional: either criticism eliminates this track if it demonstrates lower coupling while preserving exact source direction, typed ownership, recursion closure, and deterministic projection checks.

## Agent 2

Agent: Ashby, W. Ross
Role: explorer
Angle: Product/Governance bounded-context evidence inventory and bounded-context recursive-cell Tournament track.

## Evidence-backed inventory

- **ASHBY-1 — observed:** `CAV2-D66 Context` is a durable work-frame identity, not a DDD Bounded Context. It anchors exactly one Product and optionally one Project/Goal, may reference zero or more DDD bounded contexts, and remains distinct from language, source selection, View, authority, or permission.
  Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D66 Context`; `cyberAlchemy-v2/context/README.md#Context`; `cyberAlchemy-v2/context/README.md#Claim Ceiling`.

- **ASHBY-2 — observed:** Governance has direct bounded-context evidence: the Governance ubiquitous-language record declares `CA2-BC-GOVERNANCE`, names its scope/exclusions, communities, usage surfaces, and distinct owner routes. This supports “Governance as a candidate DDD bounded context,” but not runtime activation, admission, or a claim that every governance folder belongs to it.
  Source: `cyberAlchemy-v2/language/languages/governance-ubiquitous-language.json#/bounded_context`; `...#/communities`; `...#/usage_surfaces`; `...#/conflict_policy`.

- **ASHBY-3 — observed:** Governance is also a module/package, independently of any bounded-context disposition. Its `module.json` declares two independently validated ontologies—`cav2.governance-model` and `governance.product`—under a host-context link, with selector-level autonomy and no whole-product-ontology dependency. Its README explicitly calls this “structural autonomy,” not extraction or release.
  Source: `cyberAlchemy-v2/ontology/governance/README.md#Module Boundary`; `cyberAlchemy-v2/ontology/governance/README.md#Package Files`.

- **ASHBY-4 — observed:** Product is presently an ontology/package and a product-direction surface. The ontology README says JSON registries are machine-readable source for that ontology package; the product thesis document has a Markdown canonical carrier with a JSON projection. The two source-direction models are therefore artifact-specific, not a single directory-wide rule.
  Sources: `cyberAlchemy-v2/ontology/product/README.md#machine-readable package source`; `cyberAlchemy-v2/product/PRODUCT-THESIS-DOCUMENT-TYPE.md#Carrier And Machine Record`; `strategy-inventory-packet.json#/observed_tensions/0`.

- **ASHBY-5 — derived:** Product’s status as a DDD bounded context is **unverified**. The product ontology defines product meaning, capabilities, and a Governance Enforcement business capability, but neither selected Product source declares a Product bounded-context identity, local ubiquitous language, or context-map contract. Folder name, ontology ownership, and Product anchor are distinct axes and cannot substitute for those records.
  Sources: `cyberAlchemy-v2/ontology/product/README.md#Product Shape`; `cyberAlchemy-v2/ontology/product/README.md#Governance Enforcement Inside The Product`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D22 Orthogonal Classification`; `...#CAV2-D29 Axis Orthogonality Invariant`.

- **ASHBY-6 — observed:** Capability ownership supplies a better classifier than directory naming. A Product Capability belongs to one Product, has named owners, consumers, contracts, scope/exclusions, context policies, evidence, and challenge route; local capability instances remain with the module that owns their meaning/lifecycle, while a central ontology may only index/project them.
  Source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D67 Product Capability`.

- **ASHBY-7 — observed:** A Project is the typed coordination anchor, not an authority envelope. For a parent model/local instance relationship it carries bindings, goals, owners, evidence, and challenge route, but membership and file placement do not create semantic, adoption, or execution authority.
  Source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64 Recursive Instance Ownership Invariant`.

- **ASHBY-8 — observed:** Construction is a separate axis from bounded-context identity. D65 requires the exact chain `definitions -> product ontology -> capability-local business ontology -> DomainSpec source -> deterministic compiled graph/system ontology -> exact implementation binding -> conformance/runtime evidence`; valid predecessors only make a successor eligible, never authorized or complete.
  Source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D65 DomainSpec-Governed Construction Invariant`; `cyberAlchemy-v2/ontology/governance/README.md#Core Model`.

- **ASHBY-9 — observed:** Governance’s current ontology entries are candidate, non-effectful model/evidence surfaces. They map DomainSpec meta-types and register D64/D65 candidate rules, but explicitly do not prove a binding, adoption, runtime enforcement, implementation, or Product conformance.
  Sources: `cyberAlchemy-v2/ontology/governance/README.md#Core Model`; `...#DomainSpec v2 Meta-Types`; `strategy-inventory-packet.json#/claim_ceiling`.

## Folder classification

| Surface | Evidence-backed classification | Not established |
|---|---|---|
| `cyberAlchemy-v2/context/` | CAV2 Context business package; candidate instances | DDD bounded context |
| `cyberAlchemy-v2/ontology/governance/` | Governance module containing authority-governance and Governance business-product ontology packages | that module path alone selects a bounded context |
| Governance UL record | candidate DDD bounded-context record, `CA2-BC-GOVERNANCE` | accepted runtime/enforcement context |
| `cyberAlchemy-v2/ontology/product/` | Product ontology package / machine-readable ontology source | Product bounded context |
| `cyberAlchemy-v2/product/` | product-direction documents; thesis carrier/projection pair | product bounded context or canonical source direction for all artifacts |
| `cyberAlchemy-v2/goals/` | Project/Goal coordination and binding locus, per D64/D65 | semantic authority owner merely by placement |
| `CyberAlchemy-lab/` | clean-history repository location/foundation | any admitted semantic context, authority, or architecture |

Sources: `cyberAlchemy-v2/context/README.md#Claim Ceiling`; `cyberAlchemy-v2/ontology/governance/README.md#Module Boundary`; `cyberAlchemy-v2/ontology/product/README.md#machine-readable package source`; `cyberAlchemy-v2/product/PRODUCT-THESIS-DOCUMENT-TYPE.md#Carrier And Machine Record`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64 Recursive Instance Ownership Invariant`; `/home/vrondelli/projects/CyberAlchemy-lab/README.md#Foundation boundary`; `/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0001-repository-foundation.md#Explicitly unauthorized effects`.

## Tournament track: bounded-context recursive cell

- **ASHBY-10 — derived:** Minimum local cell form is a single owner-qualified capability instance, not a copied repository tree:

```text
Cell =
  product_ref
  + candidate bounded_context_ref (only if local language/scope/owner exist)
  + capability_ref
  + Project + one Goal
  + local business ontology
  + exact parent-model/instance binding
  + D65 construction binding
  + explicit input/output context-map contracts
  + residue / stop / handoff
```

This carries D21’s taxonomy, schema, human-continuation, machine-checkable facets; missing facets must be typed residue rather than silently omitted.
Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D21 Four-Facet Action Method`; `...#CAV2-D64 Recursive Instance Ownership Invariant`; `...#CAV2-D65 DomainSpec-Governed Construction Invariant`.

- **ASHBY-11 — derived:** Shared authority should be limited to the parent Product/capability contract, canonical definitions, exact inherited contract/version, and separately owner-decided adoption. Local authority should be the instance’s business meaning, extension scope, state, evidence, lifecycle, and local construction chain. The Project coordinates the relationship but owns neither semantic lane by implication.
  Source: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64 Recursive Instance Ownership Invariant`.

- **ASHBY-12 — derived:** A context-map contract must be explicit and directional: source/target bounded-context references, each language’s scope and exclusions, input/output contract refs, translation/anti-corruption responsibility where meanings differ, owner routes, exact source epoch/digests, challenge/drift routes, and effect ceiling. A shared label is insufficient; the Governance language conflict policy specifically forbids inferring equivalence from identical labels.
  Sources: `cyberAlchemy-v2/language/languages/governance-ubiquitous-language.json#/conflict_policy`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D16 Typed Coupling Invariant`; `...#CAV2-D67 Product Capability`.

- **ASHBY-13 — derived:** Recursion altitude is typed parent-to-instance progression, not nested folders: `h0` shared product/capability contract; `h1` local capability-instance cell; `h2+` only when that instance becomes a parent and a fresh complete D64 binding declares higher altitude. Each move must state source/target artifacts, owner, gate, carried residue, recomposition path, budget/stop, and terminal handoff.
  Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D30 Bounded Recursive Self-Application`; `...#CAV2-D64 Recursive Instance Ownership Invariant`.

- **ASHBY-14 — derived:** Recomposition is a typed upstream candidate route, never automatic merge: local evidence or an extension proposal returns through `recomposition_route`; parent meaning changes only through the named parent owner and adoption/promotion path. A local conformance result neither transfers authority nor promotes the instance into the parent.
  Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64 Recursive Instance Ownership Invariant`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md#Non-Collapse Rules`.

- **ASHBY-15 — derived:** The stopping rule is fail-closed at the first missing/disputed binding element or stale predecessor: no exact parent version, owner claims, inherited contract, adoption decision, extension scope, conformance relation, recomposition route, recursion budget/stop, or D65 predecessor means residue/blocker, not an implicit cell. Stop also when the cell’s Goal is complete, declared recursion budget is exhausted, or the named terminal owner/handoff is reached.
  Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D30 Bounded Recursive Self-Application`; `...#CAV2-D64 Recursive Instance Ownership Invariant`; `...#CAV2-D65 DomainSpec-Governed Construction Invariant`.

## Distill checks and elimination conditions

- **ASHBY-16 — derived:** Preserve separate axes: semantic context/language, module/package topology, authority kind, Product/Project/Goal anchoring, lifecycle, construction stage, evidence, and repository location. Eliminate a candidate if it uses any one as shorthand for another without a typed coupling.
  Sources: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D22 Orthogonal Classification`; `...#CAV2-D29 Axis Orthogonality Invariant`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md#Non-Collapse Rules`.

- **ASHBY-17 — derived:** Eliminate a recursive-cell proposal if it duplicates the whole kernel inside every cell, lacks a locally owned capability outcome, cannot name a local language/semantic boundary, or cannot recompose without hidden glue. These fail minimum form, local ownership, bounded recursion, or deterministic recomposition.
  Sources: `strategy-inventory-packet.json#/tournament_seed/comparison_criteria`; `strategy-inventory-packet.json#/observed_tensions/3`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D30 Bounded Recursive Self-Application`.

- **ASHBY-18 — derived:** Eliminate a candidate if it calls Product or Governance a bounded context solely because a directory exists, a module is autonomous, a Product anchors a Context, or a Governance product capability exists. Governance has candidate language-boundary evidence; Product presently does not in the selected source set.
  Sources: `strategy-inventory-packet.json#/observed_tensions/2`; `cyberAlchemy-v2/language/languages/governance-ubiquitous-language.json#/bounded_context`; `cyberAlchemy-v2/ontology/governance/README.md#Module Boundary`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D66 Context`.

- **ASHBY-19 — observed:** CyberAlchemy-lab is not eligible for source admission, architecture selection, or a stable-release claim from this research. Its foundation explicitly has no imported authority/runtime/generated material; its next gate is an accepted minimal product slice and source-admission contract.
  Sources: `/home/vrondelli/projects/CyberAlchemy-lab/README.md#Foundation boundary`; `/home/vrondelli/projects/CyberAlchemy-lab/README.md#Next gate`; `/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0001-repository-foundation.md#Remaining gates`.

## Explicit residue

- **unverified:** Product DDD bounded-context identity, product ubiquitous language, and Product↔Governance context-map contract.
- **unverified:** Any admitted recursive bounded-context package protocol, local-cell schema, generator, or validator.
- **unverified:** A complete D64 instance binding, D48 adoption decision, conformance witness, and recursive terminal handoff.
- **unverified:** D65 `ConstructionBinding` implementation/transition validator and capability realization evidence.
- **observed:** Lab has no admitted artifact metamodel, artifact source-direction manifest, deterministic human-projection generator, or source-admission decision.
  Source: `strategy-inventory-packet.json#/open_gaps`.

Dissent: The strongest expected disagreement from a Product-focused explorer is that the committed Product ontology and its capability language are already sufficient to call Product a bounded context; my response is that selected evidence lacks an explicit bounded-context identity, local ubiquitous language, and map contract. The strongest expected disagreement from a Governance-focused explorer is that `CA2-BC-GOVERNANCE` establishes Governance as selected; my response is that the record is candidate/review-only and does not turn every Governance module/package or enforcement surface into one accepted context.

## Agent 3

# Agent: Simon, Herbert
# Role: explorer
# Angle: enforcement and realization surfaces for a machine-canonical Lab artifact protocol, with a minimal shared kernel and owner-local Context instances

## Inventory result

- **SIMON-1 — observed:** CyberAlchemy-v2 already distinguishes source, generated projection, evidence, and authority, but does not supply an admitted universal “governed artifact” primitive. The earlier formalization rejects that primitive because its obligations decompose into existing lifecycle/envelope concepts; artifact tree and branch views are navigation aids, not authority sources.
  Citation: `cyberAlchemy-v2/development/research/2026-06-23-governed-artifact-primitive-formalization/findings.md#The-non-vacuity-gate-blocks-governed-artifact-as-a-new-primitive`; `.arcanum/inventory/entries/arcanum-framework-artifact-governance.md#Arcanum-framework-artifact-governance`

- **SIMON-2 — observed:** The strongest reusable protocol precedent is the four-facet action method: classification, schema, human-continuation view, and machine-checkable view; a missing facet must become typed residue with owner and effect. This supports `artifact.json` plus generated `ARTIFACT.md` without making either file an authority kind.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D21:-Four-Facet-Action-Method`

- **SIMON-3 — observed:** Existing ontology packages repeat a meaningful package mechanism: machine-readable registries/source bindings, closed schemas, deterministic validators, and append-only receipts. Product explicitly names `sources.json`, schemas, validator, and receipts; Governance names the same class of surfaces and retains selector-level dependencies. This is **two directly observed package-level repetitions**, sufficient evidence for a small reusable protocol seam, not for a shared semantic root.
  Citation: `cyberAlchemy-v2/ontology/product/README.md#Package-Files`; `cyberAlchemy-v2/ontology/governance/README.md#Package-Files`

- **SIMON-4 — observed:** Context is a stable work frame that may reference bounded contexts but is not itself a DDD Bounded Context; its validation and receipts remain separate from canonical definition authority. Therefore a Lab context instance can own local artifact meaning without turning every directory into a bounded context.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D66:-Context`; `cyberAlchemy-v2/context/README.md#First-Instances`; `cyberAlchemy-v2/context/README.md#Claim-Ceiling`

- **SIMON-5 — observed:** D65 supplies the realization chain but not a presently admitted implementation: canonical definitions → Product Capability → business ontology → DomainSpec authored source → deterministic compiled graph/system ontology → exact implementation binding → conformance evidence. Generated graph/ontology is not implementation; static conformance is not runtime proof.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D65:-DomainSpec-Governed-Construction-Invariant`; `cyberAlchemy-v2/ontology/governance/README.md#Core-Model`

- **SIMON-6 — observed:** Source admission is distinct from source discovery and from semantic transfer. An import candidate can preserve exact owner and provenance while remaining noncanonical; the clean Lab foundation explicitly admits no current CyberAlchemy-v2 material and requires later source/boundary classification.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#Authority-Import`; `/home/vrondelli/projects/CyberAlchemy-lab/README.md#Initial-Boundary`; `/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0001-repository-foundation.md#Decision`

- **SIMON-7 — observed:** Product Thesis is a contrary, owner-local source-direction example: `PRODUCT-THESIS.md` is its canonical carrier and JSON is its machine record. It proves that Lab must declare source direction per artifact type; it does not defeat the user-selected Lab posture of machine-canonical source.
  Citation: `cyberAlchemy-v2/product/PRODUCT-THESIS-DOCUMENT-TYPE.md#Carrier-And-Machine-Record`; `cyberAlchemy-v2/development/research/2026-08-31-cyberalchemy-lab-context-artifact-architecture/strategy-inventory-packet.json#T1-machine-source-posture`

## Minimal shared-kernel plus owner-local Context-instance track

**SIMON-8 — derived:** The smallest coherent shared unit is an **artifact protocol kernel**, not a universal Lab artifact ontology or shared semantic registry.

| Shared kernel mechanics | Owner-local Context-instance meaning |
|---|---|
| `artifact.json` source-direction rule | artifact type semantics and vocabulary |
| schema-binding declaration and validator interface | semantic owner and decision route |
| generator identity/version and deterministic projection rule | local lifecycle interpretation |
| projection fingerprint/drift comparison | local evidence and conformance criteria |
| source-admission reference shape | whether/when a source is admitted |
| typed cross-context relation shape | relation meaning and recomposition policy |

This split preserves D22/D29: transport/projection mechanics may vary independently of semantic ownership. Any coupling between a shared schema, a local meaning owner, and an admission decision must be explicit under D16.
Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D16:-Typed-Coupling-Invariant`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D22:-Orthogonal-Classification`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D29:-Axis-Orthogonality-Invariant`

**SIMON-9 — derived:** The candidate exact protocol contract, sufficient to test coherence but not an implementation plan, is:

1. `artifact.json` is canonical for a Lab artifact type. It declares stable identity, `artifact_type`, owning `context_id`, `semantic_owner`, `schema_ref` plus exact schema digest, source-admission reference, lifecycle posture, projection generator identity/version, and typed outbound context relations.
2. `ARTIFACT.md` is a generated human-continuation projection only. It must expose identity, source posture, owner, schema, blockers/residue, evidence references, and relation endpoints; it cannot introduce semantic content absent from `artifact.json`.
3. Schema validation checks decidable shape only. It cannot confer admission, semantic truth, promotion, implementation conformance, or release authority.
4. Regeneration is deterministic: same canonical bytes plus same generator identity/version produce byte-identical `ARTIFACT.md`; its projection fingerprint is recorded or recomputed from those inputs.
5. Hand edits are rejected: validator regenerates in memory and rejects a checked-in projection differing from generated bytes, unless an explicit generator/source change is itself admitted through the owning route.
6. Source admission is separate: an `external_source` or `source_admission_ref` must name exact path/selector/digest, original owner, boundary classification, and owner decision. A source pointer is not admission.
7. Cross-context recomposition uses typed relation records naming both context endpoints, relation kind/direction, owner, evidence, and effect. Recomposition presents a graph/view; it never silently merges owner-local vocabularies or lifecycle decisions.

The contract is compatible with D21’s four facets and D64’s required explicit parent/instance relation, adoption posture, conformance, drift and recomposition routes.
Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D21:-Four-Facet-Action-Method`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D56:-Schema`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D64:-Recursive-Instance-Ownership-Invariant`

## Positive and negative witnesses

- **SIMON-10 — derived, positive witness:** Context `research-lab` owns an `evidence-note` artifact type. Its `artifact.json` validates against the kernel schema, names `research-lab` as semantic owner, generates matching `ARTIFACT.md`, and points to a CyberAlchemy-v2 selector/digest as an external source candidate. The artifact remains non-admitted until its named owner records an admission decision. This proves machine/human parity and provenance without semantic import.

- **SIMON-11 — derived, positive witness:** Context `construction-lab` locally specializes an artifact type with a D65 binding. It adds a typed relation to a `research-lab` artifact, preserving both owners and declaring recomposition as “evidence supports construction review.” It may show the D65 chain, but must still mark missing implementation binding or runtime evidence as `not_evaluable`.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D65:-DomainSpec-Governed-Construction-Invariant`

- **SIMON-12 — derived, negative witness:** A user edits `ARTIFACT.md` to add an acceptance claim not in `artifact.json`. Regeneration comparison fails; the human projection is rejected. The correct repair is canonical-source change plus the relevant owner review, not synchronizing Markdown back into JSON.

- **SIMON-13 — derived, negative witness:** A Context copies a CyberAlchemy-v2 definition into `artifact.json`, labels it “admitted,” and passes schema validation. This must fail source-admission validation because a schema pass proves shape only and neither copying nor validation transfers original semantic authority.
  Citation: `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D56:-Schema`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#Authority-Import`

- **SIMON-14 — derived, negative witness:** The kernel defines `Product` and `Governance` as mandatory Context instance types. Eliminate this variant: it collapses directory/navigation taxonomy into bounded-context identity despite the packet’s explicit unresolved classification and D66’s distinction.

## Distill checks

- **SIMON-15 — derived:**
  - Abstraction-level guard: pass. The kernel is protocol/mechanics; Context instances own meaning.
  - Closure: flag. The protocol closes its source/projection/schema/drift/recomposition responsibilities, but not an admitted Lab artifact metamodel.
  - Recompositon proof: pass conditionally. Typed context relations are the only required glue; hidden shared semantic registries are forbidden.
  - Evolution profile: concrete pressure exists—multiple artifact types and contexts—but the extension boundary is one versioned protocol/schema family, not generalized ontology inheritance.
  - Cognitive-load check: pass relative to recursive-cell duplication; one repeated envelope is replaced by a small common contract.
  - Requisite-variety check: flag. Local types, policies, and evidence remain varied because the packet has not selected a universal Lab type system.
  - Boundary-object check: pass. `artifact.json` is the cross-role boundary object; `ARTIFACT.md` is a noncanonical human projection.
  - Premortem: likely failure is kernel creep into shared semantic ownership; guardrail is rejecting any kernel field that classifies local meaning rather than identifies its owner/schema/relation.
  - Frame-expiry: invalidate this optimization point if a selected Lab source-admission policy proves that all contexts must share one canonical vocabulary or one owner-controlled lifecycle.

## Elimination conditions

- **SIMON-16 — derived:** Eliminate the minimal-kernel track if any of these is demonstrated:

  1. A real cross-context use requires the kernel to decide local semantic meaning, not merely carry its owner and typed relation.
  2. Deterministic projection cannot be obtained from canonical source plus declared generator identity/version.
  3. A legitimate hand-authored human field is required to govern downstream work and cannot be represented canonically.
  4. Recomposition needs unnamed glue, inferred ownership, or directory adjacency rather than typed relations.
  5. A selected source-admission policy makes the external-owner/source-digest contract insufficient.
  6. A D65 construction binding cannot name its exact local semantic predecessor and implementation/evidence owners.

## Assumptions and residue

- **SIMON-17 — unverified:** No Lab schema, generator, validator, receipt format, hand-edit test, or source-admission validator was inspected because none is named as existing in the packet; the packet itself records these as gaps.
- **SIMON-18 — unverified:** The two observed ontology package mechanisms are comparable enough to extract mechanics, but not evidence that their schemas, receipts, or validator APIs can be reused unchanged.
- **SIMON-19 — contradicted:** “Generated/projection material is canonical by readability or validation” is contradicted by the authority posture and schema boundaries.
- **Residue:** artifact-type taxonomy; accepted source-admission policy; the bounded-context/module/product status of Product and Governance; Lab-specific schema ownership; generator trust/version policy; exact receipt and negative-test shape; D65 conformance ownership.

## Verdict

**Flag, coherent Tournament candidate.** The shared kernel can make a Lab structure mechanically real while leaving semantic and authority ownership local. It is not selected architecture, source admission, implementation authority, or conformance evidence.

Dissent: The semantic-authority explorer will likely argue that even `artifact_type` in the kernel prematurely implies a shared taxonomy; the recursive-layout explorer will likely argue that Context-local cells need a fuller repeated envelope for navigability. My response is that the kernel need only transport an owner-local type identifier and declared schema, while repeated local envelopes remain permitted where their meaning is genuinely local.
