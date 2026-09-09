---
tags: [acquisition, pipeline]
node_type: test
is_session: true
layer: domain, application
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T15:00:00-03:00
expires: 2026-05-25
conversation_id: b2f3d4e5-6a7b-8c9d-0e1f-2a3b4c5d6e7f
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "Fixed Django TestCase connection poisoning in test_upload_e2e.py by moving the file-existence check before super().setUpClass(), preventing cascading DB connection failures across 600+ subsequent tests."
---

# Test Suite Connection Poisoning Fix

**Date:** 2026-03-26 15:00 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

The full test suite was reporting 194 failures and 455 errors (649 total) out of ~1,800+ tests, but every test passed when run individually or in small groups. This pointed to a test isolation/ordering problem rather than logic bugs. Investigation traced the root cause to a single line ordering issue in `domains/aquisicao/tests/test_upload_e2e.py`.

The E2E test class `TestAquisicaoUploadE2E` requires a fixture CSV file (`new-aquisicoes-test.csv`) that is not committed to the repository. Its `setUpClass` was calling `super().setUpClass()` first — which opens a Django DB connection and wraps the class in an atomic transaction — and then raising `FileNotFoundError` if the file was missing. Because `setUpClass` raised, Django never called `tearDownClass`, leaving the DB connection in a broken state. All subsequent tests in the run that tried to use the DB then received `psycopg2.InterfaceError: connection already closed` or `FATAL: database "test_postgres" does not exist`, cascading ~600 failures.

The fix was a one-line reorder: check for the CSV file before calling `super().setUpClass()`. If the file is missing, Django's DB setup never runs, no connection is left dangling, and the E2E tests simply skip with a `FileNotFoundError` in their own error bucket without affecting anything else. After the fix: **1832 passed, 0 failures**.

### Root Cause Analysis

- **Problem/Goal:** Full test suite reporting 194 failures + 455 errors, all passing in isolation.
- **Decision:** The E2E test's `setUpClass` was corrupting the shared DB connection by raising after `super().setUpClass()` had already opened a transaction.
- **Changes:** Moved `os.path.exists(_CSV_PATH)` check to run before `super().setUpClass()` in `TestAquisicaoUploadE2E.setUpClass`.

### Investigation Path

1. Ran full suite → 649 failures/errors.
2. Ran individual failing tests → all passed.
3. Narrowed to `infrastructure/tests + aquisicao/tests` together → same failures.
4. Excluded `test_upload_e2e.py` → 940 passed, 0 failures.
5. Identified that `test_upload_e2e.py` `setUpClass` called `super()` before the guard, leaving an unclosed DB transaction.

Key outputs:
- `domains/aquisicao/tests/test_upload_e2e.py` — one-line reorder in `setUpClass`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_upload_e2e.py` | `setUpClass` guard ordering fix | E2E upload tests must not corrupt the test DB connection when their fixture CSV is absent |

**Why these tests matter:** The E2E tests validate the full two-phase upload pipeline end-to-end with real CSV data. When the fixture file is absent (e.g., on CI without secrets or on a fresh clone), the test class should fail gracefully without poisoning the DB connection for all other test classes.

## Key Decisions

- **Check before super():** Any `TestCase.setUpClass` that needs external resources must check for those resources before calling `super().setUpClass()`, to avoid leaving dangling DB transactions when the guard fails.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_upload_e2e.py` | `modified` | Moved `FileNotFoundError` guard before `super().setUpClass()` to prevent DB connection poisoning |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `new-aquisicoes-test.csv` not present — E2E tests always error on fresh clones | Observation during run | MEDIUM | Open |

## Open Questions

- Should the E2E test be skipped (via `pytest.skip`) instead of raising `FileNotFoundError` when the fixture is absent, to give a cleaner "skipped" output rather than "error"?
