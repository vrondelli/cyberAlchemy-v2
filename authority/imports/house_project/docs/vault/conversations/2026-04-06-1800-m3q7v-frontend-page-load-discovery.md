---
tags: [frontend, performance, discovery, bulk-import, import-export, optimization]
node_type: discovery
is_session: true
layer: application
nature: technical
status: active
veracidade: high
convicção: high
version: 0.2.0
created: 2026-04-06
timestamp: 2026-04-06T18:00:00-03:00
expires: 2026-06-05
conversation_id: m3q7v
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/refactor/docs/frontend-page-load/page-load-discovery.md, specs/refactor/docs/frontend-page-load/page-load-implementation-plan.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: Identified and implemented a critical performance fix (stripping extracted_data from bulk import responses) that unblocked page loading for large batches; surfaced deeper issue of nested documents payload requiring lazy-load refactoring.
---

# Frontend Page Load Performance — Discovery through Implementation

**Date:** 2026-04-06 to 2026-04-07
**Tags:** #frontend #performance #bulk-import #optimization

## Summary

This session consolidated a 5-conversation discovery and implementation cycle focused on fixing frontend page load performance issues on Bulk Import and Import/Export pages. The root cause was identified as oversized API responses: the `BulkImportDetailView` list endpoint was returning `extracted_data` (OCR text) and nested `documents` arrays for every folder, creating multi-megabyte payloads that froze the browser.

The session delivered three discovery phases:

**Phase 1 (Discovery m3q7v):** Investigated the performance bottleneck and proposed three fixes: (1) strip extracted_data from list responses, (2) prefetch with Intersection Observer, (3) refactor ImportExport to query UploadFile directly. A discovery document was written anchoring these decisions.

**Phase 2 (Reviews t4k8n, p2w8j, h7r4q):** Reviewed the discovery with the user, simplified the scope (dropped Intersection Observer prefetch as premature), confirmed design decisions (quantidade_contratos stored on UploadFile at import time, not per-request subquery), and generated an implementation plan. PendingDocuments.jsx was identified as a reference implementation for parallel metadata fetching.

**Phase 3 (Implementation k4v9t):** Executed Fix 1: stripped `extracted_data` and `ocr_text` from `BulkImportDetailView.get()` list response; rewrote `openPreview` to fetch metadata from the detail endpoint using `Promise.all`. Updated backend tests (removed extracted_data assertion, deleted ocr_text test) and verified frontend tests (55/55 pass, excluding pre-existing BulkImportTab.test.jsx hang). Commit 65fe3f5 shipped the change.

**Key Insight Discovered:** Fix 1 alone is insufficient for the largest batch (1455 folders, 6920 documents). Even without extracted_data, the nested `documents` arrays in the list response create a browser-crashing payload. This surfaced the need for Fix 1.5: lazy-load folder documents on expansion via a new `GET /bulk-import/folder/{id}/documents/` endpoint. An attempted implementation revealed that the Docker dev setup volume-mounts only source files — container rebuild was needed, which was deferred.

**Decision Quality:** The discovery process was thorough, alternated between user approval and implementation, and correctly identified the low-hanging fruit (Fix 1) vs. the larger refactoring needed (Fix 1.5). The open questions about quantidade_contratos and cedente filter were resolved; the question about Fix 1.5 was deferred but well-documented.

## Epistemic Impact

- **Validates:** Bulk import performance was a real bottleneck — confirmed by page hang on 1455-folder batch.
- **Questions:** UploadFile schema expansion (quantidade_contratos backfill strategy) and cedente filter support (requires cross-table joins) were flagged but deferred to Fix 2 implementation plan.
- **Promotes to spec:** The `page-load-implementation-plan.md` documents the exact sequence for Fix 1 and is now the reference for ongoing work on Fix 2.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `apps/backend/remessa/views.py` (BulkImportDetailView) | modified | Removed `extracted_data` and `ocr_text` from list response dict to reduce payload size |
| `frontend/src/pages/bulk-import/openPreview.js` | modified | Rewrote to fetch metadata from `/document-versions/{id}/` detail endpoint in parallel with blob fetch using `Promise.all`, matching PendingDocuments.jsx pattern |
| `apps/backend/remessa/tests/test_bulk_import_views.py` | modified | Removed `extracted_data` from assertion in test_detail_returns_folders_and_documents; deleted test_document_includes_ocr_text_field |
| `frontend/src/pages/bulk-import/BulkImportDetailView.test.jsx` | modified | Updated tests to remove extracted_data expectations and add negative assertions |
| `specs/refactor/docs/frontend-page-load/page-load-discovery.md` | created → modified | Discovery document (v0.1.0 → v0.2.0) written iteratively through 3 review cycles; Fix 1 marked as implemented |
| `specs/refactor/docs/frontend-page-load/page-load-implementation-plan.md` | created → modified | Implementation plan (v0.1.0 → v1.0.0) written to detail Fix 1 execution with test updates and stale-guard considerations |

## Connections

- **Derives from:** None — this was an exploratory discovery starting from user-reported performance issue
- **Contextualizes:** The larger backend refactoring needed for Fix 2 (UploadFile schema + lazy-load endpoint)
- **Informs:** Future sessions on Fix 1.5 (folder document lazy-loading) and Fix 2 (ImportExport refactoring)

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Fix 1.5: lazy-load folder documents on expansion | Session 2100 implementation attempt | HIGH | Deferred — requires Docker dev setup understanding and separate implementation plan |
| Add quantidade_contratos to UploadFile schema; backfill existing records | Phase 2 decision; Fix 2 design | MEDIUM | Deferred — part of Fix 2 implementation plan |
| Resolve cedente/cnpj_pagador filter support (needs UploadFile → Remessa → RemessaFilterResult chain) | Phase 2 decision; gateway.js:437 requestedBy usage | MEDIUM | Deferred — requires analysis of current filter usage before engineering effort |
| Fix BulkImportTab.test.jsx hang (pre-existing, likely Proxy-based lucide-react mock) | Phase 3 discovery | LOW | Known issue, not caused by Fix 1 changes |
| Verify remessaApiClient.get() exists before Fix 1 execution | Phase 3 question | LOW | Resolved — openPreview uses .fetch() which works with the detail endpoint |

## Open Questions

- **Fix 1.5 Docker workflow:** Does the frontend dev container volume-mount `src/` only, or does it require full container rebuild on dependency changes?
- **Fix 2 scope:** Should cedente search support be added to the table filter, or is gateway.js client-side search sufficient for now?
- **Batch processing feedback:** Should "Processando" on BulkImportBatch indicate an actively running Cloud Run job? Currently `execution_name` is logged but not stored — would require model field + save-on-dispatch + clear-on-finalization.
