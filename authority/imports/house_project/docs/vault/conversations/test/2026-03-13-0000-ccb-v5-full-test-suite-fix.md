---
tags: [ccb, tests, migration, v5, checklist, estoque]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: 64d60aac-a7ac-4064-9d9d-5eebf7867e5d
node_type: test
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 5
importance_rationale: "Fixed full CCB v5 test suite after schema migration, large-scale test refactor."
---

# CCB V5 — Full Test Suite Fix (1093 Green)

**Date:** 2026-03-13
**Tags:** #ccb #tests #migration #v5 #checklist #estoque

## Summary

Brought the entire test suite from ~1052 passing (with 41 failures and 963 errors) to **1093 passed, 0 failures**. Fixed V5 schema test alignment across all aquisição test files, updated `checklist_status.py` and `get_checklist.py` to work without the removed `checklist_item` FK, deleted an auto-generated estoque migration that incorrectly removed a live model, and added implementation status annotations to both spec documents.

Key outputs:
- `ccb-tables-column-refactor.md` — updated with ✅ status annotations, corrected Phase 4 migration reference, removed `unique_together` from DocumentVersion
- `ccb-business-rules-refactor-implementation.md` — implementation status audit table added by user
- `checklist_status.py` — rewrote to use `contract_hash` lookups instead of `checklist_item` FK
- `get_checklist.py` — rewrote subqueries to use `contract_hash`-based version matching

## Conversation Arc

**Started:** The session continued from a prior checkpoint where the CCB V5 schema migration was applied but test failures remained — the immediate task was fixing the OCR test's `extracted_data` being empty due to a `doc_type` case mismatch.

**Ended:** All 1093 tests pass with 0 failures. The user added a detailed implementation status audit to `ccb-business-rules-refactor-implementation.md`, marking each section as ✅ DONE / ❌ NOT IMPLEMENTED / ⚠️ PARTIAL.

## Key Decisions

- **DocumentVersion has no `unique_together`:** Removed the `(folder, doc_type, version_number)` constraint from both the spec and migration because `doc_type` starts as `None` until the pipeline identifies the file, which would break any unique constraint.
- **`compute_completion` uses `contract_hash` lookups:** Since `DocumentVersion.checklist_item` FK was removed, the completion projection now matches versions to checklist items by querying `DocumentVersion.objects.filter(folder__contract_hash=contrato.contract_hash, doc_type=item.doc_type)`.
- **`REASON_NO_TEMPLATE` → `REASON_NO_CCB_FOUND`:** Test assertions updated to match the V5 reason code for "templates exist but no file matched".
- **`REASON_NO_MATCHING` → `REASON_NO_ID_MATCH`:** Last remaining old constant reference fixed in a filter query.
- **Estoque migration 0008 deleted:** The auto-generated `0008_delete_estoquefundoagregagado.py` was incorrectly removing a live model from Django state; deleted to restore 21 estoque tests.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Counter update logic (F() expressions) | `ccb-business-rules-refactor-implementation.md` | ❌ Not implemented |
| Gap 1 — Misplaced files → DocumentVersion rows | Business rule B3 | ❌ Not implemented |
| Gap 2 — Remove BULK_IMPORT_MIN_TEXT_CHARS | Business rules C3/E2 | ❌ Not implemented |
| Gap 3 — Critical field check after OCR | Business rule E4 | ❌ Not implemented |
| Cleanup 1 — Remove DOCUMENT_VERSION_CREATED event | Event catalog | ❌ Not implemented |
| Cleanup 2 — Split same-batch vs DB duplicates | Duplicate handling | ❌ Not implemented |
| Cleanup 3 — Override logic | Operator workflow | ❌ Not implemented |
| Cleanup 4 — Drop DocumentChecklist | Model deprecation | ⚠️ Partial |

## Backlog Items Added

- ⚠️ HIGH — Implement counter update logic with F() expressions
- ⚠️ HIGH — Implement Gap 1-3 business rule changes
- MEDIUM — Remove DOCUMENT_VERSION_CREATED event (Cleanup 1)
- MEDIUM — Split duplicate detection logic (Cleanup 2)
- MEDIUM — Implement override logic (Cleanup 3)
- LOW — Fully drop DocumentChecklist model and dependent code (Cleanup 4)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-tables-column-refactor.md]] | `updates` | Added ✅ status annotations, removed unique_together, updated Phase 4 |
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | User added implementation status audit table |
| [[aquisicao/domain/checklist_status.py]] | `updates` | Rewrote to use contract_hash lookups, V5 constants |
| [[aquisicao/use_cases/get_checklist.py]] | `updates` | Rewrote subqueries for contract_hash-based matching |
| [[aquisicao/tests/test_checklist.py]] | `updates` | Full rewrite with folder/batch fixtures and V5 statuses |
| [[aquisicao/tests/test_registry_management.py]] | `updates` | STATUS_PENDING_UPLOAD → STATUS_PENDENTE |
| [[aquisicao/tests/test_bulk_import.py]] | `updates` | V5 reason constants (NO_CCB_FOUND, NO_ID_MATCH) |
| [[aquisicao/tests/test_ocr.py]] | `updates` | doc_type case fix (ccb → CCB) |
| [[aquisicao/tests/test_document_models.py]] | `updates` | Removed unique_together test, added new field tests |
| [[aquisicao/0021_rename_extracted_id_titulo_documentsfolderresult_contrato_extracted_id_and_more.py]] | `updates` | Removed AlterUniqueTogether for DocumentVersion |
