---
tags: [acquisition, pipeline]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T13:07:02-03:00
expires: 2026-05-22
conversation_id: 9b0c91f0-cfc8-4328-a680-0c0a99e59446
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed an issue where oversize PDF physical geometries caused PyMuPDF to generate 200+ megapixel images, crashing Pillow and causing 500 errors from the Gemini API."
---

# Fix PyMuPDF Dimension Scaling for Gemini API

**Date:** 2026-03-23 13:07 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

This session investigated a bug where the Gemini extraction pipeline failed on a specific CNH (Carteira Nacional de Habilitação) and the fallback legacy regex pipeline triggered, resulting in "Qualidade de imagem insuficiente" and hallucinated extraction data ("NOME: ARIFIRA").

We found that the user-provided CNH was embedded in a PDF that internally defined its physical dimensions as ~41x55 inches. The `_pdf_pages_to_image` function in `gemini_extraction.py` was rendering all PDFs unconditionally at 300 DPI, resulting in an absurdly large 208-megapixel image (around 15 MB in JPEG format) when processed by PyMuPDF (`fitz`). 

Sending this colossal image blob to the Gemini API triggered an HTTP 500 error. Because of this error, our pipeline caught the exception safely and gracefully fell back to the older Regex/Tesseract OCR mechanism. Tesseract choked on the dense security background of the colossal image and hallucinated the text "ARIFIRA" inside the document, leading to an extraction failure that hit the `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` quality gate.

We fixed the logic to dynamically scale the 300 DPI PyMuPDF render matrix, capping the maximum physical dimensions of generated page pixmaps to 3500 pixels. This prevents `DecompressionBomb` errors from Pillow and ensures that Gemini limits are consistently respected regardless of the PDF source geometry.

### Resolution of CNH Extration Failure
- **Problem/Goal:** Understand why a specific CNH failed to extract properly with Gemini and hallucinated the name "ARIFIRA".
- **Decision:** Cap the rendered output dimension in `_pdf_pages_to_image` to avoid memory exhaustion and API limits on oversized PDFs.
- **Changes:** Modified `_pdf_pages_to_image` in `gemini_extraction.py` using a dynamic internal scale calculation `fitz.Matrix(scale, scale)` that adjusts `300 DPI` down if the resulting image dimension exceeds 3500px.

Key outputs:
- `gemini_extraction.py` — Defensive dimension scaling on PyMuPDF rendering

## Key Decisions

- **Image Rendering:** Added a defensive bound (`MAX_DIMENSION = 3500`) to the scale multiplier used when converting PDF pages to images for Gemini ingestion, protecting against intentionally or accidentally massive PDF physical sizes.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Added logic to cap the maximum length to 3500 pixels by adjusting the `fitz.Matrix` scale before rasterizing with `get_pixmap()`. |
