---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T23:01:48-03:00
expires: 2026-05-18
conversation_id: 13d55587-b93f-4d9e-9b67-be183fa6fd52
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/pre-migration-code-changes.md
  - refactors/infrastructure/gcp-infrastructure-migration.tf
  - refactors/infrastructure/migration-preflight-checklist.md
  - refactors/infrastructure/migration-phase-guide.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Assessment of the GCP migration plan surface 3 must-fix issues (missing GS_BUCKET_NAME config, Terraform heredoc escaping bug, retention sync gap) that would have caused silent failures in production — all fixed in-session."
user_satisfaction: { mean: 8, min: 7, max: 9, std: 0.7 }
---

# GCP Migration Plan Assessment & Fixes

**Date:** 2026-03-19 23:01 (UTC-3)
**Tags:** #infrastructure

## Summary

This session performed a thorough assessment of the first-phase GCP infrastructure migration plan in `/refactors/infrastructure/`. All 5 migration documents (main plan at 1058 lines, pre-migration code changes at 477 lines, preflight checklist, phase guide, and Terraform at 1052 lines) were read in full and cross-referenced against the actual codebase (`settings.py`, `Dockerfile`, `docker-compose.prod.yml`, `nginx.conf`, `shared_services/gcs.py`, `requirements.txt`).

The overall verdict was **good to implement** — the plan is production-grade. However, 3 must-fix issues were identified and corrected in-session.

### Assessment Findings

- **Problem/Goal:** Determine if the first-phase migration plan is ready for implementation, or if there are gaps that could cause immediate problems after migration or create near-term technical debt.
- **Decision:** Plan is ready after 3 specific fixes. 12+ concerns were verified as already well-handled (security headers, Celery beat idempotency, ALLOWED_HOSTS, Redis AUTH, OOM protection, temp cleanup, etc.).
- **Changes:** Created an assessment artifact documenting 3 red items, 4 yellow items, and 12+ green items.

### Fix 1: Missing `GS_BUCKET_NAME` Configuration (Component 9)

- **Problem/Goal:** The main migration plan describes configuring `DEFAULT_FILE_STORAGE` + `GS_BUCKET_NAME` in `settings.py`, but this was never included in the pre-migration code changes document. Without it, Pattern A (50+ `default_storage` call sites) would silently continue using `FileSystemStorage` on GCP.
- **Decision:** Added as Component 9 in `pre-migration-code-changes.md`.
- **Changes:** Added Component 9 to `pre-migration-code-changes.md`, `migration-preflight-checklist.md`, and updated the `migration-phase-guide.md` component count from 8 to 9.

### Fix 2: Terraform Heredoc `$$` Escaping

- **Problem/Goal:** The worker startup script in the `<<-EOT` heredoc used bare `$` for bash variables (`$ENV_FILE`, `$SECRET_KEY`, `$(gcloud ...)`, `$QUEUES`, `$INSTANCE_NAME`). Terraform would interpolate these as Terraform expressions, producing empty values — the startup script would write an env file with blank secrets, causing worker crash loops.
- **Decision:** Escape all bash-specific `$` to `$$` while preserving Terraform interpolations (`${var.region}`, `${var.project_id}`, etc.).
- **Changes:** Updated 20+ `$` occurrences in `gcp-infrastructure-migration.tf` lines 786–872.

### Fix 3: Retention Sync Warning

- **Problem/Goal:** The GCS remessas bucket lifecycle (180 days) and the Django `REMESSA_STORAGE_RETENTION_DAYS` setting could silently disagree if someone overrides the env var without updating Terraform.
- **Decision:** Added a sync warning comment to the Terraform lifecycle block.
- **Changes:** Added 3-line comment in `gcp-infrastructure-migration.tf` at the remessas bucket lifecycle rule.

Key outputs:
- `migration_plan_assessment.md` — Full assessment artifact with red/yellow/green items

## Key Decisions

- **Plan is ready for implementation** after the 3 fixes — no fundamental design issues found.
- **Component 9 added** — `DEFAULT_FILE_STORAGE` config belongs in pre-migration, not deferred to Phase 2.
- **Terraform escaping is critical** — `$$` is required for all bash variables inside `<<-EOT` heredocs.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Escaped all bash `$` to `$$` in worker startup heredoc; added retention sync warning to remessas bucket lifecycle |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Added Component 9 (DEFAULT_FILE_STORAGE + GS_BUCKET_NAME), updated component count from 8 to 9, added Iteration 15 to Agent Duo sign-off |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Added Component 9 checklist items under Group 1 |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Updated pre-migration component count from 8 to 9 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `validates` | Assessed the first-phase plan; confirmed it is production-grade after 3 fixes |
| [[infrastructure/pre-migration-code-changes.md]] | `updates` | Added Component 9 (GS_BUCKET_NAME config) to close a gap in Pattern A activation |
