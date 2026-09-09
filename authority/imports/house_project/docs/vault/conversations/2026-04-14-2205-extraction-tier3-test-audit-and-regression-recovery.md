---
tags: [documents-validation, pipeline, architecture, ccb]
node_type: audit
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-04-14
timestamp: 2026-04-14T22:05:28-03:00
expires: 2026-06-13
conversation_id: 2026-04-14-2205
decisions_made: true
contradictions_found: true
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Closes 74 of 76 test gaps on an uncommitted refactor that deletes 1,305 lines of production code, and explicitly flags two CRITICAL unresolved gaps that require a product decision before merge."
---

# Extraction Tier-3 Test Audit + Regression Recovery

## Summary

Audited uncommitted changes in the extraction tier-3 refactor (1,305-line `extraction_steps.py` split into `ExtractionPipeline` + per-step classes + `tiers_attempted`/`escalation_reason` telemetry). Ran coherence + correctness subagents and revised the audit to v1.1 — exec-summary miscount fixed, `dv_ids`/`rerun_generation` reframed as documented staged stubs per the tier-3 plan, merge tests reclassified as regression recovery (the deleted `test_parallel_bulk_import.py` held them). Then rewrote two fragile tests and authored eight new test files — 76 tests, all passing — covering `ContratoLookupStep` compliance branches, abort invariant, merge/cross-check/kit/rename/telemetry/scoped-rerun/repository. Two CRITICAL gaps deliberately left unresolved pending a product decision on `PersistStep` timing.

## Contradictions

- Validates [extraction-tier3-implementation-plan.md](specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-implementation-plan.md) — PersistStep is confirmed as the designated writer for `rerun_generation` and `dv_ids` scope.
- Questions the tier-3 plan's staging choice — shipping `dv_ids` and migration 0049 while `_process_folder` ignores scope is plan-documented but creates an observable API-vs-behavior contradiction that the plan does not resolve.
- Questions the framing of `test_parallel_bulk_import.py` deletion as "regression recovery" — the new suite covers the failure modes flagged in the audit but was not diffed exhaustively against the deleted tests.

## Files touched

- docs/vault/conversations/2026-04-14-test-audit-extraction-tier3.md
- domains/documents_validation/tests/test_contrato_lookup_step.py
- domains/documents_validation/tests/test_extraction_pipeline_abort.py
- domains/documents_validation/tests/test_merge_identificacao_step.py
- domains/documents_validation/tests/test_cross_check_step.py
- domains/documents_validation/tests/test_kit_evaluation_step.py
- domains/documents_validation/tests/test_rename_step.py
- domains/documents_validation/tests/test_extraction_event_telemetry.py
- domains/documents_validation/tests/test_extraction_pipeline_scoped_rerun.py
- tests/domain/extraction/test_extractors_vocabulary_invariant.py
- tests/domain/extraction/test_apply_outcome.py
- tests/domain/extraction/test_dispatcher.py
- infrastructure/tests/test_bulk_import_repository.py
