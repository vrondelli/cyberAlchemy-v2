---
tags: [ccb, spec, models, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T14:33:00-03:00
expires: 2026-05-12
conversation_id: 18a85d89-1de1-4e58-88ee-0827cd34650a
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 6
importance_rationale: "Introduced upfront document version creation pattern, changing the document lifecycle architecture."
---

# Upfront DocumentVersion Creation & Pipeline Spec Alignment

**Date:** 2026-03-13 14:33 (UTC-3)  
**Tags:** #ccb #spec #models #refactor

## Summary

Decided on an upfront DocumentVersion creation strategy: all files in a folder get a `DocumentVersion` row at folder discovery time (`doc_type=None, version_number=1, reason=pending_processing`), and the pipeline updates/cleans up these rows instead of creating them lazily. Removed the `unique_together` constraint on `DocumentVersion` since `version_number=1` for all first versions (it tracks the version of a document, not a position within the folder). Updated the full pipeline flow, counter logic, and gap documentation in the CCB business rules refactor spec. Also identified `BULK_IMPORT_MIN_TEXT_CHARS` as a threshold to remove (replace with simple empty check), and wrote an implementation plan for the `_process_folder` refactor.

## Key Decisions

- **Upfront DocumentVersion creation (Option A):** Create all `DocumentVersion` rows at folder discovery, delete unused ones on failure paths. This was chosen over lazy creation for visibility and simplicity.
- **`unique_together` removed from `DocumentVersion`:** Since `version_number=1` for all first versions and `doc_type` starts as `None`, the old constraint `(folder, doc_type, version_number)` would cause collisions. Duplicate detection is now at the application layer.
- **New reason `pending_processing`:** Initial state for all upfront-created rows before the pipeline processes them.
- **Cleanup rule:** On every failure path (no_template, no_ccb_found, no_text, no_id, no_id_match, duplicates), remaining `reason=pending_processing` rows are deleted immediately. On success (step 6), they are kept as complementary documents.
- **`BULK_IMPORT_MIN_TEXT_CHARS` removal:** Replace the 50-char threshold with a simple empty check across `process_bulk_import.py`, `run_ocr.py`, and `ocr_service.py`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Added upfront creation step 0, changed steps 2–5 from "Create" to "Update matched DocumentVersion", added cleanup rules, updated counter logic comments, expanded Gap 2 with `ocr_service.py`/`bulk_import_config.py` |
| [[aquisicao/repositories/models.py]] | `updates` | Removed `unique_together` from `DocumentVersion.Meta` |
