---
tags: [testing, ocr, multi-doc-type, bulk-import]
layer: domain
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T00:00:00-03:00
expires: 2026-05-14
conversation_id: 989f6536-55d5-4927-8729-1f0d55a2005a
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 5
importance_rationale: "Wrote missing tests for multi-document-type scenarios, validating cross-type business rules."
---

# Writing Missing Tests for Multi-Doc-Type Features

**Date:** 2026-03-15
**Tags:** #testing #ocr #multi-doc-type #bulk-import #template-matching

## Summary

Analyzed all uncommitted production code changes, identified 6 test coverage gaps, and wrote 16 new unit and end-to-end tests across 3 test files. Also fixed 14 pre-existing test failures caused by the multi-doc-type refactor (stale mock paths and lowercase doc_type values). Full suite passes: 1195 tests, 0 failures.

Key outputs:
- `test_ocr.py` — 10 new tests for multi-page OCR, DOC_TYPE_KEYWORDS, and run_ocr multi-page config
- `test_document_template.py` — 2 new tests for register_template text payload storage
- `test_parallel_bulk_import.py` — 4 new e2e tests for non-CCB processing and multi-page pipeline, plus 14 mock/assertion fixes

## Conversation Arc

**Started:** User asked to check uncommitted changes and identify any missing or incomplete unit and end-to-end tests.

**Ended:** All 16 new tests written, 14 pre-existing failures fixed, full suite green at 1195 passed. Ready to commit.

## Key Decisions

- **Non-matching regex over mocking extract_fields:** For `test_non_ccb_no_extracted_fields_marks_pending`, used a deliberately non-matching regex in `extraction_config` instead of mocking `extract_fields`, because the locally-imported function reference couldn't be reliably mocked from test scope.
- **Bulk mock path update:** Updated all 15 occurrences of `extract_text_pymupdf` → `extract_text_pymupdf_pages` in existing tests to match the new production code's use of multi-page extraction for keyword classification.
- **doc_type casing alignment:** Changed 8 `doc_type='ccb'` references to `'CCB'` (uppercase) to match the new `DOC_TYPE_KEYWORDS` classification output.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Multi-page OCR unit tests | `extract_text_pymupdf_pages` added in `ocr_service.py` | ✅ Done |
| DOC_TYPE_KEYWORDS regex tests | `template_matching_config.py` new patterns | ✅ Done |
| register_template text payload test | `manage_document_template.py` PDF text extraction | ✅ Done |
| run_ocr_for_version pages config test | `run_ocr.py` multi-page routing | ✅ Done |
| Non-CCB e2e tests | `process_bulk_import.py` Antifraude classification | ✅ Done |
| Multi-page extraction pipeline e2e | `process_bulk_import.py` pages config routing | ✅ Done |

## Backlog Items Added

No new backlog items added during this session.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[aquisicao/tests/test_ocr.py]] | `updates` | Added TestExtractTextPyMuPDFPages, TestDocTypeKeywords, multi-page run_ocr test |
| [[aquisicao/tests/test_document_template.py]] | `updates` | Added register_template text payload tests |
| [[aquisicao/tests/test_parallel_bulk_import.py]] | `updates` | Added non-CCB e2e and multi-page pipeline tests, fixed 14 stale mocks |
|[[002-ccb-validation-workflow/ccb-documents-check-logic-implementation.md]]| `contextualizes` |Source spec for multi-doc-type identification logic|
