---
tags: [bulk-import, dispatch, production-incident, testing, ocr, gemini-extraction]
node_type: audit
is_session: true
layer: application
nature: testing
status: active
created: 2026-04-04
timestamp: 2026-04-04T23:41:00±03:00
expires: 2026-06-03
conversation_id: ts4vw
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: ["architectural-resilience-parallel-gcs-uploads", "feature-direct-file-signed-urls"]
expected_importance: 8
importance_rationale: "Production deployment of bulk-import dispatch retry system uncovered two critical bugs in error handling and Gemini extraction that were fixed and redeployed, plus identified architectural bottlenecks in PDF preparation requiring backlog items."
---

# Bulk Import Dispatch Audit, Production Deploy, and Live Observation

**Date:** 2026-04-04 23:41 (UTC−3)  
**Tags:** #bulk-import #dispatch #production-incident #testing #ocr #gemini-extraction  
**Session ID:** ts4vw

## Summary

This session audited and deployed Phase 1 of the bulk-import dispatch retry system into production, then observed its behavior under live load. The team verified that all 16 critical tests covering preparation, dispatch, error classification, and idempotent folder/document creation were passing—resolving the merge blocker identified in earlier audit work.

**Production Deployment & Verification:**
- Migration file `0047_bulkimport_preparation_checkpoint_and_folder_uniqueness.py` was confirmed untracked and applied cleanly (0.061s). No duplicate DocumentsFolderResult records were found in the current dataset (0 out of 85).
- Cloud SQL was upgraded from `db-g1-small` to `db-custom-1-3840` via Terraform, providing ~100 max connections and 99.95% SLA.
- All GCP deploy jobs passed: build, migrate, deploy-api, deploy-bulk-import-job (parallelism=20 verified), deploy-worker, smoke-test, and verify. A CI test failure in GitHub Actions was unrelated (PostgreSQL service not starting on runner).

**Live Batch Observation & Critical Bugs Discovered:**
During live observation of batch 41 (435 of 1455 folders never reaching terminal state), two critical bugs were identified:

1. **OCR Service Crash (ocr_service.py lines 379/390):** The string sanitization `(m.group(1) or "").strip()` was incorrect, causing _process_folder to crash when extraction failed. This prevented folder status finalization and blocked the completion gate. Fixed and redeployed successfully.

2. **Gemini JSON Truncation (all 6 extraction types):** Gemini was dropping commas in large JSON responses (~3700+ chars) because `responseSchema` was not being passed to the API. This caused failures on ~17 PDFs per batch across all holerite-based extractions. Added `responseSchema` to all 6 Gemini extraction types and redeployed. Batch 42 was cancelled to redeploy with the schema fix.

**Performance Bottleneck Identified:**
The preparation phase bottleneck is sequential extraction and re-upload: the Celery worker downloads the input zip, extracts PDFs to temp storage, then re-uploads each file individually to GCS in sequence. For large batches, this takes minutes before Cloud Run dispatch begins. The signed URL pattern already exists (`BulkImportUploadUrlView`), making per-file direct uploads architecturally straightforward.

**Key Insights:**
- The split between preparation (idempotent folder/document creation) and dispatch (Cloud Run invocation) is the right design, but requires comprehensive error handling and observability.
- The `failure_reason` field in event payloads is essential for analytics and debugging batch failures.
- Production load revealed that retry resilience depends on correctly classifying transient vs. non-transient errors and handling terminal failure marking atomically.

## Epistemic Impact

**Validated:** The preparation/dispatch split architecture is sound for idempotency. Production deployment confirmed the conceptual design is correct.

**Contradicts:** Earlier assumption that sequential re-uploads would be acceptable performance. Live observation showed this is a critical bottleneck requiring architectural intervention.

**Questions:** Should complete the truncated `test_dispatch_cloud_run_failure_propagates` test in test_cloud_run_dispatch.py in this PR or defer to a separate PR?

**Promoted Candidates:**
- Architectural resilience: Parallelize GCS re-uploads with ThreadPoolExecutor (quick win, high impact)
- Feature: Direct per-file signed URL upload (eliminates zip round-trip, long-term fix)

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| ocr_service.py (lines 379, 390) | modified | Fixed string sanitization `(m.group(1) or "").strip()` to prevent folder status finalization crash on extraction failure |
| Gemini extraction methods (6 types) | modified | Added `responseSchema` parameter to all Gemini extraction calls to force valid JSON and prevent comma truncation in large responses |
| 0047_bulkimport_preparation_checkpoint_and_folder_uniqueness.py | applied | Migration applied cleanly in production; verified no duplicate DocumentsFolderResult records |
| Cloud SQL instance (production) | modified | Upgraded from db-g1-small to db-custom-1-3840 (100 max_connections, 99.95% SLA) via Terraform |
| specs/002-ccb-validation-workflow/backlog.md | modified | Added two backlog items: parallel GCS re-uploads (ThreadPoolExecutor), direct per-file signed URL upload |
| Test suite (test_cloud_run_dispatch.py, etc.) | verified | All 16 critical tests passing; no test modifications required in this session |

## Connections

**Validates:**
- `specs/001-bulk-import/bulk-import-dispatch-idempotency.md` — Confirmed the preparation/dispatch split is correct for idempotency.

**Contextualizes:**
- `specs/002-ccb-validation-workflow/backlog.md` — Live observation surfaced two architectural improvements now in backlog.

**Questions:**
- `specs/001-bulk-import/test-audit-bulk-import-dispatch.md` — Complete the truncated `test_dispatch_cloud_run_failure_propagates` test?

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Parallelize GCS re-uploads with ThreadPoolExecutor | Live observation of batch 41 preparation phase | HIGH | Added to backlog |
| Direct per-file signed URL upload (eliminate zip round-trip) | Live observation of sequential re-upload bottleneck | MEDIUM | Added to backlog; architectural extension possible |
| Complete truncated `test_dispatch_cloud_run_failure_propagates` | Test audit | MEDIUM | Deferred; requires decision on same-PR vs. separate-PR approach |

## Open Questions

1. Should the truncated `test_dispatch_cloud_run_failure_propagates` test in test_cloud_run_dispatch.py be completed in this PR or deferred to a follow-up?
2. Should per-file signed URL upload be prioritized before or after ThreadPoolExecutor parallelization?
3. Are there other Gemini extraction points in the codebase not covered by the 6 extraction types updated in this session?
