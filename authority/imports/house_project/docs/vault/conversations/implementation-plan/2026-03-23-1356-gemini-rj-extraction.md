---
tags: [aquisicao, holerite, gemini, extraction]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T13:56:00-03:00
expires: 2026-05-22
conversation_id: 49b373cc-f7eb-4011-af9c-f32aa67f3694
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced an implementation plan for supporting Rio de Janeiro payslips using a dedicated Gemini prompt, separating it from the Federal SIAPE extraction logic."
---

# Planning Gemini RJ Holerite Extraction

**Date:** 2026-03-23 13:56 (UTC-3)
**Tags:** #aquisicao #holerite #gemini #extraction

## Summary

The session focused on expanding the Holerite (payslip) extraction capabilities using the Gemini API to support documents from Rio de Janeiro (both State Police/PMERJ and City Council/Prefeitura). We identified that the existing `GEMINI_HOLERITE_SYSTEM_PROMPT` was tightly coupled to Federal (SIAPE) terminology, which would cause issues if we tried to combine both into a single schema. We decided to create separate prompts for RJ and SIAPE, routing the document based on the inferred `empresa_geradora`. An implementation plan was drafted detailing the necessary changes in `template_matching_config.py`, `gemini_config.py`, `gemini_extraction.py`, and `process_bulk_import.py`.

### Architectural Decision: Separate Prompts vs Unified Schema
- **Problem/Goal:** The incoming PMERJ payslip has fields like `IdFunc`, `UA/Setor`, and `Lotação`, while the existing Gemini prompt looks for SIAPE-specific fields like `mat_siape` and `sigla_upag`. Combining them would result in a bloated schema.
- **Decision:** Keep the extraction prompts separate (one for SIAPE, one for RJ) and rely on upstream classification (`empresa_geradora`) to select the correct prompt.
- **Changes:** Designed an implementation plan to create `GEMINI_HOLERITE_RJ_SYSTEM_PROMPT` and refactor `extract_holerite_with_gemini` to accept an `empresa` parameter.

Key outputs:
- `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` — Detailed implementation plan for adding RJ holerite support.

## Key Decisions

- **Extraction Strategy:** Separate generative extraction prompts per large issuer (e.g., SIAPE vs RJ) yields better extraction accuracy and cleaner schemas than a single unified prompt.
- **Empresa Inference:** We will rely on text-based keywords (e.g., "GOVERNO DO ESTADO DO RIO DE JANEIRO", "PREFEITURA RIO") in `EMPRESA_KEYWORDS` to classify the payslip's `empresa` before triggering the Gemini extraction.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | The user added `HOL_` to `FILENAME_KEYWORDS` for Holerite classification. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` | `created` | Actionable plan for implementing the new RJ holerite extraction logic. |
