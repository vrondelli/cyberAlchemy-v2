---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T18:57:00-03:00
expires: 2026-05-18
conversation_id: a6f2f7d8-48f9-4f49-8460-8d1c0909d808
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [refactors/infrastructure/pre-migration-code-changes.md]
expected_importance: 7
importance_rationale: "Identified 3 critical code-level blockers (leaky storage abstraction, default_storage.path() incompatibility, hardcoded download paths) that must be resolved before GCP migration, and produced a concrete implementation plan for 6 pre-migration changes."
---

# Infrastructure Pre-Migration Code Analysis

**Date:** 2026-03-19 18:57 (UTC-3)
**Tags:** #infrastructure

## Summary

This session audited the GCP infrastructure migration plan (`refactors/infrastructure/`) and corresponding session documents against the actual codebase to determine if the **general structure** — not specific services or machine sizing — was ready for migration. The analysis confirmed the plan is solid at the service/architecture level but identified 3 critical structural issues in the code that must be resolved before any migration phase can start safely.

The session produced two outputs: (1) a structural analysis artifact identifying the issues and their blast radius, and (2) a concrete implementation plan (`pre-migration-code-changes.md`) with 5 components covering all 6 required changes. Both are testable locally with Docker Compose and independent of any GCP resource.

### Structural Audit of Infrastructure Plan
- **Problem/Goal:** Determine if the codebase needs structural code changes before migration, beyond what the plan already documents.
- **Decision:** The plan correctly identifies the issues (storage patterns, .path() calls, download paths) but does not emphasize that these are _pre-requisites_ — things that must be fixed _before_ Phase 1, not during Phases 2-4.
- **Changes:** Created `infrastructure-structural-analysis.md` artifact with detailed findings.

### Leaky Storage Abstraction
- **Problem/Goal:** `shared_services/gcs.py` only re-exports 4 of 7 storage functions. 4 production files and 15+ test files import directly from `infrastructure.storage.minio_client`.
- **Decision:** Must expand `gcs.py` to export all 7 functions and redirect all production imports before implementing `gcs_client.py` — otherwise half the system would silently continue using MinIO.
- **Changes:** Documented in pre-migration plan as Component 1.

### `default_storage.path()` Incompatibility
- **Problem/Goal:** 4 production call sites use `default_storage.path()` which raises `NotImplementedError` with GCS backend.
- **Decision:** Replace with `default_storage.open()` + temp file pattern. This is safe because `.open()` works with both FileSystemStorage and GCS. Polars `read_csv()` requires a filepath, so a local temp file is needed on the worker.
- **Changes:** Documented in pre-migration plan as Component 2 with exact diffs for all 4 sites.

### Missing Health Endpoint and Config Gaps
- **Problem/Goal:** Cloud Run probes target `/health/` but no such endpoint exists. CORS is hardcoded. Logging file handler writes to ephemeral `/tmp`.
- **Decision:** Create `/health/` with DB+Redis verification, make CORS env-configurable, remove file handler.
- **Changes:** Documented in pre-migration plan as Components 3, 4, 5.

Key outputs:
- `refactors/infrastructure/pre-migration-code-changes.md` — Implementation plan for 6 pre-migration changes across 5 components
- Analysis artifact — Structural diagnosis of all code-level migration blockers

## Key Decisions

- **Pre-migration sequencing:** All 6 code changes should be done and tested locally _before_ starting GCP Phase 1. This reduces migration risk by separating "make code portable" from "deploy to cloud".
- **Temp file pattern for Celery tasks:** Because `ProcessUploadService.process_file_upload()` passes filepath to Polars `read_csv()`, the `.path()` → `.open()` migration requires reading from storage and writing to a local temp file. This adds one I/O step but is the least invasive change.
- **Health check via Celery broker:** The `/health/` endpoint checks Redis through the Celery broker connection rather than `django-redis`, since the project doesn't use Django's cache framework for Redis.
- **Storage abstraction first:** Closing the leaky `minio_client` abstraction is the first priority because all other storage changes depend on a single import point.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `created` | Implementation plan for 6 pre-migration code changes across 5 components: storage abstraction, .path() elimination, health endpoint, CORS env var, logging cleanup |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `BASE_DIR/downloads` consolidation across 3 domains | Analysis | ⚠️ HIGH | Deferred to Phase 4 (needs GCS bucket in place) |
| Test updates for `.path()` → `.open()` mocks | Pre-migration plan | ⚠️ HIGH | Blocked on Component 2 implementation |
| JSON structured logging formatter | Pre-migration plan | MEDIUM | Can be done during Phase 5 |

## Open Questions

- Should `process_file_upload()` be refactored to accept bytes directly (bigger change, cleaner long-term) or keep the temp file pattern (smaller change, works now)?
- Health check Redis verification: use Celery broker connection or add `django-redis`?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `contextualizes` | This audit identifies code-level prerequisites for the migration phases described in the plan |
| [[infrastructure/terraform-decisions.md]] | `contextualizes` | Health endpoint and CORS changes are driven by decisions documented here |
