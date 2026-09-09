# CyberAlchemy Exchange purchase prototype

Status: local product candidate, no public deployment. Owner: Exchange product owner.

Exact Devnet program identities are prepared and passed eight compiled settlement
tests. See the [deployment plan](deployment/PLAN.md) and
[review envelope](deployment/envelope.json). Funding, fee ceiling, executor setup
and deployment review remain before a live Devnet purchase.
This implements the local portion of the [Solana/USDC plan](../../../plans/purchase-v1/SOLANA-USDC-PLAN.md).
The [initial prototype report](evidence/test-report.json) retains its original source snapshot.
The [compiled-program report](evidence/sbf-test-report.json) and
[current completion evidence](evidence/sbf-completion.json) bind this successor.

## What works

A seller registers a versioned KEP artifact, publishes an encrypted project offer,
and co-signs funding with a buyer. Exchange retains ciphertext and a buyer-specific
HPKE envelope before signing readiness. The buyer signs commitments only: the
API does not return the envelope before commitment. Unlock calls KEP and the SPL
Token program in one transaction and completes the order. Failed payment rolls
back the grant; failed grant cannot pay. An operator can refund an expired order
without the buyer being online. API replay never authorizes a second charge.

Version 2 KEP artifacts use one membership account per co-owner. Multiple buyers
and resale preserve previous memberships. Requested key reissue updates only the
selected member. Legacy KEP v1 account layout and instructions remain available;
v1 accounts are not silently migrated. The new HTTP purchase surface accepts v2
artifacts; the program's rollback tests also cover existing v1 grants.

The reference service persists encrypted material and submissions in PostgreSQL.
After a service/connection restart it checks finalized chain-owned order and
membership accounts before delivery. A lost local receipt does not reverse a
committed purchase or mislabel a preparation signature as a purchase receipt.
Native program-test bank state is ephemeral; restarting that test bank is not
production ledger recovery. Its advance-clock and genesis funding operations
exist only in the local test process. The Devnet gateway has neither operation.

Client encryption, HPKE wrapping and file verification import the existing KEP
client implementation. Wallet secrets and content keys stay in clients. The
service holds only its own release signing key. The automatic delivery receipt
requires a persisted retrieval attempt; its 900-second deadline is separate from
purchase expiry and the paid recovery duration.

## Run

From the repository root, with the existing repository Rust/C toolchain and Alch
TypeScript toolchain available:

```sh
./cyberalchemy-exchange/run bootstrap
./cyberalchemy-exchange/run build
./cyberalchemy-exchange/run check
EXCHANGE_DATABASE_URL='postgresql://localhost/exchange_test' ./cyberalchemy-exchange/run demo
```

Use a dedicated PostgreSQL database owned by the test/operator. Demo IDs and
wallets are newly generated; only public wallet information is sent to the local
bank. The demo keeps no wallet keys on disk. The service takes one database writer
lock and creates its own `exchange_purchase_*` tables. A run verifies two buyers,
real crypto, real native Solana execution, rollback tests, automatic expiry refund,
service/connection restart and failures before readiness/after chain commitment.
The PostgreSQL server process itself is not restarted by this demo.

For the browser test, install the pinned Playwright browser or supply an existing
Chromium executable:

```sh
EXCHANGE_DATABASE_URL='postgresql://localhost/exchange_test' \
EXCHANGE_BROWSER_TEST=1 ./cyberalchemy-exchange/run demo
```

`EXCHANGE_CHROMIUM` optionally selects a local Chromium binary. The browser test
uses a test wallet provider signing with real Ed25519 keys; an actual wallet
extension and public Devnet have not been tested. Browser buyer/seller signing,
status and byte-exact download are exercised. Seller preparation remains a signed
JSON workflow in the prototype console, rather than a complete seller dashboard.

## API and CLI

All product transitions are reachable through APIs, including Solana transaction
submission. The Exchange service never receives buyer/seller wallet key files.

| Surface | Purpose |
| --- | --- |
| `POST /v1/offers`, `GET /v1/offers` | Publish seller-signed encrypted offers; discovery omits ciphertext/envelopes |
| `POST /v1/orders`, `GET /v1/orders/{id}` | Freeze buyer terms and read authoritative financial status |
| `POST .../fund` | Build an exact funding transaction for buyer/seller signatures |
| `POST .../prepare` | Persist seller-signed opaque delivery, return a commitment-only transaction with Exchange signature |
| `POST .../unlock`, `POST .../refund` | Build the exact settlement or expiry transaction |
| `POST .../submit`, `GET .../pending` | Collect participant signatures over the same message, journal submission, submit or resume |
| `POST .../access`, `POST .../acknowledge` | Buyer-signed retrieval and automatic, retryable delivery receipt |
| `POST .../recover` | Retain a replacement envelope after an exact KEP reissue is finalized; no new payment |

The service's `expireDue()` is the operator refund worker. The Devnet launcher runs
it periodically; its fee payer needs Devnet SOL. The on-chain clock determines
expiry, and the order account prevents refund/Unlock from both winning.

Use [client/demo.mjs](client/demo.mjs) for complete request bodies and signing
order. [client/transactions.mjs](client/transactions.mjs) exposes transaction builders
and strict account decoders; [client/receive.mjs](client/receive.mjs) composes KEP
verification, save-before-acknowledgement and receipt-only retry.

```sh
node cyberalchemy-exchange/capabilities/project-purchase/v1/client/exchange.mjs http API GET /v1/offers
node cyberalchemy-exchange/capabilities/project-purchase/v1/client/exchange.mjs sign API ORDER WALLET_FILE
node cyberalchemy-exchange/capabilities/project-purchase/v1/client/exchange.mjs receive API ORDER WALLET_FILE IDENTITY_FILE OUTPUT_FILE
node cyberalchemy-exchange/capabilities/project-purchase/v1/client/exchange.mjs acknowledge API WALLET_FILE RECEIPT_FILE
```

Private files must have mode 0600. Download refuses to overwrite an existing file.
A failed automatic acknowledgement leaves a receipt retry file alongside the saved
project. Wallet authorization signs the exact action and canonical payload.

## Construction evidence

[definition-pack.json](definition-pack.json) records Define-style dispositions,
accepted decision sources, consumers and questions. It is a locally authored
candidate, not an admitted Define runtime output. [construction.json](construction.json)
maps the capability and business invariants. [purchase.alch](purchase.alch) compiles
with the existing Alch compiler; [domainspec/project.json](domainspec/project.json)
compiles with the actual sibling `domainspec-core/projects/domainspec-v2` builder.
The build checks determinism and exact source hashes. Generated models do not
claim that Rust, SQL or HTTP effects are generated by Alch.

The source of on-chain effects is [program/src/lib.rs](program/src/lib.rs) and the
internal [KEP membership implementation](../../../knowledge-exchange-protocol/runtime/solana-program/src/membership.rs).
No canonical KEP definition or existing free-sharing price guard was removed.
The new HTTP service is a bounded purchase composition within Exchange; it imports
KEP cryptography and does not replace the existing hosted free-sharing service.

## Compiled Solana verification

The native checks remain available. To build and load the compiled programs:

```sh
tools/toolchain/run python3 tools/toolchain/solana/bootstrap.py
./cyberalchemy-exchange/run build-sbf
./cyberalchemy-exchange/run check-sbf
```

This runs the same eight settlement tests for both the local test mint and the
Devnet mint configuration, with local fixture balances. Both Exchange and KEP
must load their SBF binaries; missing or changed binaries fail the check. SPL
Token loads the compiled P-token 1.0.0 binary bundled by Agave 4.2.2. Build receipts bind
source and binary hashes. The local run passed all 16 tests; see [the report](evidence/sbf-test-report.json).
The largest tested transaction was 825 bytes and the highest compute use was
55,356 units. These measurements cover the tested cases, not every possible order.
These commands neither deploy programs nor contact a payment network.

`program/sbf-harness` isolates the current runtime and host SDK bindings. Its library
paths reference the existing purchase and KEP Rust sources directly; the deployed
SBF candidates continue to compile with their original locked dependencies. This
avoids migrating the legacy native runtime merely to interpret current ELF files.

## Open Questions and release limits

Questions are owned by the [accepted plan](../../../plans/purchase-v1/SOLANA-USDC-PLAN.md#open-questions).

- Real-money readiness is still blocked by a concrete cryptographic limit: a
  well-formed, correctly hashed envelope can wrap the wrong content key. The
  negative test reproduces detection at buyer decryption; readiness signatures
  do not prove matching plaintext or key correctness.
- Local values use a separate valueless test mint. Default program configuration
  pins Circle's Devnet test USDC mint, never Mainnet USDC. Neither program has been
  deployed in this work. Compiled-program verification passed locally for both
  mint configurations; cluster feature compatibility remains a deployment check.
- This reference API uses one knowledge identity per wallet address in its local
  binding. It does not redefine identity as a wallet, migrate existing multi-identity
  hosted accounts, or implement wallet rotation/Auth Foundation onboarding. Those
  broader identity bindings remain a successor integration.
- Seller signatures remain required for funding, preparation and Unlock. Durable
  seller delegation is not implemented. The seller may need to refresh an expired
  transaction or reprepare after another purchase changes the artifact revision.
- The local fee is zero. Public fees, sponsorship, retention commitments, backup
  operations and standalone distribution still require their defined decisions.
  Project input remains one opaque archive within the existing 10 MB limit.
- The replacement-envelope API is exercised end to end after a real local KEP
  reissue. The Devnet RPC adapter is prepared but has not been exercised against
  deployed successor programs; do not claim a Devnet product test.
- Historical hosted bindings and paper drift are not repaired by recomputing hashes.
  A relocation-only successor projection is retained as evidence, not admission.

See [DEVNET-READINESS.md](DEVNET-READINESS.md) for the next external boundary.
