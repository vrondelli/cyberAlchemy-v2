---
tags: [ccb, kit-type, frontend, bulk-import]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T19:50:17-03:00
expires: 2026-05-17
conversation_id: 91318fdf-1431-4aee-add4-0f2196fb0912
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/kittype-with-template-implementation.md]
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 6
importance_rationale: "Implemented OR-logic evaluation for KitType and UI kit marker, changing how document completeness is assessed."
---

# KitType OR-Logic Evaluation & UI Kit Marker

**Date:** 2026-03-18 19:50 (UTC-3)
**Tags:** #ccb #kit-type #frontend #bulk-import

## Summary

This session implemented KitType OR-logic evaluation and added a visual "Kit" marker column to the bulk import folders page. The system now evaluates each folder's classified documents against ALL active KitTypes (OR logic — any one satisfied is enough) and displays the result as a badge in the folders table.

### Kit Matching Engine

- **New file:** `domains/aquisicao/domain/kit_matching.py` — pure domain function `evaluate_kit_completion()` using greedy consumption with template-specific matches prioritized over generic doc_type matches.
- **Placement:** Step 2c in `_process_folder`, right after document classification + template matching (Step 2b), **independent of contrato matching** (Steps 3-4).
- **Scope:** Evaluates folder docs against ALL active KitTypes (via `ProdutoKitConfig.is_active=True`), not filtered by tipo_produto + emissor.

### Key Bug Fixes

1. **Stale data bug:** Initial implementation iterated the in-memory `dvs` list loaded at function start. After Step 2b saved doc_type/template data to DB, the in-memory objects were stale. Fixed by re-querying `DocumentVersion.objects.filter(folder=result)`.
2. **`has_data` timing bug:** Kit evaluation required `has_data=True` (non-empty `extracted_data`), but CCB field extraction happens in Steps 3-4 — AFTER Step 2c. The CCB always had `has_data=False` at evaluation time, causing 3/4 matches. Fixed by removing the `has_data` requirement — kit satisfaction now only requires doc_type classification + template match.
3. **Kit evaluation placement:** Originally placed after contrato match (Step 5); moved to Step 2c because kit evaluation is independent of contrato matching.

### UI Kit Marker (Contratos.jsx)

Added a "Kit" column to the folders results table with badges:
- 🟢 **Green** — Kit name shown when fully satisfied
- 🟡 **Amber** — `X/Y docs` when partially matched
- ⚪ **Gray** — "Sem kit" when no kit configured
- **—** (dash) — Folder hasn't been classified yet

### Model Changes

- `DocumentsFolderResult`: Added `matched_kit_type` FK, `required_docs_count`, `documents_matched` fields, `REASON_NO_KIT_TYPE`, `REASON_KIT_INCOMPLETE` constants (reasons not used as overrides — kept for future use).
- Migration: `0033_add_matched_kit_type_and_no_kit_type_reason.py`

### API Changes

- `BulkImportDetailView.get()`: Added `matched_kit_type_name`, `required_docs_count`, `documents_matched` to folder result serialization.
- Added `select_related('matched_kit_type')` to avoid N+1 queries.

## Tests Added/Modified

| Test file | Tests | Business rule |
|-----------|-------|---------------|
| `test_kit_management.py` | `TestEvaluateKitCompletion` (7 tests) | Full match, missing docs, template-specific matching, OR logic, empty kits, doc without data still matches, legacy string format |

## Key Decisions

- **Kit matching independent of contrato:** Moved from after contrato match to right after classification. A folder's kit status is determined solely by its classified documents, regardless of whether a matching ContratoCCB exists.
- **No `has_data` requirement:** Data extraction happens at different pipeline stages for different doc types (CCB is extracted in Steps 3-4). Kit satisfaction only requires doc presence + template match.
- **Visual marker, not reason override:** Kit status is shown as a separate "Kit" column badge, NOT as a folder reason override. The `reason` field stays unchanged.
- **All active kits, not filtered:** Kit evaluation checks against ALL active KitTypes system-wide, not filtered by tipo_produto + emissor pair.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/kit_matching.py` | `new` | Pure domain function `evaluate_kit_completion()` with greedy consumption |
| `domains/aquisicao/repositories/models.py` | `modified` | Added `matched_kit_type` FK, `REASON_NO_KIT_TYPE`, `REASON_KIT_INCOMPLETE` to `DocumentsFolderResult` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added Step 2c (kit evaluation), removed old Step 5, re-query DVs from DB |
| `domains/aquisicao/interfaces/views.py` | `modified` | Added kit fields to API response, `select_related` optimization |
| `frontend/src/pages/Contratos.jsx` | `modified` | Added "Kit" column with colored badges, imported `Package` icon |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Added `TestEvaluateKitCompletion` (7 tests) |

### Migrations

| Migration | Description |
|-----------|-------------|
| `0033_add_matched_kit_type_and_no_kit_type_reason.py` | Added `matched_kit_type` FK, `required_docs_count`, `documents_matched` to `DocumentsFolderResult` |

## Gaps & Backlog

| Item | Priority | Status |
|------|----------|--------|
| Remove debug logging from Step 2c | HIGH | Pending (temporary `logger.info` calls) |
| Clean up `REASON_NO_KIT_TYPE` / `REASON_KIT_INCOMPLETE` constants | LOW | Kept for potential future use but currently unused |

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[2026-03-18-1830-kittype-template-registration]]| `updates` |Builds on template registration to add OR-logic evaluation|
| [[002-ccb-validation-workflow/kittype-with-template-implementation.md]] | `updates` | Updated to mark OR-logic as IMPLEMENTED |
