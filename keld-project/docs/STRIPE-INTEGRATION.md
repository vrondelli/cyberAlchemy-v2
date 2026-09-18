# Stripe integration construction

2026-09-17. Candidate local implementation; no merchant account, public endpoint,
live transaction or sandbox checkout has been created. No ontology-runtime dependency.

## Implemented boundary

[StripeInbox](../commerce/stripe_webhook.py) uses the official Stripe Python SDK
15.6.1 to authenticate original request bytes with the endpoint signing secret and
a 300-second timestamp tolerance. It enforces the configured environment and
explicit connected-account identity when present. Own-account events rely on the
operator binding the correct endpoint secret to the configured account.

Authenticated snapshot events are committed to SQLite before acknowledgement.
Duplicate events are idempotent; changed payloads under the same event ID are
rejected. Payloads are retained for later processing, including unsupported payment
or refund event types. Intake alone grants no entitlement. Protect this database
as customer data and keep sandbox/live storage separate.

Primary protocol references: [signature verification](https://docs.stripe.com/webhooks/signature)
and [webhook delivery](https://docs.stripe.com/webhooks). Use the provider's SDK
instead of maintaining a separate signature implementation.

## Validation

The [sandbox event processor](../commerce/stripe_processor.py) now reads only
durably authenticated inbox events. It resolves the stored session/order binding,
checks the current API account, retrieves the Checkout session and PaymentIntent
with the latest charge expanded, and verifies successful payment, capture, amount,
currency, release and absence of an already reported refund/dispute before
recording payment. An unpaid completion cannot authorize delivery; a later signed
success event is processed independently. Provider failures leave the event
retryable. Missing bindings wait for recovery; mismatches and unsupported events
remain visible as review outcomes. Inbox and confirmation records are retained.

The combined commerce suite now passes **39 tests**. Eight processor tests cover
checkout → signed inbox → verified payment → protected fixture-file bytes,
concurrent distinct events/replay, restart, response failure, interrupted outcome
recording, unpaid then successful completion, mismatches/refunds, missing binding
recovery, unsupported events and late payment. The buyer identity and provider
responses are test fixtures; this is an integrated local proof, not a real Stripe
purchase or an authenticated HTTP journey.

The first processed authenticated success event fixes the confirmation timestamp
for that payment so later events and concurrent retries cannot change it. This is
an observation timestamp from Stripe's event, not a bank settlement timestamp.
The existing ledger uses it for benefit dates; this candidate commercial timing
rule must be reviewed with the final terms. A crash after payment commit but
before outcome recording can replay without a second payment. `paid-review`
still grants no download. Refund/dispute events currently require review and do
not revoke an already granted entitlement; a refund/revocation policy and handler
remain release prerequisites. API checks are observations, not protection against
a refund occurring after retrieval.

Protocol basis: [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment?payment-ui=stripe-hosted),
[PaymentIntent retrieval](https://docs.stripe.com/api/payment_intents/retrieve),
[event timestamps](https://docs.stripe.com/api/events/object).

The [sandbox checkout adapter](../commerce/stripe_checkout.py) now persists exact
creation parameters and a stable provider idempotency key before network calls.
It verifies the API account, creates a USD card Checkout session using stored
order terms, validates the returned amount/currency/release/expiry/test mode and
checkout URL, then stores the response and binds the session before returning the
URL. Network calls do not hold SQLite transactions. A lost response can be retried
after restart with unchanged parameters, even if local return-URL configuration
has since changed. A late response is retained for reconciliation but exposes no
checkout URL after the reservation expires.

The combined suite now passes **31 tests**, including seven checkout checks.
They cover response-loss recovery, concurrent retries, ownership, incompatible
expiry, provider mismatches, expiry during creation and the official SDK's HTTP
serialization/response conversion using a mocked transport. This caught and fixed
an SDK compatibility error: version 15.6.1 exposes `to_dict()` for recursive data.
These tests perform no real Stripe API call and do not prove merchant eligibility.

Stripe requires expiry between 30 minutes and 24 hours after session creation.
The adapter requires at least 31 minutes remaining when initially preparing an
attempt, allowing one minute for network work without extending the reservation.
The previous 900-second fixture is incompatible; the new tests use 3600 seconds,
which is a test value rather than an adopted reservation policy. Failed/uncertain
requests keep their original key and parameters; expired orders cannot create a
replacement. The adapter currently disables adaptive pricing and automatic tax
for this sandbox-only USD path. Production tax policy and other methods remain
separate work. [Stripe creation contract](https://docs.stripe.com/api/checkout/sessions/create),
[idempotency contract](https://docs.stripe.com/api/idempotent_requests).

The earlier 24-test commerce suite included five tests exercising real SDK
verification using locally signed fixtures: durable/concurrent replay, altered
bytes, wrong secrets, stale signatures, multiple rotation signatures, environment
and account mismatch, malformed data and conflicting duplicate IDs. These are
not Stripe-issued events and do not prove real sandbox payment acceptance.

Install [requirements](../commerce/requirements.txt) in an isolated environment,
then run `python -m unittest discover -s keld-project/commerce -p 'test_*.py'`
from the repository root. The direct SDK version is pinned; deployment still
needs a complete dependency lock and supported Python environment.

## Remaining construction and operations

1. Exercise the implemented persisted sandbox checkout against an actual merchant
   test account; supply an explicit compatible reservation policy and return URLs.
   Reconcile orphaned provider sessions and add cancellation handling.
2. Add an HTTP endpoint that passes unmodified body bytes to the inbox, returns
   success only after durable storage, and handles transient storage failure.
3. Exercise the implemented processor with real sandbox events. Add an operational
   worker/retry interface and policy-driven refund/dispute handling; resolve the
   final tax and benefit-start semantics beyond this fixed-USD sandbox path.
4. Connect authenticated customer access to protected artifact delivery and test
   the complete Stripe sandbox buyer journey.

Product construction can proceed locally. The merchant owns sandbox access and
endpoint secret configuration; those are exact prerequisites for real provider
tests. Merchant country controls Pix/USDC availability. Final license/distribution
approval and public launch remain separate operational/release dependencies.

## Routing diagnostic

The preceding request `keld-payment-binding-078` failed its final continuation with
`cli.predecessor-binding-mismatch`. Recomputing for diagnosis showed unchanged
request/profile digests but a different route-decision digest. The original full
decision was not retained, so the particular changed evidence is unproven.
Fresh request `keld-stripe-079` returned identical receipts across two consecutive
route calls and passed context/effect evaluation. No source or provenance digest
was altered to bypass the old receipt. Preserve complete future route outputs to
make another occurrence diagnosable.

## Open Questions

Merchant country, credentials, identity/recovery, refund/late-payment policy,
BRL quotes and license terms remain owned by [intake](PROJECT-INTAKE.md).
The old routing mismatch's specific cause is unresolved; fresh stability alone
does not establish a fix.
