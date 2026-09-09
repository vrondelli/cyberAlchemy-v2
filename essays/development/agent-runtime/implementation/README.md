# Essays Agent Runtime Candidate

The candidate uses one Rust semantic kernel and one SQLite event store across
the CLI, Unix framed-JSON IPC, authenticated HTTPS/SSE, and Tauri clients.
Client payloads never carry trusted actor authority: local clients derive a
principal from Unix peer credentials, while remote clients use one-time pairing,
scoped leases, and ES256 DPoP proofs with replay protection.

## Implemented surfaces

- expected-revision and canonical command-digest idempotency;
- durable proposal creation plus Work Owner accept/reject disposition;
- qualified workspace snapshots with proposals, evidence, freshness, and cursor;
- sufficient/insufficient/indeterminate context with inference controls;
- persisted event replay plus live SSE continuation;
- bounded Unix-domain socket listener;
- loopback HTTP or TLS-required non-loopback service;
- one-time pairing, scoped leases, ES256 DPoP verification, and JTI replay guard;
- deny-by-default Playwright and Wasmtime subprocess supervisors;
- explicit uncertain-effect reconciliation and redacted browser evidence custody;
- a Tauri client linked directly to the same local semantic kernel.

## Commands

```bash
cargo run --bin essays -- execute command.json
cargo run --bin essays -- snapshot default
cargo run --bin essays -- pair-code --scopes runtime:read,runtime:command
cargo run --bin essays-ipc -- --socket /tmp/essays-agent-runtime.sock
cargo run --bin essaysd
```

A non-loopback listener additionally requires `--tls-certificate`,
`--tls-private-key`, and an HTTPS `--public-base-url`.

## Evidence boundary

The L0-L4 implementation bytes and tests are authored, but the test campaign
has not yet been executed. Live browser, WebAssembly, credential, remote,
publication, and deployment effects remain disabled and require separate exact
authorization. Exact implementation-binding refresh, independent conformance,
and pre-merge owner review follow successful local validation.
