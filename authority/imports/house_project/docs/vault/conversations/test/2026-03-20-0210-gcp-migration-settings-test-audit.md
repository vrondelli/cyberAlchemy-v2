---
tags: [infrastructure, pipeline]
node_type: test
is_session: true
layer: application
nature: [technical, reference]
status: active
created: 2026-03-20
timestamp: 2026-03-20T02:10:30-03:00
expires: 2026-05-19
conversation_id: c4faba78-3842-4098-a6a4-417df19c53c2
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/pre-migration-code-changes.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Implemented GCS conditional settings block (Components 8–10) with fail-fast pattern and wrote 9 tests covering activation and isolation, closing critical test gaps in the migration plan that could have resulted in silent data loss post-migration."
user_satisfaction:
  score: 7
  min: 6
  max: 8
  std: 0.7
---

# Test Audit & Implementation — GCP Migration Settings

**Date:** 2026-03-20 02:10 (UTC-3)
**Tags:** #infrastructure #pipeline

## Summary

This session performed a comprehensive test audit on the uncommitted GCP cloud migration documentation changes and then implemented the identified missing tests. The audit revealed that Components 9 (`DEFAULT_FILE_STORAGE`) and 10 (`CELERY_TASK_ACKS_LATE`) — recently added to the pre-migration plan — had zero test coverage planned, despite being the components with the highest financial risk. The session then implemented the settings.py code changes and wrote 9 tests to close all identified gaps.

### Test Audit of Migration Documentation

- **Problem/Goal:** The uncommitted changes added Components 9 and 10 to the pre-migration documentation (`pre-migration-code-changes.md`, `migration-phase-guide.md`, `migration-preflight-checklist.md`, `gcp-infrastructure-migration.md`) but the "Novos Testes a Criar" table had not been updated to include tests for these new components.
- **Decision:** Identified 3 critical, 2 important, and 1 nice-to-have test gaps. The critical gaps all related to settings that could cause silent data loss if misconfigured: `GS_BUCKET_NAME` crash-if-missing, `DEFAULT_FILE_STORAGE` GCS switch, and `CELERY_TASK_ACKS_LATE` activation.
- **Changes:** Created test audit artifact documenting all gaps with business context and severity.

### Settings Implementation & Test Writing

- **Problem/Goal:** Write the missing tests and implement the settings.py code (Components 8, 9, 10) so tests can verify real behavior.
- **Decision:** Used an exec()-based sandboxing approach to test the GCS conditional block in isolation — avoids reloading Django settings (which has side effects) while testing the real conditional logic extracted from `settings.py` via regex. Chose `os.environ` (crash) over `os.getenv` (silent None) for `GCS_REMESSA_BUCKET` to match the fail-fast pattern of `SECRET_KEY` and `POSTGRES_PASSWORD`.
- **Changes:** Added GCS conditional block to `settings.py`, created `house_project/tests/test_settings.py` with 9 tests, updated `run_tests.py` to include the new test directory, and updated the pre-migration doc table.

Key outputs:
- `house_project/tests/test_settings.py` — 9 tests across `TestGCSSettingsActivation` and `TestGCSSettingsIsolation`
- `house_project/settings.py` — GCS conditional block (Components 8, 9, 10)

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `house_project/tests/test_settings.py` | `test_default_file_storage_switches_to_gcs` | Upload storage must route to GCS in production — without this, uploads go to ephemeral Cloud Run disk and vanish |
| `house_project/tests/test_settings.py` | `test_gs_bucket_name_reads_from_env` | Bucket name must come from environment, not hardcoded |
| `house_project/tests/test_settings.py` | `test_gcs_bucket_name_crashes_if_missing` | Missing bucket config must crash at startup — silent failure means uploads silently fail at runtime |
| `house_project/tests/test_settings.py` | `test_celery_late_ack_enabled` | Worker tasks must survive VM replacement — without late ack, in-progress remessa processing is silently lost |
| `house_project/tests/test_settings.py` | `test_celery_prefetch_multiplier_is_one` | Worker must fetch one task at a time with late ack — otherwise pre-fetched tasks are lost on death |
| `house_project/tests/test_settings.py` | `test_conn_max_age_600` | DB connections must persist on Cloud SQL to avoid connection exhaustion |
| `house_project/tests/test_settings.py` | `test_no_gcs_settings_without_storage_backend` | GCS settings must not leak to local dev environment |
| `house_project/tests/test_settings.py` | `test_no_gcs_settings_with_wrong_backend` | Only `STORAGE_BACKEND=gcs` activates GCS — other values must be ignored |
| `house_project/tests/test_settings.py` | `test_running_django_settings_are_clean` | Running Django instance in dev must not have GCS active |

**Why these tests matter:** These tests guard the most financially sensitive configuration in the migration. A misconfigured `DEFAULT_FILE_STORAGE` means all uploaded remessa CSVs vanish. A missing `CELERY_TASK_ACKS_LATE` means any worker VM replacement silently drops in-progress tasks. The crash-if-missing test for `GCS_REMESSA_BUCKET` prevents a deploy where `django-storages` silently fails on first upload instead of crashing at startup.

## Key Decisions

- **exec()-based test sandboxing:** Rather than reloading Django settings (which causes side effects), the tests extract the GCS conditional block from `settings.py` via regex and execute it in a sandboxed namespace with controlled env vars. This is deterministic and independent of Django's global state.
- **os.environ over os.getenv for GCS_REMESSA_BUCKET:** Matches the fail-fast pattern already established by `SECRET_KEY` and `POSTGRES_PASSWORD` in the project. Prevents cryptic runtime errors in favor of clear startup crashes.
- **Consolidated GCS block:** Components 8, 9, and 10 share a single `if os.getenv("STORAGE_BACKEND") == "gcs":` block rather than separate conditionals, keeping all GCP-only settings visually grouped.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `house_project/settings.py` | `modified` | Added GCS conditional block: `CONN_MAX_AGE`, `DEFAULT_FILE_STORAGE`, `GS_BUCKET_NAME`, `CELERY_TASK_ACKS_LATE`, `CELERY_WORKER_PREFETCH_MULTIPLIER` |
| `house_project/tests/__init__.py` | `created` | Init file for new test package |
| `house_project/tests/test_settings.py` | `created` | 9 tests for GCS conditional settings (activation + isolation) |
| `run_tests.py` | `modified` | Added `house_project/tests` to `TEST_DIRS` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Added 5 test entries to "Novos Testes a Criar" table for Components 8, 9, 10 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[development-practices-constitution]] | `validates` | Tests follow the "Validated Interfaces" and testing expectations defined in the constitution |
| [[infrastructure/pre-migration-code-changes]] | `implements` | Implemented Components 8, 9, 10 from the pre-migration plan and closed test coverage gaps |
