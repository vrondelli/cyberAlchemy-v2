---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T21:51:00-03:00
expires: 2026-05-18
conversation_id: b7e48c0d-a99e-40ed-96ac-230fb7241601
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - refactors/infrastructure/gcp-infrastructure-migration.md
  - refactors/infrastructure/gcp-infrastructure-migration.tf
  - refactors/infrastructure/terraform-decisions.md
  - refactors/infrastructure/migration-phase-guide.md
  - refactors/infrastructure/migration-preflight-checklist.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Fixed 5 errors in the GCP migration plan — most critically, Celery beat MIG duplication (production bug) and SECURE_SSL_REDIRECT crash loop — by cross-referencing all plan claims against actual source code."
user_satisfaction:
  mean: 8
  min: 7
  max: 9
  std: 0.7
---

# GCP Migration Plan Audit — Fix Pass

**Date:** 2026-03-19 21:51 (UTC-3)
**Tags:** #infrastructure

## Summary

This session performed a deep audit of the GCP infrastructure migration plan in `/refactors/infrastructure/`. Every factual claim in the plan documents was cross-referenced against the actual source code to verify accuracy. While the plan's code-level claims were confirmed correct (line numbers, imports, mock patches all match), 5 errors were found in the infrastructure and operational design. All 5 were fixed in-place across 6 files.

The most critical fix was Celery beat's behavior on a Managed Instance Group — the plan incorrectly claimed beat is idempotent and safe to run on all instances. In reality, N instances = N copies of every scheduled task. The Terraform startup script was updated to use GCE metadata to elect a single beat leader (instance ending in `-0`).

### Celery Beat MIG Duplication (Issue 1)
- **Problem/Goal:** The plan and Terraform claimed Celery beat is idempotent and runs safely on all MIG instances. This is incorrect — beat enqueues N copies of each task on N instances.
- **Decision:** Use instance name detection via GCE metadata server to only run beat on the first instance (name ending in `-0`).
- **Changes:** Updated startup script in `.tf`, corrected comment blocks in `.tf`, main plan, and `terraform-decisions.md`.

### SECURE_SSL_REDIRECT Crash Loop (Issue 5)
- **Problem/Goal:** The plan proposed `SECURE_SSL_REDIRECT = True` in production settings. Cloud Run health probes use internal HTTP — this setting would 301-redirect probes, causing a crash loop.
- **Decision:** Do NOT set `SECURE_SSL_REDIRECT`. The load balancer handles HTTP→HTTPS redirect externally.
- **Changes:** Replaced the setting with a prominent warning comment across main plan, phase guide, and checklist.

### Upload Size Regression (Issue 2)
- **Problem/Goal:** `settings.py` defines `REMESSA_UPLOAD_MAX_SIZE_MB = 500` but Cloud Run caps at 32MB. Any user uploading >32MB CSVs would get an opaque Cloud Run error.
- **Decision:** Escalated Decision 2 with concrete risk and added a mandatory audit step for production upload sizes.
- **Changes:** Added warning to main plan, phase guide Decision 2, and preflight checklist.

### Missing Django Settings (Issue 3)
- **Problem/Goal:** `DATA_UPLOAD_MAX_MEMORY_SIZE` defaults to 2.5MB in Django — could reject requests before Cloud Run's limit.
- **Decision:** Add `DATA_UPLOAD_MAX_MEMORY_SIZE = 33554432` and `FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760` to settings recommendations.
- **Changes:** Added to Section 8 of main plan, Phase 5 steps, and preflight checklist.

### Remessas Lifecycle Edge Case (Issue 4)
- **Problem/Goal:** The 30-day lifecycle on the remessas bucket could delete files before failed Celery task retries complete.
- **Decision:** Documented as accepted behavior — user should re-upload after 30 days.
- **Changes:** Added edge case note to `terraform-decisions.md`.

Key outputs:
- `gcp-infrastructure-migration.tf` — Beat leader election, corrected MIG comments
- `gcp-infrastructure-migration.md` — All 5 fixes propagated
- `terraform-decisions.md` — Beat rationale corrected, lifecycle edge case documented
- `migration-phase-guide.md` — Decision 2 escalated, Phase 5 steps fixed
- `migration-preflight-checklist.md` — Upload audit, SSL warning, Django settings items
- `README.md` — Entry-point document with reading order, open decisions, and phase summary

## Key Decisions

- **Celery beat leader election:** Only the MIG instance ending in `-0` runs beat, using GCE metadata for detection. If that instance dies, beat stops until MIG recreates it — acceptable for scheduled tasks.
- **No SECURE_SSL_REDIRECT:** Cloud Run's load balancer handles HTTP→HTTPS. Setting it in Django breaks internal health probes.
- **Upload size audit required:** Must check production upload sizes before choosing signed URL vs. accept-32MB strategy.
- **DATA_UPLOAD_MAX_MEMORY_SIZE:** Align Django's request size limits with Cloud Run's 32MB cap.
- **Remessas lifecycle 30-day:** Accepted that extremely delayed retries (>30 days) will 404 — user re-uploads.
- **README as entry point:** Added a README.md to `/refactors/infrastructure/` with reading order, open decisions summary, and phase overview.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Beat leader election via instance name metadata, corrected MIG comment block |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/README.md` | `created` | Entry-point document with reading order, open decisions, and phase summary |
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Corrected beat note, removed SECURE_SSL_REDIRECT, added DATA_UPLOAD settings, added upload size warning, added REMESSA_UPLOAD_MAX_SIZE_MB to scope |
| `refactors/infrastructure/terraform-decisions.md` | `modified` | Corrected beat rationale, added remessas lifecycle edge case |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Escalated Decision 2 with upload audit, fixed Phase 5 steps (SSL, Django settings) |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Added upload audit sub-item, SSL redirect warning, Django settings items |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Fixed 5 errors: beat duplication, SSL redirect, upload limits, Django settings, lifecycle edge case |
| [[infrastructure/gcp-infrastructure-migration.tf]] | `updates` | Beat leader election via instance name, corrected MIG comment |
| [[infrastructure/terraform-decisions.md]] | `updates` | Corrected beat rationale, added lifecycle edge case note |
