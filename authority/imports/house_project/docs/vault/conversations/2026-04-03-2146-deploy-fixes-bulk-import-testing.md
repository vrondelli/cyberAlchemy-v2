---
tags: [infrastructure, pipeline, architecture, application]
node_type: discovery
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T21:46:00-03:00
expires: 2026-06-02
conversation_id: m4v8j
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Produced first production evidence of connection exhaustion at scale (1455 folders, 59% failure rate), directly motivating the DB exhaustion implementation plan and establishing the real throughput ceiling."
---

# Deploy Fixes & Bulk Import Production Testing

**Date:** 2026-04-03 21:46 (UTC-3)
**Tags:** #infrastructure #pipeline #architecture #application

## Summary

A multi-topic session covering deploy fixes and production bulk import testing at scale. The first topic resolved a deploy pipeline issue: `CELERY_QUEUES` couldn't be added to `cloud-run-env.sh` because commas in the queue list value (e.g., `default,bulk-import`) conflict with the comma-delimited `ENV_VARS` payload format used by gcloud. The workaround was to pass `CELERY_QUEUES` as a dedicated base64-encoded argument (`$8`) to `deploy-worker.sh`, decoded at runtime. A safety net was also added to `deploy-worker.sh` that always appends `bulk-import` to the queue list if missing, preventing the recurring issue of workers not listening on the bulk-import queue.

The second topic was production testing of two bulk import batches. Batch 39 (16 folders, small test) completed successfully end-to-end with the new DB-lookup contract — Cloud Run execution `xrrw8` processed all 16 folders and finalization ran correctly. One task hit 4 OOM events during Tesseract OCR but survived retries. Batch 40 (1,455 folders, 900MB ZIP) was the first real scale test and had a 59% failure rate (861/1,455 tasks failed). Root cause: Postgres connection exhaustion — all 1,455 tasks started simultaneously, each opening a database connection, exceeding the available connection slots (`FATAL: remaining connection slots are reserved for non-replication superuser connections`). This production evidence directly motivated the DB connection exhaustion implementation plan written in Sessions 11/14. A discovery document was written about the upload bottleneck. Two backlog items were added: direct per-file signed URL upload (long-term) and `ThreadPoolExecutor` parallelization of GCS re-uploads (quick win). The Tesseract removal investigation started but was interrupted.

## Epistemic Impact

- **Scaling assumption disproven:** The assumption that bulk import could scale linearly by increasing batch size was falsified in production. Batch 40's 1,455-folder run caused 59% failure from connection exhaustion, not task logic failures.
- **Spec drift:** The deploy workflow spec did not account for comma-delimiter conflicts in `ENV_VARS`, requiring the base64 workaround.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `.github/scripts/deploy-worker.sh` | modified | Added `CELERY_QUEUES` as base64 arg; added bulk-import queue safety net |
| `.github/workflows/deploy-gcp.yml` | modified | Updated to pass `CELERY_QUEUES` via base64 arg |
| `specs/002-ccb-validation-workflow/docs/gcp-upload/bulk-import-upload-bottleneck-discovery.md` | created | Discovery: connection exhaustion at 1455 concurrent tasks |
| `specs/002-ccb-validation-workflow/backlog.md` | modified | Two new items: direct signed URL upload, ThreadPoolExecutor GCS uploads |

## Connections

- contextualizes: bulk import DB connection exhaustion implementation plan

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| DB connection exhaustion fix needed before batches >200 folders | Production failure (Batch 40) | HIGH | Open |
| CELERY_QUEUES base64 workaround should be documented in deploy runbook | Deploy fix | MEDIUM | Open |
| Direct per-file signed URL upload (eliminate zip round-trip) | Backlog addition | MEDIUM | Open |
| ThreadPoolExecutor for GCS re-uploads | Backlog addition | MEDIUM | Open |
