# I00 domain prerequisites

Status: complete for the bounded I00 construction slice. Authority effect: none.
Current completion: [I00 obligation accounting](I00-COMPLETION.md).
The public Interface/Mapping bridge and combined public-boundary fixture are
now implemented and natively checked. Earlier increment sections below retain
their historical descriptions of then-outstanding work; they are not current
scheduling instructions. Full meta-type breadth and integration remain later nodes.

Historical increments:
Current implemented increments: explicit Event occurrence formation and native
TypeScript construction; multi-input Mapping formation and native projection.
Operation Event effects are also bound and natively tested. Query authoring and
formation and Rule-filtered list/optional execution are implemented. The
combined keyed Query/Mapping/Operation/Event vertical is now verified. Distinct
public request/response contracts and their mappings remain outstanding.

## Event authoring

```alch
event OrderSubmitted:
  event-type order-submitted
  version 1
  occurrence-id eventId String
  occurred-at required
  orderId -> Order.id
  accepted optional<Bool>
```

The referenced Entity must explicitly declare its identity. `event-type` is a
canonical kebab-case identifier and `version` is a positive integer string.
`occurrence-id` declares a required single occurrence value, separately from
the payload. `occurred-at required` takes an explicitly supplied timestamp;
`occurred-at generated` requires an explicit clock when the constructor runs.
No timestamp, version or occurrence identifier is inferred by the compiler.

The existing scanner retains payload-only Event declarations for formation,
but lowering rejects missing occurrence metadata. An empty payload is allowed;
it does not remove the occurrence metadata requirements. Event metadata may
occur before or after fields, without becoming payload fields.

## Exact current backend projection

Alch `src/application-domain-lowering.ts` emits the existing DomainSpec Event
body: description, event type, version, occurrence field, time policy and
payload fields. It does not emit a record contract, factory validator, message,
publication binding or runtime receipt. Explicit Event ontology metadata stays
in the source trace because the current Event body does not own that field.

The bounded field projection supports `String`, `Bool`, their optional payload
forms, and explicit `-> Entity.identity` references (including an optional
payload reference). Reference field identity is checked by the authoring model
and the backend's declared Entity identity contract; no embedded Entity is
silently recast as an identity value.

Direct `UInt64`, embedded data values, collections and nested optionals have no
exact representation in the current primitive Event field contract and reject
with `APPLICATION_EVENT_FIELD_UNSUPPORTED`. In particular, unsigned values
cannot be silently narrowed to signed 64-bit integers. Full field-constructor
breadth remains a C02 obligation, not a completed capability. This increment
does not establish complete Event language coverage.

## Native evidence and discovered defect

`test/application-event.test.ts` in Alch runs the public DomainSpec compiler
and reconciled planner, compiles the actual generated TypeScript, and executes
both occurrence-time policies. It checks immutable results, exact max UInt64
reference identity, negative/overflow/malformed rejection, optional payload
absence, explicit clocks and the absence of clock effects on rejected input.

The first native run failed: DomainSpec's generated `eventUInt64` guard checked
only the upper bound and accepted negative `bigint` and numeric inputs. The
generator in `impl/cli/src/generation/configured-event-source.ts` now checks
both bounds. `impl/cli/test/generation/event-uint64-boundary.test.ts` directly
executes rendered code against negative, overflow, malformed and boundary
inputs. The Alch native test then passed against the rebuilt public backend.
This is an unsigned-boundary bug fix, not a change in the product's type policy.

## Remaining I00 obligations

- Bounded authoring/lowering of distinct public request/response contracts and
  their explicit mappings, using existing backend Interface/public-Mapping
  contracts rather than fabricated Entity/Value Object declarations.
- Extend the combined fixture with that public boundary before I00 closure.
  Actual persistence reference/lowering remains I02; API bindings remain I04.

Native Event data construction alone does not discharge publication, delivery
or application-commit obligations. The Operation increment below tests an
explicit in-memory transaction boundary, not a durable provider. I02/I03/I04
still await completion of I00.

Focused increment evidence: 11/11 Alch Event/domain/source tests and 1/1 direct
backend boundary test pass. Current checks and progress are recorded in
`EXECUTION-STATUS.md`; no historical L0 receipt was refreshed.

## Mapping authoring and native projection

```alch
mapping SelectOrder:
  input order Order
  input accepted Bool
  target Order
  total true
  field id <- order.id
  field accepted <- accepted
```

Inputs are named typed values. Multiple inputs allow a caller to supply an
already-calculated value; no calculation dependency or implicit invocation is
created by a Mapping. Each field arrow selects an input or a typed data-property
path. The target is an explicitly declared Entity or Value Object. A total
Mapping covers all target fields; `total false` explicitly permits partial
projection. Neither form constructs a validated Entity or runs its invariants.

The existing scanner and declaration normalizer emit a distinct Mapping role.
Lowering uses `domainspec.typed-mapping/v2`, translates property paths through
their exact ontology-property bindings, checks source/target type agreement,
and emits the existing canonical `maps` relationship to the authored target.
No source or input parameter is inferred. Calls, unknown inputs/fields,
duplicate bindings, normalized name collisions and implicit optional traversal
reject. Optional values may be copied with compatible types; defaults and
other expression forms are not yet implemented by this authoring slice.

`test/application-mapping.test.ts` checks exact contract and edge formation,
hostile authoring, total/partial coverage, and public-API generation followed by
native TypeScript execution. The native result preserves the max UInt64 value,
uses the explicitly supplied Boolean input rather than the input record's
Boolean field, leaves inputs unchanged and returns frozen projected data.
Missing, extra and malformed inputs reject. The descriptor retains
`pure-explicit-values` and `field-projection-not-construction` semantics.

The three Mapping test groups pass. Integration request/payload compatibility
and the combined Event/Mapping/Query/effect vertical still require the remaining
I00 and I02–I06 work; no full I00 completion is inferred from this increment.

## Operation Event effects

An authored `produces OrderSubmitted` clause now lowers to the Operation's
explicit effect slot and canonical `produces` edge. Executable preparation
requires exactly those Event targets and qualified slots in the existing
DomainSpec action binding. Missing, extra, retargeted or hidden-slot effects
reject before generation. Occurrence input parameters and generated-clock
dependencies are explicit in that binding; they are not fabricated from an
operation name or result. Public source-driven binding authoring remains I07.

`test/application-effects.test.ts` compiles through public DomainSpec APIs and
executes the generated native TypeScript. A successful transaction receives
one frozen batch containing both writes and Event intents. Guard rejection or
malformed Event identity rolls back without committing or calling the clock.
Commit rejection stays rejected, and a thrown commit remains indeterminate
without automatic rollback or retry. No outcome claims publication or delivery.

The focused effects plus predecessor executable selection passes 4/4 test
groups. This discharges the bounded operation-effect prerequisite, not durable
atomicity, messaging integration, Query execution or the full I00 join.

## Query authoring and formation

```alch
query FindEligibleOrder:
  source candidate Order
  output optional<Order>
  where EligibleOrder
  bind order <- candidate
```

The source row has an explicit name and Entity role. Named Query inputs use
`input name Type`. `where` selects one declared Rule, never a replacement
formula. Each `bind` names an executable Rule parameter and selects an explicit
Query input or source-row path. `optional<Order>` and `list<Order>` remain
different authored result types, not a shared implicit list.

The current lowering emits a Query read declaration and canonical `reads`
edge, plus `query-shapes.json` containing exact inputs, row identity, Rule,
argument paths/types and output type. This file participates in the complete
artifact trace and currentness check. Duplicate and normalized-colliding names,
unknown fields, implicit optional/reference traversal, inline formulas and
non-Entity sources reject. Argument agreement with the projected Rule is checked
in executable projection, not claimed by formation alone.

Backend `domainspec.typed-query/v1` returns lists and embeds its bounded filter
contract. `application-query-projection.ts` now substitutes the exact projected
Rule arguments into that contract. Source fields are selected by ontology
identity; whole Query inputs remain explicit parameters. Boolean composition
and scalar equality retain their Rule structure. Argument coverage and types
must match exactly. Nested paths and other unrepresentable values reject, not
flatten or become hidden inputs. All source Entity fields are projected with
no invented ordering or limit, preserving the declared list result shape.

The trace binds Query shape, exact projected Rule bytes and emitted Query
bytes under the existing full-formation/interpretation currentness check.
Rehashing a removed filter cannot make a mutated candidate current. No new
canonical relationship or second proposition language is introduced.

Optional output now selects the explicit backend `domainspec.typed-query/v2`
cardinality extension. Zero matches produce native absence, one produces the
projection and multiple matches raise `QUERY_CARDINALITY`. Limits are forbidden
for optional results. See [Query cardinality](QUERY-CARDINALITY.md) for the
version/protocol boundary and three-language implementation. Existing list
queries retain v1. The combined keyed FindOrder proof is below; complete I00
closure still needs the distinct public request/response boundary.

`test/application-query.test.ts` verifies semantic-role retention, explicit
binding paths, optional/list separation, trace currentness, hostile syntax and
the executable rejection boundary. The earlier Query/source/domain/effects
selection passed 13/13 groups. The new six-group Query suite additionally
checks Rule arguments, field/input projection, currentness tampering and public
compiler generation followed by native list-query execution. Zero/one/multiple
matches, nonmatching rows, immutable results, max UInt64 and malformed inputs
are exercised. All six pass with no skips; typecheck passes. The combined
Query/Rule/effects/executable/integration regression passes 20/20 with no skips.
Those were list-projection results. The successor seven-group Alch Query suite
also executes optional results natively. Backend Python/Rust suites exercise
the same cardinality outcomes, including Rust reader failure. The complete I00
join remains outstanding; full C05 parity is not inferred.

## Combined domain proof

`test/application-domain-vertical.test.ts` compiles one synthetic source and
exact companion bindings through the public DomainSpec APIs. A two-parameter
scalar-equality Rule projects to `id == requested` for `FindOrder`; the same
Rule's factory use explicitly binds both arguments to the identity field.
There is no hidden default predicate or inferred lookup.

The native TypeScript harness supplies a declared Entity read with the generated
FindOrder, maps explicit caller values with the generated PrepareOrder, and
runs SubmitOrder with its generated Event constructor and explicit clock.
This is test-adapter composition, not a newly generated Workflow or integration
contract. No Operation-to-Query relationship is invented. The fixture verifies
canonical reads/maps/produces edges and source-to-output trace coverage.

Success commits one frozen write/Event batch. Missing or duplicate matching
rows, failed guards and invalid Event identity do not commit or call the clock.
Rejected commit stays rejected; thrown commit remains indeterminate without
retry or inferred rollback. Caller data remains unchanged. Full-width identity
values survive Query, Mapping and Event construction. No publication/delivery
claim is added. Both focused groups and Alch typecheck pass.

The completion audit deliberately does not count Order-shaped operation input
and output as distinct public request/response contract coverage. DomainSpec's
`NamedInterfaceContract` preserves named public payloads and request/result
members; `PublicMappingContract` preserves their separate identity. The Alch
application declaration model and its Mapping target check currently do not
support those public identities. The bounded bridge is the next I00 work, not
a reason to restart the backend or wait for C02's full breadth.
