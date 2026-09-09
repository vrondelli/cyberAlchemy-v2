---
tags: [ccb, spec, models, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T16:41:23-03:00
expires: 2026-05-14
conversation_id: 832df54f-9afa-45db-8862-57cd3248a0d9
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 6
importance_rationale: "Designed OCR extraction strategy for tiered identification documents, domain-specific technical decision."
---

# Tiered Document Identification & Averbação OCR Extraction

**Date:** 2026-03-15 16:41 (UTC-3)  
**Tags:** #ccb #spec #models #refactor

## Summary

Analyzed Jaccard and dHash distance matrices between `DocumentVersion` and `DocumentTemplate` records. Discovered that template fingerprints were computed with pHash instead of dHash — corrected all three templates (T9, T10, T11). Built a 3-tier document identification architecture (filename keywords → PyMuPDF text → Tesseract OCR) and created a detailed implementation plan. Installed Tesseract + pytesseract, added `ocr_number` field type to `_normalize_value` for OCR artifact cleanup, built 30-field `extraction_config` for Averbação, and added `is_garbled_text`, `extract_text_tesseract`, and `extract_text_with_fallback` functions to `ocr_service.py`.

## Key Decisions

- **3-tier identification cascade**: Tier 0 (filename keywords, zero I/O) → Tier 1 (PyMuPDF text + keywords) → Tier 2 (Tesseract OCR + keywords). Each tier is progressively more expensive and only runs if the previous one failed.
- **dHash fingerprints corrected**: All three template fingerprints were recomputed with the current `_compute_fingerprint` (dHash for PDFs). Previous values were from an older pHash implementation.
- **`ocr_number` field type**: New normalization type in `_normalize_value` that cleans common Tesseract OCR artifacts (O→0, y→comma, stray slashes, spaces) before applying standard number normalization. Used for rate fields in Averbação extraction.
- **Averbação is a scanned PDF**: PyMuPDF produces garbled font glyph codes. Tesseract OCR at 200 DPI produces usable text. The `extraction_config` stores 30 regex patterns designed to match Tesseract output.
- **Single-template auto-match shortcut**: When only one template exists for a doc_type, `find_matching_template` should return it immediately without computing Jaccard or pHash (proposed, not yet implemented).
- **`REASON_EXTRACTED_NOT_CROSS_CHECKED`**: New `DocumentVersion` reason constant added by the user for non-CCB documents that have been extracted but not yet cross-checked.

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[002-ccb-validation-workflow/ccb-tiered-identification-implementation.md]]| `implements` |Detailed implementation plan for 3-tier identification + Tesseract fallback|
| [[002-ccb-validation-workflow/business-rules.md]] | `updates` | Will be updated with 3-tier cascade diagram (pending implementation) |
| [[aquisicao/services/ocr_service.py]] | `updates` | Added `ocr_number` field type, `is_garbled_text`, `extract_text_tesseract`, `extract_text_with_fallback` |
| [[aquisicao/repositories/models.py]] | `updates` | Added `REASON_EXTRACTED_NOT_CROSS_CHECKED` constant |
| [[compute_distance_matrices.py]] | `updates` | Used for Jaccard/dHash distance analysis |
|[[update_averbacao_config.py]]| `implements` |Script to update Averbação template extraction_config in DB|
