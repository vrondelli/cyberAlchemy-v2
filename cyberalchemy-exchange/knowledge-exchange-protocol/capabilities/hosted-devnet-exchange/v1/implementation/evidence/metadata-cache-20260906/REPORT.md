# KEP metadata cache candidate — 2026-09-06

Route: CA2-ROUTE-IMPLEMENT. Lane: product construction. Local implementation and test evidence only.

## Result

Shared metadata collections now lazily cache canonical record JSON, document SHA-256 fingerprints and encoded byte counts. Cloned snapshots share the cache. Insert, remove and mutable-record access invalidate the candidate collection cache before mutation; the replay set similarly invalidates its encoding on mutable access. No mutation escapes through an interior-mutable application record. Generic users of SharedMap must preserve that invariant for cache correctness.

Quota validation reuses these exact byte counts instead of serializing both entire snapshots. It skips the file-attempt scan when the file collection is shared, and skips wallet accounting when accounts, identities, artifacts and payload indexes are all shared. Shared payload indexes require one length scan instead of two. Growth rules, limits and acknowledgement reserve are unchanged.

Persistence consumes cached document hashes and decodes only changed documents for SQL writes. The full v1 state SHA-256 is streamed over canonical cached bytes in the same sorted order as the previous serde_json::Value serializer. It no longer constructs a complete state Value and complete serialized byte buffer on every save. Transaction boundaries, journal format, migration logic and writer fencing remain unchanged.

## Evidence

- `cargo test --offline --locked --features ui`: 30 passed; six PostgreSQL tests ignored in this default invocation.
- All six database tests then explicitly passed, each in a separate fresh loopback PostgreSQL database: targeted persistence/migration, file expiry, accounts, full grant/reissue persistence, telemetry limits, and single-writer fencing.
- New encoding test: eight concurrent snapshots serialize a 256-record collection exactly once. Editing, inserting, replacing and removing invalidate cached bytes; prior snapshots retain their original hashes. Missing-key mutations do not cause rebuilds.
- New serializer-oracle test: repeated inserts, edits, removals, replay-set clearing and JSON reload agree with the full serializer for metadata length, state SHA-256, document values and document SHA-256. Cases include escaped keys, Unicode and large unsigned integers. Exact-limit admission passes and one-byte-over admission fails over 40 growth steps. Payload bytes remain outside metadata hashes but count toward stored-byte limits.
- New wallet test: warming caches then reassigning an identity to an already-full wallet correctly rejects the new growth.
- Existing PostgreSQL tests still verify the v1 journal chain and final state digest, failed-save rollback and retry, recovered current state, immutable historical records, idempotence and stale-session fencing.
- Scoped `git diff --check` passed. Text logs are adjacent to this report.

This is deterministic correctness and serialization-call evidence, not measured latency, RSS, throughput, public-network behavior or a general security certification.

## Construction frontier and operational residue

Completed frontier: cached canonical metadata with compatible hashing and quota behavior. Next runnable construction work: a bounded local load test measuring latency, peak memory and cache behavior under representative upload, acknowledgement and metadata traffic.

Granularity is a collection: editing one record rebuilds that collection's cached encoding, while other collections stay cached. The full-state SHA-256 necessarily still reads all encoded metadata bytes. Document enumeration and some payload/wallet scans remain linear. Encoded caches retain an extra representation of metadata plus keys/hashes and can coexist across live changed snapshots; this trades retained memory for less repeated work. No claim that total memory use decreased is made without measurement. File payloads are not encoded into this metadata cache by the application.

Deployment operator tasks remain separate operational support: review the exact candidate, rehearse coherent database/binary recovery and obtain an exact rollout envelope. The earlier migration's binary-only rollback restriction remains. These tasks do not block local construction. No commit, push, approval, release, deployment or preview restart occurred.

## Preserved historical residue

A before/after fingerprint inventory found changes only to src/shared_state.rs, src/limits.rs, src/store.rs and src/lib.rs, plus the new metadata module, tests and this evidence directory. Existing migrations, previous evidence and their hashes were not refreshed. No alchLang files, unrelated dirty work or wallet keys were changed by this task. Tests used new disposable databases, not the running preview's data or production data. The preview and public service remain on their previous builds.
