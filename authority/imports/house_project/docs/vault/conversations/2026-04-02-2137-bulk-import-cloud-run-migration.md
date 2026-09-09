---
tags: [infrastructure, pipeline, architecture]
node_type: discovery
is_session: true
layer: architecture, application
nature: technical, reference
status: active
created: 2026-04-02
timestamp: 2026-04-02T21:37:00-03:00
expires: 2026-06-01
conversation_id: b7km3
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/infrastructure/bulk-import-cloud-run-jobs-migration.md]
promoted_candidates: []
expected_importance: 9
importance_rationale: "Produced the foundational discovery document for bulk import's Cloud Run migration, fixed a production secret path bug, and surfaced ~14 unmanaged env vars representing active infrastructure risk."
---

# Bulk Import Cloud Run Migration Discovery

**Date:** 2026-04-02 21:37 (UTC-3)
**Tags:** #infrastructure #pipeline #architecture

## Summary

A large session that produced the consolidated discovery document for bulk import's Cloud Run Jobs migration at `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md`, covering root cause analysis of why Cloud Run Jobs were never triggered, trade-off tables comparing Cloud Run vs Celery for each workload type, the full migration plan, and a VM workload inventory. The deploy pipeline was significantly refactored: common Cloud Run env vars were extracted to `.github/scripts/cloud-run-env.sh` (eliminating duplication across deploy steps), the 70-line inline SSH script was extracted to `.github/scripts/deploy-worker.sh` (reducing YAML complexity and SSH escaping issues), `--command`/`--args` syntax was normalized to `=` form everywhere (preventing gcloud from misinterpreting `-m` as its own flag), and a worker health check was added to `deploy-worker.sh` that runs `docker ps` after restart and exits 1 if `celery-worker` isn't running.

A three-agent review of `deploy-gcp.yml` was conducted and documented in `deploy-gcp-review.md`. Several production issues were discovered and fixed: an `EMAIL_HOST_PASSWORD` secret path error (legacy alias format from GCP console), and the finding that `USE_CLOUD_RUN_JOBS` flags on the API service were dead config — the API only enqueues tasks, the VM worker reads these flags, so setting them on the API had no effect (this was the original root cause of the Cloud Run Jobs never being triggered). Additionally, ~14 env vars on the Cloud Run API service were found to be set manually via GCP console and not managed by the deploy script, meaning they would be lost if the service is ever recreated. Four spec errors in `bulk-import-cloud-run-jobs-migration.md` were fixed: removing `_maybe_finalize()` from the Celery chord diagram, requiring `USE_CLOUD_RUN_JOBS=true` in orchestrator env, noting `create_bulk_import_batch` is legacy, and adding retry semantics.

## Epistemic Impact

- **Dead config discovered:** `USE_CLOUD_RUN_JOBS` flags on the Cloud Run API service are inert — the API only enqueues, the worker reads flags. A belief that setting these on the API controlled behavior was false.
- **Spec drift corrected:** 4 errors in `bulk-import-cloud-run-jobs-migration.md` fixed — the plan had false claims that were invalidated.
- **~14 env vars unmanaged:** A significant set of production configuration lives outside the deploy script (set manually via GCP console), documented in `cloud-run-secret-drift.md`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md` | created | Consolidated discovery: root cause, trade-offs, migration plan, VM workload inventory |
| `.github/scripts/cloud-run-env.sh` | created | Extracted shared env vars previously duplicated inline |
| `.github/scripts/deploy-worker.sh` | created | Extracted 70-line inline SSH script; added health check |
| `.github/workflows/deploy-gcp.yml` | modified | Refactored syntax, fixed `EMAIL_HOST_PASSWORD` secret path bug |
| `specs/cloud_services/docs/bulk-import/deploy-gcp-review.md` | created | Three-agent review output |
| `specs/cloud_services/docs/secret-management/cloud-run-secret-drift.md` | created | Documents ~14 unmanaged env vars |
| `specs/infrastructure/bulk-import-cloud-run-jobs-migration.md` | modified | 4 spec errors corrected |

## Connections

- contextualizes: `specs/cloud_services/docs/bulk-import/cloud-run-jobs.md`
- validates: `specs/cloud_services/docs/secret-management/cloud-run-secret-drift.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| ~14 env vars set manually via GCP console need IaC remediation | `cloud-run-secret-drift.md` | HIGH | Open |
| Dead `USE_CLOUD_RUN_JOBS` flags on API service should be removed | Session discovery | LOW | Open |
| Migration plan phases need promotion to ratified implementation-plan | Discovery output | MEDIUM | Open |
