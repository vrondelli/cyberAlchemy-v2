# KEP shared state candidate — 2026-09-06

Route: CA2-ROUTE-IMPLEMENT. Lane: product construction. Scope: local hosted-devnet-exchange implementation and tests; no deployment or approval claim.

## Change

Database snapshots now share collection indexes and records through Arc. A snapshot clone increments nine shared references instead of duplicating all metadata, replay IDs and retained file bytes. Changing a map detaches its sorted index (keys and shared record pointers); editing an existing record detaches only that record. Replay IDs use a shared set with copy-on-write mutation. Mutable references cannot alter older snapshots. Abandoned candidates therefore retain the existing rollback semantics, and handlers still publish a candidate only after persistence succeeds.

The map has explicit mutation methods rather than exposing mutable shared pointers. Insertions/removals do not clone existing records. `get_mut` requires Clone only for the selected record. The telemetry insertion is simplified after the existing duplicate check under the same write lock. No authorization checks were removed.

Manual serialization preserves the prior sorted map and set JSON representation. File payloads remain excluded from metadata. No schema, database migration, event format, frontend asset, cryptographic input or dependency version was changed in this epoch.

## Evidence

`cargo test --offline --locked --features ui`: 27 passed, six database tests ignored by the default invocation. All six were explicitly run afterward against separate fresh disposable PostgreSQL databases and passed. Adjacent logs retain results.

New regression evidence:

- A collection of 1,024 records containing 16 KiB each is cloned into 50 snapshots. Instrumented record Clone count remains zero. Insert/remove operations still produce zero record clones. Two edits to the same candidate record produce exactly one record clone, with all previous snapshots unchanged.
- A Database containing a 10,000,000-byte file shares the same payload allocation across snapshots and insertion into the payload index. Expiry, payload removal and replay-set mutation in a candidate leave the original snapshot intact. An unrelated identity retains its pointer identity.
- Ordinary BTreeMap and SharedMap produce identical serialized bytes; a representative legacy Database JSON round-trips unchanged and excludes file payloads.

Existing tests cover signed operations, quota rejection, account isolation, receipt binding, grants/reissues, expiry, recovery, journal failure rollback and retry, database migration, unchanged-document writes, telemetry idempotence and stale-writer fencing. PostgreSQL tests use mock finality where applicable; no public transaction was submitted.

This measures record-copy counts and pointer sharing, not process RSS, latency or throughput. No production performance claim follows.

## Frontier and residue

Current product-construction frontier: shared snapshots implemented and locally tested. Runnable follow-up: reduce repeated full metadata serialization/hashing and quota scans. Persistence still builds a full metadata JSON value to maintain the existing full-state journal digest. A changed collection still copies its index, and an edited record still copies its nested fields; this is not a persistent-tree implementation. File responses and incoming requests can still allocate large buffers. Old snapshots retain shared bytes until released; expiry removes the active-state and durable payload references, without forcibly invalidating previously held snapshots.

Operational support remains owned by the deployment operator: exact candidate review, authorized rollout and a database/binary recovery rehearsal. The binary-only rollback restriction introduced by the preceding targeted-persistence migration remains in force. These deferred operational tasks do not block further local construction. No commit, push, approval, release, deployment or preview restart occurred.

## Preserved historical evidence

Before/after fingerprints across source, tests, migrations and evidence show only three pre-existing files changed: src/model.rs, src/lib.rs and src/api.rs. The new shared-state module, regression tests and this evidence directory are additions. Existing migration files and evidence directories were not rewritten. No alchLang, unrelated dirty files or wallet keys were changed by this task. The preview and production service still run their previous builds.
