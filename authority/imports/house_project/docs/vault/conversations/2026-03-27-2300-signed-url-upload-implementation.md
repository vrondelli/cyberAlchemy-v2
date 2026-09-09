---
tags: [signed-url-upload, file-upload, cloud-run, storage, minio, presigned-url]
node_type: spec
is_session: true
layer: infrastructure
nature: technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T23:00:00-03:00
expires: 2026-05-26
conversation_id: 6f87b88e-cae4-4e15-ba70-14d53433b5a9
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/2026-03-27-signed-url-upload.md]
promoted_candidates: [premise: "no binary payloads on Cloud Run — all uploads must go direct-to-storage"]
expected_importance: 9
importance_rationale: "Replaced every multipart upload path in the system with a signed-URL 3-step flow, resolving the Cloud Run 32 MB hard limit that would have blocked CSV and ZIP uploads in production."
---

# Signed URL Upload Implementation

**Date:** 2026-03-27 23:00 (UTC-3)
**Tags:** #signed-url-upload #file-upload #cloud-run #storage #minio #presigned-url

## Summary

This session implemented the complete signed URL upload plan from `refactors/infrastructure/2026-03-27-signed-url-upload.md`, replacing all multipart form upload paths with a 3-step browser-to-storage direct upload flow. The primary motivation was the Cloud Run 32 MB request body limit, which would have silently blocked CSV remessa uploads (up to 500 MB) and ZIP bulk import uploads (sometimes >1 GB) in production. The session first verified migration readiness (GCP infrastructure checklist), confirmed the plan was implementable with all dependencies in place, then executed all 7 tasks end-to-end.

The implementation touched every layer: storage client (`minio_client.py`), shared services (`gcs.py`), Django API views (`dashboard/api_views.py`, `domains/aquisicao/interfaces/views.py`), Celery tasks (both `aquisicao` and `liquidacao`), a new use-case function (`create_bulk_import_batch_from_key`), frontend hooks (`useRemessaUpload.js`, `Contratos.jsx`), and Terraform (CORS + lifecycle rules). 13 existing tests had to be updated because they tested the old multipart flow; the session also produced a net-new test suite for the new paths.

An important production caveat was identified and communicated: the presigned URL flow works locally with MinIO but the GCS production path is not yet complete — it requires `gcs_client.py` (Group 4 of the migration checklist) before Cloud Run can be switched over. This was not a blocker for the implementation but must be understood before deploying.

The user contributed several test enhancements beyond the base plan: `test_process_aquisicao_celery_task_cleans_up_tempfile`, `test_create_bulk_import_batch_from_key_generates_unique_batch_ids`, strengthened the storage-error test with DB/event count assertions, and added `TestBulkImportUploadUrlView` with 4 tests.

### Problem: Cloud Run 32 MB Upload Limit

Cloud Run enforces a hard 32 MB limit on HTTP request bodies. The existing upload flow sent the entire file as a multipart POST to Django, which in turn wrote it to MinIO. This works in a local Django server but fails silently under Cloud Run — the platform drops connections before the full body is received. CSV remessas can reach 500 MB; ZIP bulk imports routinely exceed 1 GB.

**Alternatives considered:**
- Chunked upload to Django: rejected — complexity is high, still requires Django to hold the assembled file.
- Streaming proxy: rejected — Cloud Run's streaming support has its own limits and latency cost.
- Signed URL (presigned PUT): chosen — browser sends the file body directly to MinIO/GCS, bypassing Django entirely. Django only handles a small JSON confirmation.

**Decision:** Implement the 3-step signed URL pattern:
1. Browser POSTs `{filename}` to Django → Django returns `{upload_url, object_key, expires_in}`.
2. Browser PUTs the file binary directly to `upload_url` (MinIO or GCS).
3. Browser POSTs `{object_key}` confirmation to Django → Django validates, enqueues Celery.

### Problem: Celery Tasks Read From `default_storage`, Not MinIO

After migration, the file lands in MinIO under a presigned key. But Celery tasks used `default_storage.open(file_path)` which is filesystem-backed in development and would not find the file uploaded via presigned URL.

**Decision:** Replace `default_storage` access in both `aquisicao` and `liquidacao` Celery tasks with `download_csv_to_file(key, tmp_path)` (new function in `minio_client.py` using `fget_object`). This streams directly to a temp file, avoiding holding the full CSV in memory. Post-processing cleanup uses `client.remove_object(get_remessa_bucket(), file_path)` instead of `default_storage.delete()`.

### Problem: Docker Compose Internal Hostname in Presigned URLs

MinIO inside Docker Compose is reachable from the backend as `minio:9000`. If the presigned URL is signed for `minio:9000`, the browser cannot resolve it (it's a Docker-internal hostname). The URL becomes unreachable.

**Decision:** Introduce a separate `_get_presign_client()` initialized from `MINIO_PUBLIC_URL` (the browser-accessible address, e.g., `http://localhost:9000`). The region must be pre-configured (`MINIO_REGION`, defaulting to `us-east-1`) to prevent the SDK from making an internal HTTP region-lookup call that would also fail from the host.

### Problem: Path Traversal in `object_key` Confirmation

The confirmation endpoint receives `object_key` from the browser. Without validation, an attacker could provide `../secrets/passwords.csv` and trigger Celery to process an arbitrary internal file.

**Decision:** Validate `object_key` against `^tmp_upload/[a-f0-9]+\.(csv|xlsx)$` (remessas) and `^bulk_staging/[a-f0-9\-]+/upload\.zip$` (bulk import). Reject with HTTP 400 if the pattern doesn't match. Also verify the file exists in MinIO via `stat_object` before dispatching Celery.

### Problem: `create_bulk_import_batch_from_key` — Error Propagation

The new function creates a batch record, emits two events (INITIATED + STAGED), and enqueues Celery. If Celery enqueue fails, the batch would be left in `STATUS_PENDENTE` with no worker ever claiming it — a silent orphan.

**Decision:** Do not catch Celery `ConnectionError`. Let it propagate to the view, which will return a 5xx. The batch is created before enqueue, so on retry the caller would create a second batch — acceptable because the first would never be processed. The test `test_create_bulk_import_batch_from_key_propagates_celery_failure` documents this contract.

### Production GCS Gap

`generate_presigned_upload_url` uses the MinIO SDK (`client.presigned_put_object`). For GCS, the equivalent is a signed URL generated via a service account key and the Google Cloud Storage client library. The `shared_services/gcs.py` module currently delegates to `minio_client.py` for all storage operations. Until `gcs_client.py` (Group 4 of the migration checklist) is implemented and `gcs.py` conditionally routes to it when `STORAGE_BACKEND=gcs`, the presigned upload flow will not work against real GCS in production.

## Epistemic Impact

- **Validates** the premise that the 3-step signed URL pattern is the correct architecture for large-file uploads under Cloud Run. This session moved it from "planned" to "implemented and tested."
- **Surfaces gap**: No premise node yet exists for "no binary payloads on Cloud Run." This is an enforceable architectural rule that should be promoted to a premise or constitution entry so future features don't accidentally reintroduce multipart uploads.
- **Spec updated**: `refactors/infrastructure/2026-03-27-signed-url-upload.md` was the source plan; all 7 tasks are now complete.
- **Promoted candidates**: `gcs_client.py` gap — this is a known missing piece that blocks GCS production. Should become a backlog item or implementation-plan node.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/storage/minio_client.py` | modified | Added `get_remessa_bucket()`, `download_csv_to_file()`, `_get_presign_client()` (with `MINIO_PUBLIC_URL` support), `generate_presigned_upload_url()` |
| `shared_services/gcs.py` | modified | Re-exported three new functions; removed `get_documents_bucket` (no callers) |
| `dashboard/api_views.py` | modified | Added `RemessaUploadUrlAPI` (signed URL endpoint); replaced `UploadMovimentationsAPI` with confirmation-only JSON endpoint with path-traversal validation |
| `dashboard/urls.py` | modified | Registered `api/remessas/upload-url/` route |
| `domains/aquisicao/tasks/celery_tasks.py` | modified | Replaced `default_storage.open()` with `download_csv_to_file()`; MinIO-direct cleanup |
| `domains/liquidacao/tasks/celery_tasks.py` | modified | Same changes as aquisicao |
| `domains/documents_validation/use_cases/process_bulk_import.py` | modified | Added `create_bulk_import_batch_from_key()` — validates key, checks storage, creates batch, emits 2 events, enqueues Celery |
| `domains/aquisicao/interfaces/views.py` | modified | Added `BulkImportUploadUrlView`; replaced `BulkImportUploadView` with confirmation-only JSON endpoint |
| `domains/aquisicao/interfaces/urls.py` | modified | Registered `bulk-import/upload-url/` route |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | modified | Added CORS (PUT only) to remessas + documents buckets; 7-day lifecycle for `tmp_upload/`; 30-day for `bulk_staging/` |
| `frontend/src/config/remessaConfig.js` | modified | Added `uploadUrl` path |
| `frontend/src/hooks/remessas/useRemessaUpload.js` | modified | Replaced single FormData POST with 3-step signed URL flow |
| `frontend/src/pages/Contratos.jsx` | modified | Replaced `handleUpload` with 3-step signed URL flow for ZIP uploads |
| `infrastructure/tests/test_presigned_upload_url.py` | created | 5 tests for storage layer functions |
| `dashboard/tests/integration/test_upload_url_api.py` | created | 11 integration tests for remessa upload URL API + confirmation API |
| `domains/documents_validation/tests/test_bulk_import_from_key.py` | created | 6 tests for `create_bulk_import_batch_from_key` |
| `domains/aquisicao/tests/celery_tests.py` | modified | Updated mocks for MinIO-direct; user added cleanup test |
| `domains/aquisicao/tests/test_api.py` | modified | Updated bulk import tests to new JSON flow; user added `TestBulkImportUploadUrlView` |
| `domains/documents_validation/tests/test_bulk_import.py` | modified | Removed multipart tests; updated to confirmation flow |
| `domains/aquisicao/tests/test_upload_e2e.py` | modified | Fixed integrity error test to mock `download_csv_to_file` |

## Connections

- `derives-from`: `refactors/infrastructure/2026-03-27-signed-url-upload.md` — this session executes the plan written there
- `contextualizes`: GCP infrastructure migration checklist (Groups 0–2 complete, Group 3 partial, Groups 4–8 unstarted at session start)
- `questions`: `docs/vault/constitution/event-system-constitution.md` — no new events were added for the remessa upload flow; only bulk import emits INITIATED + STAGED. The question of whether remessa uploads should also emit pipeline events was not addressed.

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement `gcs_client.py` (Group 4) to route `generate_presigned_upload_url` to real GCS | Production gap identified during session | HIGH | Open |
| Configure MinIO CORS locally: `mc admin config set myminio api cors_allow_origin="http://localhost:5173"` | Task 8 from plan (non-code) | HIGH | Open |
| Create premise node: "No binary payloads on Cloud Run — all uploads must go direct-to-storage" | Identified as missing foundational rule | MEDIUM | Open |
| Remessa upload pipeline events (INITIATED/STAGED/FAILED) — currently only bulk import emits these | Gap identified during Connections review | LOW | Open |

## Open Questions

- Should `create_bulk_import_batch_from_key` be transactional — i.e., if Celery enqueue fails, should the batch creation be rolled back? Currently the batch is persisted even if the worker never receives the task.
- Once `gcs_client.py` is implemented, should `gcs.py` use feature flag routing or constructor injection to switch between MinIO and GCS backends?
