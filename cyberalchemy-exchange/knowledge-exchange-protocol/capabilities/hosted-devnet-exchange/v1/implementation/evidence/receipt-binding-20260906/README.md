# Exact transaction receipt binding — 2026-09-06

Product-construction candidate, implemented and tested locally. No product approval, publication, deployment, live transaction, or site-wide security clearance.

## Change

Both grant finalization and key-reissue fulfillment now call `FinalityGateway::observe_transition` with an expectation constructed from the hosted operation and identities. The old `observe` method remains diagnostic only, including its CLI caller; it is not used by either effect-bearing HTTP handler.

The verifier requires:

- Exact Devnet genesis and a successful finalized status.
- Matching transaction signature, successful transaction metadata, and agreement between status and transaction slots.
- A supported legacy or version-0 compiled transaction. Version-0 account indices resolve through static keys followed by loaded writable and readonly addresses.
- Exactly one direct, top-level KEP instruction; reference to the program in an account list is insufficient.
- Correct payer/originator signer roles, writable mutation accounts, system-program role, and canonical artifact/replay PDAs.
- For grants: exact recipient wallet, encryption-key commitment, envelope commitment, expected revision, and operation-ID digest in the instruction bytes.
- For reissues: exact replacement envelope/revision and recipient request PDA, plus the replay PDA derived from the executed fulfillment nonce. The existing hosted API does not separately carry a named fulfillment operation ID; this patch does not invent one or claim that extra correlation.
- A finalized artifact read with `minContextSlot` at least the verified transaction slot, matching returned context, originator and recipient-key commitment. Existing handler checks still match artifact ID, recipient, envelope and resulting revision and recheck local state before writing.

Unknown/finished grant operations are rejected before RPC work. Reissue authorization is verified before RPC work and revalidated against current local state before persistence. The database lock is not held while RPC calls run. No historical state or receipts were rewritten.

## Source alignment

Instruction layouts, seeds and artifact-field order were checked against `../../../../runtime/solana-program/src/lib.rs` (`ProtocolInstruction`, `ArtifactState`, grant/reissue handlers) and the current browser builders in `ui-src/protocol.js`. Recipient-key commitment is bytes 202..234 of the 338-byte Borsh artifact record. The local RPC fixture serializes the declared fields in order, using distinct values for adjacent fields.

RPC structure references: [Solana JSON structures](https://solana.com/docs/rpc/json-structures) and [getTransaction](https://solana.com/docs/rpc/http/gettransaction). These document compiled instructions, transaction metadata/version and account-key resolution; local program source owns KEP-specific semantics.

## Evidence

- 24 normal Rust tests passed, including five new receipt-binding tests; five environment-dependent database tests are ignored by the default suite.
- The targeted PostgreSQL persistence/recovery test passed against a new disposable database. Its finality gateway is a test double; it does not prove chain verification.
- 49 JavaScript tests passed, including reconstruction of the legacy grant/reissue and version-0 fixtures from the actual browser instruction builders.
- Three browser-bundle consistency checks and the paper-generation check passed. Runtime JavaScript was unchanged, so no bundle rebuild was required.
- A loopback HTTP RPC fixture exercises the actual `DevnetRpc` path, accepting the matching transition and rejecting an unrelated transaction and stale account state.
- Negative fixtures cover absent/duplicate KEP instructions, failed/missing transaction metadata, mismatched signatures/slots, invalid signer headers, out-of-range indices, unsupported versions, wrong artifact PDA, altered instruction commitments/revisions/nonces and missing version-0 loaded addresses.

See `rust-tests.txt`, `js-tests.txt`, `postgres-tests.txt`, the transaction fixtures and `source-sha256.json`. Fixtures contain no real signatures or private keys and were not broadcast.

## Compatibility and limits

Only one direct KEP transition is accepted per transaction. CPI-only KEP calls, batches containing multiple KEP operations, unknown transaction versions and incomplete RPC evidence fail closed. Current browser builders use the supported direct form. Current-state revision matching remains conservative: a later transition can make an old receipt ineligible, as before.

This verifier trusts the configured RPC and the bound program. It is not an independent consensus or cryptographic transaction-signature verifier, a deployed-program binary attestation, or a complete program audit. Existing mock observations intentionally remain state-only test doubles. No public RPC exploit test, new wallet transaction, deployment or preview restart occurred.

## Next frontier

S3 is addressed for the current supported direct grant/reissue paths at the local candidate level. Full-state persistence, lifetime journal growth, admission fairness, signature-upgrade reconciliation, browser/metadata protections and dependency maintenance remain open from earlier evidence.

Runnable product-construction work: replace whole-state writes with targeted persistence and test recovery/rollback; reconcile pending old-signature operations before cutover. Operational-support owner: site operator; deployment-stage resource controls, backup restore, image scan and monitoring remain separate deferred work. They do not block independent local construction.

Previous audit and first hardening evidence remains historical and untouched. Unrelated dirty files, alchLang work and saved keys were preserved. No commit or deployment was performed.
