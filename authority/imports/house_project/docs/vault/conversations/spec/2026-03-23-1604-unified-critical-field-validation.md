---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T16:04:35-03:00
expires: 2026-05-22
conversation_id: 2ce0753f-8fa9-47f4-a41a-947f25874c2b
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/ccb-flow-refactor.md
  - specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md
promoted_candidates: []
user_satisfaction: 8
user_satisfaction_min: 7
user_satisfaction_max: 9
user_satisfaction_std: 0.7
expected_importance: 6
importance_rationale: "Unified critical field validation across all doc_types eliminates a systematic quality gate gap that allowed documents with missing identity fields to pass extraction unchecked — directly impacts data integrity in credit acquisition."
---

# Unified Critical Field Validation — Implementation

**Date:** 2026-03-23 16:04 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session implemented Part A of the `ccb-flow-refactor.md` plan: unified critical field validation for all document types in `_process_folder`. Previously, only Identificacao and CCB had critical field checks — Antifraude, Averbação, ComprovanteEmprestimo, and Holerite (regex path) accepted any extracted field as sufficient. The refactor introduces `_resolve_critical_fields()` and `DEFAULT_EXTRACTION_CONFIGS` to enforce config-driven validation universally. The `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` constant was removed as redundant (was 1.0, equivalent to the new binary check). All 108 existing tests pass after updating test fixtures to reflect the new behavioral expectations.

### Unified _resolve_critical_fields() Helper
- **Problem/Goal:** 4 of 7 doc_types had no critical field validation on the template-matched path. The Gemini path used hardcoded field checks (`has_nome AND has_id`).
- **Decision:** Replace all hardcoded checks with a single `_resolve_critical_fields(extraction_config, matched, doc_type)` helper that resolves fields from: (1) extraction_config JSON → (2) DocumentTemplate model → (3) DEFAULT_EXTRACTION_CONFIGS fallback.
- **Changes:** Added `_load_default_extraction_configs()`, `DEFAULT_EXTRACTION_CONFIGS`, and `_resolve_critical_fields()` to `process_bulk_import.py`. Unified 3 validation blocks (Gemini unmatched Identificacao, Gemini unmatched Holerite, template-matched non-CCB) into config-driven checks.

### Holerite Config Update
- **Problem/Goal:** `holerite_config.json` had `nome` as field key (inconsistent with Gemini output which uses `nome_servidor`) and wrong critical_fields (`bruto`, `liquido`).
- **Decision:** Align with Gemini schema and make `mes_ano_pagamento` critical (primary temporal identifier for payslips).
- **Changes:** Renamed `nome` → `nome_servidor` in fields; updated critical_fields to `[nome_servidor, cpf, mes_ano_pagamento]`; moved `bruto`/`liquido` to non_critical_fields.

### Behavioral Changes
- **Problem/Goal:** Document and validate intended behavioral changes.
- **Decision:** More restrictive validation is intentional — documents missing critical identity/financial fields should be flagged for review, not silently passed.
- **Changes:** Identificacao (Gemini) now requires `nome AND id_documento AND cpf` (was `nome AND (id_documento OR cpf)`). Antifraude, ComprovanteEmprestimo, and Holerite regex-matched now validate critical fields.

Key outputs:
- `process_bulk_import.py` — core refactor with 3 new functions
- `holerite_config.json` — aligned field schema
- `bulk_import_config.py` — removed `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `test_parallel_bulk_import.py` | `test_antifraude_classified_and_extracted` | Antifraude documents must have cpf, nome, and processo_id to pass quality gate |
| `test_parallel_bulk_import.py` | `test_gemini_extraction_with_nome_and_cpf_but_no_id_fails_quality_gate` (renamed) | Identificacao missing any critical field → low_quality_image (was OR, now AND) |
| `test_parallel_bulk_import.py` | `test_identificacao_with_template_uses_gemini_when_enabled` | Gemini matched path enforces all 3 Identificacao critical fields |
| `test_parallel_bulk_import.py` | `test_identificacao_without_template_uses_gemini_when_enabled` | Gemini unmatched path enforces all 3 Identificacao critical fields |

**Why these tests matter:** Without these updates, the test suite would validate the old OR-logic for Identificacao and the no-validation path for Antifraude — masking the fact that documents missing identity fields were being accepted, potentially allowing credit acquisitions based on incomplete document sets.

## Key Decisions

- **Config-driven only:** No critical field is hardcoded in Python — the JSON extraction configs are the single source of truth.
- **ALL-or-nothing semantics:** All critical fields must be present (not a fraction-based threshold). This is behaviorally identical to the old `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD = 1.0` but clearer.
- **Identificacao strictness:** `nome AND id_documento AND cpf` (stricter than old OR logic). User confirmed this is intentional.
- **Holerite field rename:** `nome` → `nome_servidor` in regex config to match Gemini output schema.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added `_load_default_extraction_configs()`, `DEFAULT_EXTRACTION_CONFIGS`, `_resolve_critical_fields()`; unified 3 validation blocks; removed `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` import |
| `domains/aquisicao/domain/extraction_configs/holerite_config.json` | `modified` | `nome`→`nome_servidor`; critical_fields updated; `bruto`/`liquido` to non_critical |
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Removed `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` constant |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Updated Antifraude fixtures, Gemini Identificacao mocks, renamed test |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `modified` | Part A marked as implemented; status→`partially-implemented`; version→0.3.0 |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | QG-2 unified for all doc_types; removed threshold config; updated Mermaid diagram and reason table; version→1.2.0 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `implements` | Part A of refactor plan now implemented |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `updates` | Quality gates section reflects unified validation |

## Open Questions

- Part B of `ccb-flow-refactor.md` (structural improvements: reduce `dv.save()` calls, extract Gemini helper, handle download failures) remains unimplemented.
