# Durable Storage Rust reference realization

This standalone Rust crate implements the admitted provider-neutral storage
port and a bounded local-filesystem reference adapter. It is suitable for
local conformance evidence and later consumer specialization. It is not a
production-provider selection or an availability, cryptographic-security,
publication, or deployment claim.

The adapter uses domain-separated SHA-256 byte identities, atomic file writes,
read-after-write verification, typed failures, and ordered envelope reissue.
It rejects plaintext, unwrapped content keys, private keys, and credentials.

Run locally with:

```text
cargo test --manifest-path cyberAlchemy-v2/product/knowledge-exchange-protocol/capabilities/durable-storage/runtime/Cargo.toml --all-targets
```
