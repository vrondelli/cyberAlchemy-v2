# KELD React staging — presentation gallery

> **Historical gallery:** this records the 2026-09-19 `/react-preview` capture.
> The React storefront has since become the staging root, and the referenced
> screenshot files are not retained in the current workspace. Do not use this
> page as current release evidence. The schema-v3 r23 release manifest and its
> privacy-safe provider-paid-delivery receipt are the current machine-readable
> authority; the receipt confirms a completed PayPal delivery without exposing
> buyer or provider identifiers.

- **Captured:** 2026-09-19
- **Staging surface:** `https://staging.keld.studio/react-preview`
- **Image:** `sha256:7042d40b6d4b6b5e2262a421e658d9322b95d2bef8587fa1d44030937fc76a25`
- **Evidence:** [`presentation-evidence.json`](../../output/playwright/presentation/presentation-evidence.json) and [`paypal-complete-evidence.json`](../../output/playwright/presentation/paypal-complete-evidence.json)

These were focused customer-view frames from the then-active staging image.
They are historical presentation references, not substitutes for the machine-readable
acceptance evidence in
[`REACT-STAGING-ACCEPTANCE.md`](REACT-STAGING-ACCEPTANCE.md).

## Journey 1 — Public discovery

An anonymous visitor can understand the product and navigate the studio before
being asked to authenticate.

![Public KELD home](../../output/playwright/presentation/01-public-home.png)

## Journey 2 — Illustrated legend

The visitor advances through the six scenes and opens a keyboard-contained
cinema view. Escape closes the modal and focus returns to its opener.

![Legend cinema](../../output/playwright/presentation/02-legend-cinema.png)

## Journey 3 — Product and transparent pricing

The shop identifies the software as an alpha download and discloses the hidden
USD 50–1,000 price range without changing the release or license.

![Shop and hidden price](../../output/playwright/presentation/03-shop-and-hidden-price.png)

## Journey 4 — Local inquiry draft

The contact form creates a copyable local draft and explicitly sends nothing.

![Local inquiry draft](../../output/playwright/presentation/04-contact-draft.png)

## Journey 5 — Mobile discovery

The same public entry point remains legible at a 390 × 844 viewport.

![Mobile KELD home](../../output/playwright/presentation/05-mobile-home.png)

## Journey 6 — Owned checkout history

An authenticated buyer sees only their checkout history. The separate negative
test proved another buyer's order returns `404 not-owned`.

![Owned checkout history](../../output/playwright/presentation/06-account-history.png)

## Journey 7 — Stripe paid restoration

The buyer restores a server-verified Stripe payment. Delivery remains available
without trusting the browser return URL.

![Stripe restored paid](../../output/playwright/presentation/07-stripe-restored-paid.png)

## Journey 8 — Stripe delivery

The restored Stripe entitlement downloads the verified 208-byte artifact.

![Stripe download complete](../../output/playwright/presentation/08-stripe-download-complete.png)

## Journey 9 — PayPal expired-order recovery

The buyer restores the original PayPal order and request key rather than
creating a duplicate. Because its provider window has elapsed, the current
image hides the stale approval link and asks for verification/review.

![PayPal restored pending](../../output/playwright/presentation/09-paypal-restored-pending.png)

## Journey 10 — PayPal sandbox entry boundary

The browser reaches only the exact PayPal sandbox approval host. Credential
fields are masked in retained presentation evidence. This cancellation-path
frame predates the final BRL image; the exact final-image approval path is shown
in Journeys 15–19 and bound by `paypal-complete-evidence.json`.

![PayPal sandbox approval](../../output/playwright/presentation/10-paypal-sandbox-approval.png)

## Journey 11 — PayPal cancellation and recovery

Cancelling at PayPal returns to KELD without marking the order paid and keeps
the same saved checkout available. This retained frame is bound to the separate
cancellation evidence produced before that order expired.

![PayPal cancelled and recoverable](../../output/playwright/presentation/11-paypal-cancelled-recoverable.png)

## Journey 12 — Logout

Logout revokes the authenticated application session and returns the customer
to an anonymous checkout surface.

![Signed out checkout](../../output/playwright/presentation/12-signed-out.png)

## Journey 13 — Mercado Pago paid restoration

The buyer restores a Pix order that Mercado Pago's APRO sandbox scenario moved
to paid and KELD verified directly with the provider.

![Mercado Pago restored paid](../../output/playwright/presentation/13-mercadopago-restored-paid.png)

## Journey 14 — Mercado Pago delivery

The verified Pix entitlement downloads the same digest-checked 208-byte
artifact as Stripe.

![Mercado Pago download complete](../../output/playwright/presentation/14-mercadopago-download-complete.png)

## Journey 15 — Fresh PayPal BRL checkout

The USD 50 customer input is frozen as BRL 257.88 using the recorded quote. The
original USD amount, provider amount, currency, and quote reference remain
bound to the order.

![PayPal BRL checkout ready](../../output/playwright/presentation/15-paypal-checkout-ready.png)

## Journey 16 — PayPal approval review

The personal sandbox buyer reaches PayPal's approval surface with the BRL amount
and completes the purchase there. No payment credential is retained in KELD.

![PayPal approval review](../../output/playwright/presentation/17-paypal-approval-review.png)

## Journey 17 — Provider return remains unverified

Returning from PayPal does not mark the order paid. KELD explicitly asks the
customer to run server-side verification.

![PayPal return unverified](../../output/playwright/presentation/18-paypal-return-unverified.png)

## Journey 18 — PayPal server verification

KELD captures and verifies the approved order at the provider before exposing
delivery.

![PayPal payment verified](../../output/playwright/presentation/19-paypal-payment-verified.png)

## Journey 19 — PayPal delivery

The verified PayPal entitlement downloads the same digest-checked 208-byte
artifact as Stripe and Mercado Pago.

![PayPal download complete](../../output/playwright/presentation/20-paypal-download-complete.png)

## Resolved staging decision

The owner-authorized React root cutover is complete. `/react-preview` is now a
compatibility alias; production authorization remains a separate decision.
