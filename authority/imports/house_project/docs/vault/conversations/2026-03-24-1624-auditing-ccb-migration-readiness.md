---
tags: [ccb, architecture, pipeline]
node_type: audit
is_session: true
layer: [architecture, domain]
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:24:48-03:00
expires: 2026-05-23
conversation_id: 5be2ace8-185b-4174-ab7e-d38097aab32d
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Caught 3 blockers (illegal hyphens, missing gemini_config.py, Celery autodiscover) in the migration plan that would have caused immediate production failures; fixes applied to the spec before execution began."
---

# Auditing CCB Migration Readiness

**Date:** 2026-03-24 16:24 (UTC-3)
**Tags:** #ccb #architecture #pipeline

## Summary

This session audited the `documents-validation-migration-implementation.md` specification against the live codebase to determine whether the Phase 1 "Lift and Shift" migration of the CCB validation pipeline could proceed. The audit cross-referenced every file, import path, test class, and infrastructure config mentioned in the spec against their actual state in the repository. The result was **3 blockers** and **4 warnings** that would have caused immediate failures or silent test gaps if the migration had been executed as-is. All issues were resolved by rewriting the implementation plan to v1.2.0.

### Migration Spec Audit

- **Problem/Goal:** Determine if `documents-validation-migration-implementation.md` was ready for execution, or if it contained technical flaws that would block the migration.
- **Decision:** The migration cannot proceed without fixing the identified blockers. All fixes were applied to the spec itself — no code changes were made.
- **Changes:** Rewrote the implementation plan from v1.1.0 to v1.2.0, addressing all 7 findings.

### Blocker 1: Python-Illegal Directory Name

- **Problem/Goal:** The implementation plan used hyphens (`documents-validation`) in directory names throughout. Python cannot import modules with hyphens — `from domains.documents-validation...` is a `SyntaxError`.
- **Decision:** Standardize on underscores (`documents_validation`), consistent with the discovery doc.
- **Changes:** Replaced all occurrences of `documents-validation` with `documents_validation` in the implementation plan.

### Blocker 2: Missing `gemini_config.py`

- **Problem/Goal:** The spec listed `gemini_extraction.py` for migration but omitted its hard dependency `gemini_config.py`, which contains all Gemini system prompts and model constants.
- **Decision:** Add `gemini_config.py` to the Services section.
- **Changes:** Added `[DELETE]`/`[NEW]` pair for `gemini_config.py` with an `[!IMPORTANT]` callout.

### Blocker 3: Celery Task Autodiscovery

- **Problem/Goal:** Celery's `autodiscover_tasks` in `celery.py` only scans `INSTALLED_APPS + ['domains.estoque']`. Moving bulk import tasks to `documents_validation/tasks/` would make them invisible to the Celery worker.
- **Decision:** Add a new Step 1.7 to the plan for updating `celery.py`.
- **Changes:** Added a `[MODIFY] house_project/celery.py` section with exact before/after code.

### Warnings: conftest, imports, test extraction

- **Problem/Goal:** Four additional issues: (1) `conftest.py` shared fixtures not addressed, (2) `views.py` and scripts cross-domain imports not enumerated, (3) line ranges for test extraction inaccurate, (4) `kit_matching` tests underestimated.
- **Decision:** Fix all four in the updated spec.
- **Changes:** Added `conftest.py` to scaffolding, added full import consumer table, fixed line references and added `[!IMPORTANT]` about API test classes that must NOT be extracted, expanded kit_matching extraction with both `TestEvaluateKitCompletion` (12 methods) and `TestEvaluateKitCompletionEmpresaFallback` (5 methods).

Key outputs:
- `documents-validation-migration-implementation.md` v1.2.0 — corrected implementation plan
- `migration_audit_report.md` — detailed audit findings artifact

## Key Decisions

- **Directory naming:** Use underscores (`documents_validation`) not hyphens, to comply with Python import syntax.
- **`gemini_config.py` must move with `gemini_extraction.py`:** They are a coupled pair via direct imports.
- **Celery autodiscover must be updated:** Added as an explicit migration step (Step 1.7).
- **`kit_matching` tests must be extracted in Phase 1:** Both `TestEvaluateKitCompletion` and `TestEvaluateKitCompletionEmpresaFallback` are direct unit tests of the migrating module and cannot be deferred to Phase 2.
- **API test classes must NOT be extracted:** `TestAvailableColumnsAPI` and `TestFieldMappingsAPI` are sandwiched between cross-check classes in `test_field_column_mapping.py` but test `aquisicao` API endpoints and must remain.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `modified` | v1.1.0 → v1.2.0: fixed all 7 audit findings (hyphens, gemini_config, Celery, conftest, imports, line ranges, kit_matching tests) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `documents-validation-migration-implementation.md` | `validates` | Audited this spec against the codebase and fixed 7 issues |
| `documents-validation-migration-discovery.md` | `contextualizes` | The discovery doc provided architectural rationale referenced during the audit |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Import hygiene grep after Phase 1 execution | Audit finding | ⚠️ HIGH | Added to verification plan |
| `conftest.py` fixture design (copy vs. shared) | Audit finding | MEDIUM | Documented, decision deferred to execution |
