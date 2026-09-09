# Hosted Devnet Knowledge Exchange Vertical

Status: implemented candidate plan
Owner: Knowledge Exchange Protocol product owner
Route: `CA2-ROUTE-IMPLEMENT`
External-effect authority: none

## Objective

Let an originator and a genuinely separate recipient use an online service to
exercise the no-price Knowledge Exchange Protocol on Solana Devnet without the
service receiving either party's wallet secret, encryption private key,
content key, or plaintext knowledge.

## D65 construction order

```text
KEP-HOST-D1..D6 definitions
  -> CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE
  -> CA2-ONTOLOGY-KEP-HOSTED-DEVNET-EXCHANGE
  -> DomainSpec source hosted-devnet-exchange
  -> deterministic graph + system ontology + bridge
  -> Rust HTTP application + PostgreSQL adapter
  -> functional and conformance evidence
```

Every artifact remains a candidate until its own owner makes a digest-bound
decision. Passing tests do not perform those decisions.

## Delivery slices

1. Model the wallet, browser cryptography, hosted custody, finality and recovery
   boundaries.
2. Accept only wallet-signed canonical commands and ciphertext-bearing data.
3. Prepare a grant, observe its transaction as finalized on Devnet, then expose
   the recipient envelope to that recipient.
4. Accept a recipient-signed reissue request and originator-signed fulfillment
   without changing membership, artifact version, policy or encryption epoch.
5. Persist a recoverable ciphertext-only snapshot and append-only journal in
   PostgreSQL while preserving an SQL-independent repository port.
6. Demonstrate the complete flow with two distinct Ed25519 identities and
   client-side authenticated encryption.

## Excluded effects

- VPS login, DNS mutation, TLS issuance or remote deployment
- Mainnet, payment, price, royalty, licensing or reputation
- custody or logging of user secrets or plaintext
- reuse of any disposable Devnet-trial credential
- upgrade-authority transfer, program deployment, commit, push or publication

