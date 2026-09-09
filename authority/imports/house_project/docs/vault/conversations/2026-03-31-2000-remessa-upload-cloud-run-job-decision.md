---
tags: [cloud-run-jobs, remessa-upload, worker-isolation, mig-autoscaling, oom, celery, gcs, machine-sizing, queue-routing, superseded-spec]
node_type: implementation-plan
is_session: true
layer: [architecture, application]
nature: [procedural, technical]
status: active
created: 2026-03-31
timestamp: 2026-03-31T20:00:00-03:00
expires: 2026-05-30
conversation_id: 2026-03-31-remessa-upload-cloud-run-job-decision
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - specs/003-remessa-upload-with-events/2026-03-31-worker-isolation-autoscaling-for-remessa-and-documents.md
  - specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md
promoted_candidates:
  - Cloud Run Jobs as standard pattern for variable-resource upload workloads → candidate for a premise node
expected_importance: 8
importance_rationale: "This session redirected a planned infrastructure investment from a multi-day MIG split (with ongoing operational overhead) to a simpler, cheaper Cloud Run Job pattern, and produced the concrete execution plan that replaces the prior spec."
---

# Remessa Upload — Decision to Replace MIG Split with Cloud Run Jobs

**Date:** 2026-03-31 20:00 (UTC-3)
**Tags:** #cloud-run-jobs #remessa-upload #worker-isolation #oom #machine-sizing #celery

---

## Summary

This session covered two distinct phases: first, a detailed review of an existing spec proposing a MIG split for remessa worker isolation; second, a requirements clarification that revealed the spec was solving a different problem than what was actually needed, leading to a new implementation plan that replaces it.

### Phase 1 — Spec Review

The spec `2026-03-31-worker-isolation-autoscaling-for-remessa-and-documents.md` proposed splitting the single `zefra-hub-worker-mig` into two groups: Group A (`remessa-upload` queue, `min_replicas=0`) and Group C (all other queues, always-on), each with a dedicated autoscaler triggered by Redis queue depth via a custom GCP metric that does not yet exist.

Seven issues were identified during review:
1. `remessa-upload` may already have no consumer in production — the deploy fallback in `deploy-gcp.yml` is `default,remessa-validation,remessa-recovery`, which omits `remessa-upload`.
2. `CELERY_WORKER_MAX_MEMORY_PER_CHILD = 2_000_000` already exists in settings, but its interaction with Group A machine sizing wasn't addressed (concurrency=2 × 2GB = 4GB minimum, must be reflected in machine type selection).
3. Group A's CI deploy job must NOT include the beat election logic, which is embedded in the existing deploy script and hardcodes the MIG name.
4. The `bulk-import` queue has task routes defined in `celery.py` but would have no consumer in either proposed group — unclear if `finalize_batch_task` is dispatched via Celery or called directly within the Cloud Run Job.
5. Rollout steps 2→3 need an explicit "verify consuming" gate: Group A must be confirmed consuming the queue before Group C stops.
6. Cold start latency of ~2-4 minutes for VM boot was not acknowledged as a user-facing impact.
7. The metric publisher (prerequisite for any autoscaling to work) does not exist yet and represents ~1 day of work before the autoscaler is functional.

### Phase 2 — Requirements Clarification and Architecture Decision

The user clarified that the actual goal was different: create machines **on demand per upload**, with the **trigger being the file size** — not queue depth. The spec was solving queue-depth autoscaling with a fixed machine type. A 10 MB upload and a 500 MB upload would trigger identical autoscaling behavior; the spec provided no mechanism to give each upload the right amount of RAM.

Two options were presented:

- **Option 1 — Tiered MIG routing:** Two machine tiers based on file size, two separate MIGs, one autoscaler each. Requires the metric publisher plus ongoing MIG management. ~2-3 days, plus permanent infra overhead.
- **Option 2 — Cloud Run Job per upload:** One Cloud Run Job execution per upload. Machine config (CPU/memory) is selected at dispatch time from the file size. No metric publisher, no new MIG, no autoscaler. ~1-1.5 days.

Option 2 was selected for three reasons: cheaper (billing per second of actual use vs. VM-minute), faster cold start (containers ~20-30s vs. VMs ~2-4min), and the pattern is already proven in the codebase via the bulk import pipeline (`zefra-bulk-import-worker`).

### Phase 3 — New Implementation Plan

`2026-03-31-remessa-upload-cloud-run-job-per-upload.md` was created with 8 tasks:

1. Add `trigger_remessa_upload_job()` to `infrastructure/cloud_run/client.py` — wraps `RunJobRequest` with a per-execution `ContainerOverride.resources` to select CPU and memory at dispatch time.
2. Add `select_remessa_tier(file_size_bytes) -> (cpu, memory)` helper in `infrastructure/cloud_run/machine_tiers.py` — configurable thresholds via Django settings.
3. Create job entrypoint `infrastructure/remessa/remessa_upload_job_entrypoint.py` — reads env vars (`REMESSA_DOMAIN`, `REMESSA_ID`, `REMESSA_GCS_PATH`) and calls the upload use case directly.
4. Convert `process_aquisicao_upload` and `process_liquidacao_upload` Celery tasks to thin dispatchers gated on `USE_CLOUD_RUN_JOBS` — tasks complete in <1 second in production.
5. Add `get_gcs_file_size()` to `infrastructure/storage/gcs_client.py` — metadata-only call, no file download.
6. Add settings: `CLOUD_RUN_REMESSA_UPLOAD_JOB`, `CLOUD_RUN_REMESSA_TIER_SMALL_MB`, `CLOUD_RUN_REMESSA_TIER_MEDIUM_MB`.
7. Add `deploy-remessa-upload-job` CI job to `deploy-gcp.yml`.
8. Remove `remessa-upload` from Group C worker env (if it was ever present).

The old MIG split spec was marked as superseded with a pointer to the new plan.

Machine tiers defined (initial estimates, to be tuned after first production week):

| Tier | File size | CPU | Memory |
|---|---|---|---|
| small | < 50 MB | 2 vCPU | 4 Gi |
| medium | 50–200 MB | 4 vCPU | 8 Gi |
| large | > 200 MB | 8 vCPU | 16 Gi |

---

## Epistemic Impact

**Confirmed:**
- Cloud Run Jobs are a proven pattern in this codebase (bulk import), making them lower-risk for new workload isolation needs.
- Cold-start latency for GCE VMs (~2-4 min) is a material penalty for on-demand upload workloads.

**Contradicted:**
- The assumption that a MIG split with queue-depth autoscaling was the right mechanism for remessa upload isolation. The real requirement (machine sizing per file size) cannot be satisfied by queue-depth autoscaling with a fixed machine type.
- The assumption that `remessa-upload` queue already had an active consumer in production — the deploy fallback may exclude it.

**Newly established:**
- Queue-depth autoscaling and file-size-driven machine selection are orthogonal problems. A spec that conflates them cannot satisfy either requirement.

---

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/003-remessa-upload-with-events/2026-03-31-worker-isolation-autoscaling-for-remessa-and-documents.md` | modified | Marked as superseded — the spec solved queue-depth autoscaling with fixed machine sizing, not the actual requirement of dynamic machine selection by file size. |
| `specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md` | created | New 8-task implementation plan. Replaces the MIG split approach with a Cloud Run Job dispatched per upload, machine config selected at dispatch time from file size. |

---

## Connections

- `derives-from` → `specs/003-remessa-upload-with-events/2026-03-31-csv-upload-cloud-run-discovery.md` (prior discovery that mapped Cloud Run Jobs as the migration path)
- `contradicts` → `specs/003-remessa-upload-with-events/2026-03-31-worker-isolation-autoscaling-for-remessa-and-documents.md` (superseded spec)
- `contextualizes` → `refactors/infrastructure/2026-03-31-cloud-run-jobs-bulk-import.md` (the bulk import Cloud Run pattern this plan reuses)

---

## Gaps & Backlog

| Item | Priority | Notes |
|---|---|---|
| Verify `remessa-upload` queue consumer status in production | HIGH | Deploy fallback may not include it — tasks may be silently queuing with no consumer right now |
| `bulk-import` Celery queue has routes but no consumer in any worker group | HIGH | Clarify whether `finalize_batch_task` is dispatched via `.delay()` or called directly inside the Cloud Run Job entrypoint |
| Machine tier thresholds not validated against historical file size distribution | MEDIUM | Wrong thresholds would over/under-provision; should be tuned after first production week with real metrics |
| Cold-start latency (~20-30s) not validated against any explicit SLA for remessa upload | MEDIUM | Acceptable relative to VM cold start but no formal SLA documented |
| Cloud Run Jobs as standard pattern for variable-resource upload workloads has no canonical premise node | LOW | Risk of future specs re-proposing MIG-based solutions without awareness of this architectural decision |

---

## Open Questions

- Does `finalize_batch_task` in `bulk_import_job_entrypoint.py` call the task via `.delay()` (queued) or directly as a function call? If queued, it targets the `bulk-import` queue which has no consumer.
- What is the expected user-facing experience when Group A scales from 0? Is there a status polling mechanism while the Cloud Run Job runs?
