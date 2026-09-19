# I03 messaging construction

Status: I03 complete for typed static lowering and same-source executable binding,
2026-09-17. Authority effect: none. Full provider/runtime wiring remains I06/I07.

## Decision resolved and verified successor

The product owner selected Mapping-to-Value-Object pure projection. Canonical
`maps` now accepts Entity, Value Object and Interface with unchanged scopes and
multiplicity. It does not construct instances or execute factories/invariants.
The current relationship digest is
`19790f73c6d1a401a37a1eeb90f1477fd53d388d2116102c414d9172893cb81f`;
the predecessor was `82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1`.
Current generated registry, compiler pin and receipt schema are synchronized.
Existing commerce fixture nodes/edges are unchanged; only the relationship digest
and enclosing graph/binding hashes change. Historical frozen receipts stay untouched.

Same-source formation/executable binding now qualifies both messaging directions.
The generated native Event identity and pure Value Object projections feed an
explicit test adapter into a generated Operation, preserving full-width UInt64
and rejecting malformed identities. Missing/extra/changed artifacts, stale
interpretations and wrong request parameter coverage reject. The shared backend
join retains exact source locations and graph identity. Its separate digest is
included in the executable trace. No provider delivery or durable deduplication
claim is inferred from this static join or the explicit test adapter.

Selected regression: 16 Alch tests, 20 backend tests, one native backend Value
Object projection test and three relationship-identity tests pass; zero skips.
Both compiler typechecks pass. The native backend fixture uses an always-false
Value Object invariant and still projects successfully, proving that Mapping
does not execute it. I04 still owns a successor to the narrower pinned public
Mapping v3 contract and its runtime consumers; this increment qualifies v2.

The earlier partial and decision-boundary sections below are historical evidence.

## Latest same-source construction and decision boundary

The domain lowerer, Rule projection and executable preparation now accept an
explicit messaging context alongside persistence. Unknown or unhandled integration
declarations still reject. All three messaging artifacts enter exact formation
currentness and interpretation hashes. Executable compilation invokes the public
shared backend messaging join and records its digest separately; formation alone
still records that payload joining is required.

The added source fixture attempts Event identity → Mapping → declared Value Object
payload → Mapping → Operation request. It exposes an existing disagreement:
`impl/cli/src/typed-backend/mapping-inputs.ts` checks Value Object field projection,
but `impl/cli/src/relationships/frozen-authority.generated.ts` restricts `maps`
targets to Entity/Interface. The compiled graph rejects the generated edge.
The fifth messaging test currently fails at that exact boundary; the preceding
four tests pass. It is an unmet acceptance obligation, not completion evidence.

No `maps` signature, frozen authority, profile or factory semantics was changed.
Do not delete the edge, substitute an Entity, or suppress the fixture to claim
success. Ask the product owner whether to allow Value Object projection as a
canonical Mapping target, with construction/invariant enforcement still separate.
Until resolved, the same-source path is implemented but not qualified; I03 and
the full goal remain incomplete. The sections below record predecessor evidence.

Alch `src/application-messaging.ts` now checks normalized publication and
subscription paths against the existing DomainSpec messaging composition using
the public `compileMessagingCompositionV2` API. The compiler adapter exposes
that capability with a missing-build diagnostic. No broker is contacted.

## Implemented boundary

The closed internal companion carries exact source bytes, an explicit
composition, declaration-to-binding selections, and separate Message/channel
aliases. These aliases select transport contracts; no Message is synthesized
as an Event, Entity or extra domain meta-type. Aliases cannot shadow domain
declarations. Final user-facing runtime/profile syntax remains I05/I07 work.

The bridge checks exact declaration, Message, channel, Mapping and consumer
coverage, domain-role identity, Mapping totality and subscription input-parameter
coverage. Publication selects the declared Event and Mapping. Subscription
selects the declared Mapping and Operation. Kernel boundary/provider/failure
references must agree with the specialized bindings.

Queue, topic and stream kinds remain distinct. Subscription acknowledgement
must exactly match `application-committed` or `consumer-handler-returned` as
authored. The source deduplication path is relative to the transport `message`
root; `deduplicate by messageId` checks `message.messageId`, not an inferred
Entity key. Dead-letter selection must agree with the delivery policy and
the dead-letter channel's source channel. Retry, ordering, retention, ownership
and transaction policies remain explicit backend inputs.

Output files separate backend-consumable `messaging-composition.json`, the
compiled snapshot `messaging-compiled.json`, and `messaging-trace.json`. Exact
currentness re-forms the result against source and companion bytes. The source
composition round-trips through the public backend compiler without removing
compiled-only fields. Runtime delivery remains false and authority effect none.

## Verification

`test/application-messaging.test.ts` checks the real backend path, round-trip
formation, unchanged input, source currentness, altered acknowledgement traces,
wrong declaration roles, changed channel kind, acknowledgement/dedup drift,
Mapping totality and input coverage, and mismatched failure routing. Explicit
handler-return selection is exercised separately from application-commit.
The three focused tests pass with no skips. The provider fixture is explicitly
adapted from the backend development fixture, not an installed/runtime test.

## Remaining I03 obligations

### Identity projection prerequisite implemented

The Alch Mapping lowerer now supports the backend's existing reference identity
projection. `input order -> Order.id` followed by `field id <- order.id` lowers
to the exact identity ontology path. This is scalar identity projection, not
reference resolution: `order.accepted` and traversal beyond `order.id` reject.
The unprojected reference is not silently assigned to a scalar field.

Native Mapping tests cover full-width UInt64 identity, negative/overflow
rejection, unchanged caller data and rejection of an Entity object supplied in
place of an identity. A generated Event's identity payload is passed explicitly
to the generated Mapping in the same compiled fixture; this is caller composition,
not a generated messaging adapter. The extra Boolean Mapping input remains
explicitly caller-supplied and is not fabricated from the Event.

Backend inspection confirms `runtimeInputSource` already distinguishes
`event-identity-reference` from direct Entity values. No backend relationship or
runtime source kind needed changing for this prerequisite.

The trace explicitly records `payload_type_join: required`. Current tests prove
reference and policy agreement, not executable Event-payload extraction,
Mapping result compatibility or Operation request-parameter composition.
The next increment must inspect and join the actual domain Mapping contracts
and payload representations; it must not coerce an Entity identity reference
into a full Entity snapshot. Then connect messaging formation to the same-source
domain/executable path and preserve the canonical application graph relations.
No alternate relationship names, subscription `invokes` edge or provider-selected
business meaning are introduced. Until that work is complete, the domain lowerer
continues to reject messaging-bearing applications and I03 remains partial.

Producer acceptance is not delivery or consumer completion. These tests do not
prove durable deduplication, acknowledgement execution, broker behavior or a
complete application. I06/I07 and the later runtime-evidence nodes remain open.
