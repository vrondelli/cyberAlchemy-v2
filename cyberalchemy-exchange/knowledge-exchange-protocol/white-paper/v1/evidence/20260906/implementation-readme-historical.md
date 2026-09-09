# Hosted Devnet Exchange Rust Application

This crate is the candidate implementation of
`CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE`. It serves a Rust HTTP API, verifies
Ed25519 wallet signatures, persists ciphertext-only state, and activates grants
or reissues only after finalized Devnet transaction and program-account
observations match the prepared command.

The root page is a browser workbench for two independent participants. It
generates X25519 keys, encrypts knowledge with XChaCha20-Poly1305, wraps content
keys with the bound RFC 9180 HPKE suite, constructs the exact deployed-program
instructions, requests wallet signatures, waits for Devnet finality, and calls
the hosted reconciliation API. Plaintext and private encryption keys remain in
the participant tab's session storage and are never API fields.

Build and verify the checked-in browser bundle with:

```bash
npm ci --ignore-scripts
npm run check:ui
npm run check:bundle
```

The current dependency audit has no critical or high findings and records one
moderate transitive advisory through `@solana/web3.js -> jayson -> uuid`. The
interface does not call the affected UUID APIs, but that is not a proof of
non-exploitability. The residue must be closed or explicitly adjudicated before
any production security claim.

## Run locally

Volatile mode exists only for demonstration:

```bash
CA2_KEP_ALLOW_VOLATILE=1 cargo run --bin server
curl http://127.0.0.1:8080/health
```

PostgreSQL mode is the VPS baseline:

```bash
CA2_KEP_DATABASE_URL='postgres://USER:PASSWORD@127.0.0.1/DB' \
  cargo run --bin server
```

The server defaults to `https://api.devnet.solana.com` and the exact deployed
program `ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1`. Override the RPC only
with `CA2_KEP_DEVNET_RPC_URL`; this does not authorize a paid endpoint.

One read-only diagnostic exercises the same production observation boundary:

```bash
cargo run --bin observe -- <transaction-signature> <artifact-account>
```

It verifies the exact Devnet genesis, finalized success, participation of the
bound program, program ownership of the account, and exact account layout. It
never signs or submits a transaction.

## API sequence

```text
POST /v1/identities
POST /v1/artifacts
POST /v1/grants
POST /v1/grants/{operation}/finalize
POST /v1/artifacts/{artifact}/access
POST /v1/reissues
POST /v1/reissues/{operation}/fulfill
```

Mutations carry a canonical message plus its base64 Ed25519 signature. Clients
must encrypt/decrypt locally and submit only ciphertext, public keys, digests
and recipient envelopes. The service does not submit or sign Solana
transactions; participant wallets do that separately.

The browser workbench is the explicit participant-side transaction surface:
after showing a confirmation, it asks the connected wallet to sign the exact
program instruction and submits those already-signed bytes to the fixed public
Devnet RPC. The hosted service still never receives a wallet secret or submits
a transaction on a user's behalf.

## Test

```bash
cargo test --test third_party_vertical -- --nocapture
```

The test uses two distinct deterministic wallet signing keys, distinct client
encryption keys, a mock with the exact finalized-observation contract, real
authenticated ciphertext, pre-finalization denial, wrong-signer rejection,
zero-price enforcement, `{A} -> {A,B}`, recipient-side decryption and key
reissue. It makes no network call and spends no SOL.

The PostgreSQL adapter has a separately gated disposable-database test:

```bash
CA2_KEP_TEST_DATABASE_URL='postgres://...' \
  cargo test --test postgres_persistence -- --ignored --nocapture
```

## VPS boundary

`compose.yaml` binds the application only to loopback. Put an HTTPS reverse
proxy in front after domain, TLS and firewall inputs are explicitly selected.
Set a strong database password outside Git. The included archive table is an
immutable logical layer, not the required independent off-host backup.
