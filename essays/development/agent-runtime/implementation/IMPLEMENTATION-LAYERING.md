# Essays Runtime Implementation Layering

## L0 — Reproducible semantic predecessor

After this layer, we know whether authored DomainSpec materializes twice to
byte-identical graph bytes. The compiler performs two in-memory loads and fails
rather than writing a nondeterministic result.

## L1 — Kernel integrity

After this layer, we know whether one verified principal, canonical command
digest, expected revision, and SQLite FULL-synchronous transaction can protect
proposal creation and Work Owner accept/reject disposition. Characterization,
collision, authorization, conflict, and reopen tests are authored.

## L2 — Qualified projection and client parity

After this layer, we know whether snapshots, event cursors, CLI, Unix IPC,
HTTP/SSE, and Tauri share one command and projection model. Bounded framing,
body, connection, stream replay, and timeout surfaces are implemented.

## L3 — Isolated extension and effect recovery

After this layer, we know whether Playwright and Wasmtime remain external,
deny-by-default, time- and output-bounded processes; uncertain browser outcomes
cannot retry implicitly and require evidence-backed reconciliation.

## L4 — Platform and remote boundary

After this layer, we know whether Linux local clients and HTTPS remote clients
can use the same kernel without transport-derived authority. Unix credentials,
one-time pairing, scoped leases, ES256 DPoP, proof replay protection, rustls,
and a direct-kernel Tauri shell are implemented.

## Deferred verification and authority

No Rust, Tauri, Playwright, Wasmtime, protocol, or conformance test has been run
against these revised bytes. Binding refresh must be performed by exactly one
bounded helper after test authorization. Independent conformance, human
pre-merge review, merge, release, deployment, and live effects remain separate.
