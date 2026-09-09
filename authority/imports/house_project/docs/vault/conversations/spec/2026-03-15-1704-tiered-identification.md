---
tags: [ccb, refactor, spec]
layer: architecture
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T17:04:53-03:00
expires: 2026-05-14
conversation_id: 147deb6c-cde3-4b40-8bc7-fcc8b9587cd0
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 5
importance_rationale: "Continued tiered identification design, refining document classification hierarchy."
---

# Tiered Document Identification + Tesseract OCR

**Date:** 2026-03-15 17:04 (UTC-3)
**Tags:** #ccb #refactor #spec

## Summary

Implemented the 3-tier document identification cascade (filename keywords → PyMuPDF text → Tesseract OCR fallback) per the `ccb-tiered-identification-implementation.md` spec. Installed Tesseract OCR in Docker (300 DPI, Portuguese). Added auto-match shortcut for single-template doc types. Fixed OCR number normalization for scanned PDFs (slash→7, semicolon→comma, strip parentheses). All 1217 tests pass.

## Key Decisions

- `FILENAME_KEYWORDS` uses simple substring match (no `\b` word boundary) because `_` is a word character
- Tesseract renders at 300 DPI (not 200) — empirically best quality for this document corpus
- `/` → `7` heuristic in `ocr_number` normalization — Tesseract consistently misreads `7` as `/` in the portal fonts
- Auto-match shortcut: single template for a doc_type skips Jaccard/pHash entirely
- `extract_text_with_fallback` returns `(text, used_ocr)` tuple for downstream awareness

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/business-rules.md]] | `updates` | Rewritten with 3-tier cascade diagram, OCR normalization table |
| [[002-ccb-validation-workflow/ccb-tiered-identification-implementation.md]] | `implements` | Full implementation of the spec |
| [[aquisicao/services/ocr_service.py]] | `updates` | Added 3 new functions + enhanced ocr_number normalization |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | 3-tier classification cascade in _process_folder |
| [[Dockerfile]] | `updates` | Added tesseract-ocr + tesseract-ocr-por |
| [[requirements.txt]] | `updates` | Added pytesseract>=0.3.10 |
