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
The example fact graphs are hand-authored; no source adapter ran for those example instances. Separately, the
ontology now carries an exact read-model of the owner-admitted current implementation baseline.

## Canonical DomainSpec Meta-Type Projection

`domain-meta-types.projection.json` is a digest-bound read model of the DS-D1
registry. It preserves 24 staged labels—13 active backend types, nine candidate
UI types, and two deferred UI types—plus the superseded `DS-D1.10 Saga`
tombstone. The projection has `authority_effect: none`; definitions-governance
continues to own identity and maturity.

Active implementation coverage is total and exact:

| Coverage state | Meta-types |
| --- | --- |
| canonical baseline alignment | Entity, Value Object, Enum, Operation, Query, Calculation, Rule, Policy, Workflow, Interface, Event, Mapping, State Machine |
| admitted realization languages | TypeScript, Python, Rust |
| exact realization rows | 39 |
| generated-target conformance | admitted for bounded static generated artifacts in TypeScript, Python, and Rust |

The baseline state is bound to
[`domainspec-meta-types-current-implemented@3`](../../meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v3.json).
Its 39 rows identify exact source, provider, and binding digests. The previous “nine mapped, one profiled but
unmapped, three unsupported” account is retained only in the six historical example-instance candidates; it
does not describe current generic realization availability.

`architecture.AdapterImplementation` is deliberately not mapped to
`DS-D1.24 Adapter`. The former is an architecture role; the latter is a
deferred DomainSpec merge candidate toward Mapping.

The six existing domain example implementation instances remain `not-admitted`. The collective baseline
decision does not manufacture PromotionRecords for them. The ontology therefore reports the admitted generic
implementation baseline while preserving the separate example-instance lifecycle exactly.

## Current Instantiation Frontier

The ontology explicitly records the remaining product residue:

- durable Workflow Compensation dispatch and restart recovery;
- production-runtime observation beyond bounded static generated artifacts;
- the general machine-graph-to-obligation join;
- package publication and release.

For Operation, target observation must cover declared read, write, and effect sets; guards before mutation;
atomic state-and-outbox behavior; explicit failure continuation; no undeclared effects; and the Rule, Event,
and Workflow relationships governed by DS-D8. These obligations are enforced in the private generated-target
observer. That evidence is static and baseline-bound; it does not establish production runtime behavior.

## Architecture Concept Hierarchy

```text
ArchitectureElement
├── DomainConceptImplementation
│   ├── EnumImplementation
│   ├── RuleImplementation
│   ├── OperationImplementation
│   ├── QueryImplementation
│   ├── MappingImplementation
│   ├── EventImplementation
│   ├── StateMachineImplementation
│   ├── WorkflowImplementation
│   └── InterfaceImplementation
├── EnumRepresentationUnit
├── DataShapeContract
├── StateContract
├── WorkflowStepContract
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
| realization binding | `representation.protocol_id`, `runtime.provider_sha256` | which profile-selected protocol and exact provider bytes are being evaluated |
| ownership/cardinality | `source.primary_concept_count`, `binding.concept_id`, `binding.current` | whether one source unit realizes exactly one current semantic concept |
| source shape | `symbol.primary_callable_count`, `symbol.public_callable_count`, `callable.form` | entry-point and export/public form |
| behavior classification | `callable.return_semantics` | boolean guard, state change, read model, value, or unit contract |
| composability | `callable.helper_policy` | whether helpers are forbidden, private, or separated |
| topology | `dependency.resolution`, `dependency.direction` | exact target/directness and layer direction of a dependency |
| state model | `state.representation`, `state.exhaustive`, `transition.negative_fixture_present` | static state representation versus runtime negative coverage |
| integration | `interface.versioned` | whether an interface realization binds an explicit contract version |
| Mapping | `mapping.source_contract_ref`, `mapping.target_contract_ref`, `mapping.direction`, `mapping.correspondence_ref`, `mapping.totality`, `mapping.failure_contract_ref`, `mapping.effect_policy` | exact directional shape correspondence and its fallibility/effect perimeter |
| Interface | `interface.boundary_kind`, `interface.contract_identity`, `interface.exact_version`, `interface.compatibility_policy_ref`, `interface.exposure_set_ref` | exact versioned multi-member boundary rather than generic callable cardinality |
| Event | `event.tense`, payload/occurrence/checkpoint/publication/consumer properties | durable past-fact identity without distributed exactly-once inflation |
| Operation | input/read/write/external-effect/outcome/failure/atomicity/order/guard/Event/continuation properties | ordered state-change evidence through an explicit continuation closure |
| State Machine | closed/initial/terminal state refs, trigger/guard/effect-intent transition properties, invalid-transition policy, effect-execution boundary | a pure directed lifecycle decision that returns effects for an Operation to execute |
| Workflow | scope, exact step order, terminal outcomes, failure, continuation, step identity/policy/compensation | explicit orchestration without collapsing step order into State Machine transitions |

Every property defines its value type, applicable node or relation types,
semantics, observation stage, owner route, and forbidden inference.

## Relations

| Relation | Direction | Important property/boundary |
| --- | --- | --- |
| `architecture.composed_from` | Enum implementation or representation unit -> representation unit | carries acyclic implementation provenance without creating canonical Enum membership |
| `architecture.depends_on` | architecture element -> architecture element | carries resolution and direction; acyclic in this experiment |
| `architecture.guards` | Rule implementation -> Operation or State Machine implementation | must not be confused with a canonical DomainSpec edge without semantic refs |
| `architecture.exposes` | Interface implementation -> Operation or Query implementation | endpoint topology is not semantic admission |
| `architecture.maps_from` / `architecture.maps_to` | Mapping implementation -> exact DataShapeContract | native parameter/return types corroborate but do not author endpoints |
| `architecture.emits` | Operation implementation -> Event implementation | binds an exact Event, durable checkpoint, order, and outcome |
| `architecture.consumes` | architecture element -> Event implementation | subscription evidence cannot author consumer meaning |
| `architecture.implements_interface` | Adapter -> Interface implementation | declaration is not runtime correctness |
| `architecture.has_state` | State Machine implementation -> State contract | closes state membership without promoting supporting states into meta-types |
| `architecture.transitions_to` | State contract -> State contract | carries trigger, guard, and effect-intent refs; cycles are topology, not recursive value derivation |
| `architecture.orchestrates` | Workflow implementation -> Workflow step contract | call syntax cannot author membership |
| `architecture.precedes` | Workflow step contract -> Workflow step contract | acyclic semantic order is distinct from incidental trace order |
| `architecture.binds_step` | Workflow step contract -> Operation or nested Workflow | exact binding is descriptor-owned and acyclic |

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
