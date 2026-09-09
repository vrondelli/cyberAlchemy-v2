---
tags: [infrastructure]
node_type: audit
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T19:11:24-03:00
expires: 2026-05-18
conversation_id: fab69864-b0d2-49c2-bed5-9610717e550c
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [refactors/infrastructure/pre-migration-code-changes.md]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Hardened the pre-migration GCP plan by cross-referencing all claims against the codebase, closing 4 gaps (test file updates, CORS defaults, SECURE_PROXY_SSL_HEADER conflict) and adding a tracked Componente 6 for test mock updates."
---

# Reviewing Pre-Migration Implementation Plan

**Date:** 2026-03-19 19:11 (UTC-3)
**Tags:** #infrastructure

## Summary

This session audited `pre-migration-code-changes.md` against the actual codebase to verify every claim and identify gaps. All 12 production-code references (line numbers, import paths, `default_storage.path()` call sites) were verified correct. However, the audit surfaced 4 missing items — most critically, test files that would break after the planned changes — and produced 5 improvement suggestions. All findings were then applied directly to the plan.

### Codebase Cross-Reference Audit

- **Problem/Goal:** Verify that every line number, import path, and code pattern claimed in the pre-migration plan actually matches the codebase.
- **Decision:** All 12 production-code claims are accurate. The plan is well-researched.
- **Changes:** No code changes — this was pure verification.

### Missing Test File Coverage

- **Problem/Goal:** The plan focused exclusively on production code changes but didn't track the test mock/fixture updates required to keep CI green.
- **Decision:** Added a new **Componente 6** to the plan, tracking: 5 `default_storage.path` mock patches in `celery_tasks_test.py` and 2 direct `.path()` calls in `test_upload_e2e.py`. Also noted that `test_storage.py`'s ~20 direct `minio_client` imports are intentionally excluded (they test the concrete implementation).
- **Changes:** `pre-migration-code-changes.md` — added Componente 6 with specific line numbers and replacement patterns.

### CORS Default Preservation

- **Problem/Goal:** The plan's `_default_cors` string silently dropped `http://zefrahub.com` (non-HTTPS) and `https://front-zefrahub.vercel.app` from the current origins list.
- **Decision:** Preserve all existing origins. Removing origins is a breaking change that should be separate.
- **Changes:** Added `http://zefrahub.com` back to the `_default_cors` string and added a `[!NOTE]` box.

### SECURE_PROXY_SSL_HEADER Conflict

- **Problem/Goal:** `settings.py` line 43 already sets `SECURE_PROXY_SSL_HEADER` unconditionally. The main migration plan (Section 8) proposes adding it inside `if not DEBUG:`.
- **Decision:** Keep it unconditional — it works for both Nginx and Cloud Run. Flagged in the pre-migration plan's User Review section so the main plan can be updated.
- **Changes:** Added `[!IMPORTANT]` note in the User Review section.

### Health Check Redis Approach

- **Problem/Goal:** The pre-migration plan and the main migration plan used different Redis check strategies (Celery broker vs. `django-redis`).
- **Decision:** Celery broker connection is correct since the project doesn't use `django-redis`.
- **Changes:** Added docstring clarification to the health check code in the plan.

Key outputs:
- `pre-migration-code-changes.md` — Updated with all findings (grew from 277 to 343 lines)

## Key Decisions

- **Componente 6 as tracked work:** Test mock updates were promoted from a loose `[!IMPORTANT]` note to a full tracked Componente, ensuring they aren't forgotten during implementation.
- **CORS preservation:** All existing origins kept in defaults to avoid silent breaking changes.
- **Health check via Celery broker:** Chosen over `django-redis` since the project only uses Redis as Celery broker/result backend.
- **Parallelism note:** Componentes 3–5 flagged as independent, enabling split execution across sessions.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `refactors/infrastructure/pre-migration-code-changes.md` | `modified` | Added Componente 6 (test updates), fixed CORS defaults, added `SECURE_PROXY_SSL_HEADER` note, clarified health check approach, added Polars `write_csv` note, expanded test table with "Afetado por" column |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[infrastructure/gcp-infrastructure-migration.md]] | `validates` | Verified pre-migration plan claims against the codebase; all production-code references confirmed accurate |
