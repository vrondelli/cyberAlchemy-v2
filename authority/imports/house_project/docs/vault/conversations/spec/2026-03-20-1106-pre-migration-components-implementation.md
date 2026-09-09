---
tags: [infrastructure, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T11:06:55-03:00
expires: 2026-05-19
conversation_id: 6d9513fb-ebe0-4b21-913c-db2f3bc43d9e
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/migration-phase-guide.md, refactors/infrastructure/README.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Completed all 10 pre-migration code components — eliminates default_storage.path() (the highest-risk GCS blocker), unblocking Phase 0+1 of the infrastructure migration."
---

# Pre-Migration Code Components Implementation (2, 6, 7)

**Date:** 2026-03-20 11:06 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

This session reviewed the `/refactors/infrastructure` directory to assess implementation status, identified 3 remaining pre-migration components (out of 10), verified the documentation accuracy against the actual codebase, and implemented all remaining components. The session completed the entire pre-migration code preparation for the GCP migration.

The session began with a full audit of all 10 pre-migration components, cross-referencing each against the codebase. Seven were already implemented (Components 1, 3, 4, 5, 8, 9, 10). Three remained: Component 2 (eliminate `default_storage.path()`), Component 6 (update test mocks), and Component 7 (`.dockerignore`). Component 7 was also found to already exist.

### Component 2 — Eliminate `default_storage.path()`
- **Problem/Goal:** `default_storage.path()` only works with `FileSystemStorage` and will fail on GCS (Cloud Run has no persistent disk). Four production call sites used it.
- **Decision:** Replace with `default_storage.open()` + streaming to temp file via `shutil.copyfileobj` for memory safety on files up to 200MB.
- **Changes:**
  - `domains/aquisicao/tasks/celery_tasks.py` — stream from storage → temp file → `process_file_upload(tmp_path)`
  - `domains/liquidacao/tasks/celery_tasks.py` — same pattern
  - `infrastructure/remessa/upload_service.py` — `_save_duplicates_csv` now writes to temp file → `default_storage.save()`
  - `shared_services/interfaces/upload_views.py` — read directly via `default_storage.open()`

### Component 6 — Update Test Mocks
- **Problem/Goal:** Tests mocked `default_storage.path` which no longer exists in production code.
- **Decision:** Update all 7 mock sites to mock `default_storage.open` returning file-like objects.
- **Changes:**
  - `domains/liquidacao/tests/celery_tasks_test.py` — 5 patches updated, error tests now use `side_effect=FileNotFoundError`
  - `domains/aquisicao/tests/test_upload_e2e.py` — 2 sites updated to streaming temp file pattern

### Bug Fix — Missing `os` Import
- **Problem/Goal:** Initial implementation missed adding `import os` to both celery_tasks files (they used `os.fdopen` and `os.path.exists` in the new pattern).
- **Changes:** Added `import os` to both files. 3 test failures resolved.

Key outputs:
- All 10/10 pre-migration components implemented
- `migration-phase-guide.md` Done Gate updated (10/11 items checked)
- `README.md` status updated to "Pre-migration code complete"

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/liquidacao/tests/celery_tasks_test.py` | 5 tests modified (mock pattern change) | Upload pipeline processes CSV correctly, cleans up storage on success/error |
| `domains/aquisicao/tests/test_upload_e2e.py` | 2 helper methods modified | End-to-end upload pipeline with real CSV, re-upload blocking when remessa is Pendente |

**Why these tests matter:** These tests validate the core upload pipeline — the primary data ingestion path for aquisição and liquidação. Without them, a regression in the storage abstraction change could silently break file processing or leave orphaned files in storage.

## Key Decisions

- **Streaming pattern over in-memory read:** Used `shutil.copyfileobj` instead of `f.read()` to stream files from storage to temp files, preventing OOM on large CSVs (up to 200MB per the REMESSA_UPLOAD_MAX_SIZE_MB setting).
- **`default_storage.save()` for duplicates CSV:** Instead of writing directly to a path via `default_storage.path()`, the duplicates CSV is now written to a temp file and then saved through `default_storage.save()`, which works with both FileSystemStorage and GCS.
- **Error test mocks use `side_effect`:** Error-path tests now raise `FileNotFoundError` via `side_effect` on `default_storage.open` instead of returning a nonexistent path — accurately simulates what happens when storage can't find a file.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tasks/celery_tasks.py` | `modified` | Added `import os`, replaced `.path()` with `.open()` + temp file streaming |
| `domains/liquidacao/tasks/celery_tasks.py` | `modified` | Added `import os`, replaced `.path()` with `.open()` + temp file streaming |
| `infrastructure/remessa/upload_service.py` | `modified` | `_save_duplicates_csv` now writes temp file → `default_storage.save()` |
| `shared_services/interfaces/upload_views.py` | `modified` | Replaced `.path()` + `open()` with `default_storage.open()` |
| `domains/liquidacao/tests/celery_tasks_test.py` | `modified` | 5 patches: `default_storage.path` → `default_storage.open` |
| `domains/aquisicao/tests/test_upload_e2e.py` | `modified` | 2 sites: `.path()` → `.open()` + temp file pattern |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Pre-migration Done Gate: marked 10/11 items as complete |
| `refactors/infrastructure/README.md` | `modified` | Updated status from "Planning (pre-implementation)" to "Pre-migration code complete" |

## Open Questions

- **Manual verification pending:** The only unchecked Done Gate item is manual CSV upload via frontend. This should be tested before proceeding to Phase 0.
