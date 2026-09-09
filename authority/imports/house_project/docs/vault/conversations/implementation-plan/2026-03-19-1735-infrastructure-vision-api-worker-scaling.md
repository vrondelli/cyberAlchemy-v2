---
tags: [infrastructure]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:35:42-03:00
expires: 2026-05-18
conversation_id: 0c18f7af-a225-41f7-bcd6-2c728a606fde
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/gcp-infrastructure-migration.tf, refactors/infrastructure/gcp-infrastructure-migration.md, refactors/infrastructure/terraform-decisions.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Added Cloud Vision API, Managed Instance Group, and Celery concurrency to GCP Terraform and migration docs, enabling 50k-folder batch processing that was previously impossible with single-VM architecture."
---

# Infrastructure Review: Cloud Vision, Worker Scaling, Celery Concurrency

**Date:** 2026-03-19 17:35 (UTC-3)
**Tags:** #infrastructure

## Summary

This session reviewed the GCP infrastructure migration files in `refactors/infrastructure/` against three criteria: conceptual soundness, ability to process 50k document folders in under 1 hour, and inclusion of Google's OCR services in Terraform. The review found the overall concept solid but identified two critical gaps: (1) the Terraform did not include `vision.googleapis.com` or `documentai.googleapis.com`, relying entirely on Tesseract local OCR, and (2) the single `e2-standard-2` worker VM with default Celery concurrency of 2 could not process 50k folders in less than ~35 hours. All three files were then updated to address these gaps.

### Infrastructure Review and Gap Analysis
- **Problem/Goal:** Assess whether the infrastructure plan could handle 50k document folders with extraction in under 1 hour, and whether Google OCR services were included.
- **Decision:** The architecture concept is sound for v1 but needs Cloud Vision API for OCR quality/speed and horizontal worker scaling for throughput.
- **Changes:** Created analysis artifact with throughput calculations showing current setup produces ~35h for 50k folders (best case), vs. the 1h target.

### Cloud Vision API Addition
- **Problem/Goal:** OCR was using Tesseract locally, which is slow (10–120s/page), poor on rotated/photographed documents, and a throughput bottleneck.
- **Decision:** Enable `vision.googleapis.com` in Terraform, add `roles/vision.user` IAM for the worker service account. Cloud Vision processes pages in ~1–3s and handles rotation natively.
- **Changes:** Added API to enabled services list, added IAM binding, documented 3-phase migration path (Tesseract → Cloud Vision alongside → Cloud Vision primary).

### Worker Scaling via Managed Instance Group
- **Problem/Goal:** Single VM with 2 Celery workers cannot achieve required throughput. Processing is parallel in code (Celery chord/group) but infrastructure limits concurrency.
- **Decision:** Replace `google_compute_instance` with `google_compute_instance_template` + `google_compute_instance_group_manager`. Upgrade to `e2-standard-4`. Add `worker_instance_count` (default 1) and `celery_worker_concurrency` (default 8) variables.
- **Changes:** MIG with PROACTIVE rolling updates, `-c` flag in startup script, scaling procedure via `gcloud resize`. 4 VMs × 8 workers = 50k folders in ~52 minutes.

Key outputs:
- `gcp-infrastructure-migration.tf` — Terraform with Vision API, MIG, concurrency
- `gcp-infrastructure-migration.md` — Updated scope, architecture, OCR migration path, worker scaling section
- `terraform-decisions.md` — MIG rationale, Cloud Vision section, updated cost estimates

## Key Decisions

- **Cloud Vision API over Document AI:** Vision's `TEXT_DETECTION` is simpler, cheaper ($1.50/1k pages), and sufficient for text extraction from photographed IDs. Document AI may be evaluated later for structured field extraction.
- **MIG over single VM:** Horizontal scaling via MIG allows normal operation at 1 VM and burst to 4–8 VMs for batch processing, then scale back.
- **e2-standard-4 over e2-standard-2:** Supports 8 concurrent I/O-bound Celery workers (Cloud Vision API calls spend most time waiting for network).
- **Celery concurrency = 8:** Default for I/O-bound Cloud Vision calls. Lower to 4 for CPU-bound Tesseract fallback.
- **Beat on all MIG instances:** Idempotent — duplicate schedule checks are harmless. Simplest approach before django-celery-beat migration.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Added `vision.googleapis.com`, new variables (`celery_worker_concurrency`, `worker_instance_count`), replaced single VM with instance template + MIG, upgraded to `e2-standard-4`, added `-c` concurrency flag, added `roles/vision.user` IAM |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Moved Cloud Vision to in-scope, updated target architecture, added OCR migration path, added Worker Scaling section with throughput estimates |
| `refactors/infrastructure/terraform-decisions.md` | `modified` | Rewrote Worker VM section as Worker MIG, added Cloud Vision API section, updated cost estimates |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/cloud-vision-migration-discovery.md]] | `contextualizes` | Discovery doc for Cloud Vision migration; this session adds the infrastructure enablement that doc requires |
