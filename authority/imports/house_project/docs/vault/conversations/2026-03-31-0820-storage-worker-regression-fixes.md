---
tags: [celery, testing, storage, workers]
node_type: test
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-31
timestamp: 2026-03-31T08:20:00-03:00
expires: 2026-05-30
conversation_id: 8ad00088-a596-43b6-8e89-5361552e17a6
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: ["premise: only one Celery worker environment should consume from a Redis queue at a time during development"]
expected_importance: 3
importance_rationale: "This session fixed localized test-decorator drift and a nested-list extraction bug, with the only durable future-reference value being the architectural insight about concurrent worker environments that should be promoted to a premise."
---

# Storage Worker Regression Fixes — Test Patch Drift, Upload FileNotFoundError, Extraction TypeError

**Date:** 2026-03-31 08:20 (UTC-3)
**Tags:** #celery #testing #storage #workers

## Summary

This session addressed three independent problems that surfaced after the previous session's `shared_services/gcs.py` → `infrastructure/storage/gcs.py` storage migration.

### Test failures after storage refactor

Three tests were failing with `AttributeError: module does not have the attribute 'get_minio_client'` in `celery_tests.py` and `test_upload_e2e.py`. The task code had been updated to use `delete_csv` instead of `get_minio_client().remove_object()`, but the `@patch` decorators in the tests still targeted `get_minio_client`. This is a classic test-decorator drift: the tests silently passed before the refactor because the patched symbol existed; after the refactor the symbol was gone and the test setup crashed. Fixed by updating the three decorators to patch `delete_csv` instead.

### Persistent CSV upload FileNotFoundError

Every CSV upload produced `[Errno 2] No such file or directory: '/Users/victorboscaro/house_project/tmp_upload/{hex}.csv'`. The path is `BASE_DIR/tmp_upload/{hex}.csv` — an absolute local filesystem path that should never appear in the upload flow.

Investigation traced the error through git history. Commit `97f8964` (pre-presigned-URL) had the task use `full_path = default_storage.path(file_path)` to resolve the file locally. Commit `bd2c499` replaced that with `download_csv_to_file(file_path, tmp_path)` to stream from MinIO into a tempfile. The new presigned URL flow passes `object_key = 'tmp_upload/{hex}.csv'` (slash format) to the task — the old code resolved this to `BASE_DIR/tmp_upload/{hex}.csv`, a path that was never written to disk because the file went directly to MinIO via the presigned PUT URL.

The root cause was a **stale local Celery worker** (PIDs 31082–31093, started Friday, never killed) consuming tasks from the same Redis queue as the Docker worker. The local worker had the old task code in memory from before `bd2c499`. Docker was restarted but the local process wasn't, so Docker picked up the new code but the local worker retained the old. Tasks were distributed non-deterministically between the two workers — first upload succeeded (Docker), second failed (local worker), confirming the race condition.

The existing tests didn't catch this because `test_process_aquisicao_celery_task` mocks both `download_csv_to_file` AND `ProcessUploadAquisicaoUseCase.process_file_upload`, so the real `default_storage.path()` code path was never exercised. A new `TestCeleryTaskStorageContract` class was added to `test_upload_e2e.py`: it exercises the full task without mocking `process_file_upload`, provides a real CSV via a `shutil.copy` side effect on `download_csv_to_file`, and asserts the `dest_path` argument is a system temp path — not a `house_project` path. If the task regresses to `default_storage.path(file_path)`, this test fails immediately with the exact FileNotFoundError the user saw in production.

The fix: `kill -9` on all stale local worker PIDs. Going forward, only one worker environment (Docker or local) should be active per session.

### Document batch extraction TypeError

Docker worker logs showed `TypeError: unhashable type: 'list'` at `extraction_steps.py:664` in `_step_extract_matched_non_ccb` and its sibling function at line 786. Both called `set(pages)` where `pages` came from `matched.extraction_config.get('pages', [0])`. Some `DocumentTemplate` records store nested lists in that field (e.g., `[[0, 1], 2]`), making `set()` fail because lists are not hashable. Fixed in both locations by flattening before the set comparison: `flat_pages = {p for item in pages for p in (item if isinstance(item, list) else [item])}`. The original `pages` variable is preserved and still passed to `extract_text_with_fallback`.

### Dual worker anti-pattern

A key architectural insight emerged: the user had been running both Docker Celery workers and a local Python Celery worker simultaneously since at least Friday. Both consume from the same Redis queues. Tasks are distributed in a competing-consumer pattern — non-deterministically, first-come-first-served. When Docker is rebuilt but the local process isn't restarted, the two workers run different code versions invisibly. The correct development practice: pick one (Docker or local), never run both against the same broker simultaneously.

## Epistemic Impact

**Confirmed:** The storage abstraction layer (`infrastructure/storage/gcs.py`) is correct, but test mock targets must be kept in sync with the module's actual imports — stale patch paths fail silently until the patched symbol is removed.

**Spec drift fixed:** `@patch` decorators in `celery_tests.py` and `test_upload_e2e.py` targeted `get_minio_client`, which no longer exists in the task module after the GCS migration. The tests were not actually mocking what they claimed to mock.

**Promoted candidates:** A new **premise** should be created: *"At most one Celery worker environment (local or Docker) should consume from a given Redis queue at a time during development; running both creates a silent code-version race condition."*

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/tests/celery_tests.py` | modified | Two `@patch` decorators updated from `get_minio_client` to `delete_csv` to match the refactored task's actual dependency |
| `domains/aquisicao/tests/test_upload_e2e.py` | modified | One `@patch` decorator updated; `TestCeleryTaskStorageContract` class added to exercise the full task flow and guard against `default_storage.path()` regression |
| `domains/documents_validation/use_cases/extraction_steps.py` | modified | Fixed `set(pages)` crash at two call sites by flattening nested lists before the set comparison |

## Connections

- contextualizes: `docs/vault/constitution/development-practices-constitution.md` — the dual-worker anti-pattern is a violation of the principle that development environments should be reproducible and isolated
- derives-from: the previous session that moved `shared_services/gcs.py` to `infrastructure/storage/gcs.py`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Create a formal premise: "Only one Celery worker environment should consume from a Redis queue at a time during development" | Root-cause analysis of stale-worker FileNotFoundError | MEDIUM | open |
| Audit remaining `@patch` decorators in the test suite for any remaining `shared_services.gcs` paths | Discovery during patch-target fix | MEDIUM | open |
