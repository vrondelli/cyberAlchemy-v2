# Closed integration paths — I01

Status: implemented syntax/model candidate, not integration execution.
Authority effect: none. Product lane: construction.

The `application-v1` branch of the existing Alch scanner recognizes five
integration sections. `src/application-integration.ts` in the Alch compiler
normalizes their rows into a discriminated typed model with source locations.
These objects express graph intent, not sequential steps. They contain no
provider realization, credentials, evaluator, generated body or runtime result.

## Authoring contract

```alch
subscription StartBilling:
  topic OrderEvents
    -> message OrderSubmittedMessage
    -> map MessageToAuthorizePayment
    -> operation AuthorizePayment
  acknowledge after application-commit
  deduplicate by messageId
  failure -> dead-letter OrderEventsDeadLetter

publication PublishOrderSubmitted:
  event OrderSubmitted
    -> map OrderSubmittedToMessage
    -> message OrderSubmittedMessage
    -> topic OrderEvents

inbound-endpoint SubmitOrderHttp:
  HTTP POST "/orders"
    -> request SubmitOrderRequest
    -> operation SubmitOrder
    -> response OrderSummary

outbound-call AuthorizePaymentCall:
  operation AuthorizePayment
    -> request PaymentAuthorizationRequest
    -> external-api PaymentGateway
    -> response PaymentAuthorization

persistence Orders:
  stores Order
  serves FindOrder
  accepts-writes-from SubmitOrder
  transaction local
```

This is an integration syntax excerpt, not a standalone buildable application.
It requires a domain/profile/owner header and the referenced declarations and
explicit contracts before integration lowering can succeed.

- Each arrow occupies one line. A path has exactly the displayed role order;
  arrows share one indentation level deeper than the initial path row.
- `queue`, `topic` and `stream` are distinct channel kinds. A dead-letter
  destination is a separate failure reference, not a main-path channel alias.
- Subscription acknowledgement is explicit: `application-commit` maps to
  `application-committed`; `handler-return` maps to `consumer-handler-returned`.
  Neither condition proves delivery, durability or exactly-once behavior.
- Subscription clauses currently follow the shown acknowledgement,
  deduplication, failure order. A deduplication key is a field path, not code;
  retention, ownership and transactional policy still require explicit I03
  bindings. No missing delivery/retry/ordering policy is inferred here.
- Persistence has exactly one Entity target and explicit local transaction
  scope, with one or more Query and/or write-Operation references. Read-only
  and write-only declarations do not acquire invented consumers.
- HTTP routes are local absolute paths, not remote URLs or query strings.
  Outbound APIs are logical references, not embedded provider addresses.
- Duplicate declaration identities, unsupported clauses, reordered path roles,
  calls and imperative statements fail with source-linked diagnostics.
- Without explicit `profile application-v1`, integration sections reject;
  they cannot silently disappear into historical compatibility syntax.

## Exact backend ownership and relationship map

Sources are in DomainSpec `impl/cli/src/system-integration/`.

| Authored path | Current typed contract | Canonical graph projection / obligation |
| --- | --- | --- |
| Subscription channel → message → map → operation | `messaging-v2-types.ts`: `SubscriptionBindingV1`, inbound `MessageMappingV1`, `AcknowledgementBoundaryV1`, deduplication and channel contracts | Bind `channel_ref`, `message_type_ref`, `mapper_ref`, `operation_ref`; validate mapping input paths/request parameters. Do not invent a Subscription `invokes` edge. |
| Publication event → map → message → channel | `PublicationBindingV1` and logical-to-message `MessageMappingV1` | Existing graph builder emits Mapping `reads-payload-from` Event, Mapping `produces-message-contract` message-contract, publication `publishes-event` Event. Channel stays an explicit binding reference. |
| Inbound HTTP → request → operation → response | `external-api-v2-types.ts`: `InboundEndpointBindingV1` and `ApiMappingV1` | Existing graph emits inbound-endpoint `invokes` Operation and Operation `accepts-request` request-contract. Both request and response mapping closures are required; the concise path does not invent missing mappers. |
| Outbound operation → request → external-api → response | `ExternalApiBindingV1`, `ExternalApiContractV1`, `ApiMappingV1` | Resolve explicit request/result contracts, provider operation and mappers in I04/I05. The arrow chain adds no new canonical relationship identifier. |
| Persistence stores / serves / accepts-writes-from | `persistence-v2-types.ts`: `PersistenceCompositionV2`, logical subjects, mappings and local transaction guarantees; application read/write bindings | Resolve Entity/Query/Operation references using current typed contracts in I02. `serves` is authoring intent, not an invented domain edge. |

`integration-relationship-authority-v1.ts` and `application-graph-v1.ts` own
the five canonical integration edge signatures above. Explanatory labels such
as `delivers` and `transformed-by` in prose are not extra edge authority.
Graph construction is delegated to those existing APIs in I06.

## Stage boundary and remaining obligations

I01 defines and normalizes the closed paths. This stage preserves unresolved
reference spelling and location; it does not claim type agreement, existence,
provider configuration or executable application validity. I00 supplies typed
Event/Mapping/Query prerequisites. I02–I04 resolve each reference, check payload
and result compatibility, and form complete current contracts. I05 owns
explicit provider/runtime selections; I06 owns the exact graph join.

Until those lowerers are connected, `lowerApplicationDomain` rejects a model
containing integrations with `APPLICATION_INTEGRATION_LOWERING_REQUIRED`.
This prevents a successful domain-only build from silently dropping intent.
No compiler should satisfy a missing mapping/policy/contract by inventing one.

## Evidence

`test/application-integration.test.ts` checks all five shapes, exact reference
roles/locations, channel and acknowledgement separation, read/write consumer
cardinality, malformed paths, legacy rejection and domain-only fail-closed
behavior. Existing parser and executable tests continue to exercise the same
scanner and native L0 outcome. These are syntax/retention checks, not claims
that I02–I07 have run. Current test results are in `EXECUTION-STATUS.md`.

Remaining integration construction is owned by I00/I02–I07 in
`EXECUTION-DAG.json`; no new product decision is selected by this contract.
