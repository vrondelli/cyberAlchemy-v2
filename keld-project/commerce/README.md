# KELD commerce core candidate

This local Python/SQLite implementation stores orders and first-100 entitlements.
It implements rules from the [starter checkout contract](../prototype/CHECKOUT-CONTRACT.md).
It is not connected to the storefront or a payment provider. The internal delivery
core below can return actual artifact bytes after entitlement/grant checks; no
public download endpoint or sign-in system is exposed.

## Implemented boundary

`Ledger.create_order` accepts a server-authenticated customer identity, a caller
idempotency key, the exact checkout payload and a server-selected release digest.
It validates integer USD cents from 5,000 through 100,000 inclusive, exact product
and offer, quantity one and a closed field set. It binds the price and release
before any provider checkout is created. Changed data under the same customer/key
is rejected, while an exact retry returns the existing order.

The same SQLite write transaction reserves a first-100 slot if available. The
returned `benefit` and expiry must be shown to the buyer and included in the
provider checkout terms before payment. Once capacity is exhausted, a new order
explicitly has no early-supporter benefit; callers must not silently substitute
that offer for a previously reviewed one. One pending reservation per customer
is allowed. Existing active customers retain their original benefit dates.

`record_verified_payment` is an internal trust boundary. A future provider adapter
must verify the event signature, fetch/verify successful payment, normalize the
expected pre-tax subtotal and currency, and bind the actual provider customer/order
before calling it. No public request may call this method with client-asserted
payment data. The method does **not** perform that provider verification itself.

Payment recording checks the bound order/customer/amount/currency, globally unique
payment identity and event idempotency. Successful timely payment activates the
reserved benefit for 12 calendar months. The leap-day policy clamps the anniversary
to February 28 in a non-leap year. Repeat purchases and duplicate events never
extend the period or allocate another customer slot.

Late payments on expired reservations are persisted as `paid-review`; they do not
silently receive a replacement slot or download entitlement. The owner selected
automatic refund for verified late payments, but no provider refund command or
worker is connected here. A newly verified payment that enters `paid-review`
after local expiry atomically creates a durable `late_refund_intents` row. Local
privileged `refund-claim` and `refund-finish` operations provide a
generation-fenced lease, bounded **pre-command read** retry, and review path.
`refund-command-start` durably marks the may-send boundary and only then
returns the stable idempotency key. After that marker, no automatic retry can
claim the intent; an expired lease becomes review for provider reconciliation.
These operations never call a provider, and no scheduler invokes them. Existing
historical reviews are not silently backfilled. Reversals do not recycle
first-100 slots.
The privileged local `refund-inspect` operation reports queue/review counts,
due/deferred work, and expired leases,
and separately flags recorded full-refund evidence; a later dispute can move
an intent back to review without erasing the earlier refund record. It is not
exposed on a buyer HTTP route.
Unlike the mutating bridge operations, `refund-inspect` opens an existing
SQLite database in read-only mode before ledger initialization and rejects a
missing or legacy schema. It never performs migration/backfill; the local
operator CLI is `npm run inspect-refunds -- <config.json>` from `integrations/`.

`record_verified_reversal` is a local trusted-core candidate, not a buyer API or
provider verifier. Its caller must independently verify the exact provider
payment, full-versus-partial amount, and refund/dispute outcome before passing
the normalized receipt. The core binds that receipt to the recorded payment and
owner, rejects cross-payment reuse of a provider reversal reference, audits
replay by provider event ID, revokes future access after a verified
full refund or lost dispute, and sends partial refunds to review. Revocation
blocks new download grants and redemption of unused grants, and suppresses the
revoked first-100 benefit on a later purchase. Already downloaded bytes cannot
be recalled. There is no connected provider event path or staging activation.

`entitlement` requires a paid order belonging to the authenticated customer. It
returns the exact purchased release digest and whether updates/support are still
within their recorded period. Expiry of those services does not revoke access to
the purchased artifact in this candidate rule. It does not stream a file, issue a
download token, validate release approval or provide an authentication mechanism.

## Persistence and tests

Use a private database path outside the served frontend. Connections use SQLite
transactions with `BEGIN IMMEDIATE`, unique constraints and rollback on error.
The reservation duration is a required constructor argument: tests use 900 seconds
as a fixture, not an adopted commercial timeout. Capacity is fixed at 100 customers.

```sh
python3 keld-project/commerce/test_ledger.py
```

Eight tests cover strict input rejection, order/event idempotency, 108 concurrent
customer reservations capped at 100 benefits, concurrent duplicate callbacks,
repeat-customer dates, mismatched/reused payments, late-payment review, restart
persistence, customer access isolation, exact service expiry and leap-day behavior.
Tests use disposable databases and synthetic verified-payment inputs. Passing
these tests is not evidence of a real provider payment or end-to-end purchase.

## Artifact delivery

`Delivery` receives a server-owned catalogue of immutable artifact records and an
artifact root outside the served frontend. It issues random 256-bit grants to a
paid order's authenticated customer, storing only token hashes in SQLite. Grants
bind the customer, order, release digest, expiry and operating mode. The caller
must obtain the customer identity from trusted authentication, never request-body
identity or a token alone.

Redemption rechecks ownership, expiry, unused state, paid order, release binding
and current release approval in one transaction. It reads bounded artifact bytes,
verifies the expected size and SHA-256, then atomically consumes the grant. Only
those verified bytes are returned. Concurrent redemptions cannot both succeed.
Corrupt files fail without consuming a grant; an authorized buyer can obtain a new
grant after expiry or an interrupted transfer. No exactly-once delivery to a remote
client is claimed: the core has no HTTP transport or client acknowledgement.

`approved-release` mode refuses artifacts whose catalogue approval is false.
`local-test` explicitly permits private candidates for local validation, and grants
cannot cross modes. Do not expose local-test delivery through a public service.
The catalogue and approval values are operator inputs, not a mechanism for granting
release approval. Absolute paths, parent traversal and symlinks outside the
configured artifact root are rejected. Filesystem containment checks assume
operator-controlled storage, not a concurrently hostile filesystem.

Run the combined tests and the real-file local journey:

```sh
python3 -m unittest discover -s keld-project/commerce -p 'test_*.py'
python3 keld-project/commerce/check_local_delivery.py
```

On 2026-09-17: all 13 tests passed. The local journey recorded a synthetic payment,
issued/redeemed one grant, delivered the real 11,257,823-byte customer bundle with
matching SHA-256, extracted and installed it, and passed engine doctor. It also
verified denial of this unapproved artifact in release mode and denial of grant
reuse. Temporary database, download and extraction trees were removed. The bounded
result is `evidence/local-delivery-check.json`.

This proves an internal order-to-real-artifact path with synthetic payment and
customer inputs. It does not prove provider verification, user authentication,
provider sandbox checkout, public network delivery or production release readiness.

## Next integration steps

`stripe_checkout.py` implements sandbox-only checkout creation with durable request
parameters, idempotency keys, account checks, response validation and session
binding. Lost responses and concurrent requests reuse the same provider attempt.
Its test-key wrapper uses the official SDK; it exposes no live-mode option.
The combined suite now passes **31 tests** with mocked provider transport and
locally signed events. See [Stripe integration](../docs/STRIPE-INTEGRATION.md)
for expiry constraints, sandbox limitations and remaining real-provider checks.

The [Stripe inbox](stripe_webhook.py) now authenticates original request bytes
with the official SDK and durably records events before processing. The combined
suite passes 24 tests using synthetic signed fixtures. Install
`python -m pip install -r keld-project/commerce/requirements.txt` in an isolated
environment before running the suite. It does not yet process those events into
payments or expose an HTTP endpoint. See [Stripe integration](../docs/STRIPE-INTEGRATION.md)
for the exact boundary and remaining sandbox work.

`provider_bindings.py` now persists immutable provider-session/order links scoped
by provider, merchant account and sandbox/live environment. Trusted adapters bind
sessions created from stored order terms, then submit independently verified
successful payment receipts. Order/customer identities are resolved locally;
provider event/payment IDs are namespaced before entering the atomic ledger.
The same scoped session cannot move to another order. Restart and concurrent replay
retain one payment event. This is not a provider adapter or signature verifier.

On 2026-09-17, the combined suite passed 19 tests, including six binding tests for
restart/concurrent replay, scope isolation, ownership/reassignment, invalid receipt
rejection, competing providers and expired payments. All payment inputs remain
synthetic. Sandbox and live deployments must use separate databases/catalogues;
identifier namespaces alone do not isolate entitlement or delivery environments.

A second successful payment for an already-paid order is rejected by the ledger.
The future provider inbox must durably retain that event for reconciliation/refund
instead of dropping it or repeatedly granting access. Checkout retries still need
provider idempotency and persisted creation attempts; this binding layer begins
after the provider session is created. Quote/FX support remains necessary for Pix.

1. Resolve merchant eligibility for the requested Stripe/PayPal/USDC/Pix methods
   and select customer-identity mechanisms.
2. Create checkout from stored order terms, with rate/origin protection and provider
   idempotency; enforce reservation expiry and explicit benefit review before payment.
3. Verify provider events before invoking this ledger, including delayed payment,
   tax/subtotal treatment and expired-order review.
4. Connect the tested catalogue/grant boundary to authenticated recovery and a
   protected HTTP response; keep private artifact storage out of the static site.
5. Exercise the real provider sandbox and the complete buyer/download/install path.

## Open Questions

Owner decisions remain open for reservation duration, cancellations/refunds,
late-payment resolution, provider/merchant, customer-account linking, support
delivery and final license. The current code proposes the calendar-year and
post-expiry behavior above; neither local tests nor configuration admit purchase
terms. See [delivery plan](../docs/DELIVERY-PLAN.md) for operational dependencies.
