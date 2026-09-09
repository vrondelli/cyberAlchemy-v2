---
tags: [infrastructure, pipeline, acquisition, liquidation, upload, minio, presigned-url]
node_type: test
is_session: true
layer: infrastructure, domain
nature: technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T14:00:00-03:00
expires: 2026-05-26
conversation_id: f812b0bd-5723-4582-ad1b-c1bd792b55c6
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - refactors/infrastructure/signed-url-upload-discovery.md
  - refactors/infrastructure/2026-03-27-signed-url-upload.md
  - refactors/infrastructure/pre-migration-code-changes.md
  - refactors/infrastructure/migration-preflight-checklist.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Fixed two Docker networking bugs that blocked the presigned URL upload flow in local dev, rewrote dead-code tests for Liquidação Celery tasks, and added complete test coverage for all new upload-related endpoints and use cases implemented in the signed URL migration."
---

# Signed URL Upload: Test Audit, Dead Code Fix, and Runtime Bug Resolution

**Date:** 2026-03-27 14:00 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition #liquidation #upload #minio #presigned-url

## Summary

This session completed the test coverage work for the signed URL upload migration (`2026-03-27-signed-url-upload.md`) and resolved two runtime bugs that prevented the upload flow from working in local development. The session started with a test audit against all uncommitted changes, then implemented every identified gap, and ended by debugging live upload failures observed in the browser.

### Test Audit and Coverage Gaps

A systematic audit was run against all files modified in the signed URL migration. The audit identified six coverage gaps:

1. **`BulkImportUploadUrlView`** — zero tests. The endpoint existed but had no coverage at all.
2. **`generate_presigned_upload_url`** — the `_get_presign_client()` path (using `MINIO_PUBLIC_URL`) was not tested.
3. **`download_csv_to_file`** — the correct bucket (`_get_bucket()` not `get_documents_bucket()`) was not asserted.
4. **`create_bulk_import_batch_from_key`** — missing tests for: no side effects on storage failure, unique batch IDs, and Celery propagation failure.
5. **`process_aquisicao_upload` Celery task** — `finally` block temp file deletion not tested.
6. **`domains/liquidacao/tests/celery_tasks_test.py`** — **all 5 tests were dead code** (see below).

All gaps were implemented. Net new tests added: ~15.

### Dead Code Discovery: Liquidação Celery Tests

The most critical finding of the audit: `domains/liquidacao/tests/celery_tasks_test.py` was patching `django.core.files.storage.default_storage.open/delete/exists`. The production code (`process_liquidacao_upload`) had already been migrated to use `download_csv_to_file` + `get_minio_client`. The `default_storage` patches had no effect on the actual code path — all 5 tests passed vacuously regardless of what the production code did.

The file was completely rewritten with the correct patches:
- `_PATCH_DOWNLOAD = 'domains.liquidacao.tasks.celery_tasks.download_csv_to_file'`
- `_PATCH_MINIO = 'domains.liquidacao.tasks.celery_tasks.get_minio_client'`
- `_PATCH_UPLOAD_CSV = 'infrastructure.remessa.stage_remessa_service.upload_csv'`

A `shutil.copy` side_effect pattern is used to simulate MinIO downloads: `_fake_download(abs_path)` returns a callable that copies `abs_path` into the `dest_path` argument, allowing the real `ProcessUploadLiquidacaoUseCase` to execute against the test DB with actual CSV data.

### Runtime Bug 1: `net::ERR_NAME_NOT_RESOLVED` in Browser

After implementing all tests, a live upload was attempted in the browser. The browser network panel showed: the `/api/remessas/upload-url/` request returned 200 with a signed URL, but the subsequent `PUT` to that URL failed with `net::ERR_NAME_NOT_RESOLVED`.

**Root cause:** The signed URL hostname was `minio:9000` (the Docker internal network name), which is not resolvable from the host browser. The `generate_presigned_upload_url` function was using `get_minio_client()` (which uses `MINIO_ENDPOINT=minio:9000`) to sign the URL.

**Fix:** Added a dedicated `_get_presign_client()` function that reads `MINIO_PUBLIC_URL=http://localhost:9000` and uses `localhost:9000` as the signing endpoint. Added `MINIO_PUBLIC_URL=http://localhost:9000` to all backend containers in `docker-compose.dev.yml`. The browser can reach `localhost:9000` because Docker maps port 9000. MinIO validates the presigned URL signature correctly because it computes HMAC-SHA256 on the canonical request including the `Host` header — and the browser sends `Host: localhost:9000`, which matches what was signed.

### Runtime Bug 2: `HTTPConnectionPool: Connection refused` from Inside Container

After fixing Bug 1, a new traceback appeared: `MaxRetryError: HTTPConnectionPool(host='localhost', port=9000): Max retries exceeded with url: /documents?location=`.

**Root cause:** The MinIO Python SDK's `presigned_put_object` calls `_get_region(bucket)` before generating the URL. This makes a real HTTP `GET /bucket?location=` request to discover the bucket's region. The presign client's endpoint is now `localhost:9000` (for the browser's benefit), but `localhost:9000` is not reachable from inside the API container. The request fails with `ConnectionRefused`.

**Fix:** Added `region=os.getenv('MINIO_REGION', 'us-east-1')` to the `_get_presign_client()` Minio constructor. When region is pre-configured, the SDK skips the HTTP region lookup entirely and computes the presigned URL via pure HMAC-SHA256 arithmetic. MinIO's default region is `us-east-1`. An `MINIO_REGION` env var is available for override.

**Key insight:** This pattern — separate client for presigning, pre-configured region to skip HTTP lookup — is the correct approach for any environment where the public-facing URL differs from the internal hostname.

### CORS Configuration for MinIO

The browser PUT to MinIO requires CORS headers. The original discovery document described `mc admin config set myminio api cors_allow_origin=...` (API-level CORS), but the correct mechanism is per-bucket CORS policy via `mc cors set --json`. The `minio-init` container in `docker-compose.dev.yml` now runs:

```sh
echo '{"CORSRules":[...]}' > /tmp/cors.json
mc cors set --json /tmp/cors.json local/remessas
mc cors set --json /tmp/cors.json local/documents
```

Both buckets now allow `PUT`, `GET`, and `HEAD` from any origin with a 1-hour max age.

### Refactor Docs Updated

Four documents in `/refactors/infrastructure/` were updated to reflect what was actually built:
- `signed-url-upload-discovery.md` — status → `implemented`, Celery tasks row corrected, local dev CORS instructions corrected, `_get_presign_client()` pattern documented
- `2026-03-27-signed-url-upload.md` — status → `implemented`, all `- [ ]` → `- [x]`, Implementation Deviations section added (4 entries)
- `pre-migration-code-changes.md` — Component 2 and Component 6 marked with divergence warnings explaining what was actually implemented
- `migration-preflight-checklist.md` — Group 6 "Implement large file upload solution" marked `[x]`

## Epistemic Impact

**Spec drift fixed:** `signed-url-upload-discovery.md` stated "Celery tasks and workers — No changes" and described `mc admin config set` for CORS. Both were incorrect relative to the implemented code. The document now reflects reality.

**Dead code contradiction resolved:** The pre-migration test plan (`pre-migration-code-changes.md` Component 6) described patching `default_storage.path/open` in liquidação Celery tests. The actual tests were patching `default_storage` in code that had already moved away from `default_storage`. This contradiction — plan said one thing, code did another, tests silently validated neither — is now resolved by the full test rewrite.

**New pattern documented:** The two-client pattern for MinIO presigned URLs (`_get_presign_client()` with `MINIO_PUBLIC_URL` + pre-configured `region`) is a non-obvious Docker networking solution that is not captured anywhere else in the vault. It is documented in `2026-03-27-signed-url-upload.md` under Implementation Deviations and in `signed-url-upload-discovery.md` under Local Development.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `infrastructure/storage/minio_client.py` | modified | Added `_get_presign_client()` with `MINIO_PUBLIC_URL` parsing and `region` pre-config; updated `generate_presigned_upload_url` to use it |
| `docker-compose.dev.yml` | modified | Added `MINIO_PUBLIC_URL=http://localhost:9000` to api/celery_worker/celery_beat; added `mc cors set` to minio-init |
| `domains/liquidacao/tests/celery_tasks_test.py` | modified | Full rewrite — removed dead `default_storage` patches, added correct `download_csv_to_file`/`get_minio_client` patches and real CSV execution tests |
| `domains/aquisicao/tests/celery_tests.py` | modified | Added `test_process_aquisicao_celery_task_cleans_up_tempfile` verifying `finally` block deletes temp file |
| `domains/aquisicao/tests/test_api.py` | modified | Added `TestBulkImportUploadUrlView` class with 4 tests: signed URL response shape, `object_key` format regex, 400 for non-ZIP, 401 unauthenticated |
| `domains/documents_validation/tests/test_bulk_import_from_key.py` | modified | Extended storage failure test with batch/event count assertions; added unique batch ID test; added Celery failure propagation test |
| `dashboard/tests/integration/test_upload_url_api.py` | modified | Added 3 tests: XLSX signed URL, 400 missing `table_type` on confirmation, 401 unauthenticated confirmation |
| `infrastructure/tests/test_presigned_upload_url.py` | modified | Added 2 tests: `download_csv_to_file` calls `fget_object` correctly, uses remessa bucket not documents bucket |
| `refactors/infrastructure/signed-url-upload-discovery.md` | modified | Status → implemented; Celery tasks row corrected; CORS instructions corrected; `_get_presign_client` pattern added |
| `refactors/infrastructure/2026-03-27-signed-url-upload.md` | modified | Status → implemented; all checkboxes `[x]`; Implementation Deviations section added |
| `refactors/infrastructure/pre-migration-code-changes.md` | modified | Component 2 and 6 marked with implementation divergence warnings |
| `refactors/infrastructure/migration-preflight-checklist.md` | modified | Group 6 "Implement large file upload solution" marked `[x]` |

## Connections

- `derives-from` → `refactors/infrastructure/signed-url-upload-discovery.md` — this session implements and validates the discovery
- `validates` → `refactors/infrastructure/2026-03-27-signed-url-upload.md` — all planned tasks confirmed implemented
- `contextualizes` → `refactors/infrastructure/pre-migration-code-changes.md` — Component 2/6 plan is superseded by signed URL approach; documented as divergence

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `Contratos.jsx` ZIP upload hook has no unit tests | Known gap from plan; `handleUpload` is 3-step inline code with no extraction | LOW | Open |
| No upload progress indicator for large ZIPs | UX: `fetch` PUT gives no `onprogress` callback | LOW | Open |
| No server-side binding between `object_key` and requesting user | Security: authenticated user A could confirm with user B's `object_key` | LOW | Open — acceptable for current threat model |
| `MINIO_REGION` not documented in `.env.example` or README | Ops: new env var not discoverable for new devs | LOW | Open |

## Open Questions

- Should `MINIO_REGION` default to `us-east-1` be configurable per environment, or is the hardcoded default sufficient for all MinIO deployments?
- The GCS `generate_signed_url` implementation (for production) still needs to be wired up in `shared_services/gcs.py` — currently `generate_presigned_upload_url` delegates to MinIO in all environments.
