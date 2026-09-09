---
tags: [ccb, pipeline, acquisition]
node_type: test
is_session: true
layer: [application, domain]
nature: [technical, reference]
status: active
created: 2026-03-25
timestamp: 2026-03-25T18:41:03-03:00
expires: 2026-05-24
conversation_id: ~
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-25

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Post-migration test gaps in `documents_validation` were audited and filled — most critically an `apps.py` preventing a Django startup label collision and Celery task-name stability guards — but the changes are localized and the domain logic itself was already well covered."
---

# documents_validation — Post-Migration Test Coverage Audit

**Date:** 2026-03-25 18:41 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session audited the test coverage of the ZefraHub domain migration — the move of bulk import, OCR, Gemini extraction, kit matching, and document template logic from `domains/aquisicao/` into the new `domains/documents_validation/` domain. The audit used the `test-uncommited-changes.md` workflow, scoped exclusively to the ZefraHub changes (newspaper, ontology, and business-philosopher changes were explicitly excluded).

The overall finding was that the migrated domain logic itself is very well covered (14k lines of tests, migrated and expanded). However, four gaps were identified: a missing `apps.py` in `documents_validation/repositories/` (risk of Django startup label collision), three API views whose import routing was migrated but never verified, upload error-path tests missing post-migration, and no Celery task-name stability guard.

All identified gaps were implemented and verified — 11 tests added, all passing. The `apps.py` fix is the highest-impact item: it prevents a potential platform-wide startup failure in any environment where the label would have collided.

### Gap 1 — Missing `apps.py` (pre-deploy blocker)

- **Problem/Goal:** `domains/documents_validation/repositories/` was added to `INSTALLED_APPS` without an `apps.py`. Django would assign the default label `repositories`, risking collision with other `*.repositories` apps (each sibling domain has a custom label in its `apps.py`).
- **Decision:** Create `apps.py` with `label = 'documents_validation'` to follow the established pattern.
- **Changes:** `domains/documents_validation/repositories/apps.py` created.

### Gap 2 — API view routing tests (Detail, Approve, Decline, Delete)

- **Problem/Goal:** Five views in `views.py` had their imports redirected to `documents_validation`, but only `BulkImportUploadView` had a routing-verification test. `BulkImportDetailView`, `ApproveView`, `DeclineView`, and `DeleteView` were untested.
- **Decision:** Add integration tests for all four using DB-backed `BulkImportBatch` objects and mock patches on the target use-case functions in `documents_validation`.
- **Changes:** New class `TestBulkImportViewsRouting` in `test_api.py` with 4 routing tests + 3 upload error-path tests.

### Gap 3 — Upload error paths

- **Problem/Goal:** `BulkImportFileTooLargeError`, `BulkImportInvalidZipError`, `BulkImportStorageUnavailableError` are lazily imported from `documents_validation` inside `BulkImportUploadView.post()`. No test exercised these error branches post-migration — a broken import would surface as 500 instead of a descriptive 4xx/503.
- **Decision:** Add three error-path tests, raising each exception via `side_effect` on the mocked `create_bulk_import_batch`.
- **Changes:** `test_upload_returns_413_when_file_too_large`, `test_upload_returns_400_when_invalid_zip`, `test_upload_returns_503_when_storage_unavailable`.

### Gap 4 — Celery task-name stability

- **Problem/Goal:** `bulk_import_tasks` was removed from `aquisicao.tasks.__init__` and now lives in `documents_validation.tasks`. The 4 tasks declare explicit `name=` strings. No test verified these names remained unchanged post-migration — a rename would silently break in-flight retries across a deploy.
- **Decision:** Add a no-DB test that imports the task objects and asserts their `.name` attributes exactly.
- **Changes:** `domains/documents_validation/tests/test_task_registration.py` created.

Key outputs:
- `domains/documents_validation/repositories/apps.py` — Django AppConfig with `label = 'documents_validation'`
- `domains/aquisicao/tests/test_api.py` — 7 new tests in `TestBulkImportViewsRouting`
- `domains/documents_validation/tests/test_task_registration.py` — Celery task-name stability test

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `domains/aquisicao/tests/test_api.py` | `test_upload_returns_413_when_file_too_large` | Oversized zip files must return a descriptive 413, not a 500 |
| `domains/aquisicao/tests/test_api.py` | `test_upload_returns_400_when_invalid_zip` | Malformed zip files must return 400 with `code: invalid_zip` |
| `domains/aquisicao/tests/test_api.py` | `test_upload_returns_503_when_storage_unavailable` | GCS unavailability must return 503, not a 500 |
| `domains/aquisicao/tests/test_api.py` | `test_detail_delegates_to_documents_validation` | Batch status polling must route to `documents_validation.get_batch_results` |
| `domains/aquisicao/tests/test_api.py` | `test_approve_delegates_to_documents_validation` | Batch approval must route to `documents_validation.approve_batch` with correct actor |
| `domains/aquisicao/tests/test_api.py` | `test_decline_delegates_to_documents_validation` | Batch rejection must route to `documents_validation.decline_batch` with correct actor |
| `domains/aquisicao/tests/test_api.py` | `test_delete_delegates_to_documents_validation` | Batch deletion must route to `documents_validation.delete_batch` |
| `domains/documents_validation/tests/test_task_registration.py` | `test_bulk_import_task_names_are_stable` | Celery task names must remain stable across deploys to avoid breaking in-flight retries |

**Why these tests matter:** The bulk import / approval flow is the primary intake gate for CCB document kits — a regression here silently leaves batches in limbo or routes operations to dead code paths with no immediate error signal. The Celery task-name test specifically guards against a class of failure that would only manifest during a rolling deploy when workers still hold old task-name registrations.

## Key Decisions

- **`label = 'documents_validation'`:** Following the `aquisicao` pattern (`label = 'aquisicao'`), every `*.repositories` sub-app needs a custom label to avoid Django collision.
- **Routing tests use real DB + function mocks:** Rather than mocking the entire DB layer, tests create a real `BulkImportBatch` row and mock only the `documents_validation` use-case functions — this tests the full view dispatch path including the `objects.get` lookup.
- **Task-name test is import-only (no DB):** Asserting `.name` on imported task objects is sufficient and avoids needing Celery broker setup in tests.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/repositories/apps.py` | `created` | Django AppConfig with `label = 'documents_validation'` to prevent label collision |
| `domains/aquisicao/tests/test_api.py` | `modified` | Added `TestBulkImportViewsRouting` class with 7 routing/error-path tests |
| `domains/documents_validation/tests/test_task_registration.py` | `created` | Celery task-name stability assertions for all 4 bulk import tasks |

## Gaps & Backlog

None surfaced beyond what was already implemented.
