# Architecture Ontology Map

## What The Ontology Models

The ontology is a meta-model for describing and evaluating architecture. Its
primary objects are architecture element types, property definitions, relation
definitions, constraints, language projections, and observed fact projections.

It intentionally separates four layers:

| Layer | Example | Responsibility |
| --- | --- | --- |
| ontology | `callable.form` applies to `DomainConceptImplementation` and has an enumerated value type | define what a property means and where it is valid |
| profile | TypeScript Rules require `callable.form = arrow-function` | declare an expected architecture |
| observation | `LegacyLimitRule` has `callable.form = function-declaration` | supply typed example facts in the shape a future language adapter should emit |
| evaluation | expected arrow, observed declaration | emit an explainable finding |

This distinction makes the engine extensible. A new profile changes expected
properties without changing evaluator code. A new language projection defines
how properties should be observed without redefining the portable ontology.
The current facts are hand-authored examples; no source adapter ran here.

## Canonical DomainSpec Meta-Type Projection

`domain-meta-types.projection.json` is a digest-bound read model of the DS-D1
registry. It preserves 24 staged labels—13 active backend types, nine candidate
UI types, and two deferred UI types—plus the superseded `DS-D1.10 Saga`
tombstone. The projection has `authority_effect: none`; definitions-governance
continues to own identity and maturity.

Active coverage is total and explicit:

| Coverage state | Meta-types |
| --- | --- |
| reciprocal candidate alignment | Operation, Query, Rule, Interface, State Machine |
| profiled but missing a realization type | Calculation, Event |
| explicitly unsupported | Entity, Value Object, Enum, Policy, Workflow, Mapping |

`architecture.AdapterImplementation` is deliberately not mapped to
`DS-D1.24 Adapter`. The former is an architecture role; the latter is a
deferred DomainSpec merge candidate toward Mapping.

## Architecture Concept Hierarchy

```text
ArchitectureElement
├── DomainConceptImplementation
│   ├── RuleImplementation
│   ├── OperationImplementation
│   ├── QueryImplementation
│   ├── StateMachineImplementation
│   └── InterfaceImplementation
└── AdapterImplementation

ArchitectureProfile
Constraint
LanguageProjection
ObservationProjection
```

Inheritance is operational: a constraint applying to
`DomainConceptImplementation` is evaluated against Rule, Operation, Query,
State Machine, and Interface implementations.

## Property Families

| Family | Properties | What they let the package understand |
| --- | --- | --- |
| placement | `source.language`, `source.path`, `source.filename_case` | where and under which language convention an element lives |
| ownership/cardinality | `source.primary_concept_count`, `binding.concept_id`, `binding.current` | whether one source unit realizes exactly one current semantic concept |
| source shape | `symbol.primary_callable_count`, `symbol.public_callable_count`, `callable.form` | entry-point and export/public form |
| behavior classification | `callable.return_semantics` | boolean guard, state change, read model, value, or unit contract |
| composability | `callable.helper_policy` | whether helpers are forbidden, private, or separated |
| topology | `dependency.resolution`, `dependency.direction` | exact target/directness and layer direction of a dependency |
| state model | `state.representation`, `state.exhaustive`, `transition.negative_fixture_present` | static state representation versus runtime negative coverage |
| integration | `interface.versioned` | whether an interface realization binds an explicit contract version |

Every property defines its value type, applicable node or relation types,
semantics, observation stage, owner route, and forbidden inference.

## Relations

| Relation | Direction | Important property/boundary |
| --- | --- | --- |
| `architecture.depends_on` | architecture element -> architecture element | carries resolution and direction; acyclic in this experiment |
| `architecture.guards` | Rule implementation -> Operation or State Machine implementation | must not be confused with a canonical DomainSpec edge without semantic refs |
| `architecture.exposes` | Interface implementation -> Operation or Query implementation | endpoint topology is not semantic admission |
| `architecture.implements_interface` | Adapter -> Interface implementation | declaration is not runtime correctness |

The distinction between `guards` and `depends_on` matters. Semantically a Rule
guards an Operation; structurally an Operation usually imports or depends on
the Rule. The ontology can represent both directions without conflating them.

## CAV2 Pattern Use

CAV2 supplies the modeling contract, not the implementation properties:

- every concept records identity, role, source, owner, status, confidence,
  challenge contract, and forbidden collapse;
- every relation records endpoints, direction, evidence, authority effect,
  value effect, cycle policy, and forbidden collapse;
- each language fact graph is a projection with allowed use, blocked use,
  drift owner, and review trigger.

The concrete properties—such as arrow functions, filename case, or direct
imports—come from the architecture profile and language-realization design.
