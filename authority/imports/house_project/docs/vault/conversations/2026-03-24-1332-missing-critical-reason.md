---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T13:32:00-03:00
expires: 2026-05-23
conversation_id: 63294bd4-1554-48d7-ba6c-fb5c11b6ed46
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/upload-flow-diagram.md"]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Introduced REASON_MISSING_CRITICAL to distinguish missing mandatory fields from missing templates, and established a firm Quality Gate where only fully extracted documents count toward Kit completion, directly improving pipeline robustness."
version: 0.1.0
last_updated: 2026-03-24
---

# Implementing Missing Critical Reason and Kit Quality Gate

**Date:** 2026-03-24 13:32 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session formalized the `REASON_MISSING_CRITICAL` document reason and established a strict Quality Gate for Kit Evaluation in the bulk import pipeline. Previously, documents that matched a template but missed critical fields were labeled `REASON_NO_TEMPLATE`, which conflated two different error states. Furthermore, the Kit Evaluation lacked a firm quality gate, meaning partially extracted or un-cross-checked documents could erroneously count towards a kit's completion status. 

### Introducing REASON_MISSING_CRITICAL
- **Problem/Goal:** Distinguish between documents that completely failed to match any template (`REASON_NO_TEMPLATE`) vs documents that matched a template but failed to extract mandatory fields.
- **Decision:** Introduce a new `REASON_MISSING_CRITICAL` ('missing_critical') status.
- **Changes:** Added the constant to `DocumentVersion` and `DocumentsFolderResult` models. Updated the extraction pipeline (`_step_extract_and_match` paths) to assign this reason when critical fields are missing. Updated 8 existing unit tests to assert this new reason.

### Kit Quality Gate Enforcement
- **Problem/Goal:** The Kit Evaluation logic blindly counted documents based on their `doc_type` presence, without checking their extraction success state, leading to false kit completions.
- **Decision:** Implement a strict Quality Gate (`_KIT_QUALIFYING_REASONS`) for non-CCB documents so only successfully extracted docs (e.g. `REASON_EXTRACTED_NOT_CROSS_CHECKED` or `REASON_OCR_MATCH`) count towards the kit.
- **Changes:** Updated `_step_kit_evaluation` to filter by these reasons. Removed the raw SQL overwrite of `documents_matched` in `_update_batch_counters` to ensure the kit evaluation logic remains the single source of truth.

### Averbação Template Fine-Tuning
- **Problem/Goal:** The `Averbacao` config had too many critical fields, causing excessive failures.
- **Decision:** Reduce the `critical_fields` list to just `cpf` and `nome_trabalhador`.
- **Changes:** Updated `averbacao_dataprev.json` and executed a DB migration to update the existing Averbação template (ID 10) in the production database.

### Flowchart Diagram Overhaul
- **Problem/Goal:** The `upload-flow-diagram.md` did not accurately reflect the extraction flow (where template matching happens *before* regex extraction) nor the AI (Gemini) fallback paths.
- **Decision:** Refactor the Mermaid diagram and its descriptions to match the true pipeline implementation.
- **Changes:** Rewrote the Fase 2 subgraph to show `Doc Type Identificado` → `Inferência de Empresa` → `Match de Template` → extractions. Added explicit explanations describing `REASON_MISSING_CRITICAL` and the new Kit Quality Gate.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | 8 step assertions updated, 2 counter tests fixed, 1 kit test fixed with `critical_fields=['nome']` | Kit evaluation should only reflect documents that passed the completeness quality gate. |

**Why these tests matter:** They ensure the pipeline handles extraction errors gracefully and prevents the system from prematurely approving incomplete document kits.

## Key Decisions

- **Missing Critical Status:** Documents lacking critical fields are now distinctly tagged `missing_critical` instead of being lumped under `no_template`.
- **Kit Source of Truth:** `documents_matched` is purely governed by `evaluate_kit_completion()`. The old SQL overwrite was removed to preserve the gate logic.
- **Gemini Schema Inference:** The pipeline decides which Gemini schema to use via `infer_empresa(text)`, acting independently of the template match status.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `REASON_MISSING_CRITICAL` constant. |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Implemented new reason in extraction paths, added kit quality gate, removed SQL override. |
| `domains/aquisicao/domain/extraction_configs/averbacao_dataprev.json` | `modified` | Reduced critical fields to `cpf` and `nome_trabalhador`. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Updated assertions, removed dead-constant guard, and fixed `test_ccb_included_in_kit_count_after_contrato_confirmed`. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Updated flowchart to reflect new template matching order, Gemini paths, and Kit Quality Gate. |
