# KELD SDK integrations

Sandbox candidate connecting Stripe cards, Mercado Pago Pix and PayPal to the
existing commerce ledger. Authentication consumes the shared Auth Foundation
session package; KELD does not implement another identity provider.

From this directory, with the sibling `domainspec-core` checkout available:

```sh
npm ci --ignore-scripts --install-links --no-audit --no-fund
npm test
```

Validated on Node 26.8.1 and Python 3.14. Tests use real SDK serialization and
intercept outgoing requests; network access is disabled. Each test gets a temporary
SQLite ledger and a small delivery fixture, removed afterward. OIDC/PostgreSQL
are substituted in tests; this is not a live merchant or identity-provider test.

To configure the real sandbox application, copy `config.example.json` to a
private JSON file, fill in the non-secret account/configuration fields, and supply
the named `KELD_*` environment values through your local secret mechanism. Paths
inside the JSON are resolved relative to that file. Then run from this directory:

```sh
npm run check-config -- /absolute/path/to/config.json
npm start -- /absolute/path/to/config.json
```

`check-config` reads local files and validates the certificate, fixture integrity,
configuration and required environment values. It makes no network requests and
prints no secret values. The example intentionally fails until configured; it
contains no exchange-rate assumption or usable credentials.

`start` binds only `127.0.0.1`, checks listener availability before initializing
Auth Foundation's session schema, then serves HTTPS at the configured origin.
Startup is an explicit database migration boundary. SIGINT/SIGTERM close the
listener and session pool. Trust your local certificate in the test browser;
this launcher does not modify trust stores or provision an identity provider.

To reconcile already-bound sandbox payments without a buyer returning, run:

```sh
npm run reconcile -- /absolute/path/to/config.json
```

This explicitly contacts merchant sandbox APIs to retrieve payment status and may
update the local ledger. It does not create payments, capture approved PayPal
orders, issue refunds or initialize the session database. Each batch checks up to
20 records; pass the returned `next` order ID as a second argument for the next
batch. Start without a cursor on the next sweep. Mixed failures return a nonzero
exit code while preserving completed results. Nothing is scheduled automatically.
The same app configuration and local preflight are required; an expired quote
policy is allowed because reconciliation uses the order's frozen amount.

See [integration contract and next tasks](../docs/SDK-INTEGRATION.md) for mounting,
configuration, verification and the Open Questions owned by that document.

Process due verified notifications from the integrations directory:

```sh
npm run process-events -- /absolute/path/to/config.local.json
```

This trusted local command handles at most 20 due inbox entries, rechecks merchant
payment state through the SDKs, and settles verified bound orders. It never creates
or captures payments. Missing bindings and provider failures retry with persisted
backoff; unsupported events enter review. A nonzero exit indicates retries, review
or failed completion in this batch. An empty batch does not establish that the
queue is empty: future retries and terminal review records are not selected.
No scheduler or retention purge is installed. Expired quote policies are accepted
because order amounts are frozen; other local preflight requirements still apply.
See [worker contract and Open Questions](../docs/WEBHOOK-DESIGN.md).

Inspect the complete queue, including work that is not currently due:

```sh
npm run inspect-events -- /absolute/path/to/config.local.json
npm run inspect-events -- /absolute/path/to/config.local.json review
```

Pass the returned numeric `next` cursor after the state to read the next page.
Output includes global counts and remaining capacity. Exit zero reports a
successful inspection, not queue health. This command makes no merchant calls;
see [inspection semantics and Open Questions](../docs/WEBHOOK-DESIGN.md#operator-queue-inspection).

After correcting the cause of a reviewed event, use the event ID and generation
from inspection to request another verification attempt:

```sh
npm run retry-event -- /absolute/path/to/config.local.json stripe evt_REPLACE GENERATION configuration-corrected
```

Use a numeric generation, not the literal placeholder. Allowed reasons are
`configuration-corrected`, `binding-restored`, and `provider-recovered`. This only
queues a fresh worker attempt and records the review action; it grants no access.
See [retry contract and Open Questions](../docs/WEBHOOK-DESIGN.md#audited-review-retry).

Run one maintenance cycle or explicitly keep processing:

```sh
npm run maintain -- /absolute/path/to/config.local.json once
npm run maintain -- /absolute/path/to/config.local.json watch 60
```

One cycle processes an event batch, one reconciliation page and queue inspection.
Watch mode waits after each cycle and handles SIGINT/SIGTERM without taking new
work. No service is installed. Run one instance per ledger and inspect pending,
review and failed counts; a cycle result is not full lifecycle acceptance.
See [runner contract and Open Questions](../docs/WEBHOOK-DESIGN.md#opt-in-maintenance-runner).

Recover a completed payment whose creation response was lost:

```sh
npm run recover-payment -- /absolute/path/to/config.local.json LOCAL_ORDER_ID PROVIDER_RESOURCE_ID
```

Use the merchant's existing Checkout Session (Stripe), Payment (Mercado Pago), or
Order (PayPal) ID. Fresh SDK verification must match the exact frozen order.
Unpaid attempts and active creation leases are rejected; late payments require
review. No payment is created/captured. See [recovery contract and Open Questions](../docs/SDK-INTEGRATION.md#recover-a-lost-paid-payment-binding).

For an uncertain Stripe or Mercado Pago order whose provider ID is unknown:

```sh
npm run discover-payment -- /absolute/path/to/config.local.json LOCAL_ORDER_ID inspect
npm run discover-payment -- /absolute/path/to/config.local.json LOCAL_ORDER_ID recover
```

The default inspects a bounded search. Explicit recovery requires one verified
paid candidate. Empty, ambiguous, incomplete and unpaid results do not create a
new payment or free a reservation. See [coverage limits and Open Questions](../docs/PAYMENT-DISCOVERY.md#implemented-mercado-pago-command).

Stripe discovery checks the merchant and scans at most five pages of 20 sessions.
A truncated scan cannot recover automatically. See [Stripe coverage and Open Questions](../docs/PAYMENT-DISCOVERY.md#implemented-stripe-scan).

Optional real-browser check using existing local tools (no automatic installation):

```sh
npm run test:browser -- /absolute/playwright/index.mjs /absolute/chromium-executable
```

It serves the actual static handler on loopback with simulated API responses,
checks responsive widths and checkout/refresh/download/sign-out, and writes
screenshots plus JSON under ignored `.runtime/browser-check/`. External page
requests are blocked. See [measured evidence and limits](../docs/SDK-INTEGRATION.md#real-browser-validation-with-simulated-apis);
Open Questions remain owned by that document.

Optional shared-auth check with an isolated real PostgreSQL database:

```sh
npm run test:auth-postgres
```

Requires Docker, OpenSSL and an existing `postgres:16-alpine` image; pulls are
forbidden. It uses a temporary loopback database and signed HTTPS issuer fixture,
then removes its resources. Existing auth configuration/databases are not used.
This verifies storage, token checks, KELD callback/PKCE/nonce handling, renewal
and revocation against a local protocol fixture, not real Keycloak login.
See [evidence, limits and Open Questions](../docs/SDK-INTEGRATION.md#real-postgresql-and-shared-token-verification-check).

Restore an existing unpaid checkout whose creation response was lost:

```sh
npm run resume-checkout -- /absolute/path/to/config.local.json LOCAL_ORDER_ID PROVIDER_RESOURCE_ID
```

Fresh SDK checks must match the frozen order and an eligible open payment. Local
expiry is enforced again at binding. The command never creates/captures payment
or grants access. Buyers restore the checkout through account history and confirm
normally. See [resumption contract and Open Questions](../docs/SDK-INTEGRATION.md#resume-a-lost-unpaid-checkout).

Preview completed-event archival with an explicit receipt-time cutoff:

```sh
npm run archive-events -- /absolute/path/to/config.local.json RECEIVED_BEFORE_SECONDS preview
npm run archive-events -- /absolute/path/to/config.local.json RECEIVED_BEFORE_SECONDS apply
```

Replace the cutoff placeholder with Unix seconds. Apply moves at most 100 completed
receipts, preserving duplicate/conflict protection and review history. It excludes
active/review events and never changes payment or access state. This frees active
queue slots, not necessarily disk space. See [archival limits and Open Questions](../docs/WEBHOOK-DESIGN.md#completed-event-archival).

Stage a private runtime that does not depend on the sibling checkout:

```sh
npm run stage-runtime -- /absolute/path/to/new-runtime-directory
npm run test:portable
```

Staging refuses an existing destination. It includes allowlisted application and
ledger sources, the unchanged Auth Foundation source package, pinned dependency
manifests and file hashes. It excludes operator configuration, credentials,
databases, caches, tests and ARE release archives. The generated README describes
installation; source-owned notices are preserved. This remains a private sandbox
candidate, not a license or deployment approval.

The portable check stages into temporary storage, installs from the existing npm
cache, checks package independence, runs the default tests, removes development
dependencies and checks runtime imports. Use `npm run test:portable -- --allow-network`
only when registry access is desired for missing cached dependencies. Lifecycle
scripts stay disabled. Temporary staging and installed dependencies are removed
on normal exit or errors. See the integration contract for Open Questions.
