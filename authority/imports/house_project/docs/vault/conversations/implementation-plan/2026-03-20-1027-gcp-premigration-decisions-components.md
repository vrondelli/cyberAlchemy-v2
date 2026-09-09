---
tags: [infrastructure, pipeline]
node_type: implementation-plan
is_session: true
layer: [architecture, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T10:27:00-03:00
expires: 2026-05-19
conversation_id: d5986998-c6bd-42b4-bc06-2cd8d0afce7d
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/migration-phase-guide.md
  - refactors/infrastructure/migration-preflight-checklist.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Registered all 3 blocking GCP migration decisions (region, upload strategy, backend-ts) and implemented 5 of 10 pre-migration code components with tests, directly advancing the infrastructure migration from planning to execution."
user_satisfaction: 8
user_satisfaction_min: 7
user_satisfaction_max: 9
user_satisfaction_std: 0.5
---

# GCP Pre-Migration: Decisions & Low-Risk Components

**Date:** 2026-03-20 10:27 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

This session performed a comprehensive audit of `/refactors/infrastructure`, assessed the current implementation status of the GCP migration plan, registered all 3 blocking architectural decisions, and implemented the 5 low-risk pre-migration code components with their corresponding tests.

The session began by reading all 9 documents in the refactors/infrastructure directory and cross-referencing each planned component against the actual codebase. This revealed that Components 8, 9, 10 (settings.py GCS conditional block) were already implemented with tests, while Components 1–7 and all GCP phases remained unimplemented. The 3 blocking decisions (region, upload strategy, backend-ts routing) were also unresolved.

After the audit, the user made the 3 architectural decisions: `southamerica-east1` for region (latency for Brazilian users), Signed URL uploads (to bypass Cloud Run's 32MB limit while keeping 500MB support), and deprecation of `backend-ts`. These were recorded in `migration-phase-guide.md`. The session then implemented Components 1, 3, 4, 5, and 7 — all independent, low-risk changes testable locally. The full test suite passed (1529/1529).

### Infrastructure Migration Assessment
- **Problem/Goal:** Determine the current state of the GCP migration plan and identify what needs to be done next.
- **Decision:** 7 of 10 pre-migration components were unimplemented; 3 decisions were blocking all progress.
- **Changes:** Created an assessment artifact documenting the exact status of each component and phase.

### Architecture Decisions
- **Problem/Goal:** 3 decisions were blocking the entire migration pipeline.
- **Decision:** Region = `southamerica-east1` (~30ms, +$50-70/mo). Upload = Signed URL (frontend → GCS direct, no size limit). Backend-ts = deprecate entirely.
- **Changes:** Recorded all 3 decisions with dates in `migration-phase-guide.md`.

### Component 1: Storage Abstraction
- **Problem/Goal:** `shared_services/gcs.py` only re-exported 4 of 7 functions, and 4 production files imported directly from `minio_client`.
- **Decision:** Expand re-exports and fix all leaky imports.
- **Changes:** Added `upload_csv`, `download_csv`, `delete_csv` to `gcs.py`. Fixed imports in `views.py` (2), `stage_remessa_service.py` (1), `upload_existing_templates.py` (1). Updated 6 mock paths in `test_document_template.py`.

### Component 3: Health Endpoint
- **Problem/Goal:** Cloud Run requires a health endpoint for startup/liveness probes.
- **Decision:** Create `/health/` checking DB + Redis via Celery broker (project doesn't use django-redis).
- **Changes:** Created `house_project/health.py`, added route to `urls.py`.

### Components 4, 5, 7
- **Problem/Goal:** CORS was hardcoded, logging used a FileHandler incompatible with Cloud Run, and `.dockerignore` was missing dev-only exclusions.
- **Decision:** Make CORS env-configurable with defaults, remove FileHandler, update `.dockerignore`.
- **Changes:** Modified `settings.py` (CORS + logging), updated `.dockerignore` with `refactors/`, `specs/`, `docs/`, `backend-ts/`, `.gitnexus/`, etc.

Key outputs:
- `migration-phase-guide.md` — 3 decisions recorded with dates
- `shared_services/gcs.py` — expanded to 7 re-exports
- `house_project/health.py` — new health endpoint
- `settings.py` — CORS env var + FileHandler removed
- `.dockerignore` — updated with dev-only exclusions

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `shared_services/tests/test_gcs_interface.py` | `test_all_functions_are_exported`, `test_all_in_list`, `test_no_extra_exports` | Storage abstraction must re-export all 7 functions and not leak internal bucket-management functions |
| `house_project/tests/test_health.py` | `test_health_check_ok`, `test_health_check_db_down`, `test_health_check_redis_down` | Health endpoint must verify both DB and Redis (Celery broker) connectivity for Cloud Run probes |
| `house_project/tests/test_settings.py` | `test_cors_default_includes_known_origins`, `test_cors_from_env_overrides_defaults` | CORS origins must be configurable via env var with safe defaults |
| `domains/aquisicao/tests/test_document_template.py` | 6 mock path updates | Template upload/download tests must mock the abstraction layer, not the concrete storage backend |

**Why these tests matter:** The storage abstraction tests prevent future regressions where domain code bypasses the `shared_services/gcs.py` facade and imports `minio_client` directly — which would break silently when GCS replaces MinIO. The health tests ensure Cloud Run probes work correctly, preventing crash loops in production. The CORS test ensures the frontend can reach the API after migration.

## Key Decisions

- **Region:** `southamerica-east1` — users are Brazilian, 30ms vs 150ms justifies ~$50-70/mo premium. Irreversible after Phase 1.
- **Upload strategy:** Signed URL uploads — frontend sends files directly to GCS (no size limit), then notifies API with the GCS key. Avoids Cloud Run's 32MB limit entirely.
- **Backend-ts:** Deprecate — `backend-ts` will be removed. Phase 4.5 becomes a cleanup step.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `shared_services/gcs.py` | `modified` | Added 3 re-exports (upload_csv, download_csv, delete_csv) to complete the 7-function interface |
| `domains/aquisicao/interfaces/views.py` | `modified` | Fixed 2 leaky imports (lines 652, 752) from minio_client → shared_services.gcs |
| `infrastructure/remessa/stage_remessa_service.py` | `modified` | Fixed leaky import (line 32) from minio_client → shared_services.gcs |
| `upload_existing_templates.py` | `modified` | Fixed leaky import (line 14) from minio_client → shared_services.gcs |
| `house_project/health.py` | `created` | Health endpoint checking DB + Redis (Celery broker) |
| `house_project/urls.py` | `modified` | Added `/health/` route |
| `house_project/settings.py` | `modified` | CORS env var (Component 4) + removed FileHandler (Component 5) |
| `.dockerignore` | `modified` | Added dev-only exclusions (refactors/, specs/, docs/, backend-ts/, .gitnexus/, etc.) |
| `shared_services/tests/test_gcs_interface.py` | `created` | 3 tests for storage abstraction completeness |
| `house_project/tests/test_health.py` | `created` | 3 tests for health endpoint |
| `house_project/tests/test_settings.py` | `modified` | Added 2 CORS env var tests |
| `domains/aquisicao/tests/test_document_template.py` | `modified` | Updated 6 mock paths from minio_client → shared_services.gcs |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Registered all 3 architectural decisions with dates |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Marked Components 1, 3, 4, 5, 7 as completed |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Components 2+6: Eliminate `default_storage.path()` + test updates | Pre-migration plan | ⚠️ HIGH | Pending (next session) |
| Signed URL upload frontend implementation | Decision 2 | MEDIUM | Not started (Phase 5) |
| Remove `backend-ts` from docker-compose.prod.yml | Decision 3 | LOW | Not started (Phase 4.5) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/pre-migration-code-changes.md]] | `implements` | Implemented Components 1, 3, 4, 5, 7 from the pre-migration plan |
| [[infrastructure/migration-phase-guide.md]] | `refines` | Registered all 3 blocking decisions |
| [[infrastructure/gcp-architecture-reference.md]] | `contextualizes` | Architecture reference informed the decision rationale |
