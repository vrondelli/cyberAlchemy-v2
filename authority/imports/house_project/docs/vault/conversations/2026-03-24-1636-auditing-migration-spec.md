---
tags: [documents-validation, migration, ccb]
node_type: audit
is_session: true
layer: [architecture, domain]
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:36:34-03:00
expires: 2026-05-23
conversation_id: 27551184-a71d-4727-a003-e82786853f42
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Caught 2 blockers (missing bulk_import_config.py + missing apps.py) that would have caused ImportError and Django startup crash during the documents_validation domain migration, preventing a failed execution."
---

# Auditing Document Validation Migration Spec

**Date:** 2026-03-24 16:36 (UTC-3)
**Tags:** #documents-validation #migration #ccb

## Summary

This session performed a systematic, codebase-validated audit of the `documents-validation-migration-implementation.md` specification (v1.3.0) to determine if the Phase 1 "Lift and Shift" migration could be executed safely. The audit cross-referenced every file path, import consumer, Django infrastructure config, Celery autodiscovery setting, and embedded test class line number against the live codebase.

The audit uncovered **2 blockers** that would have caused runtime failures if the migration were executed as-is, plus 2 minor issues. All 4 were fixed, bumping the spec to v1.4.0.

### Missing `bulk_import_config.py`
- **Problem:** `domains/aquisicao/domain/bulk_import_config.py` was not listed in the migration plan despite being a direct dependency of `process_bulk_import.py`, `bulk_import_tasks.py`, `test_bulk_import.py`, and `test_parallel_bulk_import.py` — all of which are being moved.
- **Decision:** Include `bulk_import_config.py` in the Domain logic section as a DELETE/NEW pair.
- **Changes:** Added the file to the spec, added it to the import rewriting pattern list, and added the corresponding grep to the verification plan.

### Missing `apps.py` for Django App Registration
- **Problem:** The spec adds `domains.documents_validation.repositories` to `INSTALLED_APPS` but does not create an `apps.py` with a `DocumentsValidationConfig(AppConfig)`. Django would crash on startup with `ImproperlyConfigured`.
- **Decision:** Add `apps.py` to the scaffolding section with explicit instructions for `name` and `label`.
- **Changes:** Added `[NEW] domains/documents_validation/repositories/apps.py` to the scaffolding section with configuration details.

### Minor Fixes
- Added missing `bulk_import_config` entry to the import hygiene grep checklist.
- Added `bulk_import_config` to the import rewriting pattern section.

Key outputs:
- `documents-validation-migration-implementation.md` — bumped from v1.3.0 to v1.4.0 with all fixes applied

## Key Decisions

- **Include `bulk_import_config.py` in migration:** This pure-constants file is a direct dependency of 4 files being moved; leaving it behind would cause `ImportError` at runtime.
- **Require `apps.py` for `documents_validation/repositories/`:** Django mandates an `AppConfig` for any `INSTALLED_APPS` entry; without it the application won't start.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `modified` | Added missing `bulk_import_config.py` (DELETE/NEW pair), added `apps.py` to scaffolding, updated import rewriting and verification grep list, bumped version to 1.4.0 |
