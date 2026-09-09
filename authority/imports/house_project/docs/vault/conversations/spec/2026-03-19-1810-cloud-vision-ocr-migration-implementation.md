---
tags: [pipeline, infrastructure, acquisition]
node_type: spec
is_session: true
layer: [application, domain]
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T18:10:05-03:00
expires: 2026-05-18
conversation_id: 216d9a3a-63b8-4f14-aa46-a66bac47d64a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md, specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Created Cloud Vision API implementation plan covering OCR engine swap in ocr_service.py, GCP credential flow via ADC, and test strategy, bridging discovery doc to actionable code changes."
version: 0.1.0
last_updated: 2026-03-19
---

# Cloud Vision OCR Migration — Implementation Planning

**Date:** 2026-03-19 18:10 (UTC-3)
**Tags:** #pipeline #infrastructure #acquisition

## Summary

This session began with a detailed analysis of the current OCR pipeline (`ocr_service.py`, `run_ocr.py`, `process_bulk_import.py`) and its two extraction paths: standard fallback (PyMuPDF → Tesseract) and forced OCR (always Tesseract, used for Identificacao documents). The analysis confirmed Tesseract's fundamental limitations with rotated/photographed ID documents and the planned migration to Google Cloud Vision API.

The session then produced a complete implementation plan for the Cloud Vision migration, placed in `specs/002-ccb-validation-workflow/cloud-vision-migration-implementation.md`. The plan covers: a new `cloud_vision_client.py` module, modifications to `ocr_service.py` (three-tier fallback: PyMuPDF → Cloud Vision → Tesseract), environment-configurable OCR backend via `OCR_BACKEND` env var, and a comprehensive test plan.

Per user feedback, a detailed "GCP Setup & Credential Access" section was added, documenting how credentials flow in each environment (GCP worker VM via ADC, Cloud Run, local dev with Tesseract fallback), what the Terraform already provisions (Vision API, worker SA with `roles/vision.user`, `cloud-platform` scope), and the lazy singleton client bootstrap pattern. The key design decision is that no key files are needed in production — ADC auto-discovers the service account from the VM metadata server.

### OCR Flow Analysis

- **Problem/Goal:** User requested a comprehensive explanation of the current OCR flow and the planned Cloud Vision improvements.
- **Decision:** Documented the two OCR paths (standard fallback vs force OCR), the three-tier classification cascade, and confirmed that callers (`process_bulk_import.py`, `run_ocr.py`) don't need changes since function signatures stay the same.
- **Changes:** No code changes — analysis only.

### Implementation Plan Creation

- **Problem/Goal:** Create a detailed, code-level implementation plan for replacing Tesseract with Cloud Vision API.
- **Decision:** New module `cloud_vision_client.py` (isolated client), modifications to `ocr_service.py` (Cloud Vision as middle tier in fallback cascade), environment-toggleable via `OCR_BACKEND` env var in `bulk_import_config.py`.
- **Changes:** Created `cloud-vision-migration-implementation.md`, updated `cloud-vision-migration-discovery.md` with Connections section and status note, updated `rg-document-extraction-implementation.md` with Cloud Vision reference note.

### GCP Credential Access Section

- **Problem/Goal:** User asked whether the plan covers how to access credentials and set up the GCP service.
- **Decision:** Worker VM uses Application Default Credentials (ADC) — zero config needed. Local dev gracefully degrades to Tesseract. Lazy singleton client avoids import-time failures.
- **Changes:** Added comprehensive "GCP Setup & Credential Access" section to the implementation plan with per-environment credential flow table.

Key outputs:
- `cloud-vision-migration-implementation.md` — full implementation plan
- Updated `cloud-vision-migration-discovery.md` — linked to implementation plan
- Updated `rg-document-extraction-implementation.md` — Cloud Vision note added

## Key Decisions

- **Separate module for Cloud Vision client:** `cloud_vision_client.py` isolates the API client from `ocr_service.py`, making it easy to mock in tests.
- **Three-tier fallback cascade:** PyMuPDF → Cloud Vision → Tesseract. Cloud Vision is preferred for scanned documents; Tesseract is kept as fallback only.
- **Environment-toggleable OCR backend:** `OCR_BACKEND` env var in `bulk_import_config.py` allows switching between `cloud_vision` and `tesseract` without code changes.
- **No caller changes needed:** `process_bulk_import.py` and `run_ocr.py` don't need modification because function signatures in `ocr_service.py` remain unchanged.
- **ADC for credentials:** No key files in production. Worker VM auto-discovers its service account via the GCP metadata server.
- **Lazy singleton client:** `ImageAnnotatorClient` created on first call, not at import time, preventing import-time failures that would break test collection.
- **Implementation plan goes in specs/002, not refactors/infrastructure:** The code changes are domain logic (OCR pipeline), not infrastructure. Infrastructure (Terraform) is already handled.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/cloud-vision-migration-implementation.md` | `created` | Full implementation plan for Cloud Vision migration |
| `specs/002-ccb-validation-workflow/cloud-vision-migration-discovery.md` | `modified` | Added Connections section and status note linking to implementation plan |
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Added [!IMPORTANT] note about Tesseract being replaced by Cloud Vision |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/cloud-vision-migration-implementation.md]] | `implements` | This session produced the implementation plan |
| [[002-ccb-validation-workflow/cloud-vision-migration-discovery.md]] | `refines` | Updated discovery doc with cross-references and promotion status |
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Added Cloud Vision migration notice to the extraction spec |
| [[infrastructure/gcp-infrastructure-migration.md]] | `contextualizes` | Referenced for Terraform provisioning details (Vision API, IAM, worker scaling) |
