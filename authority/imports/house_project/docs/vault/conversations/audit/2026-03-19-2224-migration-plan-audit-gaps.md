---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: [technical, reference]
status: active
created: 2026-03-19
timestamp: 2026-03-19T22:24:08-03:00
expires: 2026-05-18
conversation_id: 06bba90f-a714-46f4-84ca-6e4334137fb9
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - refactors/infrastructure/gcp-infrastructure-migration.md
  - refactors/infrastructure/migration-phase-guide.md
  - refactors/infrastructure/migration-preflight-checklist.md
promoted_candidates: []
expected_importance: 5
importance_rationale: "Audited the GCP migration plan against the codebase; fixed 3 gaps (.dockerignore, queue list, crash-loop troubleshooting) that would cause silent failures or security leaks post-migration."
---

# Migration Plan Audit — Gap Fixes

**Date:** 2026-03-19 22:24 (UTC-3)
**Tags:** #infrastructure

## Summary

Reviewed all 8 documents in `/refactors/infrastructure/` against the actual codebase to assess Phase 1 implementation readiness. Verified line numbers, import paths, and behavioral assumptions via grep searches — all matched the current code. Identified 3 gaps: a missing `.dockerignore` entry that would leak `.env` files into production images, missing worker queue list verification in done gates, and no troubleshooting guidance for crash-loops caused by missing secrets. Applied all fixes directly to the plan documents.

### Codebase Verification

- **Problem/Goal:** Confirm the plan's codebase analysis (line numbers, import sites, call patterns) is accurate.
- **Decision:** All claim verified: 4 production `default_storage.path()` sites, 4 leaky `minio_client` imports, file handler in logging config, static CORS list — all match exactly.
- **Changes:** None needed — the plan's analysis was correct.

### `.dockerignore` for `.env` Files

- **Problem/Goal:** The Dockerfile uses `COPY . /app/` which bakes local `.env` files into the image. `settings.py` uses `load_dotenv()` at startup. While `load_dotenv` won't override real env vars, stale secrets in the image are a security leak and debugging trap.
- **Decision:** Add `.env` and `.env.local` to `.dockerignore` as a Phase 5 step.
- **Changes:** Added step to Phase 5 in main plan, phase guide, and preflight checklist.

### Worker Queue List Verification

- **Problem/Goal:** `docker-compose.prod.yml` starts Celery with `-Q default,remessa-validation,remessa-recovery`. If the Terraform startup script omits the `-Q` flag, Celery only consumes the default queue and remessa tasks hang silently.
- **Decision:** Add queue list verification to Phase 1 done gate + verification commands.
- **Changes:** Added done-gate item and verification command to Phase 1 in main plan, phase guide, and preflight checklist.

### Crash-Loop Troubleshooting

- **Problem/Goal:** `settings.py` uses `os.environ["SECRET_KEY"]` (hard crash if missing). If Secret Manager injection fails, Cloud Run enters a crash loop with no diagnostic guidance.
- **Decision:** Add a Troubleshooting section to the phase guide covering crash-loop and silent-queue failures.
- **Changes:** Added new "Troubleshooting" section to `migration-phase-guide.md` before Rollback Triggers.

Key outputs:
- 3 updated migration plan documents
- `migration-plan-assessment.md` artifact with full analysis

## Key Decisions

- **`.dockerignore` is a must-have for Phase 5:** Prevents `.env` leaking into production Docker images, which is a security concern and debugging trap.
- **Queue list is a Phase 1 verification item:** Silently dropped tasks are worse than a loud failure — catching this at provisioning time prevents days of debugging later.
- **Troubleshooting section added to phase guide:** Gives operators concrete diagnostic commands for the two most likely failure modes.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/gcp-infrastructure-migration.md` | `modified` | Added `.dockerignore` step to Phase 5, worker queue verification note to Phase 1 |
| `refactors/infrastructure/migration-phase-guide.md` | `modified` | Added queue verification to Phase 1 done gate, `.dockerignore` to Phase 5, new Troubleshooting section |
| `refactors/infrastructure/migration-preflight-checklist.md` | `modified` | Added queue verification to Group 3, `.dockerignore` to Group 6 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `updates` | Fixed 3 gaps in the main migration plan |
| [[infrastructure/migration-phase-guide.md]] | `updates` | Added done-gate items, troubleshooting section |
| [[infrastructure/migration-preflight-checklist.md]] | `updates` | Added 2 checklist items |
