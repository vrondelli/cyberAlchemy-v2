---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T22:51:55-03:00
expires: 2026-05-18
conversation_id: d47240e9-485a-4d8a-a864-2b4fddba2a4b
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/gcp-infrastructure-migration.tf
  - refactors/infrastructure/gcp-infrastructure-migration.md
  - refactors/infrastructure/pre-migration-code-changes.md
  - refactors/infrastructure/migration-preflight-checklist.md
  - refactors/infrastructure/migration-phase-guide.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Identified and fixed a data-loss bug (remessa bucket lifecycle 30d vs 180d retention), a performance regression (missing CONN_MAX_AGE for Cloud SQL), and a security gap (no .dockerignore) in the GCP migration plan — preventing guaranteed post-migration breakage."
user_satisfaction:
  score: 8
  min: 7
  max: 9
  std: 0.5
---

# GCP Migration Plan Audit & Fix Pass

**Date:** 2026-03-19 22:51 (UTC-3)
**Tags:** #infrastructure

## Summary

This session assessed the first-phase GCP infrastructure migration plan across all 7 documents in `/refactors/infrastructure/` for readiness to implement. The plan was cross-referenced against the actual codebase (`settings.py`, `Dockerfile`, `docker-compose.prod.yml`, storage call sites, Celery configuration) to identify inconsistencies, missing items, and things that would break immediately after migration.

The assessment found 3 critical issues that would cause immediate breakage, 3 near-term technical debt items, and 3 simple hardening opportunities. All 9 fixes were applied directly to the plan documents and Terraform file, making the plan ready for implementation.

### Assessment Methodology
- **Problem/Goal:** Determine if the migration plan is robust enough to implement without causing post-migration breakage or creating giant near-term technical debt.
- **Decision:** The plan was well-structured and thorough (agent duo review had already caught several real issues), but codebase cross-referencing surfaced gaps the review loop missed.
- **Changes:** Created an assessment artifact documenting all findings, then applied all fixes.

### Critical Fixes Applied
- **Problem/Goal:** Prevent guaranteed post-migration breakage.
- **Decision:** Apply all 3 critical fixes plus 6 hardening items.
- **Changes:**
  - Remessa bucket lifecycle 30d → 180d (matched `REMESSA_STORAGE_RETENTION_DAYS`)
  - Added `.dockerignore` as new pre-migration Component 7
  - Added `CONN_MAX_AGE = 600` as new pre-migration Component 8
  - Increased startup probe `failure_threshold` 3 → 5
  - Added missing env vars (`REMESSA_VALIDATION_QUEUE`, `REMESSA_RECOVERY_QUEUE`, `EMAIL_PORT`, `EMAIL_USE_TLS`) to Terraform
  - Added TODO comment about plaintext secrets on worker VM

Key outputs:
- Assessment artifact with findings categorized by severity
- All 9 fixes applied across 5 files

## Key Decisions

- **Remessa bucket lifecycle:** Changed from 30 days to 180 days to match `REMESSA_STORAGE_RETENTION_DAYS` in `settings.py`. The shorter value would have silently deleted remessa files the application still expects.
- **`.dockerignore` moved to pre-migration:** Creating it in Phase 5 was too late — every Docker build during development copies `.git/`, `.env*`, and the entire `refactors/` directory into the image. Made it pre-migration Component 7.
- **`CONN_MAX_AGE` added as pre-migration:** Without persistent DB connections, Cloud Run on Cloud SQL would open/close a TCP connection per request, adding ~20-50ms latency and risking connection exhaustion.
- **Startup probe resilience:** Increased `failure_threshold` from 3 to 5 (55s total) to handle Cloud SQL VPC first-connect latency during cold starts.
- **Plan verdict:** Ready to implement after fixes applied. Three open decisions (region, large file strategy, backend-ts routing) are correctly gated.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Bucket lifecycle 30→180d, startup probe threshold, missing env vars, secrets TODO comment |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Added `CONN_MAX_AGE` section, updated Phase 5 `.dockerignore` reference |
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Added Components 7 (`.dockerignore`) and 8 (`CONN_MAX_AGE`), updated objective count and verification plan |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Added Components 7 and 8 items, updated Phase 5 `.dockerignore` reference, added Docker build verification |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Updated pre-migration from 6→8 components, added done gates for new components |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Applied 9 fixes identified during codebase cross-reference audit |
| [[infrastructure/pre-migration-code-changes.md]] | `updates` | Added Components 7 and 8 (`.dockerignore` and `CONN_MAX_AGE`) |
