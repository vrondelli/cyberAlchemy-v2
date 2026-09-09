---
tags: [pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T14:10:00-03:00
expires: 2026-05-22
conversation_id: 13aea537-4f29-44fa-adfa-29dda4a4fdc4
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md, specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Unified Holerite extraction schema across SIAPE and RJ payslips with empresa-based prompt routing, expanding pipeline coverage to State/City government employees."
user_satisfaction: 8
user_satisfaction_min: 7
user_satisfaction_max: 9
user_satisfaction_std: 0.8
version: 0.1.0
last_updated: 2026-03-23
---

# Holerite RJ Extraction Implementation

**Date:** 2026-03-23 14:10 (UTC-3)
**Tags:** #pipeline #acquisition

## Summary

This session reviewed and implemented the plan for adding Rio de Janeiro (State/PMERJ and City/Prefeitura) payslip extraction to the Gemini pipeline. The initial plan proposed separate JSON schemas for SIAPE and RJ prompts, but after review the user decided both prompts must produce the same unified output schema — a superset of ~26 fields where each prompt provides different field-mapping instructions.

The implementation touched 4 source files and 2 test files. A key design decision was to rename SIAPE-specific keys (`mat_siape` → `matricula`, `cargo_emprego` → `cargo`, `sigla_upag` → `orgao_lotacao`, `reg_juridico` → `regime_juridico`) to create format-agnostic keys usable by both SIAPE and RJ prompts. Fields exclusive to one format are returned as `null` by the other.

### Unified Schema Design
- **Problem/Goal:** The existing `GEMINI_HOLERITE_SYSTEM_PROMPT` used SIAPE-specific keys (`mat_siape`, `sigla_upag`). RJ payslips have different labels (`IdFunc`, `LOTAÇÃO`). Using separate schemas would complicate downstream logic.
- **Decision:** Both prompts share the same JSON output schema. Only the Field Mapping section differs, telling Gemini where to find each value on the document. Shared schema blocks (`_HOLERITE_GUIDELINES`, `_HOLERITE_SCHEMA`) keep the two prompts DRY.
- **Changes:** Rewrote `gemini_config.py` with unified schema, two system prompts, one generic user message.

### Classification Keywords
- **Problem/Goal:** RJ payslips use "CONTRACHEQUE" and "Comprovante de Pagamento" instead of "Comprovante de Rendimentos".
- **Decision:** Add these patterns to `DOC_TYPE_KEYWORDS` and `FILENAME_KEYWORDS` for Holerite.
- **Changes:** Updated `template_matching_config.py`. Added `gov_rj` and `pref_rj` to `EMPRESA_KEYWORDS` (before `capital_consig`) and `SUPPORTED_EMPRESAS`.

### Prompt Routing
- **Problem/Goal:** `extract_holerite_with_gemini` used a single hardcoded prompt.
- **Decision:** Accept an `empresa` parameter and route to the RJ prompt when `empresa in ("gov_rj", "pref_rj")`, defaulting to SIAPE.
- **Changes:** Updated `gemini_extraction.py` signature and routing logic. Updated both call sites in `process_bulk_import.py` to pass `empresa`.

Key outputs:
- `gemini_config.py` — unified schema, SIAPE + RJ prompts
- `gemini_extraction.py` — empresa-based routing
- `template_matching_config.py` — RJ keywords + empresas
- `gemini-holerite-rj-extraction-plan.md` — implementation plan (status: implemented)

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_gemini_extraction.py` | `test_success_returns_fields_and_confidence`, `test_no_api_key_returns_none`, `test_api_error_retries_then_returns_none`, `test_invalid_json_returns_none`, `test_routing_gov_rj_uses_rj_prompt`, `test_routing_pref_rj_uses_rj_prompt`, `test_routing_default_uses_siape_prompt` | Holerite extraction correctness; empresa-based prompt routing selects correct system prompt |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_gov_rj_by_estado`, `test_pref_rj_by_prefeitura`, `test_pref_rj_by_previdencia`, `test_gov_rj_priority_over_capital_consig` | RJ empresa keyword inference; ordering priority prevents false capital_consig match |

**Why these tests matter:** Without routing tests, a regression could send RJ payslips to the SIAPE prompt, extracting wrong fields. Without empresa inference tests, new RJ documents could be misclassified as `capital_consig` due to footer text overlap, sending them down the wrong extraction path.

## Key Decisions

- **Unified schema:** Both SIAPE and RJ prompts produce the same JSON keys (~26 fields). Fields not present on a payslip type are `null`. This eliminates downstream branching.
- **Key renames:** `mat_siape` → `matricula`, `cargo_emprego` → `cargo`, `sigla_upag` → `orgao_lotacao`, `reg_juridico` → `regime_juridico`. Existing data with old keys is considered stale (user confirmed acceptable).
- **EMPRESA_KEYWORDS ordering:** `gov_rj`/`pref_rj` inserted before `capital_consig` — RJ payslips may carry Capital Consig footer, so RJ patterns must match first.
- **Single user message:** `GEMINI_HOLERITE_USER_MESSAGE` is generic and shared by both prompts.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Added `CONTRACHEQUE`/`Comprovante de Pagamento` to Holerite keywords; added `gov_rj`/`pref_rj` empresa patterns + SUPPORTED_EMPRESAS |
| `domains/aquisicao/services/gemini_config.py` | `modified` | Replaced single Holerite prompt with unified schema, two system prompts (SIAPE/RJ), one generic user message |
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Added `empresa` param to `extract_holerite_with_gemini` with RJ/SIAPE routing |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Pass `empresa` to both `extract_holerite_with_gemini` call sites |
| `domains/aquisicao/tests/test_gemini_extraction.py` | `modified` | Added `TestExtractHoleriteWithGemini` class with 7 tests |
| `domains/aquisicao/tests/test_universal_extraction.py` | `modified` | Added 4 RJ empresa inference tests to `TestInferEmpresa` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` | `modified` | Updated to reflect unified schema design; marked as implemented |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | Updated empresa list, filename keywords table, and Gemini path description to include RJ support |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `implements` | Updated spec to reflect RJ prompt routing and new empresa values |
| `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` | `derives-from` | Implementation plan that guided this work |

## Open Questions

- How will Gate 2 quality validation behave with the unified schema? The common fields (`nome_servidor`, `cpf`, `mes_ano_pagamento`) are present in both formats, so it should work — but needs manual testing with real RJ payslips.
