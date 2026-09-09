---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T19:21:08-03:00
expires: 2026-05-18
conversation_id: e9def4b1-db5c-4e91-a62d-bf4253db9aae
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - refactors/infrastructure/gcp-infrastructure-migration.md
  - refactors/infrastructure/gcp-infrastructure-migration.tf
promoted_candidates: []
expected_importance: 6
importance_rationale: "Audit of all 4 GCP migration docs surfaced 10 gaps (3 high-severity), fixed 6 inline (health check, monitoring filter, CI/CD skeleton, tfvars, SECURE_PROXY_SSL_HEADER, Cloud Run Job for migrations), and identified 3 remaining refinements (signed URL uploads, MinIO data migration, settings.py checklist) for future addition."
---

# Infrastructure Migration Docs — Completeness Audit

**Date:** 2026-03-19 19:21 (UTC-3)
**Tags:** #infrastructure

## Summary

This session performed a comprehensive completeness review of all four documents in `refactors/infrastructure/`: the main GCP migration plan (957 lines), the Terraform baseline (1015 lines), the pre-migration code changes (343 lines), and the Terraform decisions rationale (445 lines). The review assessed internal consistency across documents, alignment with the actual codebase, and identified gaps that would block execution.

Ten specific gaps were identified, three rated high severity (CI/CD pipeline conceptual-only, large file upload strategy unresolved, MinIO data migration missing). Six gaps were fixed directly during the session. Three remaining items were documented with concrete proposals for future addition to the main migration plan.

### Completeness Review & Gap Identification

- **Problem/Goal:** Determine whether the infrastructure migration documentation is internally consistent, complete enough for execution, and aligned with the actual codebase.
- **Decision:** The documentation is strong at the planning level but has 10 gaps ranging from document contradictions to missing operational procedures.
- **Changes:** Produced a structured review artifact identifying all 10 gaps with severity ratings.

### Direct Fixes Applied

- **Problem/Goal:** Fix the 6 gaps that had clear, unambiguous solutions.
- **Decision:** Fix in-place rather than deferring.
- **Changes:**
  - Health check in main plan: replaced incorrect `django_redis.get_redis_connection()` with correct `celery_app.connection_for_read().ensure_connection()` (project doesn't use django-redis)
  - `SECURE_PROXY_SSL_HEADER`: updated Section 8 to note it already exists unconditionally at `settings.py` L43
  - CI/CD pipeline: created `.github/workflows/deploy-gcp.yml` with build → migrate (Cloud Run Job) → deploy API → redeploy MIG worker
  - DB migration runner: chose Cloud Run Job (same VPC, same image, CI-triggerable, idempotent)
  - Monitoring alert filter: fixed `resource.type` from `cloud_run_revision` to `uptime_url` in Terraform
  - Created `terraform.tfvars.example` with all 14 variables

### Remaining Refinements

- **Problem/Goal:** Three items need decisions or additions but couldn't be fixed inline.
- **Decision:** These should be added to `gcp-infrastructure-migration.md` (not to pre-migration doc or a new file) because they all depend on GCP infrastructure existing.
- **Changes:** Documented proposals in a refinement artifact:
  - Phase 4.6: Signed URL bulk uploads (Cloud Run 32MB limit vs. 500MB ZIPs — confirmed `BulkImportUploadView` at L887 reads full body)
  - Phase 6 subsection: MinIO → GCS object data migration procedure
  - Appendix: settings.py target state checklist (14 settings across 5 phases)

Key outputs:
- `infrastructure-review.md` — completeness review with 10 gaps
- `remaining-refinements.md` — proposals for 3 open items
- `.github/workflows/deploy-gcp.yml` — CI/CD deploy pipeline skeleton
- `refactors/infrastructure/terraform.tfvars.example` — example variable values

## Key Decisions

- **CI/CD platform:** GitHub Actions over Cloud Build — project already uses GH Actions for CI, avoids adding another GCP API dependency.
- **DB migration runner:** Cloud Run Job — runs in same VPC, same Docker image, no SSH/IAP needed, visible in Cloud Console.
- **Health check Redis strategy:** Use Celery broker connection, not django-redis — project uses Redis exclusively as Celery broker/result backend.
- **Refinements location:** Add to existing `gcp-infrastructure-migration.md`, not create new doc — the three items depend on cloud resources and don't meet pre-migration criteria (local-testable, cloud-independent).
- **Celery beat multi-instance safety:** Verified `CELERY_BEAT_SCHEDULE` uses only `crontab()`/interval — no `expires` or `eta`, so running beat on all MIG instances is safe.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/deploy-gcp.yml` | `created` | CI/CD skeleton: build, migrate (Cloud Run Job), deploy API (Cloud Run), redeploy worker (MIG via IAP SSH) |
| `refactors/infrastructure/terraform.tfvars.example` | `created` | Example values for all 14 Terraform variables |
| `refactors/infrastructure/gcp-infrastructure-migration.tf` | `modified` | Fixed monitoring alert filter: `resource.type` changed from `cloud_run_revision` to `uptime_url` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Fixed health check (Celery broker instead of django-redis), updated SECURE_PROXY_SSL_HEADER note, replaced Phase 5.5 options with concrete GitHub Actions pipeline + Cloud Run Job decision, added companion file references |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add Phase 4.6: Signed URL bulk uploads | This session | ⚠️ HIGH | Open — requires frontend coordination |
| Add MinIO → GCS data migration to Phase 6 | This session | ⚠️ HIGH | Open — needs inventory of existing MinIO data |
| Add settings.py target state checklist appendix | This session | MEDIUM | Open — coordination aid, not blocking |

## Open Questions

- How large are actual ZIP uploads in practice? If all are under 32MB, signed URL path may be deferrable.
- What is the current MinIO object volume? Needed to estimate data migration time and plan cutover window.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Fixed health check, SECURE_PROXY_SSL_HEADER note, Phase 5.5, companion file references |
| [[infrastructure/gcp-infrastructure-migration.tf]] | `updates` | Fixed monitoring alert filter resource type |
| [[infrastructure/pre-migration-code-changes.md]] | `validates` | Confirmed pre-migration health check implementation is correct vs. main plan's incorrect version |
| [[infrastructure/terraform-decisions.md]] | `validates` | Confirmed decisions are sound; noted monitoring alert filter inconsistency (fixed in .tf) |
