---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T17:34:30-03:00
expires: 2026-05-20
conversation_id: 38608b58-c61f-4ef3-b868-561cc5abf1ab
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Sanitized PII from all `document_template.document_payload` records and fixed garbled averbacao-dataprev payload via Tesseract re-extraction; also added `_sanitize_template_text()` to `manage_document_template.py` so future registrations auto-sanitize — localized but permanent change to data quality and privacy posture."
version: 0.1.0
last_updated: 2026-03-21
---

# Document Payload Sanitization & PyMuPDF vs Tesseract Analysis

**Date:** 2026-03-21 17:34 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session covered two related topics in the document extraction pipeline: (1) a comparative analysis of PyMuPDF vs Tesseract OCR output for the two CCB templates in the database, quantifying field-by-field differences; and (2) sanitizing the `document_payload.text` stored in all `document_template` records, erasing per-document PII values while preserving structural labels used for Jaccard template matching.

The session started with the user asking to compare what is stored in the CCB templates with what Tesseract would extract. A Python script was run inside the container to produce a complete field-by-field diff across both extraction configs (`ccb_cap.json` and `ccb_consig.json`) showing how PyMuPDF's linear-text output compares to Tesseract's image-scan output, which collapses multi-column layouts into single lines and frequently captures wrong values or neighboring labels.

The user then requested that `document_payload` values be changed to store only variable names instead of real values. This was clarified: the current text should be preserved (since it drives Jaccard matching), but each extracted value should be erased, keeping only the surrounding label. The averbação dataprev template was also identified as having a garbage payload (PyMuPDF failed on an image-based PDF).

A one-shot sanitization script was written and executed, updating all 6 templates. The `manage_document_template.py` use case was updated with a `_sanitize_template_text()` function that runs automatically on `register_template()` and `update_template()` for future templates as well.

### PyMuPDF vs Tesseract CCB Comparison

- **Problem/Goal:** Understand the difference in extraction quality between the two engines for CCB documents, to inform when each should be preferred.
- **Decision:** PyMuPDF is far superior for CCBs (and all structured multi-column PDFs). Tesseract collapses side-by-side fields into single lines, causing critical fields like `cpf`, `nome`, `valor_liberado` to fail or return wrong values. Only `numero_ccb` (in the single-column header) works reliably with both engines.
- **Changes:** Ran a comparative script (not committed) producing field-by-field diff stored in `ccb_pymupdf_vs_tesseract.md`.

### Document Payload Sanitization

- **Problem/Goal:** `document_payload.text` stored raw extracted text including PII (names, CPFs, contract numbers). The user wanted values erased, keeping only structural labels to protect privacy and reduce noise.
- **Decision:** Use each template's own `extraction_config.fields` regexes to locate and erase captured values (group 1) from the stored text, keeping the group 0 prefix (the label). This preserves Jaccard matching efficacy since matching is driven by labels, not values.
- **Changes:**
  - `scripts/sanitize_document_payloads.py` — one-shot script executed inside container; processed all 6 templates
  - `domains/aquisicao/use_cases/manage_document_template.py` — added `_sanitize_template_text()`, wired into `register_template()` and `update_template()`
  - Template id=10 (averbacao-dataprev) re-extracted via `extract_text_force_ocr()` from MinIO before sanitizing

Key outputs:
- `scripts/sanitize_document_payloads.py` — one-shot sanitization + Tesseract re-extraction for garbled template
- `domains/aquisicao/use_cases/manage_document_template.py` — `_sanitize_template_text()` function

## Tests Added/Modified

No tests were added or modified this session. The `test_document_template.py` test suite was run to verify no regressions; 14/14 payload-related tests passed. 7 pre-existing failures (seed data contamination) remain unrelated to this work.

## Key Decisions

- **Payload sanitization strategy:** Use the template's own extraction regexes to erase values, keeping labels — not a separate "field names only" structure. This avoids breaking the Jaccard matching pipeline.
- **Averbação dataprev re-extraction:** Force Tesseract via `extract_text_force_ocr()` rather than relying on `extract_text_with_fallback()`, because the latter defers to PyMuPDF which produces garbage for this image-based PDF.
- **Auto-sanitize on registration:** `_sanitize_template_text()` is now called in `register_template()` and `update_template()` so future templates never store raw PII values.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `scripts/sanitize_document_payloads.py` | created | One-shot script: sanitize all `document_payload.text` records and fix averbacao-dataprev via Tesseract |
| `domains/aquisicao/use_cases/manage_document_template.py` | modified | Added `_sanitize_template_text()` helper; called in `register_template()` and `update_template()` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `brain/38608b58-.../ccb_pymupdf_vs_tesseract.md` | created | Field-by-field comparison artifact (PyMuPDF vs Tesseract, both CCB configs) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `docs/vault/conversations/2026-03-21-1457-fixing-universal-extraction.md` | `derives-from` | Universal extraction session that established the extraction config structure this session sanitizes |
