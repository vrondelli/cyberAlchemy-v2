# KELD React staging acceptance

- **Status:** staging root and self-registration entry active; all three sandbox provider journeys pass
- **Observed:** 2026-09-19
- **Route:** `CA2-ROUTE-PUBLISH`
- **Public test URL:** `https://staging.keld.studio/`
- **Compatibility alias:** `https://staging.keld.studio/react-preview`
- **Exact image:** `sha256:2f8cbbe1ae86dc5f6f35b34e17f15f21c652070d9ae69f41bc0af87d296f2dcd`
- **Rollback image:** `sha256:132eeeb6f60c382fe51e6151d95ea1d4918b29a74c47c7087849b44050cebf4a`
- **Authority effect:** none

This report records the exact React staging-root candidate and bounded sandbox
evidence. It does not approve production payments or commercial release.

## Gate state

| Gate | State | Evidence ceiling |
| --- | --- | --- |
| G0 — Stripe slice | Pass | Real hosted Stripe sandbox checkout, KELD-side verification, and digest-checked delivery completed on the immediately preceding candidate; the exact final image restored and delivered that entitlement after the PayPal-only repair |
| G1 — Hosted parity | Pass for the reviewed hosted scope | Anonymous browse, legend, local inquiry draft, hidden price, account history, ownership denial, logout, mobile layout, keyboard dialog behavior, and reduced motion passed |
| G2 — Provider reliability | Pass | Stripe, Mercado Pago, and PayPal each complete provider approval/payment, KELD-side verification, and digest-checked delivery; shared recovery and ownership checks pass |
| G3 — Owner cutover | Pass | Owner authorized the staging-root cutover; `/` serves the React parity storefront and `/react-preview` remains a compatibility alias |
| G4 — Staging signup entry | Pass for bounded form acceptance | Anonymous `Create account` starts the normal PKCE/OIDC authorization flow with `prompt=create` and reaches the dedicated Keycloak registration form; no customer record was created during this acceptance |

## Exact-build verification

- React typecheck, production build, and 11 client/actual-handler
  tests passed. Two consecutive builds produced identical file hashes.
- The packaged runtime passed all 93 backend integration tests after the
  Mercado Pago identifier and PayPal presentment-currency corrections.
- Both dependency trees reported zero `npm audit` vulnerabilities.
- The image runs as `10001:10001`; its configured environment contains no
  payment, OIDC, session, database, or webhook credential.
- The HTML is `no-store`. Hashed assets are immutable. CSP retains self-only
  scripts/styles/images/connections plus `object-src 'none'`, `base-uri 'none'`,
  and `frame-ancestors 'none'`.
- Unknown assets, source maps, unknown API routes, and nested preview routes
  return 404. The unauthenticated session boundary returns 401.
- The final rollback rehearsal served prior image
  `sha256:4fa309a112a73d65d03cd215d689eda41cb56e894fed181a93538727e1d46902`,
  restored the exact final image, and preserved all ten commerce-ledger rows
  present at the boundary.
- Root-cutover browser acceptance passed the anonymous desktop journey, shop →
  bag → secure-checkout entry, 390-pixel mobile layout with no horizontal
  overflow, and the KELD-to-ARE link. The unauthenticated `/api/session` probe
  correctly returns 401 and appears as a failed-resource entry in browser
  developer tools; there were no JavaScript exceptions or warnings.
- Signup browser acceptance passed from the public staging root to
  `auth.staging.keld.studio`: the authorization request retained PKCE and used
  `prompt=create`; the registration form exposed email, password confirmation,
  first name, last name, Register, and Back to Login controls with no console
  errors or warnings. The realm requires unique email identities and a minimum
  12-character password with upper-case, lower-case, and digit rules.
- Email verification and password reset remain disabled because staging SMTP is
  not configured. This is a test-environment boundary, not a production account
  recovery or abuse-prevention claim.

## Staging journeys

### Hosted experience

- Public browsing works without authentication.
- The six-scene legend advances, opens in a keyboard-operable modal, traps
  focus, closes with Escape, and returns focus to the exact opener.
- The hidden price shelf discloses the accepted USD 50–1,000 range.
- The contact form prepares a local draft and sends nothing.
- Account history contains only the current buyer's orders. A direct attempt by
  buyer A to restore buyer B's order returned the enumeration-resistant
  `404 not-owned` response.
- Logout revoked the application session and returned to the signed-out React
  surface. Desktop and 390-pixel mobile views produced no page errors.

Evidence:

- [`registration-form.png`](../../output/playwright/signup/registration-form.png)
- [`hosted-staging-journeys-evidence.json`](../../output/playwright/journeys/hosted-staging-journeys-evidence.json)
- [`staging-quality-evidence.json`](../../output/playwright/journeys/staging-quality-evidence.json)
- [`10-legend-cinema.png`](../../output/playwright/journeys/10-legend-cinema.png)
- [`11-hidden-price-and-checkout.png`](../../output/playwright/journeys/11-hidden-price-and-checkout.png)
- [`12-contact-draft-local-only.png`](../../output/playwright/journeys/12-contact-draft-local-only.png)
- [`13-account-history-owned-only.png`](../../output/playwright/journeys/13-account-history-owned-only.png)
- [`14-signed-out.png`](../../output/playwright/journeys/14-signed-out.png)
- [`15-mobile-public-browse.png`](../../output/playwright/journeys/15-mobile-public-browse.png)
- [`18-keyboard-modal-focus.png`](../../output/playwright/journeys/18-keyboard-modal-focus.png)

### Stripe

Candidate `sha256:4fa309a112a73d65d03cd215d689eda41cb56e894fed181a93538727e1d46902`
created a new retry-safe checkout, navigated only to `checkout.stripe.com`,
completed a genuine sandbox card payment, treated the return page as
unverified, asked Stripe from the server, and delivered the 208-byte fixture.
The PayPal-only repair did not change the Stripe adapter; the exact final image
then restored the paid entitlement and downloaded the same fixture with SHA-256
`233a65486c8f3ef9ecae954704be8b55c6bca5827c8f2b0cd309123a51b88769`.

Evidence:

- [`react-full-stripe-evidence.json`](../../output/playwright/journeys/react-full-stripe-evidence.json)
- [`19-final-stripe-signed-in.png`](../../output/playwright/journeys/19-final-stripe-signed-in.png)
- [`20-final-stripe-hosted-checkout.png`](../../output/playwright/journeys/20-final-stripe-hosted-checkout.png)
- [`21-final-stripe-return-unverified.png`](../../output/playwright/journeys/21-final-stripe-return-unverified.png)
- [`22-final-stripe-payment-verified.png`](../../output/playwright/journeys/22-final-stripe-payment-verified.png)
- [`23-final-stripe-artifact-downloaded.png`](../../output/playwright/journeys/23-final-stripe-artifact-downloaded.png)

### Mercado Pago Orders Pix

A live Orders response exposed a 32-character `ORD…` identifier, while the
adapter had accepted only 29 characters. The adapter and signed Orders webhook
contract now accept the provider's bounded 29–32-character uppercase shape and
still reject short, long, or lowercase identifiers.

On candidate `sha256:4fa309a112a73d65d03cd215d689eda41cb56e894fed181a93538727e1d46902`,
a new invited buyer created a fresh Pix order directly, without operator repair.
The browser received the server-frozen BRL quote and Pix code. Mercado Pago's
APRO test transition then became paid; KELD verified it from the provider and
delivered the digest-checked 208-byte artifact. The PayPal-only repair did not
change the Mercado Pago adapter; the exact final image restored that paid order
and downloaded the same artifact again.

The recovery matrix also proves that a fresh tab blocked by an existing
server-side checkout clears only its unused rejected local key, explains the
next action, and restores the server-owned order from history. Expired Pix
instructions are hidden.

Evidence:

- [`mercadopago-probe-evidence.json`](../../output/playwright/journeys/mercadopago-probe-evidence.json)
- [`mercadopago-confirm-evidence.json`](../../output/playwright/journeys/mercadopago-confirm-evidence.json)
- [`existing-checkout-recovery-evidence.json`](../../output/playwright/journeys/existing-checkout-recovery-evidence.json)
- [`07-mercadopago-checkout-created.png`](../../output/playwright/journeys/07-mercadopago-checkout-created.png)
- [`16-mercadopago-payment-verified.png`](../../output/playwright/journeys/16-mercadopago-payment-verified.png)
- [`17-mercadopago-artifact-downloaded.png`](../../output/playwright/journeys/17-mercadopago-artifact-downloaded.png)
- [`24-existing-checkout-recovered.png`](../../output/playwright/journeys/24-existing-checkout-recovered.png)

### PayPal

The original USD order restored correctly and preserved the same request key on
cancel, but PayPal rejected approval with `UNSUPPORTED_PAYEE_CURRENCY` because
the configured Brazilian sandbox merchant did not accept that presentment
currency. The payment contract now makes PayPal currency explicit (`USD` or
`BRL`). For this merchant, KELD freezes the same configured BRL quote used by
the commerce service while preserving the customer's USD input and the quote
reference in the ledger and browser response.

On the exact final image, a fresh PayPal order presented USD 50 as BRL 257.88,
opened only `www.sandbox.paypal.com`, authenticated the personal sandbox buyer,
completed approval, returned to KELD as unverified, and was captured and
verified only through the authenticated server boundary. Delivery produced the
same 208-byte artifact with SHA-256
`233a65486c8f3ef9ecae954704be8b55c6bca5827c8f2b0cd309123a51b88769`.

Evidence:

- [`paypal-probe-evidence.json`](../../output/playwright/journeys/paypal-probe-evidence.json)
- [`paypal-cancel-evidence.json`](../../output/playwright/journeys/paypal-cancel-evidence.json)
- [`paypal-complete-evidence.json`](../../output/playwright/presentation/paypal-complete-evidence.json)
- [`08-paypal-sandbox-approval.png`](../../output/playwright/journeys/08-paypal-sandbox-approval.png)
- [`25-paypal-cancelled-and-recoverable.png`](../../output/playwright/journeys/25-paypal-cancelled-and-recoverable.png)
- [`17-paypal-approval-review.png`](../../output/playwright/presentation/17-paypal-approval-review.png)
- [`18-paypal-return-unverified.png`](../../output/playwright/presentation/18-paypal-return-unverified.png)
- [`19-paypal-payment-verified.png`](../../output/playwright/presentation/19-paypal-payment-verified.png)
- [`20-paypal-download-complete.png`](../../output/playwright/presentation/20-paypal-download-complete.png)

## Open Questions

1. Do the legacy standalone offline exports remain a supported product, or may
   they remain on the legacy generator while the hosted React surface advances?
2. Which SMTP provider, verification policy, password-recovery policy, and
   public-signup abuse controls must be admitted before production release?
