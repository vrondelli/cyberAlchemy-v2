# Hosted Devnet Knowledge Exchange

Status: complete local candidate vertical; D65 conformance not yet evaluable

This successor turns the accepted encrypted durable Devnet protocol into a
network-addressable, non-custodial application boundary for an originator and
an independently controlled recipient.

```text
A browser/wallet --signed ciphertext command--> Rust HTTP API
Rust HTTP API --snapshot + journal + archive--> PostgreSQL
A wallet --signed transaction--> Solana Devnet KEP program
Rust HTTP API --finalized status + exact account bytes--> Solana Devnet RPC
B browser/wallet <--ciphertext + B-only envelope-- Rust HTTP API
B browser --local private key--> exact plaintext
```

## Package map

- `definitions/`: six capability-local definition candidates with formal,
  plain-language and product-context voices.
- `product-capability.json`: canonical-schema-valid no-price hosted outcome and
  exclusions; `product-capability-candidate.json` binds its exact bytes without
  adopting them.
- `ontology/`: durable business-system bridge package.
- `domainspec/`: authored source plus deterministic graph, system ontology and
  bridge compiler.
- `implementation/`: Rust API, Ed25519 authorization, Devnet finality adapter,
  PostgreSQL persistence, participant-side browser workbench, container
  candidate and two-party test.
- `evidence/`: bounded local assessment; never an admission decision.

## Reproduce

```bash
python3 definitions/validate.py
python3 validate-product-capability.py
python3 ontology/validate.py
python3 domainspec/compile.py --check
python3 implementation/author_binding.py --check
cargo test --manifest-path implementation/Cargo.toml --test third_party_vertical -- --nocapture
(cd implementation && npm run check:ui && npm run check:bundle)
python3 validate.py --write-evidence
```

## Current boundary

The behavioral vertical is implemented and locally testable. Definitions,
Product Capability, ontology, DomainSpec, generated system ontology and exact
implementation binding remain candidates. No VPS deployment or credential use
has occurred, and the application does not submit Solana transactions.
