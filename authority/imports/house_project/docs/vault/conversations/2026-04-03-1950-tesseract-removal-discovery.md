---
tags: [pipeline, infrastructure, architecture]
node_type: discovery
is_session: true
layer: application, architecture
nature: technical
status: active
created: 2026-04-03
timestamp: 2026-04-03T19:50:00-03:00
expires: 2026-06-02
conversation_id: r8k3t
# --- Structured fields ---
decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Data-backed justification to remove Tesseract from the extraction pipeline plus admission gate design for dispatch concurrency — two decisions shaping the next implementation sprint."
---

# Tesseract Removal & Dispatch Concurrency Discovery

**Date:** 2026-04-03 19:50 (UTC-3)
**Tags:** #pipeline #infrastructure #architecture

## Summary

The session covered two distinct threads. The first investigated whether the Tesseract OCR fallback could be removed from the document extraction pipeline. Data analysis showed that 671 out of 3,690 extraction events (18%) used Tesseract as the OCR method, but closer examination revealed this usage was redundant: 175 of those were Identificacao documents on the `force_ocr` path, where Gemini already extracts the relevant fields independently. The remaining Tesseract usage was similarly covered by Gemini. The decision was made that Tesseract fallback is fully redundant and can be safely removed, which would also eliminate a source of OOM crashes in Cloud Run tasks (Tesseract loads large images into memory). An open question was flagged about whether Pillow should also be removed or if it's used elsewhere.

The session then shifted to bulk-import dispatch concurrency design. The key decision was to use a strict admission gate (distributed Redis lock + active Cloud Run execution check) before each chunk launch, rather than a polling-only approach which has race windows and can overshoot during concurrent dispatchers. For timeout scenarios, batches would be marked as `pending_dispatch_retry` with a persisted next-attempt time and re-enqueued with bounded backoff/jitter rather than being marked as failed immediately. IAM permissions were verified: `celery-worker-sa` has `roles/run.developer` at the project level (sufficient for dispatch), while `django-api-sa` has no direct Run role bindings — dispatch must run under `celery-worker-sa`.

## Epistemic Impact

- **Belief falsified:** The assumption that Tesseract adds unique extraction coverage was disproven by data — Gemini independently covers all document types where Tesseract was being used.
- **IAM discovery:** `django-api-sa` cannot dispatch Cloud Run Jobs directly. This constrains the dispatch architecture to run under `celery-worker-sa`.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| Discovery doc (Tesseract removal analysis) | created | Data analysis showing 18% Tesseract usage rate, all cases covered by Gemini |

## Connections

- contradicts: any implicit premise that Tesseract is required as a fallback OCR engine

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Tesseract removal | Session decision | HIGH | Open |
| Implement dispatch admission gate with distributed lock | Session decision | HIGH | Open |
| Implement `pending_dispatch_retry` status with bounded backoff | Session decision | HIGH | Open |
| Check if Pillow can also be removed | Session question | LOW | Open |
