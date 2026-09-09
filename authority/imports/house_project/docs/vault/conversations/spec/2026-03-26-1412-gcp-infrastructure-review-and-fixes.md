---
tags: [infrastructure, pipeline]
node_type: spec
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T14:12:46-03:00
expires: 2026-05-25
conversation_id: gcp-infrastructure-review-2026-03-26
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "GCP infrastructure finalized with autoscaling by Celery queue depth, VM/Redis rightsizing, and two critical bug fixes (beat leader election silently broken, CI/CD referencing non-existent resource names) that would have caused silent failures on first production deploy."
---

# GCP Infrastructure Review and Fixes

**Date:** 2026-03-26 14:12 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

This session reviewed the existing Terraform configuration for the GCP migration and identified several bugs and optimization opportunities. The project ID was corrected from `marine-atrium-405003` to `zefra-491412` across all infrastructure files. The session covered VM sizing, Redis tier selection, autoscaling strategy, and Celery worker throughput estimation for bulk document processing. Two critical bugs were found and fixed: Celery beat would never start because the leader election logic used a `-0` suffix pattern that GCE MIG never generates, and the CI/CD workflow referenced resource names that didn't match the Terraform-provisioned infrastructure. The Cloud Run packaging requirements (Group 6 of the migration checklist) were also completed: WhiteNoise, JSON logging, security headers, upload limits, and gunicorn configuration.

A significant addition was the autoscaling system for Celery worker VMs based on Redis queue depth. Rather than scaling manually or keeping extra VMs running at idle cost, a custom Cloud Monitoring metric (`custom.googleapis.com/celery/queue_depth`) is pushed every minute by the worker VM, and a `google_compute_autoscaler` scales the MIG up/down automatically based on pending task count.

### Project ID Correction

- **Problem/Goal:** `terraform.tfvars` and the `.tf` backend block referenced the old project `marine-atrium-405003` instead of the current `zefra-491412`.
- **Decision:** Update all references to `zefra-491412`.
- **Changes:** Updated `project_id` in `terraform.tfvars`, state bucket name in `gcp-infrastructure-migration.tf`, and `django_image` path which also carried the old project ID.

### VM and Redis Rightsizing

- **Problem/Goal:** Evaluate whether `e2-standard-4` and Redis `STANDARD_HA` were appropriate.
- **Decision:** Downsize worker VM to `e2-standard-2` (2 vCPU, 8GB) — tasks are I/O-bound (Gemini/Vision API), so 4 vCPUs provide no throughput benefit. Downsize Redis to `BASIC` tier — Celery broker downtime of minutes is acceptable; HA costs ~2x with no benefit for this use case. Cloud SQL `db-custom-2-7680` kept as-is given bulk import workloads.
- **Changes:** `machine_type` changed to `e2-standard-2`, Redis `tier` changed to `BASIC`. Estimated savings: ~$105/month.

### Autoscaling by Celery Queue Depth

- **Problem/Goal:** Worker VMs had a fixed `target_size = 1` requiring manual scaling for bulk runs. User did not want to scale manually.
- **Decision:** Implement autoscaling using a custom Cloud Monitoring metric pushed by the worker VM itself. `single_instance_assignment = 200` means one VM per 200 pending tasks. Min 1, max 10 VMs. Scale-down cooldown 300s.
- **Changes:** Added `google_monitoring_metric_descriptor`, `google_compute_autoscaler`, `roles/monitoring.metricWriter` IAM, metric pusher script in the VM startup script (runs every minute via cron using `redis-cli LLEN` across all 3 queues), `lifecycle { ignore_changes = [target_size] }` on the MIG, and `max_worker_instances` variable.

### Celery Beat Leader Election Bug (Critical Fix)

- **Problem/Goal:** The startup script elected the beat leader by checking if the instance name ended in `-0`. GCE MIG assigns random 4-character suffixes (e.g., `zefra-hub-worker-m1b4`), so this pattern never matches. Celery beat would silently never start in production.
- **Decision:** Query the MIG directly and elect the lexicographically first instance as beat leader.
- **Changes:** Replaced the `-0` regex check in both `gcp-infrastructure-migration.tf` startup script and `deploy-gcp.yml` with a `gcloud compute instance-groups managed list-instances | sort | head -1` pattern. Same fix applied consistently to both files.

### CI/CD Resource Name Mismatches (Critical Fix)

- **Problem/Goal:** `deploy-gcp.yml` referenced resource names from an earlier naming scheme (`house-project-*`) that don't exist in the Terraform-provisioned infrastructure (`zefra-hub-*`). The deploy would have failed on first run.
- **Decision:** Align all CI/CD variables with actual Terraform resource names.
- **Changes:** Corrected `ZONE` (b→a), `AR_REPO`, `IMAGE_NAME`, `CLOUD_RUN_SERVICE`, `WORKER_MIG`, and `ENV_FILE` path in the deploy workflow.

### backend-ts Removal

- **Problem/Goal:** `backend-ts` Cloud Run service was still in Terraform despite a Group 0 decision (2026-03-20) to deprecate and remove it. The resource used a placeholder image and a broken `DATABASE_URL` with an unexpanded `$$POSTGRES_PASSWORD` variable.
- **Decision:** Remove from Terraform entirely per the existing decision.
- **Changes:** Deleted `google_cloud_run_v2_service.backend_ts` and its IAM member resource.

### Cloud Run Packaging (Group 6)

- **Problem/Goal:** Complete the remaining pre-deploy code changes needed for the Django app to run correctly on Cloud Run.
- **Decision:** All changes scoped under `STORAGE_BACKEND=gcs` guard except WhiteNoise middleware (always active).
- **Changes:**
  - `Dockerfile`: uncommented `collectstatic`, updated `CMD` to use `gunicorn.conf.py`
  - `settings.py`: added `WhiteNoiseMiddleware` to `MIDDLEWARE`; added to GCP block: `STATICFILES_STORAGE`, security headers (HSTS, content-type nosniff, referrer policy — without `SECURE_SSL_REDIRECT`), upload limits (32MB/10MB), JSON structured logging via `pythonjsonlogger`
  - `gunicorn.conf.py`: new file with 2 workers, timeout 120s, stdout logging

Key outputs:
- `refactors/infrastructure/gcp-infrastructure-migration.tf` — project ID, Redis tier, VM size, autoscaler, beat fix, backend-ts removal
- `refactors/infrastructure/terraform.tfvars` — project ID, credentials, django_image
- `.github/workflows/deploy-gcp.yml` — resource names, zone, env file path, beat fix
- `house_project/settings.py` — WhiteNoise, JSON logging, security headers, upload limits
- `Dockerfile` — collectstatic, gunicorn config
- `gunicorn.conf.py` — new production gunicorn config

## Key Decisions

- **Redis BASIC over STANDARD_HA:** Celery broker downtime is acceptable; ~$40/month saved.
- **e2-standard-2 over e2-standard-4:** I/O-bound workers don't benefit from extra CPUs; ~$65/month saved.
- **Autoscaler threshold 200 tasks/VM:** Chosen as a starting point to be calibrated after first production bulk run with real throughput data.
- **Beat leader election via MIG query:** The only reliable strategy for standard (non-stateful) MIGs where instance names have random suffixes.
- **backend-ts removed:** Consistent with 2026-03-20 decision; placeholder image and broken DATABASE_URL confirmed there was no active use.
- **`SECURE_SSL_REDIRECT` not set:** Cloud Run health probes use internal HTTP; setting this would cause a crash loop.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Project ID, Redis BASIC, e2-standard-2, autoscaler resources, beat leader election fix, backend-ts removal, metric pusher script |
| `refactors/infrastructure/terraform.tfvars` | `modified` | Project ID corrected to zefra-491412, credentials rotated, django_image path fixed |
| `.github/workflows/deploy-gcp.yml` | `modified` | Zone, AR repo, service names, env file path, beat leader election fix |
| `house_project/settings.py` | `modified` | WhiteNoiseMiddleware, STATICFILES_STORAGE, security headers, upload limits, JSON logging in GCP block |
| `Dockerfile` | `modified` | Uncommented collectstatic, updated CMD to use gunicorn.conf.py |
| `gunicorn.conf.py` | `created` | Production gunicorn config: 2 workers, 120s timeout, stdout logging |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Rotate `gemini_api_key` in terraform.tfvars | Session — old key still in file | ⚠️ HIGH | Pending user action |
| Apply terraform (blocked by billing account) | Session | ⚠️ HIGH | Blocked |
| Calibrate autoscaler threshold (200 tasks/VM) | Session — no real throughput data yet | MEDIUM | Post-deploy |
| Implement signed URL uploads for files >32MB | Group 0 decision, Group 5 checklist | MEDIUM | Pending |
| Group 4: GCS storage migration (`gcs_client.py`) | Migration checklist | MEDIUM | Pending |
| Group 5: Downloads migration | Migration checklist | MEDIUM | Pending |
| Group 7: Workload Identity Federation + CI/CD setup | Migration checklist | MEDIUM | Blocked by terraform |
