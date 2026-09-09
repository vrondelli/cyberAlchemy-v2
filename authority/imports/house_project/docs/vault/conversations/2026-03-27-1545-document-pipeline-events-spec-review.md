---
tags: [event-system, ccb, pipeline, documents]
node_type: implementation-plan
is_session: true
layer: architecture, domain
nature: technical, procedural
status: active
created: 2026-03-27
timestamp: 2026-03-27T15:45:00-03:00
expires: 2026-05-26
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md, specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Produced implementation-ready specs for the document pipeline observability layer — a foundational audit capability for the CCB bulk import workflow that was previously blind to most pipeline steps."
---

# Document Pipeline Events — Spec Review & Refinement

**Date:** 2026-03-27 15:45 (UTC-3)
**Tags:** #event-system #ccb #pipeline #documents

## Summary

This session reviewed and iteratively refined two specification documents for the document pipeline events system: `document-pipeline-events-discovery.md` and `document-pipeline-events-implementation.md`. The specs define a new observability layer for the CCB bulk import pipeline, replacing fragmented legacy events with a consistent "one event per pipeline step" pattern in the `EventLogEntities` table. The session took the specs from draft to implementation-ready through multiple rounds of domain corrections, architectural simplifications, and codebase verification.

### Domain corrections

The user corrected several domain-specific assumptions. `entity_domain` must be `documents_validation` (not `aquisicao`) for all events. `object_type` for kit evaluation is `documents_folder` (not `folder` or `document`). These corrections were applied consistently across both documents, including enum string prefixes (e.g., `documents_validation.extraction_result`).

### Event consolidation: from 9 to 7 events

The original spec proposed 9 events. Through discussion, we consolidated: `DOCUMENT_OCR_RESULT` and `DOCUMENT_TEMPLATE_EVALUATED` were merged into a single `DOCUMENT_EXTRACTION_RESULT` event. The rationale was that by the time `_step_extract_and_match` completes, all OCR + classification + template matching + field extraction data is available — splitting it across two events created an artificial boundary. `DOCUMENT_VIEWED` was removed entirely because a backend API call doesn't reliably indicate the user actually viewed the document; this was moved to backlog as a frontend concern. The final 7 events are: EXTRACTION_RESULT, MERGE_RESULT, CRITICAL_FIELDS_EVALUATED, NON_CRITICAL_FIELDS_EVALUATED, CONTRATO_EVALUATED, KIT_EVALUATED, CROSS_CHECK_RESULT.

### Emission point for failed DVs

Codebase research revealed that `_step_extract_and_match` only receives successfully classified DVs — failed DVs (download error, no text, unclassifiable) are finalized in `_step_classify_dvs` via `continue` and never added to `classified_files`. The spec originally claimed all DVs would emit from `_step_extract_and_match`, which was incorrect. The user chose Option A: emit `DOCUMENT_EXTRACTION_RESULT` from two points — `_step_classify_dvs` for failures (with `success=False` and template fields as null), and `_step_extract_and_match` for successes (with full data).

### Critical/non-critical field events — one per DV per run

The original spec placed these events inside 3 extraction sub-step functions (`_step_extract_matched_ccb`, `_step_extract_matched_non_ccb`, `_step_extract_unmatched`), which would have meant 6 emission points and code duplication. The user clarified the intent: 1 event per DV per pipeline run, emitted at the end of the per-DV loop in `_step_extract_and_match`.

### Catalog cleanup: delete, don't deprecate

The user decided to delete the 5 old catalog entries outright rather than marking them with `[DEPRECATED]` prefixes. The enum values stay in `EventType` (Django requires them for existing DB rows) but the CATALOG entries are removed. The validation test should check that every **active** EventType has a catalog entry, excluding the 5 removed ones.

### Discovery: run_ocr.py is dead code, reusable for requeue

Research revealed `run_ocr_task` (Celery) is defined and exported but never enqueued anywhere. A comment in `bulk_import_tasks.py` claiming `_process_folder()` enqueues it is outdated — a Phase 2 refactor made the pipeline run synchronously. The function is structured for single-DV reprocessing with retry logic (`DOCUMENT_OCR_ERROR` on each retry), making it a natural starting point for a future requeue service. This was added to the spec's backlog.

### OCR method field simplified

The `force_ocr` method value was removed from `DOCUMENT_EXTRACTION_RESULT`. At the text extraction level, the actual methods are PyMuPDF and Tesseract — `extract_text_force_ocr` simply always runs Tesseract. Gemini is used later for field extraction (in `gemini_extraction.py`), not text extraction. The field was renamed from `method` to `ocr_method` and simplified to `'pymupdf'` | `'tesseract'` | `None`.

## Epistemic Impact

- **Validated and sharpened** Rule 12 of `[[event-system-constitution]]` — the two-table split is not "macro vs granular" but two-dimensional (state-changing vs observational, batch-level vs entity-level). The rule's intent is correct but its code example has errors (`entity_type` vs `object_type`, missing `entity_domain`) and the `bulk_create`-only prohibition is too broad. Constitution amendment is part of Phase 1 implementation.
- **Spec drift fixed** — `run_ocr.py` and `run_ocr_task` were implicitly assumed to be active code paths but are dead code since a Phase 2 refactor.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `specs/002-ccb-validation-workflow/document-pipeline-events-discovery.md` | Modified | Corrected entity_domain/object_type; consolidated 9→7 events; fixed emission points for EXTRACTION_RESULT; simplified ocr_method; changed deprecation to deletion; added backlog items; added event directory |
| `specs/002-ccb-validation-workflow/document-pipeline-events-implementation.md` | Modified | Aligned with discovery changes; updated Step 2.1 for dual emission points; removed TEMPLATE_EVALUATED step; updated counts, dependency graph, and files summary |

## Connections

| Document | Type | Description |
|---|---|---|
| [[event-system-constitution]] | `questions` | Rule 12 code example has errors and bulk_create guidance is too broad — amendment is part of this spec's Phase 1 |
| [[document-pipeline-events-discovery]] | `contextualizes` | This session refined the discovery to implementation-ready state |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Constitution amendment — Rule 12 corrections | Discovery Section 6 / Implementation Step 1.5 | High | Pending (pre-Phase 2 blocker) |
| Dashboard/admin query migration for deleted event types | Implementation Step 3.3 | Medium | Pending (post-Phase 2) |
| Requeue/reprocess service using `run_ocr.py` skeleton | Discovery backlog | Medium | Backlog |
| `DOCUMENT_VIEWED` frontend event | Discovery backlog | Low | Backlog |
