---
tags: [bulk-import, performance, frontend, backend, testing]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-04-07
timestamp: 2026-04-07T01:45:00-03:00
expires: 2026-06-06
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/refactor/docs/frontend-page-load/page-load-discovery.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Removes extracted_data/ocr_text from a frequently-called list endpoint (~80-90% payload reduction) and aligns frontend preview fetch with the established parallel pattern."
---

# Fix 1: Strip extracted_data/ocr_text from Bulk Import List Response

**Date:** 2026-04-07 01:45 (UTC-3)
**Tags:** #bulk-import #performance #frontend #backend #testing

## Summary

This session implemented Fix 1 from the frontend page load performance discovery (`specs/refactor/docs/frontend-page-load/page-load-discovery.md`). The original discovery identified that `BulkImportDetailView.get()` was serializing `extracted_data` and `ocr_text` for every document in the list response, accounting for ~80-90% of payload size. A previous session (m3q7v series) had attempted the same fix but reverted all changes due to Docker dev environment issues.

This session re-applied Fix 1 end-to-end: the backend change removes `extracted_data` and `ocr_text` from the document dict in `views.py:1035-1045`, while the frontend change rewrites `openPreview` in `BulkImportTab.jsx` to fetch document metadata in parallel with the file blob via `Promise.all`, following the same pattern already established in `PendingDocuments.jsx`.

Three test changes were made: (1) `test_detail_returns_folders_and_documents` was updated to remove `extracted_data` from asserted keys and add negative assertions confirming both `extracted_data` and `ocr_text` are absent from the list response; (2) `test_document_includes_ocr_text_field` was deleted entirely since the field is no longer in the list response; (3) two new frontend tests were added — one verifying the parallel fetch flow and extracted data panel rendering, and one verifying error toast on fetch failure.

All 55 frontend tests passed (12 test files). Backend tests also passed. `BulkImportTab.test.jsx` has a pre-existing hang during module collection (likely the Proxy-based lucide-react mock) — unrelated to these changes. The deploy to GCP was triggered on merge and was in progress at session end.

## Epistemic Impact

- **Validated** the page-load discovery's hypothesis that `extracted_data`/`ocr_text` were the dominant payload bottleneck. Fix 1 status updated to "Done" in the discovery document.
- **Confirmed** the `PendingDocuments.jsx` parallel fetch pattern (`Promise.all` for metadata + blob) as a reusable convention — now used in two places.
- No contradictions found.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/aquisicao/interfaces/views.py` | modified | Removed `extracted_data` and `ocr_text` from `BulkImportDetailView.get()` document dict |
| `domains/documents_validation/tests/test_bulk_import.py` | modified | Updated key assertions, deleted `test_document_includes_ocr_text_field`, added negative assertions |
| `frontend/src/pages/contratos-tabs/BulkImportTab.jsx` | modified | Rewrote `openPreview` with parallel metadata fetch via `Promise.all` |
| `frontend/src/pages/contratos-tabs/__tests__/BulkImportTab.test.jsx` | modified | Added 2 new tests for preview fetch flow and error handling |

## Connections

- **derives-from:** `specs/refactor/docs/frontend-page-load/page-load-discovery.md` §Fix 1
- **derives-from:** `specs/refactor/docs/frontend-page-load/page-load-implementation-plan.md`
- **validates:** `specs/refactor/docs/frontend-page-load/page-load-discovery.md` — payload reduction hypothesis confirmed

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| BulkImportTab.test.jsx pre-existing hang | This session | MEDIUM | Open — unrelated to Fix 1, likely Proxy-based lucide-react mock |
| Fix 2 — Paginate Import/Export with UploadFile | page-load-discovery.md §Fix 2 | HIGH | Pending — needs implementation plan |
| Parallel-fetch pattern extraction | This session | LOW | Consider shared utility if pattern spreads further |
