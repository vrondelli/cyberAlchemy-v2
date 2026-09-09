---
tags: [refactoring, imports, constitution]
layer: architecture
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T00:00:00-03:00
expires: 2026-05-15
conversation_id: 560f4b85-5794-48f7-bc47-f45cf09b4b44
node_type: constitution
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 3
importance_rationale: "Refactored import hoisting, code quality improvement with localized impact."
---

# Import Hoisting & Dead Code Removal Refactor

**Date:** 2026-03-16
**Tags:** #refactoring #imports #constitution #dead-code

## Summary

Reviewed all uncommitted changes against the folder-structure constitution and refactored `process_bulk_import.py` and `manage_document_template.py` to eliminate mid-code imports, remove dead code, and drop unused imports. Zero behavioral changes — all 197 tests pass.

Key outputs:
- `process_bulk_import.py` — 11 mid-code imports hoisted, dead `_extract_text_from_pdf` deleted, unused `extract_text_pymupdf`/`extract_text_pymupdf_pages` removed
- `manage_document_template.py` — 8 mid-code imports hoisted, `DocumentTemplate` moved from `TYPE_CHECKING` to runtime import
- `test_parallel_bulk_import.py` — ~22 mock patch targets updated
- `test_document_template.py` — 2 mock patch targets updated

## Conversation Arc

**Started:** User asked to review uncommitted changes for refactoring opportunities — specifically to avoid mid-code imports, follow the folder constitution, and improve code speed.

**Ended:** All refactoring applied and verified with 197 passing tests. No behavioral changes.

## Key Decisions

- **Celery task imports stay lazy:** `process_bulk_import_task`, `process_folder_task`, `finalize_batch_task` remain inside function bodies to avoid circular import chains (`tasks/ → use_cases/ → tasks/`).
- **C-extension imports stay lazy:** `fitz`, `imagehash`, `PIL.Image` remain inside `_compute_fingerprint()` because they're heavy and may not be installed in all environments.
- **`DocumentTemplate` promoted from `TYPE_CHECKING` to runtime:** It was used at runtime by every function in `manage_document_template.py`, so the `TYPE_CHECKING` guard was incorrect.
- **Mock patch targets follow `from X import Y` binding rule:** When a function is imported with `from X import Y`, mocks must target the importing module's namespace, not the source module.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `_extract_text_from_pdf` still referenced in `ccb-tiered-identification-implementation.md` spec | Stale spec reference | Not updated (spec doc only) |

## Backlog Items Added

- None

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[folder-structure-constitution]]| `contextualizes` |Constitution rules that motivated the import hoisting|
|[[2026-03-15-implementing-missing-tests]]| `updates` |Previous session that added the test coverage being preserved here|
