---
tags: [architecture, infrastructure, pipeline]
node_type: implementation-plan
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T20:30:00-03:00
expires: 2026-06-02
conversation_id: m7p4k
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Locked the execution parameters and phase ordering for the DB exhaustion fix, making it the authoritative reference for Phases 0-6 of the bulk-import scaling rollout."
---

# Plan Review — DB Connection Exhaustion (v0.3.0)

**Date:** 2026-04-03 20:30 (UTC-3)
**Tags:** #architecture #infrastructure #pipeline

## Summary

Review session for the bulk-import DB connection exhaustion implementation plan. Several key parameters were locked: throughput target set to 1,000 folders in ≤1 hour (expected ~25 minutes with parallelism=20 at 30s/task); `SAFE_TASKS_PER_EXECUTION` raised from 200 to 1,000 so that a typical batch fits in a single Cloud Run execution without multi-execution overhead. Phase 2 (admission gate with distributed lock) was deferred — it's only needed when batches regularly exceed 1,000 folders, which is not the current usage pattern. Phase 6 (PgBouncer) was downgraded from required to optional since the DB upgrade alone provides sufficient connection headroom. The plan eliminated `count_folders()` from the Cloud Run task hot path — instead of each task querying the database for the folder count, the dispatcher passes the count as an env var, removing N redundant COUNT queries that would fire simultaneously at task startup. A TOCTOU risk in Phase 2's Redis lock design was documented: the lock can expire during the `trigger_bulk_import_job()` network call if the API is slow, allowing a second dispatcher to proceed. The decision was to use `Celery self.retry()` with `max_retries` instead of spawning a new task, preventing unbounded fan-out. The plan was updated to v0.3.0 with all changes.

## Epistemic Impact

- Confirmed that the Cloud Run task hot path should be free of cross-service queries — passing `count_folders()` as an env var validates this design principle.
- Phase 6 (PgBouncer) downgraded from required to optional — any document listing PgBouncer as required for bulk-import scaling is now stale.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| Implementation plan (DB exhaustion, v0.3.0) | modified | Throughput target, SAFE_TASKS_PER_EXECUTION=1000, Phase 2 deferred, Phase 6 optional, count_folders removed from hot path, TOCTOU risk documented |

## Connections

- derives-from: bulk import DB connection exhaustion discovery
- validates: hot-path-should-be-query-free design principle

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| TOCTOU risk in Phase 2 Redis lock needs formal tracking if admission gate is built | Session decision | MEDIUM | Open |
| Phase 2 trigger condition (batches regularly >1000 folders) needs monitoring | Session decision | LOW | Open |
