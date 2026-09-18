# Mercado Pago Orders implementation and acceptance

Date: 2026-09-18. Bounded implementation authorized by “so execute the plan”.
D65 chain and live acceptance criteria: [migration DAG](MERCADO-PAGO-ORDERS-PLAN.md).
This is a sandbox candidate, not a production release or a claim of merchant compatibility.

## Implemented contract

- [Orders adapter](../integrations/src/mercadopago-orders.mjs) uses the installed
  Mercado Pago 3.6.1 Order and User SDK clients. Test seller identity, Brazilian
  account and `test_user` tag are checked before create and every authoritative lookup.
- New deployment configuration selects `orders-v1` and requires the application ID.
  Token syntax is `APP_USR-`; syntax alone does not prove sandbox access.
- Each attempt freezes its API identity. Old rows without it remain Payments rows.
  Existing numeric IDs retain the legacy read/recovery adapter; new Orders creates
  never fall back to Payments. An uncreated legacy attempt under Orders configuration
  is rejected rather than silently migrated. Keep the old credentials/account
  available for separately draining legacy data if they differ from the Orders seller.
- Provider `ORD...` binds the checkout; final `PAY...` identifies the entitlement
  payment. The 63-character external reference contains the local order ID and a
  120-bit SHA-256 comparison checksum binding release, amount/currency, expiry,
  seller, application, sandbox and API. This checksum is not authentication.
- One aggregate validator checks required fields and reports paths/reason codes
  without values. Exactly one Pix transaction and exact decimal totals are required.
  A fresh GET, final `processed/accredited` state, matching paid totals, and absence
  of refund/chargeback transactions are required before entitlement creation.
- Accepted processing responses persist the remote order. The buyer retries its
  same checkout after 1, 2 and 4 seconds, then offers manual resume. These refreshes
  use GET, never a second create. Atomic cached-response updates cannot downgrade
  a ready response back to preparing. Ownership and local expiry are checked.
- [Webhook verification](../integrations/src/events.mjs) admits Orders IDs, uses the
  SDK’s exact-case HMAC contract and verifies original 10/13-digit timestamp bytes.
  A separate five-minute freshness check handles seconds and milliseconds. Body
  status, identity, amount and environment are never payment evidence.
- Existing inbox deduplication, worker, reconciliation and recovery perform fresh
  validation. Discovery scans at most five pages of 20 IDs and never treats an
  empty/incomplete search as permission to create again.
- Deployment provisioning and example configuration now select Orders. Stripe,
  PayPal and authentication behavior are preserved.

## Validation evidence

[Orders tests](../integrations/test/mercadopago-orders.test.mjs) exercise SDK HTTP
requests, the actual SQLite ledger, asynchronous Pix readiness, authenticated
webhook receipt/worker settlement, duplicate delivery, repeated confirmation and
buyer-owned exact download. They also cover aggregate rejection, wrong/live seller,
malformed or stale signatures and bounded search. Provider responses are synthetic.
[Buyer tests](../integrations/test/buyer.test.mjs) check preparing-state persistence
and stable retry keys across reload. [Provisioning tests](../deploy/test_prepare.py)
exercise the real copied secret store and private file rendering.

Validation results: full integration suite **85/85 passed**; final focused Orders
and runtime configuration check **12/12 passed**; private provisioning **4/4 passed**.
Commands: `npm --prefix keld-project/integrations test`,
`node --test --test-concurrency=1 keld-project/integrations/test/mercadopago-orders.test.mjs keld-project/integrations/test/runtime.test.mjs`,
`python3 -m unittest discover -s keld-project/deploy -p test_prepare.py`.
An earlier parallel run hit ledger timeouts under host load; deadlines were not
relaxed. The subsequent full suite and final focused checks passed.
The source-only candidate contains 49 allowlisted files; its [source manifest](../deploy/orders-source-manifest.json) records hashes. Image `keld-sandbox:orders-candidate` built successfully (472,898,267 bytes):
`sha256:fff936e122f71cd1e28a6fb904f36d7e7367e03b4f139d4dea43dbef0de8e427`.
A non-root, read-only, network-disabled container smoke test passed SDK imports,
Python/SQLite preparation and binding, frozen API identity, and atomic Pix refresh
that rejects a downgrade from ready to preparing. This image was not deployed.

A pre-existing PayPal test counted admission-rate checks as inbox storage; its
assertion now verifies admission and event storage separately.

## Live staging gate

The configured local operator vault has no available merchant credentials, and a
read-only VPS check found no rendered `mercadopago` or `mp_webhook` secret files
under `/opt/keld-staging` (maximum depth four). No genuine Orders request was sent.
No app cutover, payment configuration upload or credential replacement was performed.
Existing VPS infrastructure and ARE remain unchanged.

Provide the application’s test seller ID, application ID, Orders test token and
webhook signing secret through the existing private vault workflow. Set the webhook
URL to `https://staging.keld.studio/events/mercadopago`, topic **Order (Mercado Pago)**.
Confirm the notification registration belongs to that test application/account.
Do not switch to a real seller token to bypass a failed preflight.

The live acceptance sequence remains: verify seller/account -> create synthetic
APRO Pix order -> observe processing/QR and reference round trip -> receive real
signed event -> fresh paid GET -> one owned synthetic download -> replay and
second-buyer denial -> evidence record. Test search/recovery against this same
online Pix account before declaring that operational path validated.

## Open Questions / blockers

1. **Currency proof:** published Pix examples omit `currency`, while SDK response
   types expose it. The adapter deliberately requires authoritative `currency=BRL`;
   it rejects an otherwise successful response when currency is absent. This may
   block the first real create/GET and remains a compatibility gate. Do not remove
   the check or substitute unsigned webhook values. A response rejected after
   POST retains an uncertain local attempt for reconciliation, not a new payment.
2. Confirm that this merchant’s `/users/me` response exposes `test_user`, `MLB`
   and `BR`, and that the order returns the expected application ID. Missing proof
   rejects the request rather than treating an APP_USR prefix as sandbox evidence.
3. Verify the real notification’s case/timestamp convention. Current behavior
   follows the installed official SDK’s exact-case contract, with no alternate
   signature trials. Capture only redacted fixture evidence, never the signing secret.
4. Validate online Pix search filters/pagination and external-reference constraints
   against the merchant API. Local SDK mocks establish our behavior, not provider support.
5. Remote Pix expiration is provider-controlled in this candidate; the local one-hour
   reservation independently expires and late payment requires review. Verify remote
   expiration and idempotency retention before cutover; no TTL equivalence is claimed.
6. Back up and inventory any ledger present at cutover. Once Orders rows exist,
   rollback must retain the Orders reader; never restore an older ledger over payments.

Primary contracts: [Pix testing](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/integration-test/pix),
[Orders notifications](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/notifications),
[official SDK](https://github.com/mercadopago/sdk-nodejs/tree/master/src/clients/order).
