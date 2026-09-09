# Hosted console deployment preparation

Status: staging preparation candidate; not production-ready or deployment-authorized.
Target assumption pending owner selection: private staging, one application writer,
one PostgreSQL database, Solana Devnet. No public endpoint has been started.

## Product construction frontier

Runnable now: verify the hosted image, database-session readiness, graceful stop,
and the connected browser journey against the same build. `/health` is liveness;
`/ready` returns 200 only when the existing PostgreSQL session answers within two
seconds, otherwise 503. It neither reconnects stale state nor checks Solana RPC.
A readiness failure must remove the instance from traffic; Compose health status
alone does not restart unhealthy containers. Disconnected in-memory reads remain
possible until the operator removes or restarts the process.

The single-writer lock excludes participating new instances. Stop the previous
writer before replacement. Do not use active-active replicas or transaction
pooling. Existing binaries and direct SQL are outside that exclusion.

Construction blockers for public beta: resource-abuse limits and authentication
perimeter, recovery-secret loss/compromise decisions, complete frozen-build
browser recovery run, real wallet compatibility, and current product review.
These do not prevent local staging preparation. Passing focused tests does not
refresh historical acceptance-bound digests or establish aggregate conformance.

## Operational support (operator owned)

1. Select provider, audience, domain, TLS termination, and private-access method.
   Compose exposes only 127.0.0.1:8080; keep it private until that decision.
2. Supply KEP_DB_PASSWORD outside Git. Use a generated hexadecimal password (for
   example 32 random bytes encoded as hex), because it is embedded in a database
   URL. Do not use the validation placeholder. Do not print resolved Compose
   configuration or secrets in receipts.
3. Build with `docker compose -f compose.yaml build application` from this folder.
   The hosted Dockerfile uses repository-root context with a Dockerfile-specific
   allowlist. It compiles the UI-enabled hosted binary, not the API-only server.
   Existing JS bundles must pass `npm test` before image construction.
4. Rehearse against a new disposable database. Verify readiness becomes unhealthy
   after its writer connection is terminated, and a replacement reloads state.
   The new PostgreSQL test covers session loss and takeover without live data.
5. Back up PostgreSQL and restore into an isolated database. Verify originals,
   account ciphertext, metadata, and journal consistency; select RPO/RTO and an
   independent backup destination. A recovery file is not a payload backup.
6. Select backup retention compatible with file expiry. Expiry does not revoke
   downloaded copies or prove backup erasure. Never purge historical archives
   as an implied deployment preparation step.
7. Record exact image digest, source manifest, test receipts, migration state,
   rollback plan, and operator ownership before any separately authorized rollout.
   Rollback must account for database compatibility; an older binary is not
   automatically a safe rollback target.

Compose applies a read-only application filesystem, temporary /tmp, dropped
capabilities, and no-new-privileges. The non-root image receives SIGTERM during
normal container stop. The database volume remains persistent.

## Deferred operational residue

Provider/domain/TLS/private access, credentials, remote backup and restore drill,
monitoring/alerts, disk and memory sizing, incident owner, and rollout/rollback
approval remain unselected or unverified. No production readiness, publication,
release, or deployment is claimed. Historical evidence stays unchanged; source
changes require a new product evidence epoch before product approval.
