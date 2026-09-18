# Launch checklist — ARE alpha and first-100 offer

## Confirmed commercial model

$200 base; the buyer may choose $50–$1,000 USD inclusive. One downloadable release,
one-time purchase, the same Apache 2.0 software license regardless of amount.
Cents are supported. These values are stored as 20000, 5000 and 100000 USD cents.
ARE is explicitly alpha. The first 100 customers receive 12 months of upgrades
as released and direct maker support from purchase, at every accepted price.
No automatic renewal, fixed release cadence or response-time guarantee is stated.

## Still needed

Publish the real engine version, archive contents, tested installation steps,
supported runtimes, release notes and checksum. Implement the one-year update
access and direct-support service, and confirm the real support channel.
Approve purchase, privacy, refund and tax handling for the actual merchant.
Connect a real contact destination. The first-100 update/support offer is now
published in the prototype; it must be operational before charging customers.
Existing license notes describe the engine, not the Keld trademarks.

## Payments

Do not redirect to a fixed-price link. The browser submits its selected amount to
a server checkout-creation endpoint; the server validates the product, currency,
quantity and integer USD cents against its own configuration, then creates the
provider checkout. See CHECKOUT-CONTRACT.md for the exact interface.

The server/provider must determine the actual charge and applicable taxes. The
amount shown in this preview is a product subtotal, not a tax-inclusive guarantee.
Use a provider-supported hosted payment flow; no card fields belong in this site.

Verify payment server-side. A success/return URL and browser flags are never
payment proof. Match verified currency, amount, status, product and order identity.
Handle retries and repeated notifications idempotently. Provide the correct release
only after verified payment, with a recovery path for delivery failures. Keep
archives, keys and download tokens out of public JavaScript.

## Configure only after the service exists

Set `checkoutEndpoint` in assets/shop-config.js to a same-origin HTTPS endpoint
such as `/api/checkout`, plus the real release/delivery description and HTTPS
purchase-terms, privacy and refund pages. After testing the complete flow set
`approvedForSale: true`, `fulfillmentReady: true`,
`earlySupporter.entitlementReady: true` and `mode: 'live'`.
Do not set the entitlement flag until capped first-100 eligibility and support/
upgrade access are implemented server-side. This flag is a launch gate, not proof
of any buyer's eligibility.

The endpoint must be served on the same HTTPS origin as the storefront; local
HTTP and file previews cannot accidentally activate live checkout. The front end
fails back to preview if any required field is missing. No values are enabled in
the delivered files. Run `python build.py` after changes.

The live branch sends the amount, awaits a valid HTTPS checkout URL and navigates.
Errors keep the price in the bag and show a retry message. It never treats a
request or redirect as payment success and never reveals a fake live download.

Update preview-specific editorial content, site information and no-script
messaging only after their replacements reflect the actual deployment. Review
accessibility, browser/device behavior and every product claim before publishing.

## End-to-end acceptance cases

Test $50, $200, $1,000 and custom cents; reject 49.99, 1000.01, fractional cents,
negative/empty amounts, manipulated product/currency/quantity and tampered carts.
Test double submission, payment cancellation, provider failure, delayed payment,
webhook retries, release download retry and recovery. Verify the real provider
shows the chosen subtotal before payment, including any applicable tax treatment.

## Early-supporter readiness

Read `ALPHA-OFFER.md` and the additional checkout contract requirements. Confirm
the one-year period starts at verified purchase and applies to both services.
Define how eligible customers receive each upgrade and contact the maker.
Handle duplicate notifications, repeat buyers, cancellations, refunds, and
concurrent purchases around the cap without silently changing a paid offer.
Do not allocate a place from a browser, cart, preview checkout, query parameter
or local/session storage. Do not show a remaining count until there is a reliable
server source. Stop presenting the first-100 benefits as available once the
program is full; later service terms have not been defined.
