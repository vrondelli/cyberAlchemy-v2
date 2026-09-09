---
tags: [ccb, refactor, spec]
layer: architecture
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T10:43:00-03:00
expires: 2026-05-15
conversation_id: 147deb6c-cde3-4b40-8bc7-fcc8b9587cd0
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 4
importance_rationale: "Handled invalid structure processing edge cases, defensive coding with documentation."
---

# Invalid-Structure Folder Processing & Business Rules Documentation

**Date:** 2026-03-16 10:00 (UTC-3)  
**Tags:** #ccb #refactor #spec

## Summary

Extended the bulk import pipeline to process invalid-structure folders (mixed files + subdirs) through the identification cascade instead of skipping them. Updated `business-rules.md` with a comprehensive mermaid pipeline diagram showing parallelism model, corrected `FILENAME_KEYWORDS` documentation, and added notes about text reuse and invalid-structure folder handling. Reviewed and assessed the import-hoisting refactoring plan from a parallel conversation.

## Key Decisions

- **Invalid-structure folders are now processed:** The Celery chord dispatches `process_folder_task` for ALL folders (valid + invalid-structure), not just valid ones. DVs keep `reason=invalid_structure` while being classified and extracted.
- **Text extraction is done once:** `extract_text_with_fallback` is called once per file; the result is cached in-memory and reused for both doc_type classification and field extraction.
- **No `\b` word boundaries in `FILENAME_KEYWORDS`:** `_` is a word character, so `\bCCB\b` would fail on filenames like `CCB_902302079-6.pdf`. Simple `re.I` substring match is intentional.

## Code Changes

| File | Change |
|---|---|
| `process_bulk_import.py` | Chord now dispatches ALL folders (valid + invalid-structure) |
| `process_bulk_import.py` | DVs in invalid folders keep `reason=invalid_structure` |
| `test_parallel_bulk_import.py` | Updated `test_invalid_structure_folder_creates_dvs` and `test_no_valid_folders_calls_finalize_directly` |
| `business-rules.md` | Full mermaid pipeline diagram, parallelism model, text reuse note, corrected `FILENAME_KEYWORDS` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/business-rules.md]] | `updates` | Added pipeline diagram, parallelism notes, text reuse, corrected FILENAME_KEYWORDS |
|[[2026-03-15-1641-tiered-identification-ocr-extraction]]| `updates` |Previous session that built the 3-tier identification system|
|[[2026-03-16-0000-import-hoisting-refactor]]| `validates` |Assessed the import-hoisting plan from parallel conversation|
