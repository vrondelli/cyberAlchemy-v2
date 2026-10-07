---
title: KELD Checkout Payment Lifecycle Decision Gate
status: owner-policy-selected-implementation-open
preparedAt: 2026-09-21
owner: KELD product and merchant owners
authorityEffect: none
---

# Checkout payment lifecycle decision gate

**Policy selection:** D1-A, D2-C, D3-A, confirmed by the owner in this task on
2026-09-21 at 18:50 UTC. **Implementation remains open** until provider
finality, refund idempotency, entitlement transitions, and tests are built and
verified. This record does not itself release an order, refund a buyer, change
access, or deploy to production.
It implements the decision gates in the
[checkout recovery DAG](../CHECKOUT-RECOVERY-DAG-2026-09-21.md); the broader
[production release gate](PRODUCTION-RELEASE-GATE-2026-09-20.md) retains its
separate D3 refund/dispute decision.

## Current verified boundary

- H4 staging changed React presentation only. The H3 server still prevents a
  fresh request key while an earlier provider-bound attempt is unresolved,
  including after local expiry. A buyer may restore or verify that order, but
  cannot safely start a replacement merely because instructions vanished.
- The current `confirm` path in
  [checkout.mjs](../../integrations/src/checkout.mjs) asks the provider adapter
  to verify payment. A null result means *not yet verified*, not conclusively
  unpaid. The ledger may place late settlement in `paid-review`; it does not
  automatically grant the original benefit after its hold expires.
- [Stripe](../../integrations/src/payments.mjs), [Mercado Pago Payments](../../integrations/src/payments.mjs),
  [Mercado Pago Orders](../../integrations/src/mercadopago-orders.mjs), and
  [PayPal](../../integrations/src/payments.mjs) have payment-positive checks,
  but no live-qualified, ledger-level terminal-unpaid contract. A default-disabled
  local atomic replacement candidate is under test; it is not active on staging.
  Existing `operator-closed-unpaid` labels do not bind terminal
  provider proof. The five historical staging labels must not be used to
  unlock replacement by migration alone.

## Provider evidence needed before D1 can be implemented

| Flow | Official state distinction | Candidate safe investigation; not yet an adopted release predicate |
| --- | --- | --- |
| Stripe Checkout | Session `status` is `open`, `complete`, or `expired`, separately from `payment_status` `paid`/`unpaid`; a complete session can still be processing. [Session object](https://docs.stripe.com/api/checkout/sessions/object), [expire endpoint](https://docs.stripe.com/api/checkout/sessions/expire). | Re-retrieve the exact merchant/test session and linked payment state. Establish whether `expired` plus `unpaid`, after any linked payment/event reconciliation, is terminal for KELD's enabled payment methods. Clock time or `unpaid` alone is insufficient. |
| Mercado Pago Orders Pix | `created`, `processing`, and `action_required` are not terminal; Orders documents `canceled`, `expired`, and `failed` separately from processed payment, refund, and chargeback states. [Order statuses](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/payment-management/status/order-status). | Prove the exact Order ID, merchant, amount, currency, and transactions. Verify that a terminal unsuccessful Order cannot later accredit a transaction; reconcile notifications before releasing the KELD lock. |
| Mercado Pago Payments API | `pending` and `in_process` can settle later; `cancelled/expired` is distinct from `approved/accredited`, partial refund, mediation, and chargeback. [Payment statuses](https://www.mercadopago.com.br/developers/en/docs/checkout-api-payments/response-handling/query-results?scope=prod). | Define a separate Payments-API predicate; do not reuse the Orders predicate or treat a missing provider response as cancellation. |
| PayPal Orders CAPTURE | Order creation, payer approval, capture, and completion are separate steps. A pending capture must not fulfill; completed capture can. [Orders API](https://developer.paypal.com/api/orders/v2), [checkout webhooks](https://developer.paypal.com/payment-methods/webhooks/). | Confirm whether this CAPTURE flow exposes a durable terminal-unpaid state and that no completed/pending capture exists. Do not infer it from the buyer's cancel URL or elapsed local time. If no conclusive predicate exists, keep PayPal replacement in reviewed support. |

For every flow, provider timeout, 404 without a documented finality guarantee,
inconsistent state, an unknown payment resource, a delayed webhook, or a
`paid-review` ledger row remains locked for reconciliation. These are safety
requirements independent of the owner choice below.

The local sandbox adapters now have **read-only candidate** `terminalUnpaid`
classifiers. Stripe requires the exact session, merchant,
order/amount/currency/offer/expiry, `expired` plus `unpaid`, a null
PaymentIntent, and exactly `['card']`. Stripe's
[session status definition](https://docs.stripe.com/api/checkout/sessions/object)
says a completed session may still be processing, whereas an expired session
cannot process further. Mercado Pago Payments requires a canceled Pix payment,
documented terminal detail, exact frozen expiry, no approved date, and zero
refund amount; Mercado Pago Orders separately requires an expired/canceled
Order and matching terminal Pix transaction with zero credited amount. These
predicates are deliberately narrower than the provider's documented
[Payments](https://www.mercadopago.com.br/developers/en/docs/checkout-api-payments/response-handling/query-results?scope=prod)
and [Orders](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/payment-management/status/order-status)
state tables. PayPal always returns unresolved; a 404 remains in review because
PayPal's [Orders API error list](https://developer.paypal.com/api/rest/integration/orders-api/errors)
does not establish payment finality.

The adapter classifiers were covered by 60/60 affected integration tests and
3/3 predicate-tightening cases. A subsequent default-disabled R3 candidate
wires bounded unique-resource discovery and terminal read to one SQLite
transaction that closes the old order and reserves the successor or rolls both
back. Its focused commerce tests pass 12/12, the full commerce suite 62/62,
and the affected integration suites 62/62. These are synthetic fixtures, not authenticated live
sandbox terminal examples. The provider read happens before the transaction;
the ledger checks proof freshness, order ownership/state, inbox conflicts, and
reconciliation leases inside the transaction. Provider-specific sandbox
evidence, late-event race qualification, HTTP/browser handling, and explicit
enablement remain prerequisites to automatic replacement. At that initial
point, D2 refunds and D3 revocations had a local trusted-core candidate only;
no provider event was wired to it and no staging access was revoked.

Later local implementation has progressed beyond that initial candidate:
explicit `replaceOldOrderId`, atomic old-to-successor linkage, authenticated
read-only request-key lookup, and React reload recovery are now wired behind
`checkout.automaticReplacement`, which defaults off. Local synthetic commerce
90/90, integration 144/144, storefront 42/42 with typecheck/build, and the
built-page browser fixture passed. These results do not qualify provider
terminal states in an authenticated sandbox or authorize staging enablement.
The subsequent D2/D3 local worker and signed-event candidates described in
the recovery DAG also remain disabled and unqualified for live operation.
Adversarial follow-up repaired lost-key and linked-successor replay defects;
the exact follow-up validation state is recorded in the recovery DAG.
The 2026-09-21 authenticated, GET-only staging spot-check subsequently found
two Stripe expired/unpaid card sessions with no PaymentIntent that matched
their frozen terms and each had one bounded-discovery match. The Mercado Pago
Orders case returned canceled/expired status alongside a nonzero
`total_paid_amount`, and discovery found two distinct Orders for its frozen
reference; it remains unresolved and locked. These snapshots do not qualify the
late-event/replacement race or authorize the disabled R3 path. See the
[sandbox evidence in the DAG](../CHECKOUT-RECOVERY-DAG-2026-09-21.md#authenticated-sandbox-finality-spot-check-2026-09-21).
Both Orders later passed a complete frozen-terms read and had distinct payment
IDs; creation times were 398 seconds apart and the local creation record was
generation 3/uncertain. The sub-agent review found a stable KELD idempotency
key but no decisive POST trace, so the duplicate's origin is still unknown.
A local, undeployed safeguard now discovers and binds one exact resource after
an uncertain Mercado Pago Orders create, keeps empty/incomplete results on
GET-only retry, and locks duplicates or mismatches for review. It never sends
another create POST in that ambiguous path.
The exact local integration candidate passed 154/154 synthetic tests; the
historical duplicate remains unresolved and the safeguard is not deployed.
A subsequent read-only PayPal staging review found five unpaid Orders GETs
returning 404 and one `PAYER_ACTION_REQUIRED` order. None proves terminal
nonpayment, so PayPal replacement remains review-only. A local test now covers
both the observed payer-action state and 404 after local expiry. With R3
explicitly enabled in the synthetic fixture, each still blocks a fresh key
and an old-order replacement before creating a successor or provider payment.
This does not qualify PayPal terminal nonpayment or enable R3 on staging. The D3
buyer projection was also corrected: a verified reversal of a late-paid order
now appears as revoked in owned checkout views, without enabling refunds or
staging deployment. See the DAG for exact validation evidence.

## D1 — New checkout after a provider-bound attempt

**Owner:** KELD product and merchant owners. **Blocks:** DAG P/R3, automatic
expired-checkout restart. **Selection:** D1-A, owner message on 2026-09-21 at
18:50 UTC. The owner's automatic-refund request applies if a payment is actually
verified after expiry under D2-C. A conclusively unpaid attempt has no payment
to refund. D1-A never releases a lock on elapsed time or an inconclusive check.

| Option | Benefit | Cost or risk | Downstream effect |
| --- | --- | --- | --- |
| D1-A — Provider-terminal-evidence-gated replacement (recommended) | Restores the buyer's ability to begin again when the old attempt is conclusively unable to pay. | Provider-specific contracts, event reconciliation, and atomic ledger release are required; some flows may remain manual. | Implement explicit finality result per flow, recheck under a per-buyer transaction, preserve the old audit record, create exactly one successor key, and test late/conflicting events. |
| D1-B — Operator-reviewed replacement only | Conservative when provider APIs do not prove finality. | Buyers wait for support; abandoned checkout UX remains limited. | Keep the H3 guard and add a proof-bound operator workflow, buyer status copy, support ownership, and audit. |

Time-only release or `verify() === null` release is **not** a viable option:
neither proves the previous provider resource cannot collect money.

## D2 — Verified payment after local order expiry

**Owner:** KELD product, merchant, and support owners. **Blocks:** late-payment
remedy in DAG P/O/U. **Selection:** D2-C, owner message on 2026-09-21 at
18:50 UTC. Automatically refund a verified payment that arrives after local
order expiry, but only after the exact payment/order and amount are reconciled,
an idempotent refund command is available, and the outcome can be verified.
A failed, pending, partial, or ambiguous refund goes to audited review; never
claim success merely because a refund request was submitted. This is selected
policy, not an active refund worker.

| Option | Benefit | Cost or risk | Downstream effect |
| --- | --- | --- | --- |
| D2-A — Audited manual remedy (recommended initial policy) | Handles benefit exhaustion, duplicate payment, and unusual provider timing case by case. | Requires named response owner and time target; buyer waits. | Keep `paid-review`, notify the buyer without claiming delivery, then record a reviewed fulfill-or-refund decision and its provider evidence. |
| D2-B — Automatic artifact fulfillment without expired benefit | Faster delivery for a paid buyer. | May violate offer/benefit terms or fulfill a payment already being reversed. | Define exact eligibility, revoke/chargeback interaction, and an idempotent entitlement transition before enabling. |
| D2-C — Automatic refund | Avoids delivering an expired offer. | Provider refund may fail, be partial, or duplicate an operator action; buyer may prefer fulfillment. | Requires a separate authorized refund command, idempotency, reconciliation, and buyer notice. |

### D2 implementation gate

The local ledger now enqueues a refund intent only when a newly
verified payment becomes `paid-review` after the order deadline. It does not
backfill older review rows and does not issue refunds. Privileged local
claim/finish operations provide a one-worker lease, generation fencing, capped
pre-command read retry, and review. A durable `refund-command-start` marker
returns the stable idempotency key only after recording that a command may be
sent; a later timeout or expired lease cannot automatically retry the command.
No scheduler or provider command is connected. A verified full refund
marks that intent succeeded; a partial refund or lost dispute sends it to
review. A worker must claim the intent durably, re-fetch the exact merchant
payment and current reversals, use one stable provider idempotency key, and
verify a terminal full-refund outcome before marking success or notifying the
buyer. A timeout, pending refund, partial amount, or existing operator action
must stay in review/reconciliation, not trigger a fresh-key refund.
The later local D2 candidate resolves the timeout/pending branch through
bounded GET-only rechecks after the may-send marker. It never reissues the
provider command. A fresh exact full-refund GET can finish the intent; after
eight inconclusive claims it remains in review for signed-event or operator
follow-up. This does not activate a scheduler or qualify real sandbox
outcomes. The owner has deprioritized partial-refund automation; partial and
ambiguous outcomes remain review-only.
A subsequent local operator candidate allows one exact reviewed order and
generation to be rechecked with provider GETs only after the automatic window
is exhausted. It preserves the may-send marker, audits each claim and result,
and records success only on fresh bound full-refund proof. It cannot send a
second refund command. An inconclusive or partial result stays in review.
This is not deployed, and its caller-supplied operator label is not yet
independent proof of a person's identity; per-person audit needs a trusted
operator launch context before staging enablement.
The integration layer has read-only refund-state inspection candidates for
Stripe and Mercado Pago Payments, with malformed or non-final states requiring
review. PayPal and Mercado Pago Orders remain review-only until their distinct
refund-resource evidence is qualified. A later local worker connects Stripe
and Mercado Pago Payments inspection to the queue, but it is default-off and
not qualified against authenticated sandbox refund resources. A pre-command
read is not a guarantee against concurrent provider or operator action.

Provider commands are not interchangeable: Stripe refunds a Charge or
PaymentIntent and exposes [refund listing by PaymentIntent](https://docs.stripe.com/api/refunds/list);
Mercado Pago Payments uses the [payment refund endpoint](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-api-payments/create-refund/post)
and [refund listing](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-api-payments/get-refunds/get),
while Orders uses a distinct [Order refund endpoint](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-api/refund-order/post)
and terminal [Order states](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/payment-management/status/order-status).
PayPal refunds the [captured payment ID](https://developer.paypal.com/api/payments/v2/captures-refund),
not its Order ID. Each provider adapter needs fixture and authenticated sandbox
evidence for idempotency, ambiguous response recovery, full-versus-partial
amount, ownership, and outcome before a worker is enabled.

## D3 — Future access after refund or dispute

**Owner:** KELD product and merchant owners. **Blocks:** DAG O/U and production
release D3. **Selection:** D3-A, owner message and follow-up confirmation on
2026-09-21 at 18:50 UTC. Revoke future unused grants after a verified full
refund or lost dispute; send partial refunds to review without automatic
revocation. The corresponding [production decision gate](PRODUCTION-RELEASE-GATE-2026-09-20.md#d3--refund-dispute-and-future-access-behavior)
retains its other independent blockers.

**Current execution priority:** the owner confirmed that partial-refund
automation is not a focus for this release. Keep partial and ambiguous
outcomes in review, without automatic revocation or another refund command.
Concentrate qualification and staging readiness on verified full refunds,
lost disputes, and late-payment recovery. This priority does not relax the
full-refund proof or duplicate-command gates.

| Option | Benefit | Cost or risk | Downstream effect |
| --- | --- | --- | --- |
| D3-A — Revoke future unused grants after verified full refund or lost dispute; review partial/ambiguous cases (recommended in production gate) | Narrow automated consequence with an audit path. | Needs provider-state verification, notice, and idempotent entitlement handling. | Implement signed-event intake, current provider verification, future-grant revocation, and review queue. |
| D3-B — Keep future access after every refund/dispute | Customer-friendly and simple. | Refund-and-retain abuse exposure. | Still ingest and audit events; disclose retained access policy. |
| D3-C — Revoke after any nonzero refund or dispute | Maximum revenue protection. | Partial refunds can unexpectedly remove all access. | Implement and disclose immediate partial/full consequences with appeal path. |

Previously downloaded bytes cannot be recalled. An event alone never
authorizes a refund call or entitlement transition: verify the current
provider state, bind it to the exact order, and handle duplicates/replays.

Latest local implementation evidence: signed Stripe, Mercado Pago Payments,
and PayPal refund hints can reach the trusted reversal bridge only after fresh
provider reads and exact recorded-payment binding. Verified full refunds and
Stripe lost disputes revoke future access; final partial refunds remain in
review with access unchanged. Owned checkout restore/history and the React
page now present revocation instead of a stale paid/download claim. Multiple
webhook IDs for one provider reversal leave one reversal row. These remain
synthetic tests, not authenticated sandbox or deployed proof. PayPal refund
webhook shape, Mercado Pago Orders reversal, buyer notice, review ownership,
and a separate staging cutover are still open.
The latest local Stripe candidate also reconciles a complete refund list
against the Charge's refunded total before treating cumulative refunds as a
full reversal; a separately verified full refund is not suppressed by an
unrelated dispute flag. A pending refund hint retries boundedly instead of
ending in permanent review. The integration suite passed 156/156 locally on
2026-09-21. This is synthetic proof only; missing final provider events and
authenticated sandbox finality still need qualification before staging
enablement.
The later local Mercado Pago Orders-v1 candidate can bind a signed Order
notification to a fresh, exact seller- and payment-matched GET and record a
full reversal through the same trusted bridge; a partial result remains in
review with access intact. Its synthetic final-state fixture is **not** a
staging qualification. The provider's [status table](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/payment-management/status/order-status)
and [refund response example](https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-api/refund-order/post)
disagree on the order status shape, so an authenticated refund GET sequence
must qualify finality before deploying or enabling this path. D3-A policy is
unchanged: full refund or lost dispute revokes future access; partial refund
requires review.

## Follow-on execution after explicit choices

1. For D1-A, qualify each provider's terminal-unpaid predicate and adverse
   timing cases; retain manual review for flows without one. For D1-B, design
   the proof-bound operator release instead. Neither path may modify the five
   historical closures without separate case review.
2. Implement R3 as a server-returned finality category plus transactional
   successor creation, then have the browser offer a fresh checkout only on
   the server's released state. Add adapter, ledger, HTTP, and browser tests
   for expiry, cancel, webhook-before-return, late settlement, replay,
   cross-tab retries, and one-pending-order invariants.
3. Implement D2/D3's verified event, buyer notice, audit, and entitlement
   transitions; exercise provider-specific refund/dispute and late-payment
   sandbox fixtures. Freeze and validate a new candidate before any separately
   authorized staging cutover. H4 does not authorize this change.

## Deferred decisions and assumptions

- Exact response time, notice channel, and refund/fulfillment operator are
  deferred until D2/D3 selection, but must be named before live operation.
- A local expiry, browser cancel, provider redirect, or stale operator label
  is assumed non-authoritative. Unknown cases remain in review. This is a
  fail-closed implementation invariant, not a choice of customer remedy.
- Production policy, legal terms, and live credentials are outside this
  candidate record and remain subject to the broader release gate.

## Open Questions

- Which exact offer/benefit obligations survive an automatic late-payment
  refund, and who owns a failed-refund review and buyer response?
- Which exact provider responses and event windows prove an attempt cannot
  later settle, particularly for PayPal CAPTURE and Mercado Pago Pix?
- Who owns the buyer response and audit for late payment, partial refund,
  dispute, and a historically closed staging order?
