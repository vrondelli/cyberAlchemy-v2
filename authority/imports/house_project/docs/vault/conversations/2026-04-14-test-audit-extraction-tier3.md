---
description: Test audit for the uncommitted extraction-pipeline tier-3 refactor (folders, cascade, rerun plumbing, estoque status, frontend preview)
tags: [audit, testing, extraction, bulk_import]
node_type: audit
layer: process
nature: snapshot
status: active
version: 1.1.0
last_updated: 2026-04-14
---

# Test Audit — Extraction Tier-3 Refactor + Estoque Status Fix

**Date:** 2026-04-14 (v1.1 — revised after coherence + correctness review)
**Changes analyzed:** ~30 production files, ~10 test files (plus vault/docs/specs noise)

## Executive Summary

The bulk of this changeset is a well-scoped refactor that splits the monolithic
extraction_steps.py (1,305 lines) into a data-driven `ExtractionPipeline` with
one step class per stage under
[domain/extraction/steps/](domains/documents_validation/domain/extraction/steps/).
Tests were added for the pipeline mechanics, outcome dataclass, cascade escalation
decision, dispatcher tier tracking, and the `dv_ids` plumbing — this is a **genuinely
good baseline**.

**Six CRITICAL gaps remain**: two staged-stub gaps (`dv_ids` scope ignored by
`_process_folder`, `rerun_generation` unused) where the
[tier-3 implementation plan](specs/002-ccb-validation-workflow/docs/extraction-refactor/docs/refactor/extraction-tier3-implementation-plan.md)
explicitly parks the work for `PersistStep` in a later tier; three
`ContratoLookupStep` abort branches that include compliance-sensitive duplicate
and rejected-folder-reclaim paths; and one aborted-state short-circuit
invariant covering all downstream steps. **Nine IMPORTANT gaps** follow —
including the regression loss of `MergeIdentificacaoStep` coverage (the deleted
[test_parallel_bulk_import.py](domains/documents_validation/tests/test_parallel_bulk_import.py)
held merge tests; this PR deletes the coverage without replacing it). Three
**NICE-TO-HAVE** items and three **fragile/incomplete** tests round out the
picture.

**Merge readiness**: the two staged-stub gaps (#1, #2) need a decision, not
necessarily implementation: either pull the PersistStep work forward into this
PR with tests, or remove `dv_ids` / migration 0049 until the stage that
consumes them lands. Shipping API parameters and schema columns that the
current code ignores is a contract smell even when the staging is
plan-documented — the plan doesn't reach production users, the API shape does.

## Business Context

This refactor is on the CCB extraction path — the core flow that moves a
contract folder from raw upload to cross-checked, kit-evaluated, renamed state.
Every folder the operators push through bulk-import goes through this pipeline.
A regression here has immediate, visible impact:

- Duplicate-contract detection lives in `ContratoLookupStep` — a miss means a
  contract gets reprocessed / double-counted across batches (compliance +
  financial accuracy).
- `tiers_attempted` / `escalation_reason` are observability outputs wired into
  `DOCUMENT_EXTRACTION_RESULT` events, which feed the telemetry pipeline that
  newspaper analyses consume. Wrong vocabulary → wrong downstream metrics.
- `estoque` status fix (`Pendente` → `Concluido` when VP==0) is a UI-facing
  bug fix: rows were stuck in the Pendentes tab after processing.
  Semantics are pinned in `domains/estoque/README.md` (`Concluido` = calculation
  ran; `Pendente` = not yet processed) — intentional, not a silent flip.
- `rerun_generation` + `dv_ids` scope are the operator-facing surface for the
  "reprocess one document" action. The tier-3 plan parks the wire-up in
  `PersistStep`; until then the parameters are accepted but ignored.

## Missing Tests — Critical

| # | Description | Type | Scope | File | Scenario |
|---|---|---|---|---|---|
| 1 | **DV-scoped rerun is honored end-to-end**: reprocessing with `dv_ids=[X]` must leave untouched DVs unchanged (no status/reason/extracted_data mutation on siblings). Today `_process_folder` passes `RerunScope(dvs=None)` regardless of input. The tier-3 plan assigns this wiring to `PersistStep`; either deliver the increment with a test here, or remove `dv_ids` from the signature until then. | business-rule | integration | `tests/test_extraction_pipeline_current.py` | `test_process_folder_with_dv_scope_only_touches_scoped_dvs` |
| 2 | **`rerun_generation` increments on each rerun** per [migration 0049](migrations/aquisicao/0049_add_rerun_generation_to_dv.py) help-text. Today no code reads or writes the column. Tier-3 plan assigns the increment to `PersistStep` — same wire-or-revert decision as #1. | business-rule | unit | `tests/test_reprocess_folder.py` | `test_rerun_generation_increments_on_reprocess` |
| 3 | **ContratoLookupStep — duplicate branch**: when a prior active folder in a different batch already claims the same `id_titulo`, current folder must be marked `STATUS_DELETADO` / `REASON_DUPLICATE_CONTRATO_DATABASE`, all its DVs marked deleted, and `DOCUMENT_CONTRATO_EVALUATED` emitted with `failure_reason='duplicate'`. | business-rule | integration | `tests/test_contrato_lookup_step.py` (new) | `test_duplicate_prior_active_folder_deletes_current` |
| 4 | **ContratoLookupStep — rejected-folder reclaim**: when prior folders for the same `id_titulo` are `STATUS_REJEITADO`, they must be transitioned to `STATUS_DELETADO` and their DVs marked deleted. Cross-batch compliance invariant. | business-rule | integration | `tests/test_contrato_lookup_step.py` (new) | `test_rejected_prior_folders_are_reclaimed` |
| 5 | **ContratoLookupStep — no_id_match**: when extracted `id_titulo` has no match in `ContratoCCB` across all three fallback candidates (normalized, sanitized, compact), folder must land `STATUS_PENDENTE` / `REASON_NO_ID_MATCH` with event `failure_reason='no_id_match'`. | business-rule | integration | `tests/test_contrato_lookup_step.py` (new) | `test_no_id_match_marks_folder_pending` |
| 6 | **Aborted-state short-circuit invariant**: once `state.aborted=True`, every downstream step must no-op with no side effects. Concretely: if `ContratoLookupStep` aborts with `duplicate`, `CrossCheckStep` / `RenameStep` must not mutate `final_name` or `leaf_folder_path` on the already-deleted folder, and `KitEvaluationStep` must not emit a late `DOCUMENT_KIT_EVALUATED` event. | code-integrity | integration | `tests/test_extraction_pipeline_abort.py` (new) | `test_abort_at_each_step_skips_all_downstream` |

## Missing Tests — Important

| # | Description | Type | Scope | File | Scenario |
|---|---|---|---|---|---|
| 7 | **MergeIdentificacaoStep — GCS upload failure**: upload fails → keep original bytes, no `_merged.pdf` written, no `DOCUMENT_MERGE_RESULT` emitted, `classified_files` unchanged. **Regression recovery**: this PR deletes [test_parallel_bulk_import.py](domains/documents_validation/tests/test_parallel_bulk_import.py) which previously held merge tests (`test_process_folder_merges_multiple_identificacao_files`, `test_process_folder_merge_handles_mixed_types`). Without #7/#8, the coverage drops from some to zero. | business-rule | unit | `tests/test_merge_identificacao_step.py` (new) | `test_gcs_upload_failure_keeps_originals` |
| 8 | **MergeIdentificacaoStep — survivor cannot be merged**: when `survivor_dv not in merged_dvs`, step must keep originals. Regression guard for the `group_dvs[0]`-as-survivor assumption. | business-rule | unit | same file | `test_survivor_unmergeable_keeps_originals` |
| 9 | **CrossCheckStep — divergent fields**: when `cross_check_fields` returns `passed=False`, DV reason becomes `REASON_CROSS_CHECK_FAILED` and event metadata carries non-null `divergent_fields` with field/extracted/expected triples. | business-rule | integration | `tests/test_cross_check_step.py` (new) | `test_divergence_marks_cross_check_failed_and_emits_details` |
| 10 | **KitEvaluationStep — empresa-filtered kit selection**: CCB has `empresa_geradora=X`, two active KitTypes (one matches X, one doesn't). Must pick the matching kit; event must carry `ccb_empresa=X`. | business-rule | integration | `tests/test_kit_evaluation_step.py` (new) | `test_empresa_filter_picks_matching_kit` |
| 11 | **RenameStep — final_name format**: given `id_titulo='CCB-123'` and `doc_type='CCB'`, `final_name` must be `'CCB_CCB-123.pdf'` and `leaf_folder_path` must be `'CCB-123_YYYYMMDD'`. For `Identificacao` ending in `_merged.pdf`, prefix is preserved. | business-rule | unit | `tests/test_rename_step.py` (new) | `test_final_name_format_per_doc_type`, `test_merged_id_preserves_prefix` |
| 12 | **`extraction_method` vocabulary enforcement**: the event catalog declares `gemini_primary \| gemini_fallback \| template \| universal \| none` as the allowed set. Add a property-style test that asserts every concrete `Extractor` emits a value in that set. Today `test_dispatcher.py` fixtures use the legacy `'gemini'` literal — must fix there as part of this gap. | code-integrity | unit | `tests/domain/extraction/test_extractors_vocabulary.py` (extend) | `test_all_concrete_extractors_emit_allowed_method` |
| 13 | **`escalation_reason` + `tiers_attempted` end-to-end**: `ExtractStep` logs both into `DOCUMENT_EXTRACTION_RESULT` metadata. No test asserts they're present — for template-only CCB (`template_has_all_criticals`), for universal-escalated CCB (`universal_filled_more_criticals`), and for the multi-tier attempt case (`tiers_attempted` has ≥2 entries). | business-rule | integration | `tests/test_extraction_pipeline_current.py` (extend) | `test_event_carries_escalation_reason_and_tiers` |
| 14 | **BulkImportRepository — new method branching**: `has_prior_active_contrato` excludes `STATUS_DELETADO`/`REJEITADO` and excludes the current `batch_id` — both filters need a positive + negative case. Similarly `find_rejected_contrato_folders`. | code-integrity | integration | `tests/infrastructure/test_bulk_import_repository.py` (new) | `test_has_prior_active_contrato_excludes_deleted_and_same_batch`, `test_find_rejected_contrato_folders_returns_only_rejected` |
| 15 | **Step-scoped rerun integration**: [test_extraction_pipeline_primitives.py](domains/documents_validation/tests/test_extraction_pipeline_primitives.py) covers the scope filter on a `_State` fake. Need a test driving the **real** pipeline with `scope=RerunScope(steps={'CrossCheckStep'})` to verify only cross-check state changes. Orthogonal to #1 (DV-axis vs step-axis). | business-rule | integration | `tests/test_extraction_pipeline_scoped_rerun.py` (new) | `test_step_scoped_rerun_only_mutates_target_step_state` |

## Missing Tests — Nice-to-have

| # | Description | Type | Scope | File | Scenario |
|---|---|---|---|---|---|
| 16 | `_derive_status_from_outcome` has a `low_quality_image=True` branch that sets `dv._non_critical_evaluated=False`. Not covered by `test_apply_outcome.py`. | code-integrity | unit | `tests/domain/extraction/test_apply_outcome.py` (extend) | `test_low_quality_image_skips_non_critical_gate` |

## Code hygiene (not a test gap)

- **Dead code**: `TransientExtractorError` in
  [rerun.py](domains/documents_validation/domain/extraction/rerun.py) is defined
  but never raised or caught. The tier-3 plan intends to wire it into
  `autoretry_for` in a later tier. Either land the wire-up or delete the class
  until the tier that needs it. Not a test gap.
- **Frontend preview endpoint**: `GET /document-templates/{id}/file/` called by
  the new `DocumentTemplateTab`. Verify the backend endpoint exists + is tested
  (probably pre-existing; out of scope for this PR's test audit).
- **Empty-DataFrame estoque semantics**: `Concluido` for empty input is
  intentional per `domains/estoque/README.md`. Worth a one-line comment in
  `test_process_estoque_dataframe_empty` linking the README, but not a test gap.

## Incomplete Tests

| File/Test | What's missing | Type | Importance | Risk |
|---|---|---|---|---|
| [test_extraction_pipeline_current.py](domains/documents_validation/tests/test_extraction_pipeline_current.py) `test_process_folder_happy_path_uses_current_pipeline` | Only asserts `folder.reason`, `dv.final_name`, `leaf_folder_path`. Does not assert `folder.status`, `dv.status`, `dv.contrato_extracted_id`, `dv.contract_hash`, `dv.applied_policy_version`, or event emissions. Happy path is the spine — every field should be pinned. | business-rule | IMPORTANT | Silent state drift between refactor and next change |
| [test_process_folder_task_scope.py](domains/documents_validation/tests/test_process_folder_task_scope.py) | Verifies Celery task forwards `dv_ids` to `_process_folder` but NOT that `_process_folder` applies the scope. Creates false confidence — the actual whole-folder behavior is covered by #1. | business-rule | CRITICAL (tracked under #1) | See #1 |
| [test_calculations.py](domains/estoque/tests/test_calculations.py) `test_process_estoque_dataframe_empty` | Asserts `status=='Concluido'` for empty DataFrame. Semantics are documented in `domains/estoque/README.md` — just add a `# See estoque/README.md` comment linking the intent. | business-rule | NICE-TO-HAVE | Low — documentation-only tightening |

## Useless or Fragile Tests

| File/Test | Problem | Recommendation | Justification |
|---|---|---|---|
| [test_extraction_pipeline_primitives.py](domains/documents_validation/tests/test_extraction_pipeline_primitives.py) | Tests `ExtractionPipeline` with synthetic fakes — six lines of glue. Tautology: mock runs in order → assert mocks ran in order. | keep, don't count as coverage | Fine as contract documentation. Don't let it substitute for #15 (real step-scoped integration). Add a comment pointing to the real rerun test. |
| [test_extraction_pipeline_current.py](domains/documents_validation/tests/test_extraction_pipeline_current.py) patch targets | Patches `...steps.extract.find_matching_template` etc. Any further split of `ExtractStep` silently breaks the patches. | refactor | Inject a fake template-matcher through the pipeline factory's DI seam rather than module-level patch. |
| `test_apply_outcome.py::test_apply_ccb_unmatched_does_not_run_non_critical_gate` | Bundles two independent contracts: non-critical-check-is-None AND extraction_method is `'universal'`. | refactor | Split into two tests. Single level of abstraction per test. |

## Coverage Matrix

| Changed functionality | Unit test | Integration test | Business rule covered? | Gap |
|---|---|---|---|---|
| `ExtractionPipeline.run` + scope filter | ✅ primitives | ⚠️ current happy path only | Partial | #15 (step-scoped) |
| `DocTypeIdentificationStep` | ❌ | ✅ multi-CCB, no-CCB paths | Yes | — |
| `EmpresaIdentificationStep` | ❌ | ❌ | No | Minor (delegates to `infer_empresa`) |
| `MultipleCCBGuardStep` | ❌ | ✅ `test_process_folder_short_circuits_on_multiple_ccb` | Yes | — |
| `MergeIdentificacaoStep` | ❌ | ❌ | **No** | #7, #8 (regression: prior tests deleted) |
| `ExtractStep` tier orchestration | ❌ | ⚠️ happy path only | Partial | #13 |
| `ContratoLookupStep` (6 abort reasons) | ❌ | ⚠️ `no_ccb_found` + happy | **No** | #3, #4, #5 |
| `CrossCheckStep` | ❌ | ❌ | **No** | #9 |
| `KitEvaluationStep` | ❌ | ❌ | **No** | #10 |
| `RenameStep` | ❌ | ⚠️ `final_name` only | Partial | #11 |
| `PersistStep` (no-op) | ❌ | ❌ | N/A | — |
| `_should_escalate_to_universal` | ✅ 4 tests | N/A | Yes | — |
| `ExtractionOutcome.tiers_attempted` / `escalation_reason` dataclass | ✅ outcome | ❌ event | Partial | #13 |
| `extract_via_registry` tier tracking | ✅ dispatcher | N/A | Yes | — |
| `PrimaryGemini`/`FallbackGemini` method vocabulary | ✅ | N/A | Yes | — |
| All-extractors vocabulary invariant | ❌ | N/A | **No** | #12 |
| `apply_extraction_outcome_to_dv` | ✅ | N/A | Yes | #16 (low-quality branch) |
| `BulkImportRepository` new methods | ❌ | ⚠️ indirect | Partial | #14 |
| DV-scoped rerun (`dv_ids`) | ⚠️ task forward only | ❌ end-to-end | **No** | #1 |
| `rerun_generation` column | ❌ | ❌ | **No** | #2 |
| Aborted short-circuit invariant | ❌ | ⚠️ one path | **No** | #6 |
| `process_estoque_dataframe` status fix | ✅ zero-VP + empty | N/A | Yes | — |

## Prioritized Recommendations

1. **[CRITICAL, BLOCKING]** Decide #1 + #2 together: either pull the `PersistStep` wire-up into this PR (with tests), or remove `dv_ids` from the public signature and revert migration 0049. The tier-3 plan parks them for later — fine, but don't ship the API surface today.
2. **[CRITICAL]** Add the three `ContratoLookupStep` branch tests (#3, #4, #5) — duplicate / rejected-reclaim / no_id_match are the compliance-sensitive paths of the whole bulk-import flow.
3. **[CRITICAL]** Add the abort-short-circuit invariant test (#6). Cheap to write, catches a broad class of regressions.
4. **[IMPORTANT, REGRESSION RECOVERY]** Replace the deleted merge coverage (#7, #8). The PR deletes `test_parallel_bulk_import.py` wholesale — merge-specific tests went with it.
5. **[IMPORTANT]** Step-level isolation tests for CrossCheck (#9), Kit (#10), Rename (#11). Can live under `tests/domain/extraction/steps/`.
6. **[IMPORTANT]** End-to-end `escalation_reason` + `tiers_attempted` event-level assertion (#13) and all-extractors vocabulary enforcement (#12). Cheap; protects telemetry contract.
7. **[IMPORTANT]** Repository-direct tests for the new `BulkImportRepository` methods (#14).
8. **[IMPORTANT]** Step-scoped rerun integration test (#15) — orthogonal to #1 (step-axis vs dv-axis).
9. **[NICE-TO-HAVE]** Extend `test_apply_outcome.py` with the low-quality branch (#16).
10. **[CODE HYGIENE]** Delete `TransientExtractorError` (or land its tier-4 wire-up). Tighten the two fragile tests flagged (`test_apply_outcome.py` bundled assertion; patch targets in `test_extraction_pipeline_current.py`).
