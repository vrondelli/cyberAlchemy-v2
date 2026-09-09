---
tags: [acquisition, ccb, pipeline, testing]
node_type: test
is_session: true
layer: [domain, application]
nature: [technical, reference]
status: active
created: 2026-03-23
timestamp: 2026-03-23T14:19:00-03:00
expires: 2026-05-22
conversation_id: ad23d04c-aa52-447a-b196-6d57f9f2be43
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Test audit and coverage implementation for Gemini extraction resizing and Holerite classification; CCB_CAP non_critical_fields expanded to include nome/cpf/data_nascimento/entidade_conveniada."
---

# Test Audit, Gemini Coverage, and CCB CAP Fields

**Date:** 2026-03-23 14:19 (UTC-3)
**Tags:** #acquisition #ccb #pipeline #testing

## Summary

This session focused on auditing uncommitted changes in the `Aquisicao` domain, evaluating test coverage for new features, implementing missing tests, and refining extraction configuration. We identified significant gaps in test coverage for the PyMuPDF document resizing logic (`MAX_DIMENSION = 3500`) and the new Holerite filename keyword detection (`HOLERITE` and `HOL_`). An audit report was generated, and unit tests were successfully implemented and verified (1614 passed, 3 skipped). Additionally, the `ccb_cap.json` extraction config was updated to include `nome`, `cpf`, `data_nascimento`, and `entidade_conveniada` as non-critical fields. A temporary exploration of lowering `TEXT_SIMILARITY_THRESHOLD` to 0.80 was reverted back to 0.85.

### Test Audit & Coverage Gaps
- **Problem/Goal:** Uncommitted changes introduced critical downscaling logic for the Gemini API (`_get_page_pixmap`) and Holerite filename matching without corresponding unit tests.
- **Decision:** Conducted a comprehensive audit and implemented the missing tests.
- **Changes:** Created `test_audit_report.md`. Added `test_pdf_to_jpeg_conversion_scales_down_large_dimensions` to `test_gemini_extraction.py` and `test_holerite_filename_pattern` to `test_ocr.py`.

### CCB CAP Extraction Config Update
- **Problem/Goal:** The CCB CAP extraction config needed additional non-critical fields for better data capture.
- **Decision:** Add `nome`, `cpf`, `data_nascimento`, and `entidade_conveniada` to the `non_critical_fields` list.
- **Changes:** Modified `domains/aquisicao/domain/extraction_configs/ccb_cap.json`.

### TEXT_SIMILARITY_THRESHOLD Exploration (Reverted)
- **Problem/Goal:** Recent valid CCB uploads scored ~0.83–0.842, below the 0.85 threshold.
- **Decision:** After temporarily lowering to 0.80, the change was reverted back to 0.85. The issue needs further investigation before adjusting the threshold.
- **Changes:** No net change — threshold remains at 0.85.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_gemini_extraction.py` | `test_pdf_to_jpeg_conversion_scales_down_large_dimensions` | PDF pages are downscaled to `MAX_DIMENSION` (3500px), preventing Gemini API 500 errors on oversized images. |
| `domains/aquisicao/tests/test_ocr.py` | `test_holerite_filename_pattern` | Files containing `HOLERITE` or `HOL_` are correctly routed to the Holerite extraction pipeline. |

**Why these tests matter:** Without resize validation, large scanned documents would silently break Gemini extraction. Without Holerite keyword testing, income verification documents might not be classified during ingestion.

## Key Decisions

- **Test Infrastructure:** Enforce unit testing for PyMuPDF spatial transformations to guarantee API compatibility.
- **Classification Routing:** `HOL_` alongside `HOLERITE` for filename-based Holerite detection.
- **CCB CAP Fields:** `nome`, `cpf`, `data_nascimento`, `entidade_conveniada` marked as non-critical for extraction quality gates.
- **Threshold 0.85 kept:** Lowering to 0.80 was explored but reverted — needs more empirical data.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `modified` | Added 4 non-critical fields: nome, cpf, data_nascimento, entidade_conveniada. |
| `domains/aquisicao/tests/test_gemini_extraction.py` | `modified` | Added test for dimension capping in PDF-to-image conversion. |
| `domains/aquisicao/tests/test_ocr.py` | `modified` | Added test for Holerite filename keyword patterns. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Document Merge feature logic | `test_parallel_bulk_import.py` (skipped tests) | ⚠️ MEDIUM | Unimplemented |
| Investigate CCB uploads scoring 0.83–0.842 | Threshold exploration | ⚠️ MEDIUM | Needs data |
