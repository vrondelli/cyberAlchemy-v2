---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-20
timestamp: 2026-03-20T00:09:50-03:00
expires: 2026-05-19
conversation_id: c51fd237-24db-45e1-8c6a-7aee82d4d28a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Hardened the GCP migration plan with 3 fixes (GS_BUCKET_NAME fail-fast, container name sync, CELERY_TASK_ACKS_LATE) that prevent silent failures post-migration — not architectural changes, but deployment-resilience improvements that compound."
version: 0.1.0
last_updated: 2026-03-20
---

# GCP Migration Plan Assessment & Hardening

**Date:** 2026-03-20 00:09 (UTC-3)
**Tags:** #infrastructure

## Summary

This session assessed the first-phase GCP infrastructure migration plan (`/refactors/infrastructure/`) for implementation readiness. The assessment involved reading all 8 migration documents (main plan, pre-migration code changes, Terraform, phase guide, preflight checklist, architecture reference, terraform decisions, README) and cross-referencing every claim against the actual codebase (`settings.py`, `gcs.py`, Celery tasks, Terraform startup script).

The plan was found to be production-grade and ready to implement after 15 prior iterations of agent duo review. Three minor hardening issues were identified and fixed in-session, plus one bonus resilience suggestion was added as a new pre-migration component.

### Assessment Findings

- **Problem/Goal:** Determine if the migration plan is ready to implement, identify missing pieces or things that would break immediately after migration.
- **Decision:** Plan is ready. Three notes identified, all applied.
- **Changes:** Cross-referenced all line numbers, import locations, `default_storage.path()` sites, and Terraform resource shapes against actual codebase. All verified accurate.

### Fix 1: `GS_BUCKET_NAME` Fail-Fast Guard

- **Problem/Goal:** `os.getenv("GCS_REMESSA_BUCKET")` returns `None` if unset, causing `django-storages` to fail cryptically on first upload instead of at startup.
- **Decision:** Use `os.environ["GCS_REMESSA_BUCKET"]` to crash at startup, matching `SECRET_KEY` and `POSTGRES_PASSWORD` patterns.
- **Changes:** Updated Component 9 in `pre-migration-code-changes.md` and Section 1 in `gcp-infrastructure-migration.md`.

### Fix 2: Container Name Consistency

- **Problem/Goal:** Terraform startup script comment referenced `house-project-worker` but the actual container name created is `celery-worker` — could cause CI/CD deploy step to silently fail.
- **Decision:** Correct the comment to match reality.
- **Changes:** Updated comment in `gcp-infrastructure-migration.tf` line 842.

### Fix 3: Component 10 — `CELERY_TASK_ACKS_LATE`

- **Problem/Goal:** Default Celery behavior acknowledges tasks before execution. If a MIG worker VM is replaced mid-task, the task is silently lost.
- **Decision:** Add `CELERY_TASK_ACKS_LATE = True` and `CELERY_WORKER_PREFETCH_MULTIPLIER = 1` as a new pre-migration component.
- **Changes:** Added Component 10 to `pre-migration-code-changes.md`, new section in main plan, updated phase guide table and done gates, added checklist items to preflight checklist, updated component counts across all docs.

Key outputs:
- `migration_plan_assessment.md` (artifact) — Full assessment with verdict
- 6 migration doc files updated with fixes

## Key Decisions

- **`GS_BUCKET_NAME` should crash on startup if missing:** Consistency with other mandatory env vars prevents silent runtime failures.
- **`CELERY_TASK_ACKS_LATE` should be a pre-migration component:** Worker resilience is cheap to add and critical for MIG-based pools where VMs can be replaced at any time.
- **Redis TLS not needed for Phase 1:** VPC-internal traffic doesn't require TLS — AUTH string is sufficient. Documented for future reference.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | `GS_BUCKET_NAME` guard (`os.environ`), added Component 10 (`CELERY_TASK_ACKS_LATE`), count 9→10 |
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | `GS_BUCKET_NAME` guard, new `CELERY_TASK_ACKS_LATE` section, companion file ref count fix |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Container name comment corrected |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Component 10 checklist items added |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Component count, table rows, done gate items updated |
| `refactors/infrastructure/README.md` | `modified` | Pre-migration description updated |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `validates` | Assessed the migration plan for implementation readiness; all claims verified against codebase |
| [[infrastructure/pre-migration-code-changes.md]] | `updates` | Added Component 10 (CELERY_TASK_ACKS_LATE) and hardened Component 9 (GS_BUCKET_NAME) |
