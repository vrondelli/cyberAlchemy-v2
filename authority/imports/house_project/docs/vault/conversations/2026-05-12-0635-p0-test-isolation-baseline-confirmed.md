---
tags: [test-isolation, postgres, harness, matching-test, ccb, regression-test, conftest, database, p0-fix]
node_type: audit
is_session: true
layer: infrastructure
nature: technical
status: active
created: 2026-05-12
timestamp: 2026-05-12T06:35:02-03:00
expires: 2026-07-11
conversation_id: 4ab8b87e-1a6a-4cd6-bf7f-674fc3b85c96
decisions_made: true
contradictions_found: false
specs_updated:
  - internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Resolves a P0 state-pollution bug producing false 0/63 integration-test results and confirms 34/63 as the real live baseline metric."
---

# P0 test isolation implemented — 34/63 baseline confirmed

## Summary

Executed the P0 test isolation fix for the CCB matching-test harness: a `pytest_configure` hook in `tests/conftest.py` redirects all test writes to a separate `harness_test` Postgres DB on the same container, schema name unchanged so zero SQL rewrites were needed, protecting live `postgres` baseline templates from TRUNCATE-on-entry destruction. A regression test (`test_isolation.py`) proves the redirect holds under the exact destructive pattern (TRUNCATE via `core.db.connect()`) that caused the pollution bug. Live baseline matcher coverage was confirmed at 34/63 on clean state via `--match-only` against the live DB; integration tests' 0/63 is a template-data coherence artifact — freshly-synced templates in `harness_test` differ in `canonical_text` from live templates. v0.3.6 commit decision deferred pending a clean deriver probe re-run.

## Files touched

- internal_tools/ccb-registration-demo/matching-test/tests/conftest.py
- internal_tools/ccb-registration-demo/matching-test/tests/test_isolation.py
- internal_tools/ccb-registration-demo/docs/validation-experiment/data-model.md
