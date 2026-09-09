---
tags: [refactor, agents]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T16:38:21-03:00
expires: 2026-05-18
conversation_id: 484c2477-74c4-41b0-929d-d38985b8c95d
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.md]
promoted_candidates: []
satisfaction:
  mean: 7
  min: 6
  max: 8
  std: 0.8
expected_importance: 6
importance_rationale: "Analyzed gaps in GCP migration plan and updated Terraform configs, infrastructure architecture."
version: 0.1.0
last_updated: 2026-03-19
---

# GCP Migration Gap Analysis & Document Updates

**Date:** 2026-03-19 16:38 (UTC-3)
**Tags:** #refactor #agents

## Summary

This session audited the existing GCP infrastructure migration plan (`refactors/infrastructure/gcp-infrastructure-migration.md` and `.tf`) against the actual codebase to identify gaps, blind spots, and improvements needed for the application to run completely on Google Cloud. The analysis compared the conceptual plan against real code patterns in `settings.py`, `minio_client.py`, `shared_services/gcs.py`, upload views, Celery tasks, download tasks, Dockerfile, and docker-compose.prod.yml. A total of 15 concrete gaps were identified: 7 blocking, 6 silent-failure blind spots, and 4 improvements. Both migration documents were then rewritten to incorporate all findings with code-level detail.

### Gap Analysis

- **Problem/Goal:** Determine what's missing between the migration plan and the application actually running on GCP.
- **Decision:** Audit all entry points (upload views, Celery tasks, download tasks, storage imports) and infrastructure config (TF, secrets, IAM, networking).
- **Changes:** Created a gap analysis artifact (`gcp_migration_gap_analysis.md`) categorizing 15 findings by severity.

### Migration Plan Update

- **Problem/Goal:** The markdown plan was conceptual — phases lacked code-level specifics, and several concerns (CI/CD, DB migration, backend-ts, logging) were absent.
- **Decision:** Rewrite the plan with exact file/line references for every phase, add new phases (CI/CD, logging), add open decisions (backend-ts), and expand risk documentation.
- **Changes:** Full rewrite of `gcp-infrastructure-migration.md` with actionable detail per phase.

### Terraform Update

- **Problem/Goal:** The TF baseline had 8 concrete issues: no secret injection in Cloud Run, no health checks, overly broad IAM, no Memorystore AUTH, missing ALLOWED_HOSTS, placeholder VM startup, no monitoring, and basic SQL backup config.
- **Decision:** Fix all 8 issues in a single rewrite while preserving the baseline skeleton philosophy.
- **Changes:** Full rewrite of `gcp-infrastructure-migration.tf`.

Key outputs:
- `gcp-infrastructure-migration.md` — expanded plan with code-level detail for every phase
- `gcp-infrastructure-migration.tf` — corrected Terraform with secrets, health checks, scoped IAM, monitoring

## Key Decisions

- **Scoped IAM:** Moved from project-level `storage.objectAdmin` to per-bucket IAM bindings (least-privilege).
- **Secret injection method:** Cloud Run v2 `secret_key_ref` for all sensitive env vars (`SECRET_KEY`, `POSTGRES_PASSWORD`, `EMAIL_HOST_PASSWORD`, `REDIS_PASSWORD`).
- **Memorystore AUTH:** Enabled `auth_enabled = true` with AUTH string in Secret Manager.
- **Cloud Run timeout:** Reduced from 900s to 300s — long operations should be Celery tasks.
- **Subnet size:** Widened from `/24` to `/20` to support future scaling.
- **Health checks:** Added `startup_probe` + `liveness_probe` on `/health/` endpoint.
- **CI/CD phase:** Added Phase 5.5 documenting Cloud Build and GitHub Actions options.
- **DB migration strategy:** Documented 3 options (Cloud Run Job, Cloud SQL Proxy, VM one-off).
- **backend-ts:** Documented as an open decision with 4 options before traffic cutover.

## Files Changed

### Code

No application code was changed in this session. All changes were to infrastructure planning documents.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Full rewrite: added code-level detail per phase, CI/CD phase, DB migration strategy, backend-ts decision, logging decision, expanded risks |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Full rewrite: added secret refs, health checks, scoped IAM, Memorystore AUTH, VM startup script, monitoring, PITR, wider subnet |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement `gcs_client.py` real GCS backend | Phase 2 | ⚠️ HIGH | Open |
| Close leaky imports (views.py, stage_remessa_service.py) | Phase 2 | ⚠️ HIGH | Open |
| Rewrite upload handoff to use GCS keys | Phase 3 | ⚠️ HIGH | Open |
| Move download tasks to GCS | Phase 4 | ⚠️ HIGH | Open |
| Install and configure WhiteNoise | Phase 5 | ⚠️ HIGH | Open |
| Add `google-cloud-storage` to requirements.txt | Phase 2 | ⚠️ HIGH | Open |
| Create CI/CD pipeline | Phase 5.5 | ⚠️ HIGH | Open |
| Implement `/health/` endpoint in Django | Phase 5 | MEDIUM | Open |
| Structured JSON logging | Phase 5 | MEDIUM | Open |
| Decide on backend-ts fate | Pre-Phase 7 | MEDIUM | Open |

## Open Questions

- Which CI/CD platform? Cloud Build or GitHub Actions?
- What happens to `backend-ts` `/v2/` routes after Nginx removal?
- Should database migrations run via Cloud Run Job, Cloud SQL Proxy, or VM one-off?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `updates` | Expanded with code-level migration specifics |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `updates` | Fixed secret injection, IAM, health checks, monitoring |
