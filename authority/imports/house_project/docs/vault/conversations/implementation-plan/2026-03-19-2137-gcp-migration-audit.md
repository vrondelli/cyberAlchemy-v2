---
tags: [infrastructure, pipeline]
node_type: implementation-plan
is_session: true
layer: [architecture]
nature: [technical, explanatory]
status: active
created: 2026-03-19
timestamp: 2026-03-19T21:37:00-03:00
expires: 2026-05-18
conversation_id: bbe2145b-5f19-4b34-a25d-2b8749ce3ffe
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: 
  - refactors/infrastructure/pre-migration-code-changes.md
  - refactors/infrastructure/gcp-infrastructure-migration.md
promoted_candidates: 
  - refactors/infrastructure/gcp-architecture-reference.md
expected_importance: 7
importance_rationale: "Validated the GCP migration plan using an Agent Duo simulation, identifying and fixing critical OOM file-streaming risks, and formally documented the architectural boundary keeping core domain processing in Celery rather than GCF."
---

# GCP Migration Audit & Celery vs GCF Boundary

**Date:** 2026-03-19 21:37 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

The session focused on thoroughly auditing the first phase of the GCP infrastructure migration plan (`pre-migration-code-changes.md`). Using a simulated "Agent Duo" approach, the codebase and existing design documents were deeply reviewed against the project Constitutions. Critical vulnerabilities related to memory management during file uploads were caught, specifically the risk of OOM errors when loading large (up to 200MB) CSV files entirely into memory. The plan was updated to enforce streaming via `shutil.copyfileobj` and direct disk writes using Polars instead of loading strings into memory.

Furthermore, a critical architectural decision was clarified and documented regarding the boundaries between Celery background tasks and Google Cloud Functions (GCF). The session concluded that core domain processing (which heavily relies on the Django ORM and large memory margins for Polars) will remain in Celery, while GCF will exclusively handle future stateless event-driven integrations. A new architectural reference document (`gcp-architecture-reference.md`) was initialized to serve as the single source of truth for the FASE 1 architecture.

### OOM Vulnerability in Data pipelines
- **Problem/Goal:** The initial pre-migration plan suggested reading entire file contents into memory (`file_bytes = f.read()`) before writing them to temporary files for Polars processing, risking catastrophic OOMs for 200MB payloads. Duplicate CSV generation in `upload_service.py` had similar volatile string operations.
- **Decision:** Shift all reads and writes of large file objects to streaming methods or disk-direct commands.
- **Changes:** Updated `pre-migration-code-changes.md` to patch `celery_tasks.py` to stream files with `shutil.copyfileobj(src, dst)` directly from `default_storage.open()`. Updated duplicate saving to instruct Polars to dump directly into a local temp path. Tests in `celery_tasks_test.py` were verified for compatibility with this patching logic.

### Celery vs GCF Architectural Boundary
- **Problem/Goal:** Clarify what workloads should be handled by `celery_tasks_test.py` (Celery) versus Google Cloud Functions in the new GCP architecture.
- **Decision:** Do not migrate core data processing to GCF. Retain the monolithic context for deep domain validation via Celery Managed Instance Groups. Reserve GCF strictly for lightweight, stateless event triggers (like Webhooks or GCS object events) in a future phase.
- **Changes:** Created `architecture_boundary_celery_vs_gcf.md` as an explanatory artifact. Added a specific boundary definition section directly into `gcp-infrastructure-migration.md`. Created the permanent reference document `gcp-architecture-reference.md` containing a Mermaid architecture topology diagram.

Key outputs:
- `pre-migration-code-changes.md` — Updated with Agent Duo iterations 9-14 detailing the OOM streaming patches.
- `gcp-infrastructure-migration.md` — Modified to include the Celery vs GCF boundary under Target Architecture.
- `gcp-architecture-reference.md` — Bootstrapped a new reference top-level architectural map for the FASE 1 infrastructure with Mermaid graphs.

## Key Decisions

- **Streaming I/O:** Any interaction transferring data between Cloud Storage (`default_storage.open`) and a domain temp file must stream via `shutil.copyfileobj` or equivalent, never loading raw files entirely to memory strings.
- **Celery Boundary:** Polars processing, atomic transactional commits, and heavy Event System logging stay mapped to Compute Engine Celery Workers. GCF is restricted from Phase 1 data pipeline rewrites.

## Files Changed

### Code
None directly edited (only migration documents detailing the code changes).

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Applied streaming patches for robust file handling (Iterations 9-14). |
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Added the Celery vs GCF boundary definitions. |
| `refactors/infrastructure/gcp-architecture-reference.md` | `created` | Scaffolded the single source of truth for FASE 1 architecture. |
| `architecture_boundary_celery_vs_gcf.md` | `created` | Artifact exploring the background processing boundaries. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-architecture-reference.md]] | `implements` | Documented top-level pipeline behaviors. |
| [[infrastructure/pre-migration-code-changes.md]] | `refines` | Fixed memory vulnerabilities prior to implementation. |
| [[constitution_developement_practices.md]] | `contextualizes` | Contextualizes the boundary constraints protecting the monolithic application domain layer. |
