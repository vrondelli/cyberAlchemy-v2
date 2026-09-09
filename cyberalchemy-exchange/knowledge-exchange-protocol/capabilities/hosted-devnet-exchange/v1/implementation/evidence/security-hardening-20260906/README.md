# KEP hardening candidate — first tranche

Date: 2026-09-06. Classification: product construction, owner-directed local implementation and tests. No product approval, release or deployment claim.

## Changes

- API admission is shared across router clones: four concurrent handler/body reads, 240 requests per minute globally, and ten telemetry requests per minute. Rejections are HTTP 429 with Retry-After. Liveness/readiness bypass these budgets. Body collection has a 15-second deadline and route-specific byte limits; it occurs before the handler so a timeout cannot cancel a database write.
- Every HTTP candidate write checks collection, metadata and storage growth before persistence. Defaults: 2,048 records per main collection, 128 telemetry records, 1,024 retained attempts per file, 16 MiB serialized metadata, 128 MiB total encoded payload plus metadata, and 32 MiB encoded account/original payload per originating wallet. Limits are explicit Rust configuration via `Application::with_limits`; hosted binaries currently use these defaults.
- Capacity errors return HTTP 507 and preserve the prior state. Existing over-limit records are not deleted; non-growing writes can continue. Limits are checked under the same write lock as persistence, so concurrent writes cannot race the quota.
- Identical telemetry retries do not clone/rewrite application state or append another state-journal event. The separate telemetry journal insert remains idempotent and retryable after a partial failure. Conflicting content under the same attempt ID is rejected.
- Unauthorized file uploads are rejected before ciphertext decoding/hashing. Downloads and acknowledgements no longer trigger a database-wide expiry sweep before authentication. The existing background sweep remains; time-based access denial still applies immediately.
- All browser/Rust authorization constructors now use the `ca2:kep:authorization:v2:` envelope with structured fields, action, canonical service audience, exact Devnet genesis and program ID. Registration/artifact/grant/access/reissue, file commands, and account messages are covered. Rust/browser fixture vectors agree. Field separators no longer change field boundaries.
- All three generated JavaScript bundles were rebuilt from the changed sources.

## Signature compatibility

This is a strict verifier upgrade, not a dual-acceptance transition. Legacy v1 signatures are rejected. The server and all clients must switch together; stale tabs must reload and operations need fresh signatures. No private key, public identity, encrypted account, file, historical receipt, or old upload-message record was migrated or deleted. Stored account encryption/AAD is unchanged; its authorization format changes independently.

The audience is intentionally fixed to `https://kep.cyberalchemylab.com` for this candidate. Local fixtures use that same audience to test the canonical service. This does **not** isolate local testing from production by itself. A separately deployed service must select a different audience in both signer and verifier before use; a generic configurable multi-deployment signing context remains future work.

Pending uploads created under the old signature format need explicit reconciliation before cutover: an already stored upload retains its old upload-message string, so a new-format replay is not automatically treated as its exact retry. Reading and accessing existing records use freshly signed commands. Do not delete recovery files or pending state as a migration shortcut.

## Validation

- 19 normal Rust tests passed, including nine new security tests.
- Five PostgreSQL tests passed, each suite in its own disposable database: account reload, atomic file expiry with preserved legacy archive, persistence recovery, writer fencing, and duplicate-telemetry/quota persistence. The new persistence test confirms two identical reports create one application journal event and one telemetry row, and a rejected overflow does not survive reload.
- 48 JavaScript tests passed; all three bundle comparisons and the paper-generation check passed.
- Signature tests check field-boundary differences, action/audience binding, valid legacy-signature rejection, and shared browser/Rust vectors.
- Capacity tests cover HTTP rejection before parsing, shared rate budgets, independent telemetry budget, immutable duplicates, over-limit preservation and wallet/global byte ceilings.

See the adjacent logs, `before-sha256.json`, and `after-sha256.json`. Tests validate these cases; no destructive load test, public exploit test or real wallet transaction was performed. The currently running preview and public deployment were not restarted or upgraded.

## Current frontier and remaining work

S1 resource exhaustion is **partially mitigated**, not closed. Candidate checks still happen after cloning the bounded state. Full-state cloning, per-save traversal, unbounded lifetime event-journal growth, HTTP connection/slow-response limits, and fair admission against wallet/IP rotation need further work. Global rate limiting protects capacity but can itself be consumed by one abusive client. It is not a fairness guarantee.

Attempts remain capped and preserved rather than pruned, because pruning without fresh signed request timestamps/tombstones could permit replay. Reaching a ceiling denies new work; this tranche does not silently change the agreed one-year-since-download retention policy. Acknowledgements have a separate bounded 4 MiB metadata/storage reserve so ordinary admission exhaustion does not immediately block completion. Even this reserve is finite; incremental persistence and retention of operational journals should precede broad public cutover.

S2 delimiter ambiguity is corrected in the current v2 constructors/verifier; compatibility and per-deployment replay isolation remain explicit cutover work. S3 transaction receipt binding, S4 browser/metadata hardening, and dependency updates remain open from the audit.

Product-construction tasks runnable next: exact transaction binding; incremental persistence and attempt freshness; migration reconciliation tests. Operational-support owner is the site operator: resource limits, edge admission, headers, image scan, monitoring and independently tested backups affect deployment and remain deferred. They do not block continued local product work.

Historical audit and UX/deployment evidence remains unchanged. No commit, push, public transaction or deployment occurred. No alchLang or unrelated dirty files were edited.
