# Checkout creation interface — implementation required

This is the contract used by the optional frontend live mode. There is no server
implementation or provider integration in this website package.

POST /api/checkout on the same HTTPS origin, with Content-Type: application/json:

```json
{
  "productId": "agent-reasoning-engine",
  "offerId": "release",
  "amountCents": 20000,
  "currency": "USD",
  "quantity": 1
}
```

Example response after the server has created a real checkout session:

```json
{
  "checkoutUrl": "https://YOUR-PAYMENT-PROVIDER.example/CREATED-SESSION"
}
```

The example URL is a placeholder, not a configured provider. The frontend checks
that the returned URL is HTTPS. The server must restrict returned destinations to
the actual payment provider it uses, not a URL supplied by the customer.

Server obligations:

1. Load trusted product and pricing config, independent of browser JavaScript.
2. Require the exact productId/offerId, USD currency and quantity 1.
3. Require an integer amountCents between 5000 and 100000 inclusive. Never silently
   replace an invalid amount with the default, and never parse fractional cents.
4. Create a provider checkout for the selected subtotal; do not use a fixed-price
   catalog entry that overrides the buyer's amount. Keep taxes and the final total
   clear on the hosted payment page.
5. Protect the endpoint appropriately for the deployed application: validate
   origins, apply rate limits and use server-side idempotency/order handling.
6. Persist the expected order amount, currency, product and release. Verify the
   provider payment server-side before enabling delivery. Do not trust query
   parameters, checkoutUrl navigation or local/session storage for entitlements.
7. Return a non-2xx response on rejection/failure; do not return private engine
   download URLs, API keys or payment secrets.

The browser has a 15-second checkout-creation timeout and prevents concurrent
button submissions. Those controls do not replace server-side idempotency or
payment verification. Local QA does not verify a live payment provider.

The hidden-shelf interface only controls discovery. The accepted server range
is still $50–$1,000, independent of any client-side discovery state.

## ARE alpha / first-100 entitlement contract

The capped benefit is not implemented by this front end. The commercial rules
now require a server-side early-supporter service before live mode may be enabled.

- Serve authoritative alpha status, first-100 availability and purchase terms;
  do not accept an eligibility flag or count from the browser.
- The cap is 100 customers, not 100 tabs, bags, downloads or payment callbacks.
  Identify a purchasing customer server-side; repeat purchases must not create
  extra customer slots or silently restart the benefit year.
- Use transactional capacity control through checkout and verified payment so
  concurrent purchases cannot oversell the promised benefits. Eligibility and
  inclusion must be clear before payment and recorded on the order. If the offer
  becomes unavailable, request a new review rather than silently dropping it.
- Grant the services only after verified successful payment. Record the program
  version, customer/order reference, verified purchase time, and a calendar-year
  expiry (12 months) in trusted storage. Replayed callbacks must be idempotent.
- The chosen price within the accepted range must not alter the first-100
  benefits. Hidden-shelf discovery is only presentation, never an eligibility
  requirement. The underlying software license remains Apache 2.0.
- Provide authenticated recovery/download access and a real direct-maker support
  channel. The one-year entitlement is to updates as released and direct support;
  no response SLA, release frequency or specific feature is promised here.
- Include allocation, upgrade and support information in a real confirmation.
  Do not create a fictitious customer number or paid confirmation in this demo.
- Confirm how cancellations/refunds affect slots and entitlements before launch.
  Do not recycle or remove slots based on client-side state.

`earlySupporter.entitlementReady` only gates frontend live mode. Setting it
does not create a database, allocate a place, validate a payment or provide support.
