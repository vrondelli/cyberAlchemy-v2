---
tags: [ccb, acquisition, frontend, models]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T16:34:08-03:00
expires: 2026-05-17
conversation_id: d32e0f55-3ff6-455b-b8d4-18a9cf6445a9
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - "Auto-match when single template exists for a classified doc_type"
  - "Fix load_extraction_configs command to promote critical_fields to model columns"
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 6
importance_rationale: "Added ComprovanteEmprestimo document type and extraction pipeline, new domain entity and processing path."
---

# ComprovanteEmprestimo Doc Type & Extraction Pipeline

**Date:** 2026-03-18 16:34 (UTC-3)
**Tags:** #ccb #acquisition #frontend #models

## Summary

This session added a new document type, `ComprovanteEmprestimo`, to the system end-to-end: backend config, frontend UI, filename/text-based classification, template registration, and OCR field extraction. The document represents a "Comprovante Transferência PIX Enviado" — a loan disbursement proof from Capital Consig. We registered a template (T14) with 12 critical extraction fields covering valor, bank origin/destination details, company info, CNPJ, and timestamp. During testing, we discovered that the template matching step fails for most comprovantes because Jaccard similarity (~0.50–0.57) is far below the 0.85 threshold, and dHash distances are borderline (9–12 vs threshold of 10). We also fixed the `averbacao-sape-template` (T13) which had `critical_fields` and `non_critical_fields` buried inside `extraction_config` JSON but empty on the actual model columns — a gap in the `load_extraction_configs` management command.

### Adding ComprovanteEmprestimo Doc Type

- **Problem/Goal:** The system needed to support a new document type for loan disbursement proofs
- **Decision:** Named `ComprovanteEmprestimo` (user renamed from initial `Comprovante`)
- **Changes:**
  - Added to `SUPPORTED_DOC_TYPES` in `template_matching_config.py`
  - Added to `DOC_TYPES` + `DOC_TYPE_COLORS` (orange) in `Contratos.jsx`
  - Added to `SUPPORTED_DOC_TYPES` in `Cadastros.jsx`

### Extraction Pipeline Integration

- **Problem/Goal:** Enable automated field extraction from comprovante PDFs
- **Decision:** Use `_EXT` as Tier 0 filename keyword, `"Comprovante Transferência PIX Enviado"` as Tier 1 text keyword, 12 critical fields with validated regex patterns
- **Changes:**
  - Added `_EXT` pattern to `FILENAME_KEYWORDS` for Tier 0 classification
  - Added text keyword to `DOC_TYPE_KEYWORDS` for Tier 1 fallback
  - Created `scripts/update_comprovante_emprestimo_config.py` with `extraction_config` (12 regex fields, pages [0,1], field_types for date/number)
  - All 12 regex patterns validated against real PDF text from `700456434-5_EXT.pdf`

### Template Matching Threshold Gap

- **Problem/Goal:** Uploaded comprovante documents were classified correctly but failed template matching → `no_template`
- **Decision:** Identified root cause via distance analysis across 16 documents. Need to implement auto-match for single-template doc types (backlog item)
- **Analysis results:**
  - Jaccard: 0/16 passed (range 0.500–0.569, threshold 0.85)
  - dHash: 11/16 passed (range 9–12, threshold 10)
  - Variable content (names, amounts, CPFs) dilutes shared structural words below Jaccard threshold

### Averbação SAPE Critical Fields Fix

- **Problem/Goal:** `averbacao-sape-template` (T13) had `critical_fields=[]` and `has_ocr_flow=False` despite the JSON config defining them
- **Decision:** The `load_extraction_configs` management command stores `critical_fields`/`non_critical_fields` inside `extraction_config` JSON but never promotes them to model columns — a code gap
- **Changes:** Manually populated T13's model columns from its own `extraction_config` data and set `has_ocr_flow=True`

Key outputs:
- `scripts/update_comprovante_emprestimo_config.py` — config script for ComprovanteEmprestimo extraction
- `template_matching_config.py` — updated with new doc type, filename + text keywords

## Key Decisions

- **Doc type naming:** User chose `ComprovanteEmprestimo` over initial `Comprovante`
- **Tier 0 keyword:** `_EXT` substring in filename for zero-I/O classification
- **Tier 1 keyword:** `"Comprovante Transferência PIX Enviado"` as text fallback
- **All 12 fields are critical:** `timestamp`, `valor`, `descricao`, `empresa_razao_social`, `banco_origem`, `agencia_origem`, `conta_origem`, `nome_destino`, `banco_destino`, `agencia_destino`, `conta_destino`, `cnpj`
- **No non-critical fields** for this doc type
- **Template matching needs architectural fix:** Auto-match when exactly one template exists for a classified doc_type (deferred to backlog)

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Added `ComprovanteEmprestimo` to `SUPPORTED_DOC_TYPES`, `FILENAME_KEYWORDS` (`_EXT`), and `DOC_TYPE_KEYWORDS` (PIX text) |
| `frontend/src/pages/Contratos.jsx` | `modified` | Added `ComprovanteEmprestimo` to `DOC_TYPES` and `DOC_TYPE_COLORS` (orange) |
| `frontend/src/pages/Cadastros.jsx` | `modified` | Added `ComprovanteEmprestimo` to `SUPPORTED_DOC_TYPES` |
| `scripts/update_comprovante_emprestimo_config.py` | `created` | Config script to set extraction_config + critical_fields on T14 |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Auto-match template when single template exists for classified doc_type | Template matching analysis | ⚠️ HIGH | Open — blocks comprovante extraction in production |
| Fix `load_extraction_configs` to promote `critical_fields`/`non_critical_fields` to model columns | T13 sape fix | MEDIUM | Open |
| Consider per-doc-type Jaccard thresholds | Distance analysis | LOW | Open |

## Open Questions

- Should `find_matching_template` auto-return the only template when `doc_type` is already classified and there's exactly one template? This would fix the comprovante matching without touching global thresholds.
- Should Jaccard threshold be configurable per doc_type on the `DocumentTemplate` model (similar to `similarity_threshold` for dHash)?

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[vault/conversations/2026-03-18-1634-comprovante-emprestimo-extraction.md]]| `contextualizes` |This session node|
| [[002-ccb-validation-workflow/business-rules.md]] | `updates` | ComprovanteEmprestimo is a new doc type in the validation pipeline |
