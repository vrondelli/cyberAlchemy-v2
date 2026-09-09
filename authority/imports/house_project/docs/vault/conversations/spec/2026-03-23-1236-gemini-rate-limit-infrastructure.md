---
tags: [infrastructure, pipeline, acquisition]
node_type: spec
is_session: true
layer: [architecture, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T12:36:00-03:00
expires: 2026-05-22
conversation_id: 09ee127d-30e7-42bd-8b0f-64473ff74d66
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/terraform-decisions.md
  - refactors/infrastructure/gcp-architecture-reference.md
  - refactors/infrastructure/gcp-infrastructure-migration.tf
  - refactors/infrastructure/terraform.tfvars.example
  - specs/002-ccb-validation-workflow/backlog-ccb.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established the three-tier AI extraction strategy (Gemini → Vision → Tesseract) as the canonical architecture, updated all infrastructure planning artifacts with revised IAM, costs, and rate limiting, directly shaping the GCP migration."
version: 0.1.0
last_updated: 2026-03-23
---

# Gemini Rate Limiting & Infrastructure Migration Updates

**Date:** 2026-03-23 12:36 (UTC-3)
**Tags:** #infrastructure #pipeline #acquisition

## Summary

This session addressed performance issues with the Gemini 2.5 Flash extraction pipeline and updated all GCP infrastructure planning documents to reflect the shift from Cloud Vision as primary extractor to Gemini as primary with Vision as fallback. The session resolved worker slowness caused by Gemini API rate limits, implemented Celery-level rate limiting, documented a three-tier extraction strategy across all infrastructure artifacts, and added multi-page PDF stitching for identification documents.

The key architectural outcome is the formalization of a **three-tier extraction cascade**: Gemini 2.5 Flash (primary structured JSON extraction), Cloud Vision API (fast fallback when Gemini fails), and Tesseract + Regex (last resort). This cascade was documented in `terraform-decisions.md`, reflected in the Mermaid architecture diagram in `gcp-architecture-reference.md`, and implemented in the Terraform HCL with new secrets, APIs, and IAM bindings.

### Gemini Rate Limiting

- **Problem/Goal:** The Celery workers were processing folders too slowly. Investigation revealed that Gemini API calls (10–90s each) were being throttled with 429 errors when too many concurrent requests hit the API.
- **Decision:** Use Celery's native `rate_limit='10/m'` on `process_folder_task` instead of purchasing GCP Provisioned Throughput. This is cheaper, simpler, and paradoxically faster (zero time wasted on exponential backoff retries).
- **Changes:** Added `rate_limit='10/m'` to `process_folder_task` decorator in `bulk_import_tasks.py`.

### Infrastructure Migration Updates for Gemini

- **Problem/Goal:** All infrastructure planning documents (`terraform-decisions.md`, `gcp-architecture-reference.md`, `.tf` file) were written assuming Cloud Vision as the primary OCR engine. With Gemini now primary, the documents needed comprehensive updates.
- **Decision:** Update all infrastructure artifacts to reflect the three-tier strategy with revised cost estimates, IAM roles, and secret management.
- **Changes:**
  - `terraform-decisions.md`: Replaced "Cloud Vision API" section with "AI Extraction APIs — Gemini 2.5 Flash + Cloud Vision". Added rate_limit rationale, 3-tier cost comparison table, new `gemini-api-key` secret. Reduced batch burst sizing from 4 VMs to 2 VMs.
  - `gcp-architecture-reference.md`: Updated Mermaid diagram with Gemini node, services table (5 secrets, Gemini primary, Vision fallback), IAM table.
  - `gcp-infrastructure-migration.tf`: Added `gemini_api_key` variable, `generativelanguage.googleapis.com` API, Secret Manager secret + IAM bindings, startup script injection, updated comments.
  - `terraform.tfvars.example`: Added `gemini_api_key = "CHANGE_ME"` to required variables.

### Google Vision Fallback Backlog

- **Problem/Goal:** Cloud Vision should be preserved as a fallback when Gemini fails, but implementation is deferred until GCP migration.
- **Decision:** Add to spec 002 backlog as a MEDIUM priority item for post-migration implementation.
- **Changes:** Added backlog item with the three-tier cascade table, affected files, and prerequisite note.

### Multi-Page PDF Stitching

- **Problem/Goal:** ID documents scanned as multi-page PDFs (front/back) were only sending the first page to Gemini, losing the back side.
- **Decision:** Render up to 3 pages at 300 DPI and stitch them vertically into a single JPEG for Gemini processing.
- **Changes:** Renamed `_pdf_first_page_to_image` → `_pdf_pages_to_image` in `gemini_extraction.py`. Added vertical image stitching with PIL.

Key outputs:
- `bulk_import_tasks.py` — rate_limit='10/m' on `process_folder_task`
- `gemini_extraction.py` — multi-page PDF stitching, list-wrapped JSON handling
- `terraform-decisions.md` — three-tier extraction strategy documentation
- `gcp-infrastructure-migration.tf` — Gemini API key secret and IAM
- `backlog.md` — Cloud Vision fallback backlog item

## Key Decisions

- **Rate limiting over Provisioned Throughput:** Celery `rate_limit='10/m'` is cheaper and simpler than purchasing GCP Provisioned Throughput for the Gemini API. Can be raised later if higher quotas are purchased.
- **Three-tier extraction cascade:** Gemini (primary) → Cloud Vision (fallback) → Tesseract (last resort). Formalizes the extraction architecture across all infrastructure documents.
- **Batch burst reduced to 2 VMs:** With rate limiting, the Gemini API quota is the bottleneck, not worker count. Scaling beyond 2 VMs provides diminishing returns.
- **Gemini API key via Secret Manager:** Uses the REST API (`generativelanguage.googleapis.com`) with an API key rather than Vertex AI to avoid additional IAM complexity during initial migration.
- **Cost reduction:** Monthly steady-state dropped from ~$230–360 to ~$230–325. Batch burst dropped from ~$530–670 to ~$330–460. OCR API costs dropped from ~$150/batch (Vision) to ~$23.50/batch (Gemini + Vision fallback).

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tasks/bulk_import_tasks.py` | `modified` | Added `rate_limit='10/m'` to `process_folder_task` to prevent Gemini 429 errors |
| `domains/aquisicao/services/gemini_extraction.py` | `modified` | Renamed `_pdf_first_page_to_image` → `_pdf_pages_to_image`, added multi-page vertical stitching. Also fixed list-wrapped JSON parsing. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/terraform-decisions.md` | `modified` | Replaced Cloud Vision section with three-tier AI extraction strategy. Updated cost table, secrets, rate_limit rationale, VM sizing. |
| `refactors/infrastructure/gcp-architecture-reference.md` | `modified` | Updated Mermaid diagram, services table, and IAM table to include Gemini as primary extractor. |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Added `gemini_api_key` variable, `generativelanguage.googleapis.com` API, Secret Manager resources, IAM bindings, startup script injection. |
| `refactors/infrastructure/terraform.tfvars.example` | `modified` | Added `gemini_api_key` to required variables. |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `modified` | Added "Google Cloud Vision como fallback do Gemini" backlog item with three-tier cascade documentation. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `refactors/infrastructure/terraform-decisions.md` | `updates` | Updated Cloud Vision section to three-tier extraction strategy with Gemini primary |
| `refactors/infrastructure/gcp-architecture-reference.md` | `updates` | Architecture diagram and tables now reflect Gemini integration |
