---
tags: [infrastructure, pipeline]
node_type: audit
is_session: true
layer: architecture, application
nature: technical, reference
status: active
created: 2026-03-27
timestamp: 2026-03-27T19:00:00-03:00
expires: 2026-05-26
conversation_id: signed-url-plan-review-2026-03-27
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Caught and fixed 11 issues in the signed URL upload migration plan — including 2 high-severity bugs (silent Celery failure creating orphan batches, dead 503 code path) and a dev/prod storage divergence — before any code was written."
user_satisfaction: 8
user_satisfaction_min: 7
user_satisfaction_max: 9
user_satisfaction_std: 0.5
---

# Signed URL Upload Plan — Pre-Implementation Review

**Date:** 2026-03-27 19:00 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

This session performed a thorough pre-implementation review of the signed URL upload migration plan (`refactors/infrastructure/2026-03-27-signed-url-upload.md`). The plan proposes replacing direct multipart file uploads through Django with a 3-step signed URL flow to bypass Cloud Run's 32 MB request limit. The review identified 11 issues across the plan's 7 tasks, ranging from high-severity bugs to minor inconsistencies and test coverage gaps. All 11 issues were fixed directly in the plan document before any implementation code was written.

The most critical findings were: (1) `create_bulk_import_batch_from_key` silently swallowed Celery enqueue failures, which would leave batches in `STATUS_PENDENTE` forever with no user feedback; (2) the `BulkImportStorageUnavailableError` handler in the view was dead code because the function never raised it; (3) `default_storage.exists()` would fail in dev because Django's `DEFAULT_FILE_STORAGE` only points to GCS when `STORAGE_BACKEND=gcs` (local dev uses filesystem). Two open questions from the prior planning session were also resolved by investigating the actual infrastructure.

### Critical bugs fixed

- **Problem/Goal:** Identify implementation-time bugs before writing code.
- **Decision:** (a) `create_bulk_import_batch_from_key` must verify file existence in storage via `stat_object` and raise `BulkImportStorageUnavailableError` if missing. (b) Celery enqueue failures must propagate (not be silenced). (c) `default_storage.exists()` replaced with `get_minio_client().stat_object()` to work in both dev (MinIO) and prod (GCS).
- **Changes:** Rewrote the function body, updated the confirmation view error handlers, and changed test mock targets from `default_storage` to `get_minio_client`.

### Layer violation and input validation

- **Problem/Goal:** The plan imported `_get_bucket()` (private function) directly in `api_views.py` and had no validation on `gcs_key` input.
- **Decision:** Export `_get_bucket` as `get_remessa_bucket` via `shared_services/gcs.py`. Add regex validation for `gcs_key` format in `create_bulk_import_batch_from_key`. Add `ValueError` handler in the view returning 400 with `code: 'invalid_key'`.
- **Changes:** Updated `shared_services/gcs.py` exports in Task 1.4, replaced import in Task 2.3, added validation + handler in Task 3.4/3.5.

### Test migration clarification

- **Problem/Goal:** The plan was vague about which existing tests to remove/replace in `TestBulkImportViewsRouting` after the upload endpoint changes from multipart to JSON.
- **Decision:** Explicitly: DELETE `test_upload_returns_413_when_file_too_large` and `test_upload_returns_400_when_invalid_zip` (these error paths move to Celery). REPLACE `test_upload_returns_503_when_storage_unavailable` (patch target changes). ADD `test_upload_returns_400_when_gcs_key_invalid` and `test_confirmation_endpoint_returns_400_when_filename_missing`.
- **Changes:** Rewrote Step 3.7 with explicit per-test instructions.

### Open questions resolved

- **Problem/Goal:** Two questions from the planning session were left unresolved.
- **Decision:** (a) `default_storage` issue resolved by switching to MinIO client directly. (b) Celery timeout concern resolved — confirmed Celery runs on Compute Engine MIG (not Cloud Run), so Cloud Run timeouts don't apply.
- **Changes:** Updated open questions in `docs/vault/conversations/2026-03-27-1800-signed-url-upload-plan.md` with resolutions.

Key outputs:
- `refactors/infrastructure/2026-03-27-signed-url-upload.md` — plan updated with all 11 fixes
- `docs/vault/conversations/2026-03-27-1800-signed-url-upload-plan.md` — open questions resolved

## Key Decisions

- **Storage verification via MinIO client, not Django `default_storage`:** `default_storage` depends on `STORAGE_BACKEND` env var — in dev it's local filesystem, in prod it's GCS. Using `get_minio_client().stat_object()` works uniformly.
- **Celery failures must propagate:** A silenced failure creates an orphan batch (STATUS_PENDENTE forever, no user feedback). The view should convert the exception to 503.
- **`gcs_key` regex validation:** Prevents arbitrary paths from reaching `create_bulk_import_batch_from_key`. Pattern: `bulk_staging/{uuid}/upload.zip`.
- **`filename` required in confirmation endpoint:** Removing the `'upload.zip'` default prevents all batches from having identical labels when frontend omits the field.
- **Public `get_remessa_bucket` export:** Avoids importing private `_get_bucket` across layer boundaries. Exported via `shared_services/gcs.py` alongside `get_documents_bucket`.
- **413 and invalid_zip tests deleted (not just replaced):** With signed URL, Django never sees the ZIP binary. Size and integrity validation moves to the Celery worker. These error paths no longer exist in the upload endpoint.

## Files Changed

### Code

No code files were changed — this was a plan-only review session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/2026-03-27-signed-url-upload.md` | `modified` | Fixed 11 issues: rewrote `create_bulk_import_batch_from_key`, replaced `default_storage`, added validation, clarified test migration, added 7 new tests, added review issues table |
| `docs/vault/conversations/2026-03-27-1800-signed-url-upload-plan.md` | `modified` | Resolved 2 open questions with infrastructure evidence |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `Contratos.jsx` `handleUpload` has no unit tests | Review finding #10 | MEDIUM | Documented as known gap — follow-up to extract shared upload hook |

## Open Questions

None — all questions from the prior session and this review have been resolved.
