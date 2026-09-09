---
tags: [ccb-validation, pipeline, extraction, identificacao]
node_type: implementation-plan
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T12:57:00-03:00
expires: 2026-05-22
conversation_id: 1454a890-e7be-40ed-b0dd-3afff478ca34
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ['specs/002-ccb-validation-workflow/document-merge-implementation.md']
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established the detailed implementation plan to resolve the UniqueViolation bug by aggregating files of the same doc_type within a folder into a single multi-page PDF prior to extraction."
---

# Document Merge Implementation Planning

**Date:** 2026-03-23 12:57 (UTC-3)
**Tags:** #ccb-validation #pipeline #extraction #identificacao

## Summary

This session focused on planning the solution for the `UniqueViolation` bug discovered in Batch 163, where folders containing two identification documents (like RG front and back) crash the processing pipeline. The chosen solution is to aggregate multiple files of the same `doc_type` into a single multi-page PDF before template matching and extraction.

We wrote a detailed implementation plan (`document-merge-implementation.md`) following the project's ontology conventions. The plan outlines the architecture decision (pre-extraction aggregation), the required code changes in `_process_folder` using PyMuPDF (`fitz`), the consolidation of `DocumentVersion` records in the database, and the comprehensive integration tests needed to validate the workflow.

### Pre-Extraction Aggregation Decision
- **Problem/Goal:** Folders with multiple files of the same `doc_type` crash with `UniqueViolation` when saving the second file. Additionally, extracting data from disjoint front/back IDs is suboptimal for context-aware extraction like Gemini.
- **Decision:** Intercept the pipeline between classification (Step 2a) and template matching (Step 2b) to group and merge files sharing the same `doc_type`.
- **Changes:** Designed the logic to use `fitz` to merge images/PDFs into a single PDF, upload the merged result to MinIO, update one survivor `DocumentVersion`, and delete the duplicates.

### Formalizing the Implementation Plan
- **Problem/Goal:** Document the chosen solution clearly so it can be implemented reliably.
- **Decision:** Follow the established `spec` and `implementation-plan` structure used in the vault.
- **Changes:** Drafted `document-merge-implementation.md` with explicit sections for background, architecture decisions, code diff targets, and a detailed test plan covering mixed types and standard success flows.

Key outputs:
- `specs/002-ccb-validation-workflow/document-merge-implementation.md` — The finalized implementation plan for the document merge feature.

## Key Decisions

- **Pre-Extraction Aggregation:** Merge multiple files of the same `doc_type` into one PDF *before* extraction to prevent database crashes and improve OCR/Gemini context.
- **fitz (PyMuPDF) Usage:** Use the existing PyMuPDF library to efficiently compose a new PDF from mixed input types (images and PDFs).
- **Survivor Consolidation:** Keep one `DocumentVersion` record to represent the merged file, updating its paths and sizes, and physically delete the other `DocumentVersion` records from the DB to reflect the new reality.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-merge-implementation.md` | `created` | Created the formal implementation plan for merging documents of the same `doc_type`. |

## Connections

- `validates` [specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md) (Merging documents provides the full context needed for optimal Gemini extraction)
- `resolves` [docs/vault/conversations/2026-03-23-1239-failed-folder-unique-constraint-bug.md](file:///Users/victorboscaro/house_project/docs/vault/conversations/2026-03-23-1239-failed-folder-unique-constraint-bug.md) (This plan addresses the bug detailed in the previous session)
