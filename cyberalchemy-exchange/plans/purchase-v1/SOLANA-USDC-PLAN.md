# Purchase v1: Solana and USDC construction plan

Date: 2026-09-08. Owner: CyberAlchemy Exchange product owner.
Status: candidate implementation plan; no execution admission or deployment.
User decision: “yes, plan the next steps”, accepting Solana settlement and USDC
after the preceding proposal. This supersedes the open chain/currency choice and
mock-first sequencing in the [earlier plan](PLAN.md). Its [analysis](ANALYSIS.md)
and [check evidence](evidence.json) remain historical evidence, not fresh test results.
The earlier [Define intake](../../../define/reviews/cyberalchemy-exchange/INTAKE.md)
remains the source for prior product decisions; its unresolved chain choice is
resolved by the user decision recorded here, without rewriting historical records.

## Implementation status — 2026-09-08

The [local candidate](../../capabilities/project-purchase/v1/README.md) implements
S0 core baseline recovery, S1 candidate contracts/compiler bindings, S2 rollback
proof, S3 v2 membership/reissue, S4 escrow/refund, S5 encrypted PostgreSQL delivery
and S6 reference API/CLI/browser paths. The seller console still accepts prepared
signed JSON; it is not a finished seller dashboard. Existing v1 hosted bindings
remain historical; a relocation-only successor is evidence, not admission.

Current product frontier: freeze and review the exact local candidate against
[its test evidence](../../capabilities/project-purchase/v1/evidence/test-report.json).
S7's public Devnet portion remains deferred pending an exact SBF/deployment
binding. No real-money or deployment authority follows from local tests. The
[Devnet readiness envelope](../../capabilities/project-purchase/v1/DEVNET-READINESS.md)
owns that operational work. Malformed-envelope detection remains a real-money
blocker, not a reason to hide the working local prototype.

## Result and accepted boundaries

Build an API-first project purchase using USDC escrow on Solana, existing KEP
encryption, and nonexclusive co-ownership. KEP remains internal to Exchange.
Unlock commits the grant, seller payment and completed order in one chain
transaction. Before commitment, expiry refunds escrow; after commitment, delivery
is recoverable without another payment. Local decryption triggers the existing
automatic delivery acknowledgement, not a second purchase acceptance.

The chain cannot atomically store our PostgreSQL records or deliver a file to a
browser. Exchange must retain ciphertext and the buyer envelope before authorizing
Unlock, then reconstruct delivery entitlement from finalized chain evidence after
any restart. Exchange retains no plaintext or content keys. Existing free sharing
remains intentional and separate from a purchase; this is not redistribution control.

First deliverable: two independent clients complete a project purchase locally
with real KEP encryption and real Solana program execution using a valueless test
token. Mock state-machine tests support development but do not establish atomic
settlement. Public Devnet verification follows the local candidate.

## Source findings that determine the work

- [KEP chain grant](../../knowledge-exchange-protocol/runtime/solana-program/src/lib.rs)
  currently requires the originator signature and rejects another grant when
  `has_recipient` is set. The hosted owner collection does not remove this chain
  limit. A multi-buyer marketplace needs a compatible chain-state successor.
- [Hosted transaction verifier](../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/src/transition.rs)
  requires exactly one matching top-level KEP instruction, while ignoring other
  program instructions. It neither verifies purchase settlement nor recognizes a
  KEP grant invoked inside a purchase program. Do not weaken it into accepting any
  transaction containing a vaguely matching grant.
- [Client grant workflow](../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/ui-src/console-session.js)
  prepares the recipient envelope and submits a grant. Purchase preparation must
  stop before that standalone grant, retaining seller authorization explicitly.
- [File delivery](../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/src/file_routes.rs)
  and [durable storage](../../knowledge-exchange-protocol/capabilities/hosted-devnet-exchange/v1/implementation/src/store.rs)
  supply recovery building blocks, but not a paid retention reservation or order ledger.

Solana supports atomic transactions and calls between programs. The proposed
composition is an engineering design, not an already-tested property of KEP.
See [transactions](https://solana.com/docs/core/transactions) and
[cross-program invocation](https://solana.com/docs/core/cpi). Circle lists native
USDC on Solana and a separate Devnet mint in its
[official token addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses).
Pin cluster, program IDs, token program and mint in each tested environment;
local test tokens must never be presented as redeemable USDC.

## Proposed contract and transaction

Use an Exchange purchase program with per-order state and a program-controlled
token vault. Prefer its `unlock` instruction calling KEP and the token program,
then completing the order; S2 proves feasibility before committing to the layout.
Authorization must be enforced by the program, not merely by the transaction
builder. Seller authorization, buyer approval and Exchange readiness authorization
are distinct roles. Exchange cannot impersonate an originator through a program call.

Bind each order to buyer identity/wallet/key version, authorized seller, immutable
offer terms, artifact/version/epoch, expected KEP revision, envelope and ciphertext
commitments, payment mint/amount, fee amount/destination, deadline, retention term,
and unique operation ID. Use checked integer token units, never floating point.
Keep delivery bytes off-chain. Freeze funded terms; changes require a new order or
an explicit precommit transition rather than silently replacing buyer consent.

Proposed transitions:

1. Create order against seller-authorized terms; funding transfers the exact amount
   into its validated vault. Caller assertions or an unrelated transfer cannot fund it.
2. Seller prepares the buyer-specific envelope using existing KEP client crypto.
   Exchange durably reserves delivery material and attests to the exact preparation.
3. Unlock validates parties, funds, readiness, deadline and unconsumed order. Invoke
   the exact KEP grant, transfer escrow to fixed recipients, and complete the order.
   Any instruction failure rolls back these state changes; network fees are separate.
4. Expire/refund is allowed only for an uncommitted funded order at or after the
   chain deadline. Unlock requires chain time strictly before the deadline. Both
   contend on the same order state; neither an HTTP timeout nor a local timer refunds.
5. Finalized chain state authorizes delivery. An ambiguous submission is reconciled
   before resubmission/refund. Store the signature before submission; return the
   original receipt on exact API replay. A restarted service rebuilds missing local
   projections without recharging or inventing another grant.

Chain completion is authoritative for payment and ownership. Local readiness and
retrieval state are separate; “submitted” is not “committed”. Fail closed on unknown
chain status. Storage loss after commitment requires recovery, not automatic reversal.

## Ordered steps and acceptance evidence

| Step | Work | Completion evidence |
| --- | --- | --- |
| S0: restore baseline | Materialize locked dependencies using the shared toolchain; reproduce focused client/Rust tests; prepare explicit relocation manifest successors without rewriting historical admission. | Runnable baseline and exact failure list; missing UI assets tracked separately. |
| S1: bind purchase contracts | Carry accepted decisions into candidate Define records; model Offer, Order, Escrow, Readiness and receipts through business ontology, Alch/DomainSpec, compiled graph and native effects. Define account layouts, signers and invariants. | D65 trace from definitions to each transition and test; explicit generated versus handwritten boundaries. |
| S2: prove atomic execution early | Build a small local Solana execution harness with existing KEP and test-token transfer under the proposed purchase instruction. Initially require the originator to co-sign. Measure size, compute and signer limits. | Successful grant/payment/order update plus forced failures before and after grant/payment with all state rolled back; no payout-only entry path. |
| S3: support real marketplace ownership | Design a versioned KEP membership representation preserving original owners, multiple buyers, per-recipient envelopes and reissue semantics. Define seller authorization for existing co-owners and funded-order conflicts. Keep legacy accounts supported or explicitly version-isolated. | Same version sold to two buyers; both retain access; original owners preserved; unauthorized seller denied; migration/version boundary tested. |
| S4: complete escrow lifecycle | Implement exact funding, authorized readiness, Unlock, expiry/refund, replay guards and receipt verification. Bind all account owners, program IDs, mints, vault authorities and destinations. | Conservation of tokens, concurrent unlock/refund, duplicate/reordered requests, wrong mint/account/signer, stale revision and deadline boundary tests. |
| S5: connect delivery and recovery | Extend hosted persistence, journal and chain reconciliation; reserve ciphertext/envelope before readiness; handle crash windows and finalized evidence; add a dedicated verifier for the selected purchase composition. Preserve free-grant verification. | Restart after each boundary; delayed RPC/finality; lost response; no access through accidental legacy-route bypass; saved client file and automatic receipt retry. |
| S6: finish API and user journey | Offers/orders/fund/prepare/unlock/status/access/refund interfaces, CLI commands and UI over the same contracts. Show seller-signature waits, submitting, recovering and refunded accurately. | Two-client end-to-end purchase, second buyer, API/UI parity, wallet rejection, interrupted download and recovery without another charge. |
| S7: freeze local candidate, then Devnet | Run required suites and record exact sources; provide one reproducible local demo. Prepare a separate Devnet deployment envelope with test mint and operator setup. | Reviewed local product candidate; after deployment authorization, real Devnet signatures and balances proving success, refund and recovery. |

Dependencies: S0 enables executable evidence; S1 precedes implementation; S2 proves
the settlement mechanism before expanding S3–S6. S3 and S4 join before final hosted
integration. S7 requires all local evidence. A one-buyer S2 spike is not the finished
marketplace. Extend existing KEP under Exchange rather than forking its cryptography.

Proposed new capability home: `cyberalchemy-exchange/capabilities/project-purchase/v1/`.
Reuse internal KEP runtime, hosted service and clients at the linked boundaries.
Specify exactly which Alch/DomainSpec outputs are generated and which Rust effects
implement them; existing hosted Rust is not automatically generated by Alch.

## Test obligations beyond the happy path

- Escrow release cannot succeed without the exact authorized grant; failed token
  transfer cannot leave a grant or completed order behind.
- Unlock and refund cannot both win, including after an RPC timeout or restart.
- Buyer key rotation, envelope changes, stale revisions and concurrent purchases
  never redirect paid access. Repreparation requires fresh binding/consent where needed.
- Multiple buyers and repeated retrieval preserve all existing memberships.
- Incorrect content key in an otherwise well-formed envelope is tested with real
  crypto. A correct digest alone is not evidence of successful buyer decryption.
- Readiness record persistence failure prevents signing readiness. Crash after chain
  commit but before local save recovers from chain plus retained delivery material.
- Receipt deadline and storage expiry cannot delete material reserved for paid recovery.
- Real program execution supplies atomicity evidence; mock success fixtures do not.

## Product frontier and operational support

Current frontier: S0 baseline recovery and S1 candidate contract work. Runnable work:
focused dependency/check preparation and concrete account/transition/test mapping.
No mainnet funds or public deployment are needed for S0–S6. Under CAV2-D65, preserve
definition → product capability → business ontology → DomainSpec/compiled graph →
system ontology → native implementation → exact tested candidate → product review.
Goals admission remains blocked; this document is a planning candidate, not an
admitted construction binding. Exact source/selector dependencies are the linked
KEP and purchase sources; no candidate ontology-runtime prerequisite is introduced.

| Operational task | Owner | Affected step | Causal blocker / disposition |
| --- | --- | --- | --- |
| Locked dependencies and local Solana test environment | Implementation owner | S0/S2 | Required to execute program tests; use repository Rust/C launcher and preserve pins. |
| Relocation manifests and selected bindings | Binding owner | S0/S1 | Required for source-current claims; preserve old receipts. |
| Disposable PostgreSQL | Implementation owner | S5 | Required for durable restart/transaction tests; not contract drafting. |
| Missing presentation assets | UI owner | S6/full UI binding | Scoped UI blocker; not atomic-program prototype blocker. |
| Envelope/ciphertext backup and retention operations | Exchange operator | S5 tests / public paid release | Local failure tests first; production recovery promise needs verified operations. |
| Devnet program IDs, test funds, deployment keys, RPC | Operator | S7 external portion | Separate exact deployment envelope; no local prerequisite. |
| Mainnet authority/upgrade controls, fees and security review | Product and settlement owners | Mainnet successor | Deferred; public paid release requires concrete review and authorization. |
| Standalone packaging and legacy symlink retirement | Repository owner | Distribution milestone | Separate operational scope; preserve compatibility during purchase work. |

## Open Questions

Solana, USDC, internal KEP, nonexclusive ownership, Exchange release custody and
precommit expiry/refund are settled. Remaining questions do not require reopening them.

1. **Seller signing availability:** initial spike requires an originator signature
   on the final transaction. For unattended purchases, design durable order-specific
   authorization in KEP; a prepared envelope or expired transaction signature is not
   that authorization. Product decision needed before promising offline sellers.
2. **Paid recovery duration:** recommend an explicit per-order term. Test with a
   configurable finite term; select the public promise before publishing paid offers.
3. **Malformed delivery:** determine how existing crypto detects a wrong-key envelope
   and what Exchange readiness can actually establish without plaintext/key custody.
   This remains a real-money blocker if detection is only after irreversible payment.
4. **Fees and fee payer:** zero Exchange fee and explicit test fee payer for the local
   candidate are proposed defaults; production fee schedule and sponsorship remain open.
5. **Package size and distribution:** keep one opaque archive within the existing
   10 MB bound for the local purchase. Larger projects and standalone installer timing
   remain separate scope decisions.

First implementation slice: S0 + S1, then the S2 rollback demonstration. Success is
a reproducible program-level proof, before presenting a polished purchase UI.
