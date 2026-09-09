---
tags: [acquisition, pipeline, extraction]
node_type: test
is_session: true
layer:[[domain, application]]
nature: [technical]
status: active
created: 2026-03-24
timestamp: 2026-03-24T00:57:00-03:00
expires: 2026-05-23
conversation_id: c60240f6-2968-4004-8a2f-2beae13a81c2
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed a critical discrepancy between Gemini's normalized output for Identificacao documents (id_documento) and legacy templates requiring (rg_numero), ensuring documents pass the validation quality gate accurately."
---

# Fix Gemini Mapping for Identificacao Extraction

**Date:** 2026-03-24 00:57 (UTC-3)
**Tags:** #acquisition #pipeline #extraction

## Summary

This session focused on investigating a bug where an IDENTIFICACAO document was successfully extracted via the newly integrated Gemini model, visibly displaying the extracted data (CPF, NOME, ID DOCUMENTO), but still failing the pipeline's Quality Gate with the reason `REASON_NO_TEMPLATE` ("Nenhum template cadastrado para este tipo"). 

Through investigation, it was discovered that the document was being evaluated against a legacy regex template from the database which defined `rg_numero` as a `critical_field`. Since the Gemini normalizer standardizes the ID number key to `id_documento` (instead of the legacy `rg_numero` name), the `all_present` check in the `_process_folder` validation gate was evaluating to `False`. 

To resolve this issue while maintaining backwards compatibility without touching the legacy database templates, the `gemini_extraction.py` normalizer was updated to mirror the value of `id_documento` into the `rg_numero` field. This ensures that the extraction dictionary satisfies critical field checks regardless of whether the target template uses modern or legacy naming conventions.

### Mapping Missing Critical Fields for Gemini Extraction
- **Problem/Goal:** IDENTIFICACAO documents processed by Gemini were being rejected by the quality gate (`REASON_NO_TEMPLATE`) due to missing critical fields, despite having successfully extracted the data visually.
- **Decision:** Mirror the `id_documento` output backwards into `rg_numero` directly within the Gemini normalizer layer, rather than conditionally converting names downstream.
- **Changes:** Updated `_normalize_fields` in `domains/aquisicao/services/gemini_extraction.py` to copy `id_documento` into `rg_numero` if it is present. Updated test cases in `test_parallel_bulk_import.py` to accurately mock the `_try_gemini_extraction` layer so legacy regex paths can still be tested without crashing PyMuPDF on dummy PDF byte objects.

Key outputs:
- `gemini_extraction.py` — Backwards compatibility mirroring for `id_documento` -> `rg_numero` added.
- `test_parallel_bulk_import.py` — Patched Gemini extraction out for legacy tests so PyMuPDF doesn't crash on mocked files.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_rg_extraction_stores_fields` | Verifies that the extraction pipeline properly parses and stores RG documents running through the system, ensuring the extracted fields and status correspond exactly to business expectations. |

**Why these tests matter:** Without accurately determining that a document successfully extracted critical fields, perfectly valid ID documents would be discarded by the CCB bulk import pipeline, resulting in massive manual operational overhead. These tests confirm the quality gate is operating reliably.

## Key Decisions

- **Mapping Resolution:** Decide to mirror `id_documento` into `rg_numero` at the Gemini unification layer (`_normalize_fields`) to satisfy legacy DB templates generically, rather than injecting complex fallback logic deep in the quality gate resolver (`_resolve_critical_fields`).
- **Test Integrity:** Chosen to mock out `_try_gemini_extraction` inside the legacy RG tests to ensure we continue asserting the correct functioning of the PyMuPDF/Tesseract/Regex fallback pipeline, since these tests were fundamentally designed to test that older path before Gemini was added.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Added backwards compatibility mirroring for `id_documento` to `rg_numero` in `_normalize_fields`. |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Mocked out `_try_gemini_extraction` in `test_rg_extraction_stores_fields` to prevent PyMuPDF crashes on dummy data and test the regex layer. |
