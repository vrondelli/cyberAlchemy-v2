---
tags: [pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T12:00:00-03:00
expires: 2026-05-22
conversation_id: 2b7cc0ce-a184-4d3d-9c06-8159b1a43247
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Improved Gemini extraction robustness for multi-page and multi-document ID scans, plus expanded Holerite prompt with 21 new secondary fields — directly impacts document processing quality for all future bulk imports."
version: 0.1.0
last_updated: 2026-03-23
---

# Gemini Extraction Robustness & Holerite Prompt Expansion

**Date:** 2026-03-23 12:00 (UTC-3)
**Tags:** #pipeline #acquisition

## Summary

This session focused on understanding and improving the Gemini-based document extraction pipeline for the CCB bulk import workflow. It spanned four main areas: understanding the empresa_geradora inference timing, expanding the Holerite extraction prompt, measuring template Jaccard similarities, and fixing two problematic Identificacao documents that were failing extraction.

The most impactful outcome was resolving two distinct extraction failure modes: (1) multi-document images where Gemini couldn't identify the primary document, and (2) multi-page PDFs where the function `_pdf_first_page_to_image` only sent page 1 to Gemini, missing critical data on page 2 (the back of the RG). Both issues were fixed by updating the Gemini prompt with multi-doc/damaged-doc guidelines and refactoring the PDF-to-image conversion to render all pages.

### Empresa Geradora Inference Timing
- **Problem/Goal:** Understand at which point in the CCB upload pipeline the `infer_empresa` function runs.
- **Decision:** Confirmed the flow: classification → template match → `infer_empresa` → extraction (Gemini or regex). The empresa is inferred before extraction starts and saved to `DocumentVersion.empresa_geradora`.
- **Changes:** No code changes — informational discussion.

### Holerite Prompt Expansion
- **Problem/Goal:** The Gemini Holerite extraction prompt only captured 3 critical fields + Rendimentos/Descontos. The user identified 21 additional fields visible (in blue) on the payslip document that should be extracted.
- **Decision:** Add all non-redacted fields from the payslip header as secondary extraction fields.
- **Changes:** Updated `GEMINI_HOLERITE_SYSTEM_PROMPT` in `gemini_config.py` with 21 new fields (sigla_upag, uf_upag, reg_juridico, situacao_funcional, sigla_uorg, uf_uorg, mat_siape, ident_unica, cargo_emprego, classe, ref_padrao_nivel, funcao, dependente_sf, dependente_ir, ats_percentagem, banco/agencia/conta for salary and other operations).

### Holerite Template Distance Measurement
- **Problem/Goal:** Measure the Jaccard similarity distance between Holerite DocumentVersions and the registered Holerite template.
- **Decision:** Results showed similarities ranging from 0.37 to 0.68, indicating significant text variation across Holerites — well below the `TEXT_SIMILARITY_THRESHOLD` used for template matching.
- **Changes:** Created and ran a diagnostic script (`measure_holerite.py`).

### Fixing Gemini Extraction for Problematic RGs
- **Problem/Goal:** Two Identificacao documents (`RG_701004483-7.jpg` and `RG_700301434-2.pdf`) were failing to extract data via Gemini.
- **Decision:** Root causes identified and fixed:
  1. **RG_701004483-7.jpg** (multi-doc image): Gemini couldn't identify the primary document among two overlapping IDs. Fixed by adding "Multiple Documents" and "full_name Priority" guidelines to the system prompt.
  2. **RG_700301434-2.pdf** (2-page scan): `_pdf_first_page_to_image` only sent page 0 (fingerprint side) to Gemini — the actual data was on page 1 (verso). Fixed by refactoring to `_pdf_pages_to_image` which renders all pages and stitches them vertically.
- **Changes:**
  - `gemini_config.py`: Added multi-doc, damaged-doc, and full_name priority guidelines to the system prompt.
  - `gemini_extraction.py`: Renamed `_pdf_first_page_to_image` → `_pdf_pages_to_image`, now renders all pages (up to 3) into a single stitched JPEG.
  - `test_gemini_extraction.py`: Updated import references to match renamed function.

Key outputs:
- `gemini_config.py` — Expanded Holerite prompt + improved ID extraction prompt
- `gemini_extraction.py` — Multi-page PDF support for Gemini
- `measure_holerite.py` — Diagnostic script for template distances

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_gemini_extraction.py` | `test_pdf_to_jpeg_conversion` (updated import) | PDF-to-JPEG conversion produces valid output for Gemini consumption |

**Why these tests matter:** The PDF-to-JPEG conversion is a critical step in the Gemini extraction pipeline. If the conversion fails or produces a blank image, Gemini cannot extract any data from scanned documents.

## Key Decisions

- **Multi-page PDF rendering:** Changed from single-page to all-pages rendering for Gemini extraction. This ensures both front and back of scanned ID documents are visible to Gemini.
- **Prompt engineering for edge cases:** Added explicit instructions for multi-document images and damaged documents, prioritizing partial extraction over empty results.
- **Holerite field expansion:** All non-redacted header fields from the payslip are now extracted as secondary fields by Gemini.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/services/gemini_config.py` | `modified` | Added 21 new secondary fields to Holerite prompt. Added multi-doc, damaged-doc, and full_name priority guidelines to ID prompt. |
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Renamed `_pdf_first_page_to_image` → `_pdf_pages_to_image`. Now renders all PDF pages (up to 3) and stitches vertically into single JPEG for Gemini. |
| `domains/aquisicao/tests/test_gemini_extraction.py` | `modified` | Updated import references from `_pdf_first_page_to_image` to `_pdf_pages_to_image`. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `measure_holerite.py` | `created` | Diagnostic script to measure Jaccard similarity between Holerite DVs and templates. |
| `test_gemini_rg.py` | `created` | Diagnostic script to test raw Gemini extraction on problematic RG documents. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Holerite template text distance too low (0.37–0.68) for Jaccard matching | Distance measurement | MEDIUM | Open — Holerites may need empresa-based matching or a different threshold |
| Gemini fallback when confidence is MUITO_BAIXA/NENHUMA | RG_700301434-2.pdf investigation | LOW | Open — when Gemini fails, Tesseract data could be used as fallback |
| `_pdf_first_page_to_image` still exists in management command `extract_id_gemini.py` | Rename refactor | LOW | Open — should be updated to `_pdf_pages_to_image` or share the service function |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `contextualizes` | The upload flow diagram documents the pipeline where these changes apply |
| `specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md` | `refines` | This session refines the Gemini extraction implementation with multi-page and multi-doc support |
