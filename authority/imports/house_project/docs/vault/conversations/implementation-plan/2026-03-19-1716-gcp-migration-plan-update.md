---
tags: [infrastructure]
node_type: implementation-plan
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:16:34-03:00
expires: 2026-05-18
conversation_id: a4e6e365-8cd1-4f43-995a-299bbd7a5cc7
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.md, refactors/infrastructure/gcp-infrastructure-migration.tf]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Rewrote GCP migration plan with 15 gap fixes (storage two-pattern split, data migration, backend-ts timing, security headers, CORS) and created Terraform rationale doc — foundation for all subsequent infrastructure implementation."
satisfaction_estimate:
  mean: 8
  min: 7
  max: 9
  std: 0.7
version: 0.1.0
last_updated: 2026-03-19
---

# GCP Migration Gap Analysis and Plan Update

**Date:** 2026-03-19 17:16 (UTC-3)
**Tags:** #infrastructure

## Summary

This session performed a deep gap analysis of the GCP infrastructure migration documents (`gcp-infrastructure-migration.md`, `gcp-infrastructure-migration.tf`, and `infrastructure-refactor.md`), cross-referencing them against 10+ actual source files and discovering 15 distinct gaps including 6 critical issues. The most impactful finding was that `default_storage` is used in 50+ sites across the codebase — far more than the 4 originally documented — which led to a fundamental restructuring of the storage migration strategy into two distinct patterns (Pattern A: `django-storages` for FileSystemStorage, Pattern B: `gcs_client` for artifact storage). All gaps were then applied directly to the migration plan and Terraform baseline, and a new dedicated Terraform decisions document was created explaining the rationale behind every resource.

### Storage Migration Gap

- **Problem/Goal:** The original plan underspecified storage migration, treating `default_storage` and MinIO object storage as a single concern and only identifying 4 `default_storage` call sites.
- **Decision:** Split into two distinct patterns — Pattern A uses `django-storages[google]` to transparently migrate 50+ `default_storage` sites; Pattern B implements a full `gcs_client.py` with expanded interface (`upload_csv`, `download_csv`, bucket routing).
- **Changes:** Rewrote Sections 1 and 2 of the migration plan. Added full `default_storage` usage table. Specified the `minio_client` interface that `gcs_client` must match. Added `django-storages[google]` to the required dependencies.

### Data Migration Strategy

- **Problem/Goal:** The plan provisioned Cloud SQL but never explained how existing production data would get there.
- **Decision:** Added a full data migration strategy covering pg_dump/restore, Cloud SQL Auth Proxy import, row-count validation, sequence verification, and downtime window estimation.
- **Changes:** Added data migration subsection to Phase 6. Covers both RDS and Docker Compose source scenarios.

### Backend-ts Timing Fix

- **Problem/Goal:** The plan scheduled the `backend-ts` routing decision for Phase 7, but removing Nginx in Phase 5 would immediately break `/v2/` routes.
- **Decision:** Moved `backend-ts` resolution to a new Phase 4.5, making it a hard prerequisite for Phase 5.
- **Changes:** Created Phase 4.5 with audit steps. Updated Section 9 to mark this as a Phase 5 blocker. Removed the "Open Decision" framing — it's now a required decision.

### Security Headers and CORS

- **Problem/Goal:** Nginx provides HSTS, CSP, X-Frame-Options, Referrer-Policy, and a 200MB body limit. The plan didn't address replacements after Nginx removal. CORS origins were hard-coded.
- **Decision:** Security headers move to Django settings. CORS becomes env-var configurable. Cloud Run's 32MB body limit is flagged as a functional regression risk.
- **Changes:** Added Section 8 (Security Headers), Section 6 (CORS env-var), request body limit risk. Added `CORS_ALLOWED_ORIGINS` env to Cloud Run and worker VM in Terraform. Added `cors_allowed_origins` variable.

### Terraform Fixes and Decisions Document

- **Problem/Goal:** Terraform had hard-coded Celery queues, no API enablement dependencies, fragile uptime checks, no LB/DNS resources, and no documentation explaining why each resource was chosen.
- **Decision:** Applied 8 targeted fixes and created a standalone `terraform-decisions.md` with per-resource rationale.
- **Changes:** Added `celery_queues` variable (read from env in worker startup script). Added `depends_on` for Artifact Registry. Documented uptime check revision fragility. Added Phase 7 TODO section for LB/DNS/SSL resources. Created `terraform-decisions.md` covering provider versioning, region choice, networking topology, bucket separation, IAM scoping, Cloud SQL PITR, Redis tier, Cloud Run scaling, worker VM justification, and cost estimate (~$180–$250/month).

Key outputs:
- `gcp-infrastructure-migration.md` — fully updated migration plan
- `gcp-infrastructure-migration.tf` — corrected Terraform baseline
- `terraform-decisions.md` — new rationale document

## Key Decisions

- **Storage split into two patterns:** Pattern A (`django-storages`) for `default_storage`, Pattern B (`gcs_client`) for artifact storage — avoids rewriting 50+ call sites
- **`backend-ts` is Phase 4.5 blocker:** cannot defer to Phase 7 since Phase 5 removes Nginx
- **CORS from env var:** `CORS_ALLOWED_ORIGINS` injected into Cloud Run and worker VM
- **Celery queues from env var:** worker VM reads queue names from env instead of hard-coding in Terraform
- **Security headers in Django:** `SECURE_HSTS_*`, `SECURE_REFERRER_POLICY`, CSP via `django-csp`
- **32MB body limit acknowledged:** Cloud Run HTTP/1.1 limit is smaller than Nginx's 200MB; needs signed URL upload strategy for large files

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Added CORS/queue variables, Cloud Run CORS env, worker env-var queue names, depends_on, uptime check docs, LB/DNS TODO section |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Rewrote with 15 gap fixes: two-pattern storage, data migration, Phase 4.5, security headers, CORS, gunicorn, body limits |
| `refactors/infrastructure/terraform-decisions.md` | `created` | Per-resource rationale for every Terraform resource, including cost estimate |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Load balancer + DNS + SSL Terraform resources | gap analysis | ⚠️ HIGH | Deferred to Phase 7 implementation |
| `backend-ts` audit (frontend `/v2/` usage, DB sharing, auth) | gap analysis | ⚠️ HIGH | Blocked on frontend codebase check |
| Large file upload strategy (signed URLs vs Cloud Run limit) | gap analysis | MEDIUM | Decision pending before Phase 5 |
| Region decision (`us-central1` vs `southamerica-east1`) | terraform-decisions.md | MEDIUM | Default is us-central1, needs latency testing |

## Open Questions

- Does the frontend actively call `/v2/` routes? This determines the `backend-ts` decision.
- Does `backend-ts` share the Django Postgres instance or have its own database?
- Are there any current uploads exceeding 32MB that would break on Cloud Run?
- Should the region be `southamerica-east1` for lower latency to Brazilian users?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Rewrote migration plan with 15 gap fixes |
| [[infrastructure/gcp-infrastructure-migration.tf]] | `updates` | Applied 8 targeted Terraform corrections |
| [[infrastructure/terraform-decisions.md]] | `implements` | Created rationale document for Terraform resources |
