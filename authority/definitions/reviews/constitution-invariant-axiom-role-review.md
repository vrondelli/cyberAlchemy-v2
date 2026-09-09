# Constitution, Invariant, And Axiom Role Review

Status: active review
Owner: definitions-governance
Target terms: constitution, invariant, axiom
Canonical definitions: [../DEFINITIONS.md](../DEFINITIONS.md)
Tower map: [../DEFINITION-TOWERS.md](../DEFINITION-TOWERS.md)

## Authority Rule

This review clarifies candidate role boundaries before CyberAlchemy v2 defines
or promotes these terms. It is not canonical definition authority. Any promoted
term still needs a definitions-governance update to
[../DEFINITIONS.md](../DEFINITIONS.md), index synchronization, and drift audit.

## User Seed

Initial intuition:

```text
invariant is the source for axiom and constitution
constitution is for structure
axiom is for action
```

Review result: mostly right, with one adjustment. Invariant is the best source
or constraint layer. Axiom is the admitted load-bearing principle that explains
why action or governance must be constrained. Constitution is the scoped,
enforceable ruleset that turns axioms and invariants into artifact, structure,
form, process, or validation rules. So constitution is not only static
structure; it also governs process and form when those are part of the artifact
contract.

## Reference Findings

| Source | What it says | Implication for CAV2 |
| --- | --- | --- |
| [constitution-governance skill](../../../../arcanum/arcana/constitution-governance/SKILL.md) | Constitutions are modular, scoped rule artifacts with selectors, rules, validation modes, examples, non-examples, composition precedence, and promotion boundaries. | Constitution should be defined as an enforceable scoped rule surface, not as a broad philosophy note. |
| [Arcanum manual](../../../../arcanum/development/user-guide/ARCANUM-MANUAL.md) | A constitution is a modular scoped ruleset governing artifact structure and form; it composes narrowest-scope-first and each rule declares a validation mode. | Public Arcanum already gives CAV2 a compact constitution meaning. |
| [Stable Repository Constitution](../../constitutions/STABLE-REPOSITORY-CONSTITUTION.md) | CAV2 constitution rules govern source-ledgered consolidation, authority separation, non-promotion, public/private boundary, generated projection traceability, import before promotion, entropy register declaration, and value-cycle edge guard. | CAV2 constitutions can govern repository structure, authority behavior, process, and proof obligations. |
| [Constitution Import Pack](../../constitutions/CONSTITUTION-IMPORT-PACK.md) | Constitution and axiom candidates are imported together, but private DomainSpec axioms are classified as candidate semantics and invariants while constitutions are reusable rule patterns. | CAV2 already treats axiom and constitution as adjacent but different authority imports. |
| [Constitution Import Manifest](../../imports/constitutions/MANIFEST.md) | The import ledger stages constitution, axiom, quality-bar, and anti-pattern sources before local promotion. | CAV2 needs role distinctions before importing or promoting the next batch. |
| [Ontology lifecycle source pack](../../../../arcanum/arcana/ontology-vault/development/cyberalchemy-ontology-lifecycle/SOURCE-PACK.md) | Working model: `axiom = behavior invariant or load-bearing principle`; `constitution = enforceable form/model/structure/process governance that preserves axioms, transformations, and review gates`. | This is the closest existing direct answer and should seed the CAV2 candidate wording. |
| [DomainSpec AXIOMS.md](../../../../implementation/domainspec/AXIOMS.md) | Each axiom states an epistemic foundation, records harm when absent, and names which constitution clauses it governs. | Axiom can be a principle layer between invariant evidence and constitutional rules. Private source; use as evidence only. |
| [DomainSpec CONSTITUTION.md](../../../../implementation/domainspec/CONSTITUTION.md) | Constitution rules map `Rule ID -> Rule Statement -> L4 Axiom -> L6 Gate`, then derive enforcement chains. | Constitution operationalizes axioms into enforceable rules and gates. Private source; use as evidence only. |
| [Framework-unification concept map](../../../../projects/framework-unification/CONCEPT-MAP.md) | Invariants are load-bearing rules a validator or human gate checks; drift is an invariant violated. | Invariant should mean "what must stay true" rather than "the document that enforces it." |
| [CAV2-D16](../DEFINITIONS.md#cav2-d16-typed-coupling-invariant), [CAV2-D29](../DEFINITIONS.md#cav2-d29-axis-orthogonality-invariant), and [CAV2-D38](../DEFINITIONS.md#cav2-d38-claim-proof-bound) | CAV2 already promotes specific invariants as rules or epistemic constraints with operational interpretation and boundaries. | CAV2 has invariant instances but not yet a generic definition of invariant. |

## Provisional CAV2 Distinction

| Term | Provisional role | Governs by | Typical contents | Not this |
| --- | --- | --- | --- | --- |
| invariant | Constraint or property that must remain true across a decision, transformation, artifact, graph, process, or claim. | Truth/constraint pressure; validator or gate when available. | statement, scope, variables/objects, condition, violation meaning, evidence or proof, validation route. | Not automatically an axiom, constitution, theorem, or validator. |
| axiom | Admitted load-bearing principle that explains why a rule family, action boundary, or governance move is necessary. | Foundational commitment; derivation pressure for constitutions and gates. | statement, harm when absent, source basis, governed rules, action implication, boundary. | Not merely any invariant; not directly an implementation rule unless a constitution/gate operationalizes it. |
| constitution | Scoped enforceable ruleset that applies principles and constraints to artifact structure, form, process, validation, or authority behavior. | Rules, selectors, validation modes, examples, non-examples, composition, promotion boundary. | scope, owner, authority level, selectors, rules, validation mode, precedence, conflicts, validators, promotion/retirement rules. | Not a glossary, not a single axiom, not a hidden validator, not a universal catch-all. |

## Relation Model

Candidate relation:

```text
invariant -> axiom -> constitution rule -> validator/gate -> artifact behavior
```

Interpretation:

1. An invariant says what must remain true or what violation counts as drift.
2. An axiom admits a load-bearing principle, often because violating the
   invariant or missing the principle has caused harm.
3. A constitution rule operationalizes the axiom or invariant for a scope.
4. A validator or gate enforces, reviews, or blocks movement under the rule.
5. Evidence and residue feed back into whether the invariant, axiom, or
   constitution still holds.

This chain is a default pattern, not a law. Some constitutions may encode an
invariant directly. Some axioms may be research-local and never become
constitutional. Some invariants may remain mathematical or diagnostic rather
than governance authority.

## Candidate Voice Sketches

### Invariant

Scientific/formal sketch: an invariant is a declared condition `I(x)` over a
bounded object, relation, process, or claim context that must remain true across
specified transformations or decisions. If `I(x)` fails, the result is drift,
residue, invalidity, or a gate condition according to the declared scope.

Plain-language sketch: an invariant is the thing that must keep holding while
the work changes.

Domain-context sketch: in CyberAlchemy v2, specific invariants already exist as
`CAV2-D16`, `CAV2-D29`, `CAV2-D30`, and `CAV2-D38`. A generic invariant
definition would explain how these constraints can seed axioms, constitutions,
validators, and gates without collapsing them into the same artifact type.

Boundary sketch: invariant is not a constitution, not proof by itself, not a
validator, and not always an axiom. It becomes governance authority only through
the relevant owner route.

### Axiom

Scientific/formal sketch: an axiom is an admitted load-bearing principle for a
declared scope, accepted as a foundation for reasoning, action boundaries,
constitution rules, or gates. In CAV2, a strong axiom candidate should state the
principle, evidence or harm basis, governed rule family, and challenge route.

Plain-language sketch: an axiom is the principle we decide to stand on because
the system breaks when we ignore it.

Domain-context sketch: in CAV2, DomainSpec gives the clearest evidence pattern:
each axiom states the foundation, names harm when absent, and maps to
constitution clauses and gates. CAV2 should not copy those private axioms as
public authority, but it can reuse the shape.

Boundary sketch: axiom is not any important sentence, not an implementation
task, not a constitution rule, and not a validator. It can ground action, but a
constitution or gate must say how the action is constrained.

### Constitution

Scientific/formal sketch: a constitution is a modular scoped ruleset
`C = (scope, owner, selectors, rules, validation_modes, precedence, examples,
non_examples, promotion_boundary)` that governs artifact structure, form,
process, validation, or authority behavior for a declared target.

Plain-language sketch: a constitution is the rule pack that says what shape the
work must have and how we check it.

Domain-context sketch: in CAV2, constitutions live under
[../../constitutions/](../../constitutions/) and currently govern stable
repository behavior, imported value-concept adoption, and constitution import
composition. CAV2 constitutions preserve boundaries between definitions,
ontology, inventory, specs, implementation, validation, and public/private
movement.

Boundary sketch: constitution is not a source glossary, not a proof, not a
single axiom, and not a giant context dump. It should stay modular,
selectable, and tied to validation or review modes.

## Recommended Promotion Path

Do not promote all three terms in one step.

Recommended order:

1. Promote generic `invariant` only if CAV2 needs a parent term above existing
   invariant instances such as `CAV2-D16`, `CAV2-D29`, `CAV2-D30`, and
   `CAV2-D38`.
2. Promote `axiom` next as the admitted-principle layer between invariant
   pressure and constitutional rule families.
3. Promote `constitution` only after deciding whether CAV2 should adapt the
   public Arcanum definition or keep `constitution` as external Arcanum
   authority plus local constitution instances.

## Open Questions

1. Should generic `invariant` become a CAV2 parent definition, or are the
   specific invariant definitions enough?
2. Should `axiom` be defined as a source-local import class first, before
   becoming a CAV2 authority term?
3. Should CAV2 define `constitution`, or reference Arcanum's constitution
   governance definition and only define `CAV2 constitution` as a local subtype?
4. Should constitution rules be described as structure/form/process governance,
   or should CAV2 reserve "structure" for artifact shape and "process" for
   methods/gates?
