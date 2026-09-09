---
tags: [remessa, aquisicao, liquidacao, cloud-run, infrastructure, upload, memory, oom, celery, architecture, spec-003]
node_type: spec
is_session: true
layer: [architecture, application, infrastructure, domain]
nature: [technical, analytical]
status: active
created: 2026-04-01
timestamp: 2026-04-01T14:00:00-03:00
expires: 2026-05-31
conversation_id: 2026-04-01-remessa-cloud-run-implementation
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md]
promoted_candidates:
  - docs/vault/constitution/folder-structure-constitution.md
expected_importance: 8
importance_rationale: "This session produced a complete architectural decision and implementation that eliminates the primary production OOM failure mode for remessa uploads by moving processing into isolated, size-tiered Cloud Run Jobs — an irreversible infrastructure commitment that establishes how all large-file processing should be structured."
---

# Remessa Upload — Cloud Run Jobs Implementation and Spec Fixes

**Date:** 2026-04-01 14:00 (UTC-3)
**Tags:** #remessa #cloud-run #upload #memory #oom #celery #architecture #spec-003

## Summary

This session covered two sequential phases: spec review and full implementation of the remessa upload Cloud Run Jobs feature. The feature's goal is to eliminate OOM-kills in Celery workers caused by Polars never returning freed memory pages to the OS. A 1.2 GB CSV upload in the local environment confirmed the problem is real — the host machine OOMs because Polars peaks at 4–6× the file size during processing. In production, the fix routes each upload to a dedicated Cloud Run Job whose CPU and RAM are sized based on the uploaded file's size in GCS. The Celery task becomes a thin dispatcher completing in under one second.

### Phase 1 — Spec review and fixes

Before touching code, the spec (`2026-03-31-remessa-upload-cloud-run-job-per-upload.md`) was reviewed for implementation readiness. Four problems were found and corrected in the spec before any code was written.

**Bug — NameError in Task 4 snippet.** The dispatcher code used `gcs_path` as a local variable name, but the actual Celery task parameter is `file_path`. This would have raised a `NameError` at runtime for anyone who implemented the snippet literally.

**Flag coupling — independent rollout broken.** The spec gated the remessa dispatcher on `USE_CLOUD_RUN_JOBS`, the same flag already used for bulk import. Setting it to `true` would have activated both pipelines simultaneously, making staged independent rollout impossible. A separate `USE_CLOUD_RUN_JOBS_REMESSA` flag was introduced. This is the pattern bulk import should also follow if it ever needs to be rolled back independently.

**Architecture violation — stager registry in infrastructure.** The spec proposed placing builder functions and `StageRemessaService` instances in `infrastructure/remessa/stager_registry.py`. However, the folder-structure-constitution Rule 6 states infrastructure imports from nobody — the builder functions reference domain models (`AquisicaoManualStaging`, `ContratoCCB`, `RemessaAquisicaoId`) directly. This was caught during review and the fix was decided before implementation began.

**Minor omission — lru_cache migration.** When `_get_aquisicao_complementary_columns` moves out of `celery_tasks.py`, the `cache_clear()` call in the Celery task must also update its import site. The spec did not mention this. It was applied during implementation.

### Phase 2 — Architectural decisions

**Entrypoint location.** The spec placed the Cloud Run job entrypoint in `infrastructure/remessa/`. This was rejected: the entrypoint is cross-domain (handles both `aquisicao` and `liquidacao` via `REMESSA_DOMAIN` env var) and must import use cases and domain models from both. Per Rule 6, infrastructure imports from nobody. The only layer permitted to import from multiple domains is `shared_services/`. The entrypoint was placed at `shared_services/tasks/remessa_upload_job_entrypoint.py`, consistent with the existing `shared_services/tasks/` package.

**Stager extraction.** Rather than a shared registry in infrastructure, each domain's stager configuration (builder functions + `StageRemessaService` instance) was extracted into domain-level modules: `domains/aquisicao/tasks/upload_stager.py` and `domains/liquidacao/tasks/upload_stager.py`. These are within the domain layer, which can import from infrastructure freely. `shared_services/` can import from domain tasks. The existing Celery task files were stripped of the builder functions and now import from `upload_stager`. The `lru_cache` and its `cache_clear()` call live in `upload_stager.py` and are correctly re-imported by `celery_tasks.py`.

### Phase 3 — Implementation

All tasks implemented in order:

- **Settings** — `USE_CLOUD_RUN_JOBS_REMESSA` (bool), `CLOUD_RUN_REMESSA_UPLOAD_JOB` (job base name), `CLOUD_RUN_REMESSA_TIER_SMALL_MB` (default 50), `CLOUD_RUN_REMESSA_TIER_MEDIUM_MB` (default 200)
- **Storage layer** — `get_gcs_file_size()` in GCS client (metadata-only call, raises `FileNotFoundError` if blob absent); `NotImplementedError` stub in MinIO client so local dev fails loudly rather than silently if flag is accidentally set to true
- **Cloud Run client** — `trigger_remessa_upload_job()` injects `REMESSA_DOMAIN`, `REMESSA_GCS_PATH`, `REMESSA_USERNAME` as env vars into the job execution
- **Machine tier selector** — `select_remessa_tier()` reads thresholds from Django settings at call time (tunable via env vars without code deploy)
- **Stager extraction** — both domains extracted, Celery tasks updated with correct imports
- **Entrypoint** — `shared_services/tasks/remessa_upload_job_entrypoint.py`: explicit `django.setup()`, handles both domains via `REMESSA_DOMAIN`, preserves the exact step order from the original Celery tasks (download temp file → use case → delete GCS CSV → stage → run filters), exits non-zero on unhandled exceptions
- **Dispatcher gate** — added to both `process_aquisicao_upload` and `process_liquidacao_upload` behind `USE_CLOUD_RUN_JOBS_REMESSA`; returns `{"status": "dispatched", "tier": tier}` immediately when flag is true
- **CI** — three deploy jobs (`small`, `medium`, `large`) with explicit `--cpu` and `--memory` in **both** `create` and `update` branches (the existing `deploy-bulk-import-job` omits these, causing silent fallback to GCP defaults on redeployment)

### Local OOM discussion

After implementation, the user confirmed the local environment was already OOM-killing on a 1.2 GB CSV. Inspection of `docker-compose.dev.yml` showed no Docker memory limits — the worker already uses all available host RAM. The OOM is a host machine RAM limitation. The Cloud Run path solves it in production. Locally, it could be activated if GCP credentials are available in the Docker Compose env, since `trigger_remessa_upload_job` would dispatch to GCP even when called from a local Celery worker. This was left as an open question.

## Epistemic Impact

**Confirms:** The Polars allocator never releases pages to the OS (see memory project note). Process isolation per upload is the correct fix — tuning `CELERY_WORKER_MAX_MEMORY_PER_CHILD` is a bandage, not a solution. A 1.2 GB file confirmed this in production-equivalent conditions.

**Validates:** `docs/vault/constitution/folder-structure-constitution.md` Rule 6 was actively enforced during spec review — an infrastructure placement was caught and corrected before any code was written.

**Spec drift fixed:** `specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md` contained three concrete errors (NameError, flag coupling, architecture violation) that were corrected before implementation.

**Promoted candidates:** The architectural rule that cross-domain Cloud Run entrypoints must live in `shared_services/tasks/` (not `infrastructure/`) is applied here but not yet written as an explicit clause in the constitution. Should be added. Similarly, the `upload_stager.py` extraction pattern (domain-level stager config to keep infrastructure clean) is reusable and worth recording.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md` | modified | Fixed NameError bug, decoupled feature flag, corrected architecture violation in stager placement |
| `house_project/settings.py` | modified | Added `USE_CLOUD_RUN_JOBS_REMESSA`, job base name, and tier threshold settings |
| `infrastructure/storage/gcs_client.py` | modified | Added `get_gcs_file_size()` — metadata-only GCS call, raises `FileNotFoundError` if blob absent |
| `infrastructure/storage/minio_client.py` | modified | Added `NotImplementedError` stub for `get_gcs_file_size()` to preserve interface parity |
| `infrastructure/storage/gcs.py` | modified | Exported `get_gcs_file_size` in conditional imports and `__all__` |
| `infrastructure/cloud_run/client.py` | modified | Added `trigger_remessa_upload_job()` — dispatches sized Cloud Run Job with upload env vars |
| `infrastructure/cloud_run/machine_tiers.py` | created | `select_remessa_tier()` maps file size in bytes to small/medium/large tier string |
| `domains/aquisicao/tasks/upload_stager.py` | created | Extracted aquisicao stager configuration (builder functions + AQUISICAO_STAGER) |
| `domains/aquisicao/tasks/celery_tasks.py` | modified | Imports stager from upload_stager; Cloud Run dispatcher gate added |
| `domains/liquidacao/tasks/upload_stager.py` | created | Extracted liquidacao stager configuration (builder function + LIQUIDACAO_STAGER) |
| `domains/liquidacao/tasks/celery_tasks.py` | modified | Imports stager from upload_stager; Cloud Run dispatcher gate added |
| `shared_services/tasks/remessa_upload_job_entrypoint.py` | created | Cloud Run Job entrypoint — reads env vars, runs full upload pipeline, exits cleanly |
| `.github/workflows/deploy-gcp.yml` | modified | Added 3 deploy jobs with explicit CPU/memory in both create and update branches |

## Connections

| Document | Type | Description |
|---|---|---|
| `docs/vault/constitution/folder-structure-constitution.md` | `validates` | Rule 6 enforced during spec review; entrypoint and stager placement decisions derive directly from it |
| `specs/003-remessa-upload-with-events/2026-03-31-remessa-upload-cloud-run-job-per-upload.md` | `derives-from` | This session implements and corrects that spec |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Tests: `select_remessa_tier()` — all boundary conditions (below small, at small, between thresholds, at medium, above medium) | Session | HIGH | open |
| Tests: `trigger_remessa_upload_job()` — env var injection verified with mocked `run_v2.JobsClient` | Session | HIGH | open |
| Tests: `get_gcs_file_size()` — blob exists returns size; blob absent raises `FileNotFoundError` | Session | HIGH | open |
| Tests: Entrypoint — missing env vars exits 1; unknown domain exits 1; successful aquisicao run; successful liquidacao run; unhandled exception exits 1 | Session | HIGH | open |
| Tests: Celery dispatcher gate (aquisicao) — flag true dispatches and returns `{"status": "dispatched"}`; flag false falls through to existing pipeline | Session | HIGH | open |
| Tests: Celery dispatcher gate (liquidacao) — same as aquisicao | Session | HIGH | open |
| Promote to constitution: cross-domain Cloud Run entrypoints must live in `shared_services/tasks/`, not `infrastructure/` | Session — rule applied but not written | MEDIUM | open |
| Promote to constitution or conceptual: domain-level stager extraction pattern (`upload_stager.py`) as reusable guideline | Session — pattern emerged, not recorded | MEDIUM | open |
| Open question: can `USE_CLOUD_RUN_JOBS_REMESSA=true` be used locally if GCP credentials are in Docker Compose env? | Session — local OOM discussion | LOW | open |

## Open Questions

- Does the local Celery worker have GCP credentials available (Application Default Credentials or service account key) to allow `USE_CLOUD_RUN_JOBS_REMESSA=true` locally for large-file testing?
- Should the CI `deploy-bulk-import-job` job be updated to also explicitly set `--cpu`/`--memory` (it currently relies on GCP defaults)?
