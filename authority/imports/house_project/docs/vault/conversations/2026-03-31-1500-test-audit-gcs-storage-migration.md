---
tags: [infrastructure, acquisition, liquidation, pipeline]
node_type: audit
is_session: true
layer: [application, architecture]
nature: [technical]
status: active
created: 2026-03-31
timestamp: 2026-03-31T15:00:00-03:00
expires: 2026-05-30
conversation_id: ~
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-31

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [docs/vault/premise/test-mock-lifecycle-risk.md]
expected_importance: 7
importance_rationale: "This session prevented a silent CI regression (a dead mock would have broken the liquidação pipeline test suite), closed the entirely untested GCS production routing path, and gave formal coverage to a real OCR bugfix in `extraction_steps.py` — while surfacing the silent-vacuous-mock failure mode as a recurring risk warranting a constitution rule."
---

# Test Audit — GCS Storage Layer Migration (`shared_services.gcs` → `infrastructure.storage.gcs`)

**Date:** 2026-03-31 15:00 (UTC-3)
**Tags:** #infrastructure #acquisition #liquidation #pipeline

## Summary

This session had two phases. In the first, the `test-uncommited-changes.md` workflow was executed — a structured QA audit — against all uncommitted changes. The changes under audit were a storage layer refactoring that migrated every import from `shared_services.gcs` to the new `infrastructure.storage.gcs` module and deleted the old `shared_services/gcs.py`, plus a logic bugfix in `extraction_steps.py` for nested page lists in document extraction configs. The audit produced a structured report classifying findings as CRITICAL, IMPORTANT, and NICE-TO-HAVE.

In the second phase, all critical and important findings were implemented: one broken test file fixed, one new test class added to an existing file, and one entirely new test file created.

The most important finding was that a critical test regression had been introduced silently. The liquidação celery task test file was still patching `get_minio_client` — a symbol that no longer existed in the module after the refactor — while asserting `mock_minio.return_value.remove_object.assert_called_once()`. This test would have failed on CI. A second test in the same file was vacuously passing: it asserted `assert_not_called()` on the same dead mock, providing false assurance that storage cleanup was properly gated on success. This is the second confirmed instance of the silent-vacuous-mock failure mode in this codebase.

### Finding 1 — Broken liquidação celery task test (CRITICAL)

**Problem:** `celery_tasks_test.py` (liquidação) patched `get_minio_client`, a symbol removed from `celery_tasks.py` in the refactor. The module now uses `delete_csv` directly. Two specific failures: `test_task_removes_staging_object_after_success` asserted `mock_minio.return_value.remove_object.assert_called_once()` on a mock that was never invoked (would FAIL on CI); `test_task_does_not_call_remove_object_when_download_fails` asserted `assert_not_called()` on the same dead mock (silently vacuous — passes but tests nothing). Three other tests had the stale `@patch(_PATCH_MINIO)` decorator but didn't assert on the mock arg, so they passed with irrelevant mocking overhead.

**No alternatives considered.** The only correct fix was to replace `_PATCH_MINIO = 'domains.liquidacao.tasks.celery_tasks.get_minio_client'` with `_PATCH_DELETE_CSV = 'domains.liquidacao.tasks.celery_tasks.delete_csv'` throughout and rewrite the cleanup assertions to match the real interface: `mock_delete.assert_called_once_with(object_key)`.

**Changes:** All 5 tests updated in `domains/liquidacao/tests/celery_tasks_test.py`. The vacuous "does not call" test was renamed from `test_task_does_not_call_remove_object_when_download_fails` to `test_task_does_not_call_delete_csv_when_download_fails` to accurately describe what it now tests.

### Finding 2 — Untested OCR page-flattening bugfix (IMPORTANT)

**Problem:** `_step_extract_matched_non_ccb` and `_step_extract_matched_ccb` in `extraction_steps.py` were changed to flatten nested page lists (`[[0, 1], 2]` → `{0, 1, 2}`) before deciding whether to re-use cached OCR text or fetch fresh pages. This was a real bug fix for a real edge case in production template configs, but it had zero test coverage. Without a test, any future regression to the old `set(pages)` — which would throw a `TypeError` on nested lists — would go undetected.

**Decision:** Create a dedicated test file for `extraction_steps.py` unit logic. The existing bulk-import pipeline tests mock the entire extraction step, so they cannot catch step-internal logic regressions.

**Changes:** New file `domains/documents_validation/tests/test_extraction_steps.py` with 5 tests: two for `_step_extract_matched_non_ccb` (nested within cache range → no fetch; nested outside range → fetch), two for `_step_extract_matched_ccb` (same), and one regression test confirming a plain flat list `[0, 1, 2]` still uses the cache correctly.

### Finding 3 — Untested GCS production routing path (IMPORTANT)

**Problem:** `infrastructure/storage/gcs.py` branches at module load time based on `STORAGE_BACKEND`. The `minio` path had been tested in `test_gcs_interface.py`, but the `gcs` path — the one that runs in production — had never been exercised. Every storage call in production uses `gcs_client`, but CI only verified the `minio_client` routing.

**Decision:** Add a routing test using `importlib.reload` under a patched `os.environ`. The module must be popped from `sys.modules` before import so the conditional branch re-evaluates. The original module is restored in a `finally` block to avoid poisoning subsequent tests.

**Changes:** New class `TestGCSBackendRouting` added to `infrastructure/tests/test_gcs_interface.py` with one test: `test_gcs_backend_routes_to_gcs_client`.

## Epistemic Impact

**Confirmed:** The silent-vacuous-mock pattern is a recurring test failure mode in this codebase. When infrastructure symbols are renamed or moved, `@patch` decorators silently stop doing anything — the mock is created but never injected at the patched path, and assertions like `assert_not_called()` pass trivially. This is the second confirmed instance. The first was observed in a previous session; this one provides a stronger case for adding a constitution rule.

**Confirmed:** The GCS `STORAGE_BACKEND` routing branch in `infrastructure/storage/gcs.py` had zero test coverage for the production path despite the system running in production on GCS. This is a direct consequence of the implicit assumption that "CI passing means infrastructure is adequately covered."

**Flagged for promotion:** The silent-vacuous-mock failure mode warrants a `premise` node or a rule in `development-practices-constitution.md`. Proposed rule: every `@patch` decorator must either (a) have an assertion on the mock, or (b) be explicitly documented as setup-only with a comment. Candidate: `docs/vault/premise/test-mock-lifecycle-risk.md`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/liquidacao/tests/celery_tasks_test.py` | modified | Replaced `_PATCH_MINIO` / `get_minio_client` with `_PATCH_DELETE_CSV` / `delete_csv`. Rewrote broken `assert_called_once()` and vacuous `assert_not_called()` assertions. Removed stale decorators. |
| `domains/documents_validation/tests/test_extraction_steps.py` | created | 5 unit tests for the nested page-list flattening logic in `_step_extract_matched_non_ccb` and `_step_extract_matched_ccb` — previously zero coverage for this bugfix. |
| `infrastructure/tests/test_gcs_interface.py` | modified | Added `TestGCSBackendRouting` using `importlib.reload` under patched `os.environ` to exercise the GCS production routing path. |

## Connections

- `derives-from`: `docs/vault/constitution/development-practices-constitution.md` — the audit validates the necessity of mock discipline rules and surfaces a gap in the constitution.
- `contextualizes`: `domains/liquidacao/tasks/celery_tasks.py` — the broken test was a direct consequence of the `delete_csv` refactor in this file.
- `contextualizes`: `domains/documents_validation/use_cases/extraction_steps.py` — the new test file provides coverage for the nested-pages bugfix in this module.

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Add constitution rule against silent `@patch` decorators: every mock must either have an assertion or be documented as setup-only. | HIGH | open |
| `test_extraction_steps.py` only covers the page-flattening branch. The full step logic (cache reuse, cache-miss, field extraction quality gates) has no dedicated unit test file. | MEDIUM | open |
| `TestGCSBackendRouting` uses `importlib.reload` which is fragile if `gcs.py` is refactored to lazy initialization. The test strategy is not documented. | LOW | open |

## Open Questions

- Should the silent-vacuous-mock rule be a `premise` (something we believe is worth enforcing) or directly a `constitution` amendment (an enforceable rule)? The two confirmed instances suggest it should skip the premise stage and go straight to the constitution.
