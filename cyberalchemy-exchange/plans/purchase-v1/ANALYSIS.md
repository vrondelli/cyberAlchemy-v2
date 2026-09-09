# Exchange purchase v1 — current implementation analysis

Status: candidate planning evidence, 2026-09-08. Owner: Exchange product owner.
Scope: current checkout source inspection and bounded local checks; no implementation,
Devnet calls, deployment, funds or credentials used. [Plan](PLAN.md).
Source hashes and check records: [evidence.json](evidence.json).

## Outcome

Reuse the internal KEP hosted application, client cryptography, identities,
recipient access and durable storage. Add an Exchange commercial order lifecycle.
The current code is a substantial no-price sharing application, not an escrow
purchase implementation. KEP remains part of Exchange and its encryption/custody
model is preserved. No new standalone KEP service or cryptographic replacement
is needed as a planning assumption.

Selected meaning comes from the [intake](../../../define/reviews/cyberalchemy-exchange/INTAKE.md)
and [purchase design](../../../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md):
permissionless seller entry, KEP co-ownership, escrow before delivery, one Unlock
purchase action, timeout cancellation/refund before commitment, delivery recovery
after commitment, and Exchange itself as the trusted envelope release operator.
No mandatory successful build or quality test is part of delivery acceptance.

Paths below are relative to the [KEP package](../../knowledge-exchange-protocol/README.md).
`H` means `capabilities/hosted-devnet-exchange/v1/implementation`.

## Actual workflow

| Step | Current behavior and source | Reuse or gap |
| --- | --- | --- |
| Identity/account | H/ui-src/account-client.js encrypts account snapshots; account_routes.rs authenticates account operations. Console session registers wallet/signing and encryption bindings. | Reuse; account is not automatically a market balance or tenant. |
| Package | H/ui-src/file-client.js encryptFile builds kep-original-file-v1 with name/type/size/hash and bytes; one original file, at most 10,000,000 bytes. | Reuse one opaque project archive initially; no directory extraction/execution. |
| Encrypt | H/ui-src/protocol.js encryptBytes uses a fresh content key and XChaCha20-Poly1305; sealContentKey creates HPKE recipient envelopes. | Reuse exact suites and context binding. |
| Store | H/src/file_routes.rs upload validates signed metadata/digests, persists encrypted payload and metadata. H/src/store.rs separates file payloads from metadata/journal. | Reuse; add order records and delivery reservations. |
| Prepare recipient | H/ui-src/console-session.js share uses the sender-held content key and recipient public key to create the recipient envelope, then calls /v1/grants. | Split preparation from immediate chain submission for the purchase UI. Seller preparation remains necessary. |
| Grant | H/src/api.rs prepare_grant rejects nonzero knowledge_consideration_lamports, checks authorization, current revision and recipient. finalize_grant checks a finalized exact transition then adds the owner and envelope. | Preserve no-price contract. Add a separately bounded commercial composition. |
| Deliver | H/src/api.rs access and H/src/file_routes.rs file_access require current owner authorization and return ciphertext plus that owner's envelope. | Existing grants immediately enable access; purchase grant/release must be gated together. |
| Decrypt/receipt | H/ui-src/file-client.js receive verifies ciphertext/envelope hashes and decrypts the original; console-session.js receive then acknowledges. CLI saves verified bytes before acknowledgement and can retain a pending receipt for retry. | Existing one-flow client behavior is reusable; receipt must not be a payment callback. |
| Retain/expire | H/src/files.rs sets a 900-second acknowledgement window; file_routes.rs acknowledge renews retention by one calendar year. Expiry removes payload while keeping provenance. | These are download/retention rules, not order cancellation. Keep the clocks separate. |
| Reissue | H/src/api.rs request_reissue/fulfill_reissue require recipient request, originator authorization, bound replacement key and finalized evidence. | Recovery of lost keys is not the same as retrying envelope download; seller involvement remains. |

The implementation README describes a browser workbench but the current package
also exports a CLI client and account/file console. Top-level prose and older
receipts alone are insufficient to describe this checkout's latest surface.

## Encryption responsibility, now grounded in code

KEP is internal to Exchange, but its participant-side client holds the plaintext
and content key. Console share explicitly creates and submits the recipient
envelope. Exchange's hosted service is not able to manufacture a new buyer envelope
from an opaque sender envelope alone. Account snapshots preserve sender material
inside client-encrypted account storage; server custody of those encrypted bytes
is not plaintext-key custody.

The regular workflow uses the associated content key consistently. Server
prepare_grant currently checks digest equality and signer/context bindings; it
does not decrypt the recipient envelope or prove its key matches the ciphertext.
This is an observed implementation limit, not a request to redesign KEP or add
zero-knowledge proofs. The earlier assertion that an official KEP client makes
malformed envelopes impossible was too broad. Direct API requests must remain
part of the test boundary. A wrong-key test should document the present outcome
and determine whether existing internal KEP controls suffice before real paid
settlement is enabled. Do not declare this closed because the happy path passes.

## Commercial gaps

1. **No offer/order/escrow state.** H/src/model.rs contains identities, artifacts,
   grants, reissues, accounts and files. Its grant has Prepared/Finalized status;
   there is no purchase, funding, refund, payout or price snapshot.
2. **No-price is intentional.** H/src/api.rs rejects nonzero consideration;
   runtime/src/encrypted_durable_devnet/model.rs also enforces zero consideration.
   Do not remove that guard to imply the admitted sharing capability supports sales.
3. **No atomic purchase/grant.** PostgreSQL save atomically writes documents,
   journal and relevant payload changes, and keeps a single-writer session lock.
   Solana finality happens outside that transaction. Existing local transactions
   do not make external payment, chain membership and access release atomic.
4. **No cancellable prepared grant lifecycle.** A pending grant has no purchase
   expiry. A sender can submit its grant transaction separately; cancelling a
   local order cannot undo a finalized chain membership. Commercial preparation
   must not be treated as an already-active grant.
5. **No durable commercial replay result.** Operation identifiers and revision
   checks exist, but finalize_grant returns conflict for an already-finalized
   grant. Order retries need authoritative receipt lookup and exact-request replay,
   not blind resubmission of legacy finalize.
6. **Handoff metadata is part of delivery.** The client needs policy, plaintext
   commitment, ciphertext commitment, epoch, nonce and recipient/envelope revision
   from the handoff. Holding envelope bytes alone is not recoverable access.
   The purchase must persist its validated public delivery context.
7. **Retention can defeat recovery.** Existing file expiry can remove ciphertext.
   A paid delivery promise needs a retention reservation sufficient for its agreed
   recovery term, without silently changing KEP's existing policy or all free files.
8. **Seller availability is required for new recipients.** Preserve non-custodial
   KEP: seller client/agent prepares a buyer-specific envelope before Ready. Seller
   offline means waiting or eventual expiry/refund, not server-side rewrapping.
9. **Marketplace discovery is missing.** Identity/artifact metadata routes are not
   offers with typed terms, price and immutable delivery commitments.

## Alch and DomainSpec reuse

The existing [Alch/KEP agent exchange](../../knowledge-exchange-protocol/capabilities/alchlang-agent-exchange/v1/README.md)
contains exchange-model.alch, an authored DomainSpec project and a compiler path,
plus a local Rust KEP bridge. It models ExchangeEnvelope, CompilationReceipt,
DeliveryReplay and CompiledBundle. It is evidence of an integration pattern;
it is not the commercial order model and its bridge is not the hosted service.

The hosted DomainSpec compile.py reads authored JSON nodes/edges and materializes
a graph, system ontology, bridge and receipts. The Rust API is separately authored.
Do not claim that current hosted Rust behavior was generated from Alch. Purchase
work should explicitly map Alch domain terms to DomainSpec bindings, then bind
native persistence/cryptography/settlement responsibilities to those contracts.
Compiler support for transactions and effects must be assessed against the selected
profile; domain declarations alone do not implement distributed atomicity.

Inference is still a separate working offering implementation in the Alch prototype.
The common commercial model should allow offering_kind plus versioned fulfillment
terms. Purchase v1 proves only project access. Do not force streaming inference into
KEP file grants or move the inference prototype as part of this plan.

## Fresh checks and evidence limits

| Check run now | Result | Meaning |
| --- | --- | --- |
| npm run check:ui | 19 passed; 6 test-file load failures | Missing @hpke/core and @solana/web3.js; not a passing full client suite. |
| Focused offline Rust tests: third_party_vertical, file_lifecycle, receipt_binding | Could not start | Cargo cache lacks bs58; no Rust behavioral PASS claimed. |
| Hosted domainspec/compile.py --check | FAIL: source-manifest.json and compilation-receipt.json stale | In-memory comparison confirms manifest differences are relocation paths only; graph, system ontology and bridge bytes match. |
| implementation/author_binding.py --check | Cannot complete | Missing external arcanum/docs/assets/cyberalchemy-mark.svg; do not silently substitute an asset or refresh binding. |

Logs are retained under [checks](checks/). Missing dependency materialization is a
local baseline task; no compiler installation is required by this finding.
The [relocation check](../../RELOCATION.json) separately records unchanged top-level
model/white-paper drift and file preservation. It did not cover hosted compiler
path-manifest currency. The broader inspection here exposes that additional task.
No package installation, live service call, full browser run, PostgreSQL test or
Solana submission was performed for this analysis.

## Open Questions

The [plan](PLAN.md#open-questions) owns product and construction questions. Key
unresolved technical boundaries are grant/payment atomicity, retention-backed
recovery and evidence of paid-delivery correctness under malformed client input.
