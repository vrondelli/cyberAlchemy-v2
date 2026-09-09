# Essays Agent Runtime L4 Status

The implementation source has reached the end of the planned L0-L4 authoring
pass. This status means the required code surfaces and their test cases exist;
it does not mean they compile, pass, conform, or are merge-ready.

| Layer | Authored surface | Current evidence state |
| --- | --- | --- |
| L0 | DomainSpec source and two-run byte comparison | local construction receipt only |
| L1 | Rust kernel, SQLite transactions, idempotency, owner disposition | tests authored, not run |
| L2 | snapshots, cursor replay, CLI, Unix IPC, HTTP/SSE, Tauri | tests and golden traces pending |
| L3 | deny-by-default Playwright and signed proposal-only Wasmtime supervisors | tests authored, live effects disabled |
| L4 | Unix peer identity, pairing, scoped leases, ES256 DPoP, TLS boundary | tests authored, protocol campaign pending |

The pre-existing implementation binding names superseded files and graph nodes
and is stale. Repository policy requires exactly one bounded native helper to
author and self-validate its replacement after the local campaign. A separate
independent validation and human pre-merge decision follow; neither is implied
by L4 authoring.
