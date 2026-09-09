---
tags: [ccb, phase3, migration, status-semantics, dual-hash]
layer: architecture
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T00:00:00-03:00
expires: 2026-05-14
conversation_id: fdc5116d-1cc1-41e9-ae11-5ef551988e1a
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 5
importance_rationale: "Completed phase 3 of CCB refactor with dual-hash migration, architectural milestone."
---

# Phase 3 Completion, Status Fix & Non-CCB Reason

**Date:** 2026-03-15
**Tags:** #phase3 #migration #status-semantics #dual-hash #non-ccb

## Summary

Completed all remaining Phase 3 items (matched_template FK, dual-hash, set matched_template in both pipelines), fixed the `completado → pendente` status transition across both pipelines and all tests, resolved a stale migration causing 1068 test errors, fixed an infinite loading screen caused by unapplied migration 0026, added comprehensive `BulkImportDetailView` API tests, and introduced `REASON_EXTRACTED_NOT_CROSS_CHECKED` for non-CCB documents. All 1199 tests pass.

Key outputs:
- `models.py` — `matched_template` FK, `REASON_EXTRACTED_NOT_CROSS_CHECKED` constant
- `0026_documentversion_matched_template.py` — migration (stale `AlterUniqueTogether` removed)
- `manage_document_template.py` — dual-hash: dHash for PDFs, pHash for images
- `run_ocr.py` — STATUS_PENDENTE, matched_template, non-CCB reason
- `process_bulk_import.py` — STATUS_PENDENTE, matched_template, non-CCB reason, SQL counter
- `Contratos.jsx` — frontend label for new reason
- `test_bulk_import.py` — 6 new `TestBulkImportDetailAPI` tests
- `ccb-refactor-phases.md` — Phase 3 marked ✅ Done

## Conversation Arc

**Started:** User asked to review spec 002 progress and determine next steps; identified Phase 3 had 3 pending items (matched_template FK, dual-hash, set matched_template).

**Ended:** All Phase 3 items complete, `completado → pendente` fix applied, non-CCB documents now get `extracted_not_cross_checked` reason. Phase 5 (Critical Field Check) is ready for implementation next.

## Key Decisions

- **Status semantics:** `STATUS_COMPLETADO` is reserved strictly for post-cross-check validation. All intermediate successful states use `STATUS_PENDENTE`.
- **Dual-hash strategy:** `imagehash.dhash()` for PDFs (layout-heavy), `imagehash.phash()` for images. Existing templates need re-registration after deployment.
- **Counter SQL:** Changed from `status = 'completado'` to `reason IN ('ocr_match', 'extracted_not_cross_checked')` for `docs_matched`.
- **Non-CCB reason:** `extracted_not_cross_checked` distinguishes non-CCB docs (extraction done, no cross-check) from CCB docs (`ocr_match` = extraction + cross-check).
- **Migration cleanup:** Removed stale `AlterUniqueTogether` from migration 0026 that referenced a non-existent `contrato` field on `DocumentsFolderResult`.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Re-register existing DocumentTemplates (fingerprints invalidated by dual-hash) | Dual-hash change | ⚠️ Pending deployment |
| Phase 5: Critical Field Check | `ccb-critical-field-check-implementation.md` | 📋 Spec ready |
| Phase 6: Counter Logic for post-finalization mutations | `ccb-refactor-phases.md` | TODO |

## Backlog Items Added

- ⚠️ HIGH — Re-register all existing DocumentTemplates after deploying dual-hash change
- MEDIUM — Implement Phase 5 Critical Field Check (spec ready at `ccb-critical-field-check-implementation.md`)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-refactor-phases.md]] | `updates` | Phase 3 items marked ✅, summary table updated |
| [[aquisicao/repositories/models.py]] | `updates` | Added matched_template FK, REASON_EXTRACTED_NOT_CROSS_CHECKED |
|[[aquisicao/0026_documentversion_matched_template.py]]| `implements` |Migration for matched_template FK (cleaned up stale AlterUniqueTogether)|
| [[aquisicao/use_cases/manage_document_template.py]] | `updates` | Dual-hash: dHash for PDFs, pHash for images |
| [[aquisicao/use_cases/run_ocr.py]] | `updates` | STATUS_PENDENTE, matched_template, non-CCB reason |
| [[aquisicao/use_cases/process_bulk_import.py]] | `updates` | STATUS_PENDENTE, matched_template, non-CCB reason, SQL counter |
| [[src/pages/Contratos.jsx]] | `updates` | Added REASON_LABELS entry for extracted_not_cross_checked |
| [[aquisicao/tests/test_bulk_import.py]] | `updates` | 6 new TestBulkImportDetailAPI tests |
|[[002-ccb-validation-workflow/ccb-critical-field-check-implementation.md]]| `contextualizes` |Next phase to implement|
