---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T15:00:00-03:00
expires: 2026-05-25
conversation_id: ~
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 3
importance_rationale: "Fixed silent file duplication bug in `_collect_upload_tasks` where `startswith` caused nested subfolder files to be attached to parent invalid-structure folder results instead of their own direct-parent folder result."
---

# Fix: Invalid-Structure Folders Receive Only Direct-Child DVs

**Date:** 2026-03-26 15:00 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session addressed backlog item `[2026-03-12] Track misplaced files in DocumentVersion for invalid_structure folders`. The discussion started by clarifying the intended behavior: every mixed folder (files + subdirs) at every depth in the ZIP should receive its own `DocumentsFolderResult(reason=invalid_structure)` plus one `DocumentVersion(status=deletado)` per *direct* file — not recursively for all descendants.

During exploration it was confirmed that the `DocumentsFolderResult` creation was already correct — `_find_leaf_folders` iterates all directories at all depths and correctly classifies every mixed folder. What was missing was not the folder records but the scoping of file assignment: `_collect_upload_tasks` used `startswith(folder_path + '/')` to collect files per folder, which recursively matched files in nested subfolders and caused duplicate `DocumentVersion` rows (the same file was associated with both the parent folder result and the child folder result).

The fix was a single-line change replacing the `startswith` predicate with `os.path.dirname(info.filename) == folder_path`, ensuring only direct children are collected per folder. A focused regression test was added to verify the new behavior. The full test suite (248 tests) passed without regression. A pre-existing `whitenoise` missing-from-venv issue was also resolved.

### Root Cause of the Bug

- **Problem/Goal:** Backlog required audit-level `DocumentVersion` rows for files inside invalid-structure folders so operators can see which files were misplaced.
- **Decision:** Each mixed folder at any depth gets its own `DocumentsFolderResult` + one `DocumentVersion` per **direct child** file only. Files in subdirectories belong to their own folder result.
- **Discovery:** The `DocumentsFolderResult` creation was already correct. The bug was in `_collect_upload_tasks`: `startswith(folder_path + '/')` matched descendant files too, so `parent/child/file2.pdf` was assigned to both `parent/` and `parent/child/` folder results.

### Fix

- **Problem/Goal:** Remove the file duplication across nested folder results.
- **Decision:** Replace `startswith` with a direct-parent check.
- **Changes:** In `_collect_upload_tasks`, changed `info.filename.startswith(folder_path + '/')` → `os.path.dirname(info.filename) == folder_path`. This is safe for valid leaf folders too (all their files are direct children by definition).

### Test Added

- **Problem/Goal:** Prevent regression — no test previously caught the duplication.
- **Decision:** Test a two-level ZIP (`parent/file1.pdf` + `parent/child/file2.pdf`) and assert each folder result has exactly one DV with the correct `original_name`.
- **Changes:** `test_nested_invalid_structure_each_folder_gets_only_direct_files` added to `TestPhase2Pipeline`.

### Environment Fix

- `whitenoise` was listed in `requirements.txt` but not installed in the active venv. Installed via `pip install whitenoise`.

Key outputs:
- `domains/documents_validation/use_cases/process_bulk_import.py` — one-line fix in `_collect_upload_tasks`
- `domains/documents_validation/tests/test_parallel_bulk_import.py` — new regression test

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `test_nested_invalid_structure_each_folder_gets_only_direct_files` | Each invalid-structure folder at every depth must receive `DocumentVersion` rows only for its direct child files — nested subfolder files must not be duplicated into ancestor folder results |

**Why these tests matter:** Without this test, a future refactor of the file-collection loop could silently re-introduce duplication, causing operator batch review screens to show the same file under multiple folders and inflating `total_documents` counts on folder results.

## Key Decisions

- **Direct-parent scoping:** Files are assigned to the folder result whose path is their immediate parent (`os.path.dirname`), not any ancestor. This is the semantically correct model and eliminates duplication.
- **Scope of change:** Only `_collect_upload_tasks` needed to change — `_find_leaf_folders` and `_create_folder_results` were already correct.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/use_cases/process_bulk_import.py` | `modified` | `_collect_upload_tasks`: replaced `startswith(folder_path + '/')` with `os.path.dirname(info.filename) == folder_path` |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `modified` | Added `test_nested_invalid_structure_each_folder_gets_only_direct_files` to `TestPhase2Pipeline` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Remaining backlog items for `documents_validation` domain | `specs/002-ccb-validation-workflow/backlog-ccb.md` | Various | See backlog |

## Open Questions
