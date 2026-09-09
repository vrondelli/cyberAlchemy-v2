---
tags: [acquisition, pipeline]
node_type: discovery
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:33:00-03:00
expires: 2026-05-18
conversation_id: 595c4109-d81b-4f93-a662-58e632cdc295
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md]
promoted_candidates: [specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md]
expected_importance: 7
importance_rationale: "Unified 'Identificacao' doc_type replacing 'RG' across entire extraction pipeline, fixed Gate 1 data-loss bug, and surfaced fundamental Tesseract limitation requiring Cloud Vision API migration for 50k-folder scale."
version: 0.1.0
last_updated: 2026-03-19
---

# Identificacao Extraction Implementation & OCR Limitation Discovery

**Date:** 2026-03-19 17:33 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

This session implemented the full migration from the `"RG"` document type to a unified `"Identificacao"` type across the extraction pipeline, tests, and specifications. It also discovered a fundamental limitation of Tesseract OCR when processing photographed ID documents (RG, CNH) — rotated images, dark backgrounds, and low resolution produce garbled output that makes data extraction unreliable. The session concluded with a decision to migrate to Google Cloud Vision API for production-scale OCR.

### Identificacao Document Type Migration

- **Problem/Goal:** The system treated all personal IDs as "RG", but CNHs and RNEs were being misclassified or failing extraction because a CNH doesn't extract like an RG.
- **Decision:** Replace `"RG"` with `"Identificacao"` as a unified doc_type. Add `id_subtype` as a non-critical field (defaults to "Nao identificado"). Remove `id_subtype` from `critical_fields`.
- **Changes:**
  - Created `identificacao_generic.json` (replaced `rg_generic.json`)
  - Added CNH pattern to `FILENAME_KEYWORDS`
  - Updated `KitType` docstring
  - Updated 6 test files (50+ replacements of `'RG'` → `'Identificacao'`)

### Gate 1 Data-Loss Bug Fix

- **Problem/Goal:** When OCR text was too short (Gate 1), `extracted_data` was silently discarded before being saved — even successfully extracted fields (like the RG number) were lost.
- **Decision:** Always persist `extracted_data` before evaluating quality gates.
- **Changes:** Refactored `process_bulk_import.py` so `dv.extracted_data = fields` is set before gate evaluation, and all `dv.save()` calls include `extracted_data` in `update_fields`.

### Tesseract Rotation & Quality Limitation

- **Problem/Goal:** Photographed ID documents (CNH rotated ~70-90°, dark backgrounds) produce garbled Tesseract output. Chrome's built-in OCR reads them perfectly but uses a ML-based engine.
- **Decision:** (1) Implemented OSD-based auto-rotation as best-effort. (2) Tested brute-force 4-rotation approach — correctly identified 90° rotation but caused 4x latency (unacceptable for 50k folders/hour target). (3) Reverted brute-force, kept OSD-only. (4) Created discovery doc for Cloud Vision API migration as the real solution.
- **Changes:** Added `_detect_and_correct_rotation()` with OSD-only detection in `ocr_service.py`. Created `cloud-vision-migration-discovery.md`.

### Nome Regex Fix

- **Problem/Goal:** The `nome` regex `(?:Nome|NOME)[:\s]*([^\n]+)` required the name on the same line as "NOME". Tesseract often puts them on separate lines.
- **Decision:** Allow newlines between label and value.
- **Changes:** Updated regex in `identificacao_generic.json` to `(?:Nome|NOME)[:\s\n]*([A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú .']+)`.

Key outputs:
- `identificacao_generic.json` — unified extraction config for all personal ID types
- `cloud-vision-migration-discovery.md` — discovery doc for Tesseract replacement
- `rg-document-extraction-implementation.md` — updated spec removing `id_subtype` from critical fields

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `test_kit_management.py` | 35+ assertions updated | Kit creation with `Identificacao` doc_type passes validation |
| `test_bulk_import.py` | 6 fixtures/assertions | Bulk import correctly uses `Identificacao` in kit configs and DV classification |
| `test_checklist.py` | 4 fixtures/assertions | Checklist generation creates items for `Identificacao` instead of `RG` |
| `test_parallel_bulk_import.py` | `TestRGExtraction` class (4 tests) | Pipeline classifies `RG_*.pdf` and `CNH_*.pdf` files as `Identificacao` via filename keyword |
| `test_document_template.py` | 2 `register_template` calls | Template registration accepts `Identificacao` as valid doc_type |
| `test_registry_management.py` | 1 fixture | Registry management works with `Identificacao` doc_type |

**Why these tests matter:** Without these updates, all kit management, bulk import, and checklist tests would fail because `'RG'` is no longer in `SUPPORTED_DOC_TYPES`. The test suite validates that the entire pipeline works end-to-end with the new unified type.

## Key Decisions

- **Unified doc_type:** All personal IDs (RG, CNH, RNE) are classified as `"Identificacao"` with `id_subtype` for differentiation.
- **`id_subtype` is non-critical:** Defaults to "Nao identificado" — doesn't block processing or gate quality evaluation.
- **Gate 1 always persists data:** `extracted_data` is saved before quality gates, enabling kit matching even on low-quality scans.
- **Brute-force rotation rejected:** 4x latency makes it unviable for 50k-folder production scale. OSD-only kept as best-effort.
- **Cloud Vision API is the path forward:** Tesseract is fundamentally inadequate for photographed ID documents. Cloud Vision handles rotation natively, costs ~$150 for 100k pages, and processes in <2s per document.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/services/ocr_service.py` | `modified` | Added `_detect_and_correct_rotation()` (OSD-only), kept in `extract_text_tesseract` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Fixed Gate 1: `extracted_data` persisted before quality gate evaluation |
| `domains/aquisicao/domain/extraction_configs/identificacao_generic.json` | `created` | Unified extraction config replacing `rg_generic.json` |
| `domains/aquisicao/domain/extraction_configs/rg_generic.json` | `deleted` | Replaced by `identificacao_generic.json` |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Added CNH filename pattern to `FILENAME_KEYWORDS["Identificacao"]` |
| `domains/aquisicao/repositories/models.py` | `modified` | Updated `KitType` docstring |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | 35+ `'RG'` → `'Identificacao'` replacements |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | 6 fixture/assertion updates |
| `domains/aquisicao/tests/test_checklist.py` | `modified` | 4 fixture/assertion updates |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | `TestRGExtraction` template and assertions updated |
| `domains/aquisicao/tests/test_document_template.py` | `modified` | 2 `register_template` calls updated |
| `domains/aquisicao/tests/test_registry_management.py` | `modified` | 1 kit fixture updated |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Removed `id_subtype` from critical_fields in Gate 2 |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md` | `created` | Discovery doc for Tesseract → Cloud Vision API migration |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Cloud Vision API migration | OCR quality limitation | ⚠️ HIGH | Discovery doc created |
| Data migration: register `Identificacao` DocumentTemplate in prod | Identificacao migration | ⚠️ HIGH | Not started |
| Data migration: update `KitType.required_docs` from `"RG"` → `"Identificacao"` | Identificacao migration | ⚠️ HIGH | Not started |
| Tesseract OSD has low confidence on photographed IDs | OCR testing | MEDIUM | Known limitation, Cloud Vision solves |

## Open Questions

- What GCP service account / project should Cloud Vision API use?
- Should Tesseract be kept as a fallback when Cloud Vision is unavailable, or fully replaced?
- For the 50k-folder reprocessing: should we use Cloud Vision's `asyncBatchAnnotate` or individual calls with Celery parallelism?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `implements` | This session implemented the changes specified in the extraction plan |
| [[002-ccb-validation-workflow/cloud-vision-migration-discovery.md]] | `derives-from` | Discovery doc was created based on limitations surfaced during implementation |
