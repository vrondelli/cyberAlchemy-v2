# C02 meta-type and field-constructor obligation matrix

Date: 2026-09-20. Status: C02 bounded construction evidence.
Authority effect: none.

## Thirteen backend meta-types

The matrix covers the `application-v1` product model, not the historical
carrier's separate thirteen-type demonstration. Every row is authored through
the shared scanner, normalized into a distinct application-model role, lowered
to a distinct DomainSpec node kind, and accepted together by the current
DomainSpec project compiler.

| Meta-type | Authored declaration | Normalized application role | Lowered evidence |
| --- | --- | --- | --- |
| Entity | `entity Order` with explicit `identity` | `entity` data declaration | `Entity` with typed record and identity property |
| Value Object | `value-object Money` | `value-object` data declaration | `Value Object` with typed record and declared Rule invariant |
| Enum | `enum Status` | `enum` declaration with distinct variants | `Enum` with typed payload-free sum contract |
| Operation | `operation SubmitOrder` | typed input/output plus exact reads, writes, produces and requires references | `Operation` and operation-shape record |
| Query | `query FindOrders` | named inputs, Entity source, cardinality, declared Rule and bindings | `Query` and query-shape record |
| Calculation | `calculation Fee` | exact UInt64 inputs, result, expression and rounding | `Calculation` with `domainspec.typed-calculation/v2` |
| Rule | `rule EligibleOrder` bound to one FormalClaim | formal-condition consumer identity | `Rule` plus exact condition binding |
| Policy | `policy DispatchOrder` | typed inputs, ordered declared-Rule cases and explicit default target | `Policy` with distinct decisions/default and `applies` edges |
| Workflow | `workflow SubmitFlow` | admitted scope and two or more ordered Operation steps | `Workflow` with ordered steps and `orchestrates` edges |
| Interface | `interface OrderApi` | versioned boundary, named public contracts and explicit exposure | `Interface` with typed public contract |
| Event | `event OrderSubmitted` | occurrence identity/version/time policy distinct from payload | `Event` with exact occurrence and payload fields |
| Mapping | `mapping OrderToMoney` | named inputs, explicit target, totality and field paths | `Mapping` with typed field projection and `maps` edge |
| State Machine | `states OrderLifecycle` | explicit initial state and guarded/event-producing transitions | `State Machine` with distinct states/transitions and Event edge |

Policy and State Machine retain declared Rule references, but C03 still owns
complete FormalClaim argument binding and non-collapse evidence across every
formal consumer. Workflow scope is retained in source trace; C04 owns modules,
namespace composition and multiple entry points.

## Selected field constructors

| Constructor | Normalized form | Lowered distinction |
| --- | --- | --- |
| scalar | `String`, `Bool`, `UInt64` | `kind: scalar` with exact scalar name |
| explicit identity reference | `-> Order.id` | `kind: reference` with Entity selector and identity projection |
| optional | `optional<T>` | `kind: optional`; cardinality `optional` |
| list | `list<T>` | `kind: list`; cardinality `many` |
| set | `set<T>` | `kind: set`; cardinality `many-unique` |
| sum | `sum<Status>` | payload-free variants and ontology identities copied from the selected declared Enum |

`sum<T>` is deliberately bounded to one declared Enum whose variant names are
canonical. It is not a synonym for a record, an Entity snapshot, or an
untyped union. Nested constructors retain their tree shape; no cardinality or
identity reference is flattened during lowering.

## Hostile checks

The focused C02 suite rejects:

- a sum selecting an Entity rather than an Enum;
- an identity reference selecting a non-identity field;
- a Workflow step selecting a Calculation rather than an Operation;
- a Policy target selecting an Entity;
- a State Machine event reference selecting an Entity; and
- a Calculation expression using an undeclared input.

The same fixture is compiled by the real DomainSpec compiler and asserts 13
distinct graph node kinds. Adjacent application regressions pass 102 of 102,
including native source paths, exact currentness, Interfaces, Mappings,
Queries, realizations, integrations and whole-application formation.

## Claim ceiling

This is authoring/normalization/static-lowering closure. It does not establish
C03's complete formal-consumer semantics, C04's module or entry composition,
C05's 39-cell three-language parity, installed-package use, product approval,
publication, deployment or production behavior.

## Open Questions

C03 owns typed Rule argument binding for Policy and State Machine consumers.
C04 owns cross-file namespace and entry selection. Payload-bearing anonymous
sums are not selected by C02; the exact supported sum is the declared,
payload-free Enum-backed form above.
