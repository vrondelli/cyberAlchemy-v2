---
tags: [acquisition, pipeline, ccb]
node_type: spec
is_session: true
layer: [domain, application]
nature: [technical, explanatory]
status: active
created: 2026-03-23
timestamp: 2026-03-23T11:55:22-03:00
expires: 2026-05-22
conversation_id: e6c3f7bc-8757-4cee-bff4-a547793a1f20
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: ["specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md"]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed a critical bug where Gemini vision extraction failed to read documents due to PyMuPDF converting PDFs to images at a low 150 DPI resolution."
---

# Fix Gemini DPI Extraction

**Date:** 2026-03-23 11:55 (UTC-3)
**Tags:** #acquisition #pipeline #ccb

## Summary

The session began with an investigation into why a specific Identificacao document (`RG_700301434-2.pdf`) did not have its fields extracted by the Gemini Vision model, despite having a successfully matched template and the text being clearly visible via Tesseract OCR. We discovered that the root cause was the preprocessing step for the Gemini API: the system was using PyMuPDF (`fitz`) to convert the PDF into a JPEG image with a hardcoded `dpi=150` and `quality=85`. This caused small ID cards embedded within A4 pages to become pixelated and unreadable for the LLM. 

By contrast, Tesseract succeeded because its extraction path rendered the PDF pages at 300 DPI into raw pixels. The decision was made to increase the PyMuPDF DPI from 150 to 300 in `gemini_extraction.py` so that Gemini receives a high-resolution image capable of preserving the legibility of small fonts on ID cards. This successfully resolved the issue, and the user also updated the spec to explicitly document the Gemini AI extraction path.

### PyMuPDF Preprocessing Resolution
- **Problem/Goal:** Gemini Vision model was unable to extract fields from an RG document (confidence: `MUITO_BAIXA` and all data fields returning `None`) even though the document text was legible.
- **Decision:** Increase the resolution of the image generated from the PDF before passing it to the Gemini API. 150 DPI was inadequate for small ID cards embedded in large A4 PDFs.
- **Changes:** Modified `_pdf_first_page_to_image` in `domains/aquisicao/services/gemini_extraction.py` to use `dpi=300`. This provides Gemini with a much clearer image without exceeding payload limits.

Key outputs:
- `gemini_extraction.py` — Updated internal PyMuPDF DPI to 300 to fix blurriness.
- `spec-pipeline-identificacao-extracao.md` — User updated the specification to clarify the Gemini/AI path boundaries against the Regex path.

## Key Decisions

- **Gemini Vision Payload:** We must ensure the intermediate image representations of PDF files are rendered at a minimum of 300 DPI to guarantee legibility for generative AI vision models, especially when the target document (like an RG or CNH) does not occupy the full page.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Changed the PyMuPDF `dpi` parameter from `150` to `300` in `_pdf_first_page_to_image`. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | The user updated the specification to outline the exact flow of the "Inteligência Artificial (Gemini) path". |
