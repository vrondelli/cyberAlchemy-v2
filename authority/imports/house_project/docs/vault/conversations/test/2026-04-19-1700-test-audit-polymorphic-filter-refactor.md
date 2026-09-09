---
title: Test Audit — Polymorphic Filter Architecture Refactor
date: 2026-04-19
node_type: conversation
conversation_type: test
status: active
tags: [test-audit, filters, polymorphic, eligibility, refactor]
---

# Test Audit — Polymorphic Filter Architecture Refactor

**Date:** 2026-04-19
**Changes analyzed:** 24 production files, 8 test files (1 new, 1 deleted, 6 modified)

---

## Executive Summary

This is the most structurally significant refactor in the filter subsystem to date. The domain layer was purified (filters are now IO-free), a new `FilterEvaluation` model replaces `RemessaFilterResult`, the cascade propagation machinery is entirely new, and the override mechanism changed from single-row to remessa-scoped bulk. The existing test suite covers the happy path at remessa-level only. **I found 6 critical missing tests, 7 important gaps, 3 nice-to-have gaps, and 2 fragile/useless tests.** The cascade propagation logic for contract-level and parcela-level failures — the new core capability of this refactor — has zero coverage. That is a merge blocker.

---

## Business Context

The filter system is the eligibility gate for financial batch approval. A FAIL blocks a fund manager from promoting a remessa to the production portfolio. A missed cascade means a contract or installment can appear as PASS in the UI when the parent remessa failed — or worse, a contract-level failure may not surface to the approval gate. The new `_propagate_cascade()` method implements a multi-level failure priority logic (remessa > contrato > parcela) whose correctness is entirely untested beyond the remessa-level case. In regulated financial infrastructure, silent miscascade equals silent data integrity violation.

---

## Missing Tests — Critical

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| `_propagate_cascade` when the failing filter's `object_type='contrato'`: contratos get `FAIL/direct`, the remessa and sibling installments get `FAIL/from_contract` | business-rule | integration | CRITICAL | Contract-level failure is the primary new capability. Without this test, the cascade path is dead code that could produce wrong eligibility signals in production | `domains/aquisicao/tests/test_run_filters_service.py` | `test_fail_cascades_reason_from_contract` |
| `_propagate_cascade` when the failing filter's `object_type='parcela'`: installments get `FAIL/direct`, remessa and contracts get `FAIL/from_installment` | business-rule | integration | CRITICAL | Installment-level failure is the third new cascade path. Completely untested. | `domains/aquisicao/tests/test_run_filters_service.py` | `test_fail_cascades_reason_from_installment` |
| `_propagate_cascade` when both remessa-level and contract-level filters fail simultaneously: remessa-level takes priority as the dominant reason | business-rule | integration | CRITICAL | Priority logic determines what fund managers see in the Pendentes screen. Wrong priority = wrong remediation action by operator | `domains/aquisicao/tests/test_run_filters_service.py` | `test_fail_priority_remessa_dominates_contrato` |
| `RunFiltersService.apply_override()` bulk-updates all `FilterEvaluation` rows for the remessa and re-cascades hierarchy; not just the one row referenced by `filter_result_id` | business-rule | integration | CRITICAL | The override behavior changed from single-row to remessa-scoped bulk. `JustifyFilterOverrideUseCase` passes a single `filter_result_id` but the service overrides the entire remessa. Untested edge: multiple FAILs on the same remessa — all must be cleared, not just one | `shared_services/tests/test_justify_filter_override.py` | `test_override_clears_all_evaluations_for_remessa` |
| `HierarchyRepository.prefetch_evaluation_context()` correctly computes `portfolio_sum`, `batch_sum`, `contract_count`, and `max_ccb_age_days` from real DB rows | business-rule | integration | CRITICAL | This method feeds all three filters with their IO-extracted inputs. Any miscalculation silently wrong-filters every batch. No dedicated test exists — the context is trusted without verification | `infrastructure/repositories/tests/test_hierarchy_repository.py` (new file) | `test_prefetch_context_computes_correct_aggregates` |
| `RunFiltersService` vacuous-pass (no filter_configs): outcome is `vacuous_pass` and all hierarchy nodes are marked `vacuous_pass/direct` | business-rule | integration | CRITICAL | A remessa with no configured filters must pass the approval gate and show clean in the UI. If the vacuous path sets wrong status, all remessas without filter configs are blocked silently | `domains/aquisicao/tests/test_run_filters_service.py` | `test_vacuous_pass_when_no_filter_configs` |

---

## Missing Tests — Important

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| `RunFiltersService._evaluate_all()` exception in filter execution: exception is caught, stored as `FAIL` with `detail='exception: ...'`, run does not raise | code-integrity | unit | IMPORTANT | Production filters run in sequence; one crash must not corrupt the entire run or leave the remessa in an ambiguous state | `domains/aquisicao/tests/test_run_filters_service.py` | `test_filter_exception_produces_fail_not_crash` |
| `RunFiltersService._evaluate_all()` stub filter (is_implemented=False): produces `vacuous_pass` row, does not invoke filter class | code-integrity | unit | IMPORTANT | Stub filters are production config; the vacuous_pass row must be written and hierarchy updated accordingly | `domains/aquisicao/tests/test_run_filters_service.py` | `test_stub_filter_produces_vacuous_pass_evaluation` |
| `FilterEvaluationRepository.upsert_evaluation()` idempotency: running filters twice for the same (object_type, object_id, entity_type, fund_filter) updates the row, not duplicates it | code-integrity | integration | IMPORTANT | The `unique_together` constraint protects against duplicates. But the test suite only runs once — we need to verify that a re-run updates the existing row | `domains/aquisicao/tests/test_run_filters_service.py` | `test_run_twice_upserts_not_duplicates` |
| `validate_filter_registry()` failure modes: missing `object_type`, invalid `object_type`, and `object_type` with no registered resolver each raise `ImproperlyConfigured` | code-integrity | unit | IMPORTANT | This is the startup guard against misconfigured filters. If it silently passes with bad config, the service bootstraps and then crashes at runtime during upload | `shared_services/tests/test_filter_registry.py` (new file) | `test_validate_raises_when_object_type_missing`, `test_validate_raises_when_object_type_invalid`, `test_validate_raises_when_no_resolver` |
| `build_filter_config_bindings()` returns `[]` for any non-`aquisicao` domain_namespace | code-integrity | unit | IMPORTANT | Liquidação uploads must not accidentally pick up aquisição filter configs | `shared_services/tests/test_filter_config_bindings.py` (new file) | `test_returns_empty_for_non_aquisicao_namespace` |
| `ApproveRemessaAquisicaoUseCase` approval gate: an `entity_type='parcela'` FAIL blocks approval (it is in `approval_entity_types`), while `entity_type='cnpj_fundo'` does NOT block | business-rule | integration | IMPORTANT | The approval gate filters by entity_type. Only `remessa`, `contrato`, `parcela` are in scope. The existing test only verifies `cnpj_fundo` doesn't block, not that `parcela` does | `domains/aquisicao/tests/test_approve_remessa.py` | `test_parcela_entity_type_fail_blocks_approval` |
| `FilterEvaluationRepository.has_unresolved_failures()` raises `ValueError` when called with an empty `entity_types=[]` list | code-integrity | unit | IMPORTANT | The guard exists in code but is unexercised. An accidental empty list would vacuous-pass the gate for all remessas | `domains/aquisicao/tests/test_approve_remessa.py` or a dedicated repo test | `test_has_unresolved_failures_raises_on_empty_entity_types` |

---

## Missing Tests — Nice-to-have

| Description | Type | Scope | Importance | Business context | Suggested file | Suggested scenario |
|---|---|---|---|---|---|---|
| `ConcentracaoMaxFilter.run()` falls back to `max_pct` when `max_concentracao_pct` is absent (legacy config compatibility) | code-integrity | unit | NICE-TO-HAVE | FundFilterConfig rows written before the rename keep the old key. The filter should keep working | `domains/aquisicao/tests/test_filters_criteria.py` | `test_max_pct_legacy_param_fallback` |
| `HierarchyRepository.load_hierarchy_graph()` logs a warning when two ContratoCCB rows share the same `numero_titulo`, and returns the first ID for the cascade join | code-integrity | unit | NICE-TO-HAVE | Data quality issue that produces ambiguous cascade. Warning logging must fire for operators to catch it | `infrastructure/repositories/tests/test_hierarchy_repository.py` | `test_duplicate_numero_titulo_logs_warning_and_uses_first` |
| `ListFinalizedUploadsAPI` `filter_status` query parameter is ignored for liquidação remessas (has_failed hardcoded to False) — intentional behavior documented in test | code-integrity | integration | NICE-TO-HAVE | The API change silently broke liquidação filter status filtering. This should be a test that explicitly asserts the current (intended) behavior so future changes are deliberate | `shared_services/tests/test_filter_override_api.py` | `test_liquidacao_filter_status_param_is_no_op` |

---

## Incomplete Tests

| File/Test | What's missing | Type | Importance | Risk |
|---|---|---|---|---|
| `test_run_filters_service.py` — `test_fail_cascades_reason_from_remessa` | Asserts cascade reason on remessa, contrato, parcela but doesn't assert `last_filter_result=FAIL` on contrato and parcela — only `filter_result_reason`. The `last_filter_result` column propagation could be silently wrong | code-integrity | IMPORTANT | UI shows wrong eligibility status on contracts/installments |
| `test_filters_criteria.py` — `TestCcbFreshnessFilterPure` | Missing the `max_ccb_age_days=0` case (no staged installments → vacuous pass). Filter returns `pass` with "filter does not apply" but this path is untested | business-rule | IMPORTANT | If max_ccb_age_days is never 0 in context, this path is dead. But the guard is there for a reason |
| `test_justify_filter_override.py` — `test_happy_path_writes_override_fields` | Verifies that `override_justification` is written on the retrieved `fr`, but doesn't verify that ALL evaluations for the remessa were updated (new bulk behavior). With one evaluation per test, the bulk vs single distinction is invisible | business-rule | CRITICAL | A multi-evaluation remessa would only appear fixed in the test, but in production a second evaluation would still block approval |
| `test_approve_remessa.py` (aquisicao) — `TestApproveAquisicaoFilterGate` | `test_mandatory_fail_for_out_of_scope_entity_type_does_not_block` tests `cnpj_fundo` doesn't block but doesn't have a paired test asserting `parcela` DOES block — leaving the gate half-verified | business-rule | IMPORTANT | Incomplete gate verification gives false confidence the approval gate is fully correct |

---

## Useless or Fragile Tests

| File/Test | Problem | Recommendation | Justification |
|---|---|---|---|
| `test_filters_criteria.py` — `TestFilterModulePurity.test_no_django_db_imports_in_filters_criteria` (and siblings) | Reads the source file via `Path('domains/aquisicao/domain/filters_criteria.py').read_text()` — a **relative path**. Will fail with `FileNotFoundError` if the test runner is invoked from any directory other than the project root (e.g., a CI matrix that changes cwd, or a pytest run from inside the module) | `rewrite` | Replace relative path with `Path(__file__).parent.parent / 'domain' / 'filters_criteria.py'` — an absolute path anchored to the test file's location. The intent is good (domain purity assertion); the fragility is a packaging detail |
| `domains/liquidacao/tests/test_approve_remessa.py` — `TestApproveLiquidacaoFilterBypass` / `TestApprovalGateWithOverrideLiquidacao` | These tests create `FilterEvaluation` rows and verify that `ApproveRemessaLiquidacaoUseCase` ignores them (gate was removed). They are testing a no-op. The `FilterEvaluation` rows created are never read by the use case under test | `refactor` | Replace with a single `test_approval_succeeds_regardless_of_filter_evaluations` test that explicitly documents the intent: "liquidação has no filter gate in this phase." The current 6-test class creates false coverage signal |

---

## Coverage Matrix

| Changed functionality | Unit test | Integration test | Business rule covered? | Gap |
|---|---|---|---|---|
| `filters_criteria.py` — ConcentracaoMaxFilter (pure, params injected) | ✅ | ✗ | Partially | No end-to-end test verifying context injection → filter → outcome |
| `filters_criteria.py` — CcbFreshnessFilter (pure) | ✅ | ✗ | Partially | `max_ccb_age_days=0` path untested |
| `filters_criteria.py` — MaxContratosFilter (pure) | ✅ | ✗ | Yes | — |
| `RunFiltersService.run()` — remessa-level PASS | ✅ | ✅ | Yes | — |
| `RunFiltersService.run()` — remessa-level FAIL + cascade | ✅ | Partially | Partially | Only `filter_result_reason` asserted, not `last_filter_result` on children |
| `RunFiltersService.run()` — contrato-level FAIL + cascade | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `RunFiltersService.run()` — parcela-level FAIL + cascade | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `RunFiltersService.run()` — mixed-level FAIL priority | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `RunFiltersService.run()` — vacuous_pass (no configs) | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `RunFiltersService.run()` — stub filter → vacuous_pass row | ✗ | ✗ | No | Important gap |
| `RunFiltersService.run()` — exception in filter → FAIL | ✗ | ✗ | No | Important gap |
| `RunFiltersService.apply_override()` — bulk cascade | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `HierarchyRepository.prefetch_evaluation_context()` | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `HierarchyRepository.update_filter_status()` — write-once first_filter_date | ✗ | ✗ | No | Nice-to-have |
| `FilterEvaluationRepository.upsert_evaluation()` idempotency | ✗ | ✗ | No | Important gap |
| `FilterEvaluationRepository.has_unresolved_failures()` — empty list guard | ✗ | ✗ | No | Important gap |
| `ApproveRemessaAquisicaoUseCase` — new injectable gate | ✅ | ✅ | Partially | `parcela` entity type in gate scope not asserted |
| `ApproveRemessaLiquidacaoUseCase` — gate removed | ✅ (trivial) | ✅ (trivial) | N/A | Tests are no-op; refactor them |
| `JustifyFilterOverrideUseCase` — bulk override behavior | ✗ | ✗ | **NO** | **CRITICAL gap** |
| `validate_filter_registry()` | ✗ | ✗ | No | Important gap |
| `build_filter_config_bindings()` edge cases | ✗ | ✗ | No | Important gap |
| `ListFinalizedUploadsAPI` — liquidação filter_status no-op | ✗ | ✗ | No | Nice-to-have |

---

## Prioritized Recommendations

1. **[CRITICAL — MERGE BLOCKER]** Write contract-level and parcela-level cascade tests in `test_run_filters_service.py`. The entire new `_propagate_cascade` logic for these paths is unverified dead code from a testing perspective.

2. **[CRITICAL — MERGE BLOCKER]** Add a dedicated `HierarchyRepository` test file. `prefetch_evaluation_context()` is the IO boundary that feeds all three filters. It must be tested with real DB fixtures to verify the aggregates.

3. **[CRITICAL — MERGE BLOCKER]** Add a test in `test_justify_filter_override.py` that creates **two** `FilterEvaluation` rows for the same remessa (two different filters, both FAIL) and verifies that after one `execute()` call, **both** rows have `override_justification` set. This is the new bulk behavior and it is completely invisible in current tests.

4. **[CRITICAL]** Add `test_vacuous_pass_when_no_filter_configs` to `test_run_filters_service.py`. This guards the common pre-config scenario.

5. **[IMPORTANT]** Fix `TestFilterModulePurity` relative path before it silently breaks in CI.

6. **[IMPORTANT]** Add `validate_filter_registry()` failure-mode unit tests in a new `test_filter_registry.py`. This startup guard has no tests.

7. **[IMPORTANT]** Add `test_filter_exception_produces_fail_not_crash` and `test_stub_filter_produces_vacuous_pass_evaluation` to `test_run_filters_service.py`. These are runtime resilience contracts for the upload pipeline.

8. **[IMPORTANT]** Add `test_run_twice_upserts_not_duplicates` — the unique_together constraint must be exercised to catch future migration mistakes.

9. **[IMPORTANT]** Add `test_parcela_entity_type_fail_blocks_approval` to `test_approve_remessa.py` to complete the gate verification.

10. **[REFACTOR]** Collapse `TestApproveLiquidacaoFilterBypass` into one clearly-named test + comment explaining the gate-absent state. The 6 tests create false coverage signal.
