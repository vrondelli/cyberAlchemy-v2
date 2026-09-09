---
tags: [infrastructure, pipeline, acquisition]
node_type: discovery
is_session: true
layer: application, infrastructure
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T03:50:00-03:00
expires: 2026-06-02
conversation_id: r8k2m
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identifies a 10-15 minute blocking operation on the bulk import path that degrades the db instance for all concurrent workloads, requiring architectural remediation before scale."
---

# Index Rebuild Bottleneck Discovery

**Date:** 2026-04-03 03:50 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition

## Summary

A discovery session that identified a critical performance bottleneck in the remessa (CSV) upload path. The `bulk_copy_staging` function drops and rebuilds 10 non-PK indexes on the `aquisicao_manual_staging` table (3.3M rows, 2.2GB) regardless of upload size — even a 20-row CSV triggers the full rebuild. The `_rebuild_indexes` function scans the entire table for each of the 10 indexes sequentially, blocking for 10-15+ minutes on the db-g1-small instance. During this time, the database is under heavy load, degrading performance for all concurrent workloads. The bottleneck is disproportionate: the cost of rebuilding indexes on a multi-million row table is orders of magnitude larger than the actual data insertion for small uploads. A discovery document was written at `specs/003-remessa-upload-with-events/docs/cloud-run/` documenting the root cause, the measurement methodology, and potential remediation paths (conditional rebuild based on upload size, deferred/background rebuild, or partial index strategies).

## Epistemic Impact

- **Belief challenged:** The implicit assumption that index rebuilds on `aquisicao_manual_staging` are fast or acceptable was falsified. Any spec or premise treating `bulk_copy_staging` as a low-latency operation is contradicted by this finding.
- No existing spec was updated. The discovery documents a gap — no spec currently captures the performance contract for bulk import staging.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/003-remessa-upload-with-events/docs/cloud-run/` (discovery doc) | created | Documents the `_rebuild_indexes` bottleneck: 10 non-PK index rebuilds on 3.3M rows even for 20-row uploads |

## Connections

- questions: any existing spec treating `bulk_copy_staging` as low-latency

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fix `_rebuild_indexes` full-table scan (e.g., conditional rebuild, background rebuild) | Session discovery | HIGH | Open |
