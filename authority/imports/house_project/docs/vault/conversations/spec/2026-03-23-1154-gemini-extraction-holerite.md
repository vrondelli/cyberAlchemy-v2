---
tags: [pipeline, ocr]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T11:54:00-03:00
expires: 2026-05-22
conversation_id: 09ee127d-30e7-42bd-8b0f-64473ff74d66
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [
  "specs/002-ccb-validation-workflow/upload-flow-diagram.md",
  "specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md"
]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established the architectural pattern for using Gemini 2.5 Flash as a generalized structured data extractor for complex layouts (like Holerites), bypassing brittle regex rules."
version: 0.1.0
last_updated: 2026-03-23
---

# Gemini Extraction for Holerite Documents

**Date:** 2026-03-23 11:54 (UTC-3)
**Tags:** #pipeline #ocr

## Summary

This session focused on replacing traditional PyMuPDF regex extraction with Google Gemini 2.5 Flash for parsing complex tabular data in "Holerite" documents. The regex-based approach was brittle and unable to handle the dynamic length and nested variables of `Rendimentos` and `Descontos` tables.

We integrated `GEMINI_HOLERITE_ENABLED` into `bulk_import_config.py` and decoupled the existing `_call_gemini` method from the hardcoded `Identificacao` prompts. We created a specific system prompt (`GEMINI_HOLERITE_SYSTEM_PROMPT`) to instruct Gemini to return structured JSON mapping the payslip's exact values, amounts, and descriptions. Finally, we wired up `process_bulk_import.py` to route Holerite documents to this new Gemini pipeline if enabled, and updated all relevant Markdown specification documents to reflect that Gemini is no longer restricted exclusively to RG/CNH identification documents.

### Generalizing Gemini Extraction
- **Problem/Goal:** The Gemini OCR logic was hardcoded exclusively for `Identificacao` documents in both the service and the bulk import use case. Holerite documents required AI extraction to parse dynamic tables securely.
- **Decision:** Break down `_call_gemini` to accept dynamic system/user prompts rather than duplicating the entire HTTP request handling and retry logic. 
- **Changes:** Modified `_call_gemini` signature; added `extract_holerite_with_gemini` focusing directly on raw JSON output without predefined key mapping.

### Wiring Bulk Import Pipeline
- **Problem/Goal:** The orchestrator pipeline `process_bulk_import.py` needed an entrypoint to trigger Holerite AI extraction and bypass traditional regex steps.
- **Decision:** Introduce the `GEMINI_HOLERITE_ENABLED` feature flag and route the classified Holerite files directly to the new Gemini function instead of waiting for `extract_fields`.
- **Changes:** Added branching logic inside `_process_folder` and established Quality Gate 2.1 for Holerite (demanding presence of `nome_servidor`, `cpf`, and `mes_ano_pagamento`).

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Added `GEMINI_HOLERITE_ENABLED` flag. |
| `domains/aquisicao/services/gemini_config.py` | `modified` | Added Holerite-specific system prompts instructing the precise JSON return shape. |
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Refactored `_call_gemini` to accept dynamic prompts; implemented `extract_holerite_with_gemini`. |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Integrated the new Gemini function into the document loop and set up Quality Gates logic for the AI output. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Generalized the "Sucesso IA" branch to signify it handles any configured AI doc_type, not just Identificacao. |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | Re-branded the Identificacao Gemini excerpt to a general "Inteligência Artificial (Gemini) path" explicitly citing Holerites. |
