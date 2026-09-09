# Test Audit — Remessa Idempotency, Job Status, and Semantic Index Schema Changes

**Date:** 2026-04-11
**Changes analyzed:** 97 production files, 6 test files

## Executive Summary

Coverage is partially improved, but core transition safety and async-status flows still have merge-risk gaps. I found **4 critical missing tests**, **6 incomplete tests**, and **3 fragile tests**. There is also an active red suite in `internal_tools/semantic_index/tests` (5 failures) caused by model contract drift (`CodeAnchor.prefix` now required), which should be treated as a release gate for this branch.

## Business Context

These changes affect the remessa lifecycle (`Pendente -> Aprovado/Rejeitado/Rollback`), async task orchestration (Celery + Redis job status), and UI processing visibility. In this domain, an approval/rejection regression can duplicate or lose financial records tied to FIDC operations, while status API regressions can leave operators with incorrect operational state during critical reconciliation windows. The semantic-index changes also modify a foundational internal schema/model contract, so test reliability matters to prevent silent tooling regressions.

## Missing Tests — Critical

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| Validate that concurrent approvals for the same remessa do not duplicate promoted rows (`AquisicaoManual` / `LiquidacaoManual`) | business-rule | integration | CRITICAL | Duplicate promotion corrupts financial base tables and downstream reconciliation totals | `domains/aquisicao/tests/test_approve_remessa.py`, `domains/liquidacao/tests/test_approve_remessa.py` | `test_concurrent_approve_same_remessa_is_single_effect` |
| Validate approve/reject race on the same remessa produces a deterministic final status with no partial side effects | business-rule | integration | CRITICAL | Operator actions can collide in production; partial transitions break remessa integrity and auditability | `domains/aquisicao/tests/test_approve_remessa.py`, `domains/aquisicao/tests/test_reject_remessa.py`, `domains/liquidacao/tests/test_approve_remessa.py`, `domains/liquidacao/tests/test_reject_remessa.py` | `test_approve_reject_race_keeps_atomic_consistency` |
| Validate Celery task idempotent short-circuit (`already_approved`/`already_rejected`) does not call use case and returns stable payload | code-integrity | unit | CRITICAL | Missing guard coverage can allow duplicate transitions and repeated financial writes | `domains/aquisicao/tests/test_upload_tasks.py`, `domains/liquidacao/tests/test_upload_tasks.py` | `test_approve_task_skips_when_status_already_aprovado` |
| Validate rollback transaction reverts all changes when delete flow errors after child deletion start | business-rule | integration | CRITICAL | Partial rollback can orphan or delete production rows without proper status transition | `domains/aquisicao/tests/test_delete_remessa.py`, `domains/liquidacao/tests/test_delete_remessa.py` | `test_delete_rollback_is_atomic_when_child_delete_fails` |

## Missing Tests — Important

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| Cover `STARTED`/`PROGRESS`/`RETRY` mapping to `PROCESSING` with `progress` propagation in `JobStatusAPI` | code-integrity | unit | IMPORTANT | Wrong mapping degrades operator monitoring and retry behavior understanding | `shared_services/tests/test_job_status_api.py` | `test_processing_states_return_processing_with_progress` |
| Cover `REVOKED` -> `CANCELLED` and `FAILURE` -> `FAILED` mappings with error message contract | code-integrity | unit | IMPORTANT | Incorrect terminal-state contract leads to wrong UX and stalled batch tracking | `shared_services/tests/test_job_status_api.py` | `test_revoked_and_failure_states_return_terminal_errors` |
| Cover Redis backend failure in `_task_exists` fail-open path (must avoid false 404) | code-integrity | unit | IMPORTANT | Infra blips should not make valid jobs appear missing | `shared_services/tests/test_job_status_api.py` | `test_pending_with_redis_error_fails_open` |
| Cover delete error mapping for `not found` -> 404/`BATCH_NOT_FOUND` and unknown `ValueError` -> 400/`INVALID_INPUT` | code-integrity | integration | IMPORTANT | Frontend relies on stable error code/status contract for user feedback and retries | `shared_services/tests/test_batch_views.py` | `test_delete_maps_not_found_and_invalid_input_errors` |
| Cover unexpected delete exception -> 500/`INTERNAL_ERROR` envelope | code-integrity | integration | IMPORTANT | Prevents silent server crashes and preserves API contract during failures | `shared_services/tests/test_batch_views.py` | `test_delete_unexpected_error_returns_internal_error` |
| Cover provider-level supplemental `/api/jobs/:id` polling for `FAILED` (clear processing + warning toast) | business-rule | integration | IMPORTANT | UI can otherwise show processing forever after backend terminal failure | `frontend/src/infrastructure/state/__tests__/ProcessingBatchesContext.provider.test.jsx` | `clears_batch_and_warns_when_job_failed` |
| Cover provider-level supplemental `/api/jobs/:id` polling for `CANCELLED` | business-rule | integration | IMPORTANT | Cancelled operations must surface quickly to operators to avoid duplicate actions | `frontend/src/infrastructure/state/__tests__/ProcessingBatchesContext.provider.test.jsx` | `clears_batch_and_warns_when_job_cancelled` |
| Assert settings for Redis cache backend + `CELERY_TASK_TRACK_STARTED=True` | code-integrity | unit | IMPORTANT | These settings are required for status transitions and idempotency/runtime behavior | `house_project/tests/test_settings.py` | `test_idempotency_runtime_settings_present` |

## Missing Tests — Nice-to-have

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| Verify request-id precedence when both `X-Request-Id` header and `meta.requestId` are present | code-integrity | unit | NICE-TO-HAVE | Improves debugging consistency across backend variants | `frontend/src/hooks/remessas/__tests__/apiClient.test.js` | `uses_header_request_id_over_meta_when_both_present` |
| Validate behavior when transition response misses `data.task_id` (still returns typed object without crash) | code-integrity | unit | NICE-TO-HAVE | Hardens frontend against partial envelope regressions | `frontend/src/hooks/remessas/__tests__/useRemessaBatchTransitions.test.jsx` | `handles_transition_response_without_task_id` |
| Validate both `Pendentes` and `Finalizados` pages always pass `taskId` into `markProcessing` | code-integrity | integration | NICE-TO-HAVE | Keeps supplemental polling consistently enabled across entry points | `frontend/src/pages/Status/__tests__/Pendentes.validate.test.jsx`, `frontend/src/pages/Status/__tests__/Finalizados.*.test.jsx` | `captures_task_id_for_processing_context` |

## Incomplete Tests

| File/Test | What's missing | Type | Importance | Risk |
|---|---|---|---|---|
| `shared_services/tests/test_job_status_api.py::TestJobStatusAPI` | Covers only PENDING-known/unknown and SUCCESS variants; misses full state matrix and fail-open behavior | code-integrity | IMPORTANT | API may silently regress terminal/processing contracts used by frontend polling |
| `shared_services/tests/test_batch_views.py::TestDeleteBatchAPI` | Covers 200 and 409 only; no assertions for 404/400/500 mapping and error codes | code-integrity | IMPORTANT | Client can mis-handle rollback failures and show wrong remediation actions |
| `frontend/src/infrastructure/state/__tests__/ProcessingBatchesContext.test.jsx` | Tests helper functions only; provider polling, terminal job states, and toast behavior are untested | business-rule | IMPORTANT | UI may leave batches stuck as processing after FAILED/CANCELLED jobs |
| `house_project/tests/test_settings.py::TestIdempotencySettings` | Verifies middleware order and CORS header only; does not assert `CACHES`/`CELERY_TASK_TRACK_STARTED` rollout settings | code-integrity | IMPORTANT | Runtime config drift can break idempotency/status tracking without test detection |
| `internal_tools/semantic_index/tests/test_setup_migrations.py` | Most migration assertions become vacuous when `MIGRATIONS=[]`; lacks explicit guard/contract for non-empty schema-evolution path | code-integrity | NICE-TO-HAVE | Future migration regressions can pass CI without real signal |
| `internal_tools/semantic_index/tests/test_embeddings.py` and `internal_tools/semantic_index/tests/test_embeddings_runtime.py` | Fixtures were not updated for required `CodeAnchor.prefix`; 5 active failures block the targeted assertions from running | code-integrity | CRITICAL | Red suite hides real embedding/runtime regressions and blocks reliable release confidence |

## Useless or Fragile Tests

| File/Test | Problem | Recommendation | Justification |
|---|---|---|---|
| `house_project/tests/test_settings.py::_read_block/_read_cors_block` | Regex extraction of source blocks is highly formatting-sensitive | refactor | Test intent is behavioral configuration, not source formatting; behavior-based assertions are more stable |
| `internal_tools/semantic_index/tests/test_setup_migrations.py::test_migrate_applies_all_migrations_when_none_applied` (and related) | Assertions are effectively no-op when migration registry is empty | rewrite | A synthetic migration fixture (monkeypatching `MIGRATIONS`) gives deterministic coverage of apply/skip semantics |
| `shared_services/tests/test_batch_views.py::test_cancel_wrong_status_is_handled_by_task` | Only asserts HTTP 202, without validating downstream contract or side effects | refactor | A stronger assertion set should validate queued task call + returned envelope fields to prevent false confidence |

## Coverage Matrix

| Changed functionality | Unit test | E2E test | Business rule covered? | Gap |
|------------------------|---------------|-----------|--------------------------|-----|
| Idempotency middleware (`Idempotency-Key` replay handling) | Yes (`shared_services/tests/test_idempotency_middleware.py`) | No | Partial | No end-to-end coverage with real cache backend / multi-process behavior |
| Batch validate/cancel queued envelope response | Yes (`shared_services/tests/test_batch_views.py`) | No | Partial | No contract tests for unexpected error paths |
| Batch delete error mapping (`_map_delete_error`) | Partial | No | Partial | Missing 404/400/500 envelope mappings |
| Job status endpoint normalization (`/api/jobs/:job_id`) | Partial (`shared_services/tests/test_job_status_api.py`) | No | Partial | Missing STARTED/PROGRESS/RETRY/REVOKED/FAILURE + Redis fail-open scenarios |
| Frontend transition hook envelope/error handling | Yes (`frontend/src/hooks/remessas/__tests__/useRemessaBatchTransitions.test.jsx`) | No | Partial | Missing malformed envelope and broader terminal-status integrations |
| Frontend processing provider supplemental job polling | No (provider behavior untested) | No | No | Critical operator-visibility path lacks direct tests |
| Approve/reject transactional locking (`select_for_update`, atomic blocks) | Partial (`test_approve_remessa.py`, `test_reject_remessa.py`) | No | Partial | Missing race/concurrency coverage |
| Task-level idempotent short-circuit in Celery approval/rejection tasks | No | No | No | Newly introduced skip behavior is unverified |
| Semantic-index schema setup/migration flow | Partial (`test_setup_migrations.py`) | No | Partial | Vacuous tests with empty migration list reduce confidence |
| Semantic-index embedding model contract (`CodeAnchor.prefix`) | Failing (5 tests red) | No | No | Contract drift currently blocks reliable validation |

## Prioritized Recommendations

1. Add concurrency and task-idempotency tests for approve/reject/delete flows in aquisição and liquidação (critical merge blocker).
2. Expand `JobStatusAPI` tests to full state matrix plus Redis fail-open behavior; add delete API error mapping contract tests.
3. Add provider-level frontend tests for `/api/jobs/:id` terminal states (`FAILED`/`CANCELLED`) and processing cleanup.
4. Fix semantic-index embedding tests for `CodeAnchor.prefix` and ensure the full `internal_tools/semantic_index/tests` suite is green.
5. Harden `test_settings.py` to assert runtime config values (`CACHES`, `CELERY_TASK_TRACK_STARTED`) through behavior-driven checks.
6. Refactor fragile tests (`test_setup_migrations`, regex source extraction) to reduce false positives/false negatives.
