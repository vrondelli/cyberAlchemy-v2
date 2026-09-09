# KEP CLI and API

Status: tested first-release product candidate. Package publication and hosted deployment remain separate decisions.

The first release supports account creation and authentication, public identity export, exchange listing, send, receive and acknowledgement retry. Reissue remains explicitly outside this release.

The CLI performs account and exchange work without a browser or Phantom. It uses the same canonical authorization messages, encryption, envelope and Solana instruction implementations as the console. Wallet, recovery and content keys remain local. Every command verifies `/health` against the expected hosted Devnet capability, network, program and ciphertext-only custody before authentication.

Run `node cli/kep.mjs --help` from the source checkout or `kep --help` from an installed candidate package. All account-backed commands require an explicit API origin, Solana CLI keypair and KEP recovery file:

```bash
node cli/kep.mjs account create \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json

node cli/kep.mjs login \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json \
  --json

node cli/kep.mjs identity export \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json \
  --output recipient.json
```

Send and receive an original file:

```bash
node cli/kep.mjs send original.png \
  --to recipient.json \
  --handoff-output handoff.json \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json \
  --accept-retention \
  --approve-transactions

node cli/kep.mjs receive handoff.json \
  --output received.png \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json \
  --accept-retention
```

`send` authorizes two Devnet transactions and possible network fees. It never exports a handoff until the recipient grant is finalized. `receive` decrypts and verifies before writing with exclusive-create semantics. Existing output files are preserved unless `--overwrite` is explicit.

`send` writes an encrypted journal beside the handoff as `<handoff>.kep-send.json`. Repeat the same command after an interruption to resume the exact prepared ciphertext, operation IDs and known transaction signatures. Use `--journal FILE` to select another private journal path. The journal is bound to the API origin, wallet, original path, recipient and handoff path, and is removed only after the handoff is safely written.

If the original is verified and saved but acknowledgement fails, the CLI writes `<output>.kep-receipt.json`. Retry only that receipt:

```bash
node cli/kep.mjs acknowledge received.png.kep-receipt.json \
  --api https://kep.example \
  --keypair /private/solana-id.json \
  --recovery /private/kep-recovery.json
```

The retry reuses the original attempt and signed authorization when present. After success the receipt file becomes a non-secret acknowledgement record. `exchanges list` reads the encrypted account state and supports `--json`.

## Programmatic API client

Import `createApi`, `createAccount`, `openWorkspace`, `sendFile`, `receiveFile`, or `acknowledgeReceipt` from `cli/client.mjs`. Callers inject `fetchImpl`, `approve`, and transaction adapters for isolated testing. Direct HTTP clients must reproduce the exact versioned messages and cryptographic formats in `ui-src/protocol.js`, `ui-src/account-client.js`, and `ui-src/file-client.js`; endpoint names alone are insufficient.

The CLI does not provide bearer sessions, password resets, mainnet, deletion, revocation or reissue. It does not silently discover keys. Reissue is a later release; current commands must not claim it.

## Local package rehearsal

`package.json` contains an exact 11-file product allowlist in addition to npm's package metadata and README. A release operator can create a candidate tarball with `npm pack --pack-destination <private-directory>` and install that exact tarball in a clean directory. This is a local rehearsal path, not a registry publication instruction.
