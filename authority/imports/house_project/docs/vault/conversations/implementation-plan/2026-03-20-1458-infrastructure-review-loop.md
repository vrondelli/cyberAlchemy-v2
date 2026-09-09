---
tags: [infrastructure, gcp, terraform]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:58:13-03:00
expires: 2026-05-19
conversation_id: e3ce5d3e-b23a-4775-84b6-2346c2791f1a
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.md, refactors/infrastructure/README.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Refined the GCP migration plan and Terraform baseline by establishing Redis HA, standardizing large file handling via Signed URLs, and separating backend-ts into its own Cloud Run service."
---

# Infrastructure Review Loop

**Date:** 2026-03-20 14:58 (UTC-3)
**Tags:** #infrastructure #gcp #terraform

## Summary

This session involved a multi-agent review loop for the GCP Infrastructure Migration plan. The objective was to deeply analyze the Terraform baseline and the markdown specifications to find areas of improvement before proceeding with the migration. We identified several gaps and open decisions that needed closure. Through the iteration process, we ratified specific choices regarding database/cache resilience, static file routing, and handling large request payloads within Cloud Run.

### Redis Resilience
- **Problem/Goal:** The baseline Terraform incorrectly provisioned a `BASIC` tier Redis instance, which lacks High Availability and creates a single point of failure for the Celery cluster.
- **Decision:** Use `STANDARD_HA` for the production Memorystore instance to ensure background tasks are not lost during node failures.
- **Changes:** Updated `gcp-infrastructure-migration.tf` and modified the architecture components list in the Markdown specs.

### Backend-TS Routing
- **Problem/Goal:** Phase 5 removes Nginx, breaking `/v2/` API routes that pointed to the separate Express/Drizzle `backend-ts` service.
- **Decision:** Deploy `backend-ts` as a distinct Cloud Run service and use the external HTTPS load balancer for URL mapping, rather than merging it with Django.
- **Changes:** Inserted a baseline `google_cloud_run_v2_service` definition into the Terraform baseline and explicitly resolved the open decision in the `README.md` and spec table.

### Large File Uploads
- **Problem/Goal:** Cloud Run has a hard 32MB request body limit, which blocks large CSV and ZIP bulk imports currently allowed by the application (`REMESSA_UPLOAD_MAX_SIZE_MB = 500`).
- **Decision:** Retain the default 32MB Cloud Run limit and mandate the use of Signed URLs directly to GCS for large files.
- **Changes:** Updated the Open Decisions block in the `README.md` and clarified Phase 5 of the implementation plan.

## Key Decisions

- **Redis HA:** Production Memorystore must be `STANDARD_HA`.
- **Backend Routing:** `backend-ts` will run as an independent Cloud Run service managed via GCP Load Balancer maps.
- **Storage Limits:** Files larger than 32MB must use Signed URLs directly against GCS to bypass Cloud Run overhead.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Upgraded Redis tier to STANDARD_HA and added the backend-ts Cloud Run service. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Updated infrastructure scope to reflect Redis HA, Signed URLs, and backend-ts service layout. |
| `refactors/infrastructure/README.md` | `modified` | Closed the Open Decisions relating to backend-ts routing and large file uploads. |
