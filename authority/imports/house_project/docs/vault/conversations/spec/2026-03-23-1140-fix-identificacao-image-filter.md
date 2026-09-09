---
tags: [acquisition, pipeline]
node_type: spec
is_session: true
layer: [application, domain]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T11:40:00-03:00
expires: 2026-05-22
conversation_id: 87b4eae6-c0e2-49e8-94b1-acca409fafaa
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed a bug in process_bulk_import.py where non-PDF files were skipped, enabling image-based Identificacao extraction via Gemini."
---

# Fixing Identificacao Image Extraction Filter

**Date:** 2026-03-23 11:40 (UTC-3)
**Tags:** #acquisition #pipeline

## Summary

This session investigated why a specific Identificacao document (a CNH sent as `.jpg`) was failing to extract any data. The analysis revealed that `process_bulk_import.py` possessed a specific filter blocking non-PDF files (`endswith('.pdf')`) from proceeding into the template matching and extraction engine. 

As a result, image files were being marked with `doc_type=None` and skipped. The code was updated to allow all supported extensions defined in `BULK_IMPORT_SUPPORTED_EXTENSIONS` (which includes `.jpg`, `.png`, etc.). Finally, the fix was successfully verified by reprocessing the document, proving that Gemini can effectively extract Identificacao data directly from the image without a PDF wrapper.

### Root Cause Analysis
- **Problem/Goal:** A CNH `.jpg` document failed to extract and didn't receive a `doc_type`.
- **Decision:** Remove the hardcoded `.pdf` filter in the bulk import pipeline.
- **Changes:** Updated `process_bulk_import.py` to check against `BULK_IMPORT_SUPPORTED_EXTENSIONS` instead of `.pdf`, allowing image files to be parsed, categorized, and forwarded to the Gemini extraction service.

## Key Decisions

- **Extension Support**: Image files must be evaluated in the classification and extraction pipeline directly, instead of being completely skipped by the bulk validation phase.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Replaced `.pdf` suffix filter with `BULK_IMPORT_SUPPORTED_EXTENSIONS` inclusion check. |

