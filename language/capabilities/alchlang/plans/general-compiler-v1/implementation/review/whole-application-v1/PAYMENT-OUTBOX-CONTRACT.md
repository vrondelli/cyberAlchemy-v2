# Commerce payment outbox contract (candidate)

This records the product-owner choices for the synthetic Commerce review: payment
authorization occurs **after** the order transaction commits, and the runtime
creates the event ID and timestamp. It is a construction contract, not a claim
that the current AlchLang projection or provider implements this flow.

The [candidate AlchLang payment model](candidate/payment-outbox.alch) now
declares `Money.amountMinor` and `Currency`, a distinct `PaymentStatus`, payment
Events, and a `PaymentLifecycle` State Machine. Its parser test verifies those
first-class declarations and trigger/transition references. This model has not
been joined to the runnable Commerce application or its generated provider.
`occurred-at generated` covers event time only; the declared `eventId` still
lacks a runtime-generation policy in the current language and compiler.
The candidate is parser-checked, not lowered or compiled: a Value Object also
needs a source-authored Rule invariant and its formal meaning binding before
it can become an executable DomainSpec projection.

## Ordered behavior

1. `SubmitOrder` validates the requested order and commits its
   `payment-pending` state together with one `OrderSubmitted` outbox row in a
   single local database transaction. The event ID and timestamp are created
   once within this transaction and retained with that row.
2. A committed outbox row is eligible for publication. A broker acceptance
   receipt means broker acceptance only; it does not mean the payment was
   authorized or the consumer completed.
3. The consumer records a durable inbox identity before applying the event.
   It sends a payment authorization using a stable idempotency key derived from
   the stored submission identity. A duplicate delivery must not authorize
   a second payment.
4. An explicit provider approval moves the order to `payment-authorized`;
   an explicit decline moves it to `payment-declined`. The outcome and inbox
   completion are committed before acknowledging the message.
5. A timeout or unknown provider outcome is **not** a decline and must not
   start a fresh authorization identity. It remains unresolved for retry or
   reconciliation under the same idempotency key.

The HTTP submit response may report `payment-pending`, not payment success.
The order identity, submission identity, event ID, and payment idempotency key
have different roles; neither a delivery attempt nor a wall-clock timestamp
may be used as the payment identity. The candidate amount is an unsigned count
of minor currency units and the review currency is USD. The exact provider wire
payload, retry budget, and reconciliation endpoint are not yet specified.

## Required executable checks before runtime claims

- A failed order transaction leaves neither a pending order nor an outbox row.
- Repeating the same submission cannot create a second event or authorization
  identity; a conflicting repeat must fail explicitly.
- A publish failure leaves the outbox row pending; broker acceptance cannot
  mark payment authorized.
- Duplicate delivery, worker restart, and an ambiguous provider timeout do not
  create a second authorization identity.
- Approval and decline move to distinct terminal states; acknowledgement
  follows the durable outcome, never precedes it.
- The generated TypeScript, Python, and Rust boundaries either satisfy these
  checks or explicitly reject unsupported execution. No unimplemented adapter
  returns a success receipt.

## Current implementation gap

The authored `SubmitOrder` Realization currently writes `Order` but emits no
`OrderSubmitted` occurrence. The outbound call is attached to `SubmitOrder`,
not the post-commit consumer. `Order` has only `id` and `accepted`, so it cannot
represent payment state. The generated TypeScript persistence and outbox drain
remain deliberately fail-closed. Therefore this document does not change the
current runnable review application's semantics.

The existing reference external-API resilience policy requires an idempotency
key at `request.authorizationId`, but the synthetic Order and API request do
not contain that field. The generated TypeScript outbound adapter now requires
an explicit stable key and sends it as `Idempotency-Key`; it fails before HTTP
when the key is absent or invalid. It serializes `UInt64` values as decimal
strings and rejects invalid request serialization separately from timeouts.
No worker currently derives that key from a
stored submission, and Python/Rust parity remains open. Thus retries cannot
yet be classified as safe merely because the policy is declared.

## Open Questions

- Which payment instrument or token does this synthetic application authorize,
  and which data may be persisted?
- Which provider idempotency and status-lookup contracts support safe timeout
  reconciliation?
- What is the stable submission identity when the same order can be resubmitted
  after a terminal payment outcome?
- Which formal Rule states the Money invariant (at minimum nonzero amount and
  supported currency), and how is it bound to the payment Value Object?
