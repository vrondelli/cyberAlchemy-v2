---
tags: [ccb, pipeline]
node_type: test
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T00:28:00-03:00
expires: 2026-05-23
conversation_id: d415eb39-e99c-45e1-ac06-7c19480893ae
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Implemented 13 tests covering critical gaps (log_event_safe migration, rejeitado prior dedup, kit re-eval with CCB, dead constant guards) that protect the CCB bulk import pipeline refactoring from regressions on code paths previously untested."
satisfaction_mean: 8
satisfaction_min: 7
satisfaction_max: 9
satisfaction_std: 0.8
---

# CCB Pipeline Test Implementation — Audit Gap Coverage

**Date:** 2026-03-24 00:28 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session implemented 13 tests identified as critical and important gaps during a prior test audit of the CCB bulk import pipeline refactoring. The refactoring decomposed the monolithic `_process_folder` function into 9 modular step functions, introduced `log_event_safe` across all batch lifecycle operations, and cleaned up dead model constants. While the refactoring was fully functional and regression-free against existing tests, several new code paths lacked dedicated test coverage — this session closed those gaps.

The work followed a structured audit-to-implementation flow: reading the production code for `approve_batch`, `decline_batch`, `delete_batch`, `create_bulk_import_batch`, and `_step_contrato_lookup` to understand the exact call signatures and data flow, then writing targeted tests for each gap, and finally fixing 2 test failures (wrong kwarg names, missing NOT NULL model fields) before achieving 13/13 green.

### log_event_safe Migration Coverage

- **Problem/Goal:** All batch lifecycle functions (`approve_batch`, `decline_batch`, `delete_batch`, `create_kit_full`) were migrated from `log_event` to `log_event_safe` but lacked tests verifying the migration.
- **Decision:** Test each function's call to `log_event_safe` by patching and asserting event_type, plus test that `approve_batch` completes even when log_event_safe throws. Also verify shared `stream_id` in `create_bulk_import_batch`.
- **Changes:** 5 tests in `TestLogEventSafeMigration` class.

### Rejeitado Prior Dedup Transitions

- **Problem/Goal:** `_step_contrato_lookup` transitions rejeitado prior folders to deletado when a new folder matches the same contrato, but this path had no test.
- **Decision:** Create a prior folder with `STATUS_REJEITADO`, a prior DV, and verify both transition to `STATUS_DELETADO` with `REASON_DUPLICATE_CONTRATO_DATABASE` while the new folder succeeds.
- **Changes:** 1 test in `TestContratoRejeitadoPriorTransitions` class.

### Kit Re-Evaluation Includes CCB

- **Problem/Goal:** After contrato match, `_step_contrato_lookup` re-evaluates the kit with CCB added to `folder_docs`, but no test verified the CCB entry was correctly appended.
- **Decision:** Mock `_run_kit_eval` and verify the docs list includes both existing non-CCB docs and the new CCB entry with correct `template_id` and `empresa_geradora`.
- **Changes:** 1 test in `TestContratoKitReEvalIncludesCcb` class.

### Mixed Classify DVs Scenarios

- **Problem/Goal:** `_step_classify_dvs` was tested with single-DV scenarios but not with multiple DVs where some succeed and some fail.
- **Decision:** Test download failure isolation (one DV fails, another succeeds) and classification isolation (one classifiable, one not).
- **Changes:** 2 tests in `TestClassifyDvsMixedScenarios` class.

### Dead Constants Regression Guard

- **Problem/Goal:** `REASON_MISSING_CRITICAL` and `REASON_EXTRACTED_NO_TEMPLATE` were removed from `DocumentVersion` during the refactoring — need to guard against accidental re-introduction.
- **Decision:** Use `hasattr` assertions to ensure these constants stay removed.
- **Changes:** 2 tests in `TestDeadConstantsRemoved` class.

### Strengthened Existing Assertions

- **Problem/Goal:** `test_universal_success` and `test_happy_path` in the existing step function tests had weak assertions (`is not None`, missing field checks).
- **Decision:** Replace `ccb_fields is not None` with exact dict equality; add `contrato_extracted_id` assertion to `test_happy_path`.
- **Changes:** 2 inline assertion improvements.

Key outputs:
- `test_parallel_bulk_import.py` — 13 new/strengthened tests across 5 new test classes

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_approve_batch_uses_log_event_safe` | Batch approval must use crash-safe event logging |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_decline_batch_uses_log_event_safe` | Batch decline must use crash-safe event logging |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_delete_batch_uses_log_event_safe` | Batch deletion must use crash-safe event logging with `action: deleted` payload |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_create_batch_uses_shared_stream_id` | Upload events must share stream_id per Constitution Rule 4 |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_approve_batch_survives_log_failure` | Batch state must transition even if event logging fails |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_rejeitado_prior_transitions_to_deletado` | Re-uploading a contrato must supersede previously rejected folders |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_contrato_reeval_kit_includes_ccb` | Kit completeness evaluation after contrato match must include the CCB document |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_mixed_download_success_and_failure` | Download failure of one DV must not block classification of other DVs |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_mixed_classified_and_unclassifiable` | Unclassifiable DVs must be marked without affecting classifiable siblings |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_reason_missing_critical_removed` | Dead constant must not be re-introduced |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_reason_extracted_no_template_removed` | Dead constant must not be re-introduced |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_universal_success` (strengthened) | CCB universal extraction must return exact field dict |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_happy_path` (strengthened) | Contrato lookup must set contrato_extracted_id on CCB DV |

**Why these tests matter:** Without these tests, the `log_event_safe` migration could silently regress back to raw `log_event` calls that crash the pipeline on EventLog write failures. The rejeitado prior transition test guards a dedup edge case where re-uploaded documents would leave stale rejected folders in the database. The kit re-evaluation test ensures CCB documents are counted toward kit completeness, which directly affects whether a folder can be approved.

## Key Decisions

- **Guard tests for removed constants:** Used `hasattr` assertions rather than import-based checks, making the tests resilient to future model changes while catching accidental constant re-introduction.
- **Shared stream_id verification:** Chose to capture all `log_event_safe` calls via side_effect and compare stream_ids rather than inspecting internal state, making the test infrastructure-agnostic.
- **Rejeitado prior test uses direct DV creation:** Instead of using `_setup_folder_with_dvs`, the prior DV is created directly to control the exact status/reason fields, matching how real rejected DVs would look in production.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Added 5 new test classes (11 tests), strengthened 2 existing assertions, added `delete_batch` to top-level imports |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `validates` | Tests validate the step-function architecture and business rules defined in the CCB flow refactor spec |
