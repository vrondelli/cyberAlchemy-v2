# KEP targeted persistence candidate — 2026-09-06

Route: CA2-ROUTE-IMPLEMENT. Lane: product construction. Scope: the hosted-devnet-exchange implementation. This is local implementation and test evidence, not product approval or deployment evidence.

## Result

Current state is stored in `kep_hosted.state_documents`, one document per collection/key. Replay-operation IDs are separate documents. A writer-session SHA-256 fingerprint map identifies additions, changes and removals; only those records are sent to PostgreSQL. Fingerprints advance after commit. Losing the single writer connection still fences further writes; no reconnect from stale in-memory state was introduced.

Metadata changes, file-payload insertion/expiry, new legacy ciphertext archives and the event-journal append share one transaction. Existing payloads and archives are not reinserted for unrelated operations or metadata-only changes. The existing v1 event hash chain and full metadata-state digest are retained. No new cryptographic or protocol claim is made.

Startup runs the schema migrations and conversion in one transaction while holding the existing exclusive writer lock. Legacy JSON is decoded and checked for field loss before copying. An incompatible legacy shape aborts, including rolling back new schema objects. A frozen layout marker records the canonical legacy JSON digest. Once the marker exists, restart loads documents and does not re-import the historical snapshot.

## Validation

- `cargo test --offline --locked --features ui`: 24 tests passed; six database tests were ignored by this default invocation.
- All six database tests were then explicitly run and passed against separate fresh PostgreSQL 17 databases in the existing loopback test container.
- New targeted-persistence test: incompatible legacy field rejected without partial migration; corrected migration; exact state recovery; unchanged records receive zero mutation attempts; a two-record change touches exactly two records; injected journal failure rolls back record changes/removals; retry proves the fingerprint cache did not advance on failure; restart recovers the new state rather than the old snapshot; historical snapshot, archive and journal row values survive; original v1 journal chain and final state digest verify; legacy writes and layout deletion are rejected.
- File lifecycle test: metadata-only access and acknowledgement succeed with triggers that reject any attempted archive insert or payload insert/update. Injected payload-delete failure rolls back expiry, and retry/restart preserve the expected expiry state and immutable legacy archive.
- Existing PostgreSQL tests: encrypted account recovery; full grant/reissue persistence and replay behavior; bounded/idempotent telemetry; single-writer exclusion, takeover and stale-connection fencing.
- `git diff --check -- src/store.rs tests/file_lifecycle.rs`: passed.

The adjacent text logs record each run. These are local database/API tests, not production traffic or public Solana transactions. UI assets were unchanged; no UI rebuild or browser-refresh claim is made.

## Preserved historical residue

The former `application_state` row is retained as historical metadata, including its revision and timestamp. Its value is no longer the current-state read source. Existing event-journal rows and encrypted archives remain untouched; the new chain continues after the existing last event. Older evidence directories and their hashes were not refreshed.

A before/after fingerprint inventory of this implementation's source, tests, migrations and evidence found only two pre-existing files changed: `src/store.rs` and `tests/file_lifecycle.rs`. Added files are the new migration, targeted test and this evidence directory. No alchLang files, wallet keys, unrelated dirty work, production database or running preview were changed by this task.

## Frontier and operational residue

Product-construction frontier: targeted database writes are implemented and locally tested. Full candidate cloning, metadata serialization/hashing, capacity scans and initial state/payload loading still scale with retained state. This work reduces database write amplification; it does not prove constant-time request processing or a throughput improvement. No performance benchmark was run. Incremental in-memory mutation/validation remains runnable construction work, separately from deployment preparation.

Operational support owner: the deployment operator, outside this local construction task. A future rollout needs an exact backup/restore rehearsal, inspection of the actual legacy snapshot for compatibility, a writer stop, and an authorized deployment envelope. These tasks do not block further local construction.

**Binary-only rollback is unsafe after migration.** The old snapshot table rejects INSERT, UPDATE, DELETE and TRUNCATE, preventing old code from resuming snapshot writes. Old binaries can still read the preserved stale snapshot: do not start them against the migrated database. A rollback must use a separately planned coherent database-and-binary restore and account for writes since the backup. This task neither performs nor authorizes that restore. Schema-owner privileges can bypass database triggers; they are not a defense against an administrator.

The signed-command v2 compatibility/reconciliation question from the earlier hardening epoch remains separate. Journal retention, long-term resource growth, recovery objectives and production load behavior also remain open. No broad assertion that the site is fully secure follows from these tests.

No commit, push, approval, release or deployment was performed. The preview and public service still run their previous builds.
