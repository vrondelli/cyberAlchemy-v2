---
tags: [infrastructure, architecture, pipeline, application]
node_type: discovery
is_session: true
layer: architecture, application
nature: technical
status: active
created: 2026-03-31
timestamp: 2026-03-31T14:09:00-03:00
expires: 2026-05-30
conversation_id: ~
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - Cloud Run Jobs as target execution model for bulk import (future spec)
  - Redis atomic INCR finalization pattern (future spec)
expected_importance: 8
importance_rationale: "This session produced a concrete architectural pivot — from always-on VM to Cloud Run Jobs — that directly resolves a production correctness bug (stale task interference) and a structural cost inefficiency, with a quantified breakeven analysis and a ready-to-implement plan covering local dev fallback, deploy workflow, and race-condition-free finalization."
---

# Production Investigation: Bulk Import Slow Processing → Cloud Run Jobs Migration Plan

**Date:** 2026-03-31 14:09 (UTC-3)
**Tags:** #infrastructure #architecture #pipeline #application

---

## Summary

This session started as a production incident investigation — the user uploaded a documents zip containing 15 folders (`Kit_Lastros/`) to the application and reported that processing was taking too long. The investigation covered live GCP infrastructure inspection via `gcloud` and Celery inspect commands, queue depth analysis via Redis, execution flow tracing via GitNexus, and review of the `bulk_import_tasks.py` and `process_bulk_import.py` source. It evolved into a deep architectural discussion about the cost and performance tradeoffs of the always-on VM worker model versus Cloud Run Jobs, culminating in an implementation plan.

The most critical finding was a **production correctness bug**: batch 23 (the user's upload) had all 15 folders in `pendente` status with no tasks running for it. The worker was consuming stale tasks from batch_id=22 — a previous, now-deleted batch. These orphaned tasks exhausted all retries (`BulkImportBatch.DoesNotExist`) before batch 23's bootstrap task could execute, causing an invisible ~4-minute delay before the actual upload even started processing.

The architectural conversation surfaced that the always-on `e2-standard-2` VM (~R$330/month) is economically wasteful for a bursty workload that doesn't require continuous processing. Cloud Run Jobs were identified as the right execution model: one container per folder, native `tasks=N` parallelism, ~R$0.80 per batch, no always-on cost. The breakeven is ~6,200 folders/month (~200/day).

A full 6-task implementation plan was produced and saved. The plan keeps the Celery chord as a local dev fallback (via `USE_CLOUD_RUN_JOBS=false`), uses a Redis atomic `INCR` counter for race-condition-free finalization detection, and preserves the existing Celery VM for `finalize_batch_task` and beat scheduler tasks.

---

### Production Incident: Stale Batch 22 Tasks Blocking Batch 23

**Problem:** Batch 23 (user's upload) had all 15 folders stuck in `pendente` with no processing happening. The worker appeared busy but was not doing useful work.

**Root cause discovered:** The Celery `default` queue contained `process_folder_task` tasks from batch_id=22, a batch that no longer existed in the database. These tasks had been queued from a prior upload session. With `max_retries=2` and `retry_backoff=30`, each task ran 3 attempts before failing — and while they were failing, batch 23's `process_bulk_import_task` was waiting in the queue behind them.

**Why it happened:** There is no guard that prevents orphaned tasks from a deleted batch from blocking a new batch's bootstrap. The queue is FIFO; batch 22's tasks were ahead of batch 23's.

**What happened after:** Batch 23 began processing at ~14:13 (4 minutes after the worker started) once batch 22's tasks exhausted all retries.

**Not resolved this session.** Fixing this requires either a pre-flight check in `process_folder_task` to skip gracefully (already happens via `DoesNotExist`) or a mechanism to purge stale tasks when a new batch is created. The task error handling currently marks the folder as failed and returns a dict — it does not propagate the exception — which is correct, but the batch bootstrap is still delayed.

---

### Worker Configuration: 8 Workers on 2 vCPUs

**Problem:** Tesseract OCR is CPU-bound. With `concurrency=8` on an `e2-standard-2` (2 vCPUs), all 8 worker processes compete for 2 physical cores, causing heavy context-switching and slowing every individual task.

**Alternative considered:** Resize VM to `e2-standard-8` (8 vCPUs, ~R$1,320/month). Breakeven vs Cloud Run Jobs at ~25,000 folders/month.

**Decision:** Not taken — Cloud Run Jobs makes more sense at current usage levels.

---

### Architecture Decision: Cloud Run Jobs for Bulk Import

**Problem:** The always-on `e2-standard-2` costs ~R$330/month regardless of whether any uploads happen. At ~R$0.80/batch (15 folders), the breakeven is ~412 batches/month (~14/day). On a per-folder basis: R$0.053/folder, breakeven ~6,200 folders/month (~200/day).

**Alternatives considered:**
1. Keep VM, resize to `e2-standard-8` — more CPU but still always-on, higher cost
2. MIG autoscaling to 0 on queue depth — complex custom metric, 2-3 min cold start
3. Cloud Run Jobs — native `tasks=N` parallelism, ~15-30s cold start, pay-per-use

**Decision:** Cloud Run Jobs. Each execution runs `tasks=N` (one per folder) with `parallelism=N` (all simultaneously). No rate limit, no queue contention, no always-on cost.

**Gemini 2.5 Flash rate limits confirmed not a concern:** ~3-5 Gemini calls per folder (primary for Identificacao/Holerite, fallback for CCB/Averbação). 15 folders × 5 calls = 75 simultaneous calls. Pay-as-you-go tier limit is 1,000 RPM.

---

### Implementation Plan Produced

**Saved to:** `refactors/infrastructure/2026-03-31-cloud-run-jobs-bulk-import.md`

**Key decisions locked in:**
- `infrastructure/cloud_run/client.py` — Cloud Run Admin API wrapper, lives in `infrastructure/` per layer constitution (imports from nobody)
- `_dispatch_folder_processing` branches on `USE_CLOUD_RUN_JOBS` env flag — Celery chord stays as local dev fallback
- `bulk_import_job_entrypoint.py` — reads `CLOUD_RUN_TASK_INDEX` + `BULK_IMPORT_FOLDER_PATHS`, calls `_process_folder`, then increments Redis counter
- Redis `INCR` for atomic finalization detection — the task that brings count to `total_folders` enqueues `finalize_batch_task`
- `finalize_batch_task` still runs via Celery on existing VM (VM stays alive for beat scheduler tasks)
- Deploy workflow updated to `gcloud run jobs create/update` on every push to main

---

## Epistemic Impact

**Confirmed:** The always-on VM model is economically wasteful for bursty, CPU-bound batch workloads. The cost asymmetry (R$0.80/batch vs R$330/month) is now quantified, not just an intuition.

**Challenged:** The implicit assumption that 8 Celery workers on 2 vCPUs is a viable configuration for Tesseract OCR. All workers compete for the same 2 cores — this configuration is harmful rather than neutral for CPU-bound tasks.

**Spec drift discovered:** No existing spec or guard prevents orphaned tasks from a previous batch from blocking the new batch's bootstrap. This is a correctness gap, independent of the Cloud Run Jobs migration.

**Promoted candidates:**
- Cloud Run Jobs as target execution model for bulk import → promote to `spec` after implementation goes live
- Redis atomic INCR pattern for finalization detection → promote to `spec` once implemented

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `refactors/infrastructure/2026-03-31-cloud-run-jobs-bulk-import.md` | Created | 6-task implementation plan for migrating bulk import from Celery worker VM to Cloud Run Jobs |

---

## Connections

| Document | Edge type | Description |
|----------|-----------|-------------|
| `docs/vault/constitution/folder-structure-constitution.md` | `validates` | The plan places the Cloud Run client in `infrastructure/cloud_run/` — consistent with the layer purity rules |
| `docs/vault/constitution/development-practices-constitution.md` | `validates` | Background jobs remain idempotent, batch IDs are traceable, feature flag pattern used for safe rollout |

---

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Stale task guard: no mechanism prevents orphaned tasks from a deleted batch from delaying a new batch's bootstrap (root cause of this incident) | HIGH | Open — independent of Cloud Run migration |
| Implement Cloud Run Jobs migration per `refactors/infrastructure/2026-03-31-cloud-run-jobs-bulk-import.md` | HIGH | Plan ready, no code written |
| Validate whether `rate_limit='10/m'` on `process_folder_task` is still intentional — may be a legacy safeguard unnecessary under Cloud Run Jobs | MEDIUM | Open |
| Reduce Celery `concurrency` to match physical vCPUs (2) on the VM to reduce CPU contention for remaining tasks | MEDIUM | Quick operational fix, no deploy needed |
| Promote Cloud Run Jobs architectural decision to `spec` once live and production-verified | LOW | Post-deployment follow-up |

---

## Open Questions

- Should the VM be immediately downsized to `e2-micro` (beat-only) once Cloud Run Jobs is live, or kept as-is for safety until the migration is validated?
- Is the `rate_limit='10/m'` on `process_folder_task` intentional (e.g., GCS or DB protection) or a legacy artifact? Removing it would save ~90s latency on a 15-folder batch even in the Celery-only path.
