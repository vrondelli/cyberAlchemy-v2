---
tags: [acquisition, liquidation, pipeline, architecture]
node_type: spec
is_session: true
layer: domain, architecture
nature: technical
status: active
created: 2026-04-02
timestamp: 2026-04-02T13:12:30-03:00
expires: 2026-06-01
conversation_id: 69a6974f-57f9-463f-94b6-2c9bc60da267
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Completes the last COPY FROM performance step and discovers a non-obvious PostgreSQL deferred-FK / CREATE INDEX interaction that would have caused production failures."
---

# Copy Staging: Index Drop/Rebuild and Pending Trigger Events Fix

**Date:** 2026-04-02 13:12 (UTC-3)
**Tags:** #acquisition #liquidation #pipeline #architecture

## Summary

This session implemented Step 3c from the COPY FROM staging plan — the index drop/rebuild optimization in `bulk_copy_staging()` — and immediately discovered and fixed a PostgreSQL constraint interaction that the plan had not anticipated.

### Index Drop/Rebuild Implementation (Step 3c)

The goal was to address a production performance bottleneck: COPY FROM STDIN with 4 B-tree indexes on `aquisicao_manual_staging` was taking ~6m24s per 500k rows (~45 min projected for 3.3M rows), the same order of magnitude as the ORM path it replaced. The root cause was per-row incremental index maintenance during COPY.

The solution, as specified in the plan, was to DROP all non-PK indexes before the COPY loop and rebuild them after. Two helper functions (`_drop_non_pk_indexes`, `_rebuild_indexes`) were added to both `domains/aquisicao/repositories/repositories.py` and `domains/liquidacao/repositories/repositories.py`. The expected speedup is ~10-15x (from ~45 min to ~3-5 min).

### Pending Trigger Events Bug

Running the tests immediately revealed a bug the plan did not account for: `cannot CREATE INDEX because it has pending trigger events`. PostgreSQL refuses to CREATE INDEX on a table with unflushed deferred FK constraint checks. The staging tables have FK fields (`file_id`, `remessa_id`, `tipo_instrumento`) whose constraint checks are deferred within the transaction. COPY FROM queues these as "pending trigger events," blocking any subsequent CREATE INDEX.

The fix was a `_flush_pending_triggers(cursor)` function that runs `SET CONSTRAINTS ALL IMMEDIATE` (forces deferred checks to fire, clearing the event queue) followed by `SET CONSTRAINTS ALL DEFERRED` (restores deferred mode). This is called at the start of `_rebuild_indexes`, before any CREATE INDEX. No alternative approaches were considered — this is the canonical PostgreSQL solution.

### Tests

Four new tests were added across both domains: `test_indexes_rebuilt_after_copy` (verifies same indexes exist before/after) and `test_indexes_survive_empty_dataframe` (edge case: zero rows). All 35 related tests pass (16 stager copy + 19 integration/dedup).

### Spec Update

The plan file was bumped to v1.5.0 with Step 3c marked as done.

## Epistemic Impact

**Confirmed:**
- The COPY FROM approach (Steps 3a-3c) works end-to-end for both aquisicao and liquidacao domains.
- Dropping non-PK indexes before bulk insert and rebuilding afterward is a valid optimization path.

**New knowledge created:**
- PostgreSQL deferred FK constraint checks (triggered by COPY FROM) queue pending trigger events that block a subsequent `CREATE INDEX` unless explicitly flushed.
- The `SET CONSTRAINTS ALL IMMEDIATE` / `SET CONSTRAINTS ALL DEFERRED` pattern is the safe mechanism to flush the pending trigger queue within the same transaction before issuing index DDL.

**Gap surfaced:**
- The discovery doc (`2026-04-01-staging-copy-from-discovery.md`) did not list "deferred FK constraints blocking CREATE INDEX" in its risk section. The issue was found and fixed but the discovery doc has not been updated.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/repositories/repositories.py` | modified | Added `_drop_non_pk_indexes`, `_flush_pending_triggers`, `_rebuild_indexes`; integrated into `bulk_copy_staging` |
| `domains/liquidacao/repositories/repositories.py` | modified | Same changes mirrored for liquidacao domain |
| `domains/aquisicao/tests/test_upload_stager_copy.py` | modified | Added `test_indexes_rebuilt_after_copy` and `test_indexes_survive_empty_dataframe` |
| `domains/liquidacao/tests/test_upload_stager_copy.py` | modified | Same two tests added for liquidacao domain |
| `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md` | modified | Bumped to v1.5.0; Step 3c marked as done |

## Connections

| Target | Edge | Description |
|--------|------|-------------|
| `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-discovery.md` | derives-from | This session implements the index drop/rebuild proposed in the discovery's "Post-implementation Finding" section |
| `specs/003-remessa-upload-with-events/2026-04-01-staging-copy-from-plan.md` | validates | Step 3c is now implemented and tested; plan updated to reflect completion |
| `docs/vault/constitution/development-practices-constitution.md` | contextualizes | Repository Isolation principle — COPY logic stays in repository layer, not service |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Update discovery doc risk section with "deferred FK blocking CREATE INDEX" | This session | LOW | Open |
| Extract shared `_drop_non_pk_indexes` / `_flush_pending_triggers` / `_rebuild_indexes` to avoid duplication between aquisicao and liquidacao | This session | LOW | Open |
| Remove `USE_COPY_STAGING` feature flag after production validation | Plan Step 3c notes | MEDIUM | Open |
