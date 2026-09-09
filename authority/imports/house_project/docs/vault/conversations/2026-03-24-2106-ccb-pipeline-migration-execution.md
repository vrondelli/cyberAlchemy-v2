---
tags: [documents-validation, migration, ccb, pipeline]
node_type: implementation-plan
is_session: true
layer: [architecture, domain]
nature: [technical, procedural]
status: active
created: 2026-03-24
timestamp: 2026-03-24T21:06:00-03:00
expires: 2026-05-23
conversation_id: d709b571-47a5-4344-9e91-7e36df7eb84f
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Phase 1 lift-and-shift of the entire CCB document validation pipeline (24 files, 14 source modules, 612 tests) from aquisicao to documents_validation — a foundational domain boundary change that shapes all future pipeline work."
---

# Phase 1 Migration: CCB Validation Pipeline to `documents_validation` Domain

**Date:** 2026-03-24 21:06 (UTC-3)
**Tags:** #documents-validation #migration #ccb #pipeline

## Summary

This session executed the complete Phase 1 "Lift and Shift" migration of the CCB document validation pipeline from the `aquisicao` domain to a new dedicated `documents_validation` domain. The migration involved physically relocating 24 source files (use cases, services, domain logic, tasks, management commands, and tests), creating 2 new test files via embedded test extraction, rewriting 29 files for import paths (21 `from` statements + 8 `mock.patch` string literals), and updating 3 infrastructure configuration files. The migration concluded with a full test suite verification: **1795 passed, 0 failures, 0 errors**.

The session began by auditing the existing migration implementation spec (`documents-validation-migration-implementation.md` v1.3.0), which had been prepared in prior sessions. The audit revealed 3 issues that needed fixing during execution: a stale `__init__.py` re-export in `aquisicao/tasks/`, mock.patch string literals not caught by import-level rewriting, and an unlisted import consumer (`scripts/compute_distance_matrices.py`). All were resolved during execution.

The session concluded with a thorough test coverage audit confirming that all 14 source modules in the new domain have test coverage (13 directly or transitively covered, 1 pre-existing gap in `extract_id_gemini.py`), and an import hygiene check returning zero stale references for all 10 moved module paths.

### Phase 1 Execution — File Moves and Import Rewriting

- **Problem/Goal:** Physically decouple the document validation pipeline from `aquisicao` into its own domain without altering business logic, preserving 100% test coverage.
- **Decision:** Execute as a single-shot Python script (`/tmp/migrate_ccb.py`) to handle file moves, import rewrites, and infrastructure config atomically. This avoided the risk of partial moves from interrupted shell commands (which had occurred in the previous session).
- **Changes:**
  - 24 files moved from `aquisicao` → `documents_validation` (3 use cases, 3 services, 5 domain modules + 7 JSON configs, 1 task, 2 management commands, 8 test files)
  - 21 files rewritten for `from domains.aquisicao.X import` → `from domains.documents_validation.X import`
  - `conftest.py` copied from `aquisicao/tests/` to `documents_validation/tests/`

### Embedded Test Extraction

- **Problem/Goal:** Two domain modules (`cross_check_extracted_fields.py`, `kit_matching.py`) had their unit tests embedded inside host test files (`test_field_column_mapping.py`, `test_kit_management.py`) that must remain in `aquisicao`. Simply moving those host files would have moved tests for CRUD, API endpoints, and event logging that belong in `aquisicao`.
- **Decision:** Extract the relevant test classes into dedicated files in the new domain and remove them from the host files to prevent duplicate execution.
- **Changes:**
  - Created `test_cross_check_extracted_fields.py` with 12 extracted test classes (domain logic, numeric tolerance, Brazilian format, pipeline integration)
  - Created `test_kit_matching.py` with 2 extracted test classes (kit evaluation + empresa_geradora fallback, 17 test methods total)
  - Trimmed `test_field_column_mapping.py` from 799 → 631 lines (9 remaining classes)
  - Trimmed `test_kit_management.py` from 1266 → 970 lines (13 remaining classes)

### Infrastructure and Mock.Patch Fixes

- **Problem/Goal:** After file moves and import rewrites, the test suite failed with (a) `ModuleNotFoundError` on Django startup, (b) `AttributeError` in mock.patch string arguments.
- **Decision:** Fix the stale `__init__.py` re-export, then run a second-pass string replacement targeting `mock.patch()` string literals in test files.
- **Changes:**
  - Removed `from .bulk_import_tasks import *` from `domains/aquisicao/tasks/__init__.py`
  - Added `domains.documents_validation.repositories` to `INSTALLED_APPS` in `settings.py`
  - Added `domains.documents_validation` to Celery autodiscover in `celery.py`
  - Updated 8 test files with mock.patch string literal rewrites

### Migration Spec Update and Test Coverage Audit

- **Problem/Goal:** Document the execution for future reference and verify no tests were lost.
- **Decision:** Update `documents-validation-migration-implementation.md` to v2.0.0 (status: completed) with a full Execution Walkthrough section.
- **Changes:**
  - Added execution timeline, issues found, files changed summary, test results, per-file test distribution, test coverage audit table, and import hygiene results to the spec
  - Confirmed all 14 source modules have coverage; only `extract_id_gemini.py` lacks tests (pre-existing gap)

Key outputs:
- `domains/documents_validation/` — new domain with 14 source modules and 10 test files (612 tests)
- `documents-validation-migration-implementation.md` v2.0.0 — completed spec with execution walkthrough
- `test_cross_check_extracted_fields.py` — new extracted test file (12 classes)
- `test_kit_matching.py` — new extracted test file (2 classes, 17 methods)

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/documents_validation/tests/test_cross_check_extracted_fields.py` | 12 classes extracted (~30 tests) | Cross-check validation: extracted OCR data vs database installment records. Covers numeric tolerance, Brazilian format parsing, date comparison, case-insensitive matching, complementary data resolution, and pipeline integration. |
| `domains/documents_validation/tests/test_kit_matching.py` | 2 classes extracted (17 tests) | Kit completion evaluation: OR logic, greedy consumption, template-specific matching, legacy format support, empresa_geradora fallback. Determines if a document folder satisfies product line document requirements. |
| All 8 moved test files | Imports + mock.patch strings updated | Same business rules as before — no logic changes, only path rewrites. |
| `domains/aquisicao/tests/test_field_column_mapping.py` | 12 classes removed | Remaining 9 classes still cover TemplateFieldColumnMapping CRUD, API endpoints, event logging, unique constraints. |
| `domains/aquisicao/tests/test_kit_management.py` | 2 classes removed | Remaining 13 classes still cover KitType CRUD, ProdutoKitConfig management, API endpoints, templates-by-doc-type. |

**Why these tests matter:** The extracted cross-check tests validate the business-critical path where OCR data is verified against actual database records — if this fails in production, contracts could be approved with incorrect financial data. The kit matching tests validate the document completeness gate — if this logic breaks, batches could be approved with missing required documents, causing compliance failures.

## Key Decisions

- **Atomic migration script:** Used a single Python script instead of sequential shell commands to avoid partial-move failures (which had occurred in the prior session).
- **Two-phase import rewriting:** Phase 1 handled `from X import Y` statements; Phase 2 handled `mock.patch()` string literals, which are invisible to import-level tools.
- **Embedded test extraction over full host-file move:** Chose surgical extraction of domain-specific test classes rather than moving entire host files, preserving the host files' coverage of aquisicao-specific CRUD and API tests.
- **Pre-existing test gap accepted:** `extract_id_gemini.py` has no tests and this was a pre-existing condition, not introduced by migration. No action taken — this is a backlog item.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/**` (full tree) | `created` | New domain: 14 source modules, 10 test files, conftest, __init__.py files |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/use_cases/manage_document_template.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/use_cases/run_ocr.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/services/ocr_service.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/services/gemini_extraction.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/services/gemini_config.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/universal_extraction.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/cross_check_extracted_fields.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/kit_matching.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/template_matching_config.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/bulk_import_config.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/domain/extraction_configs/` | `deleted` | Directory moved to documents_validation |
| `domains/aquisicao/tasks/bulk_import_tasks.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tasks/__init__.py` | `modified` | Removed stale `from .bulk_import_tasks import *` re-export |
| `domains/aquisicao/repositories/management/commands/extract_id_gemini.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/repositories/management/commands/load_extraction_configs.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_bulk_import.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_gemini_extraction.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_manage_document_template.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_ocr.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_universal_extraction.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_load_extraction_configs.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_document_template.py` | `deleted` | Moved to documents_validation |
| `domains/aquisicao/tests/test_field_column_mapping.py` | `modified` | Removed 12 extracted cross-check test classes (799→631 lines) |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Removed 2 extracted kit matching test classes (1266→970 lines) |
| `domains/aquisicao/interfaces/views.py` | `modified` | Import rewrites for process_bulk_import lazy imports |
| `domains/aquisicao/use_cases/manage_kit_type.py` | `modified` | Import rewrite for template_matching_config |
| `house_project/settings.py` | `modified` | Added documents_validation.repositories to INSTALLED_APPS |
| `house_project/celery.py` | `modified` | Added documents_validation to Celery autodiscover |
| `scripts/sanitize_document_payloads.py` | `modified` | Import rewrite for ocr_service |
| `scripts/update_averbacao_config.py` | `modified` | Import rewrite for ocr_service |
| `scripts/compute_distance_matrices.py` | `modified` | Import rewrite for template_matching_config |
| `query_ccb_distances.py` | `modified` | Import rewrites for template_matching_config, universal_extraction |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `modified` | Updated to v2.0.0 (status: completed). Added execution walkthrough, test audit, import hygiene results. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `implements` | This session executed Phase 1 of the two-phase migration plan described in the discovery |
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `resolves` | The implementation plan was fully executed and updated to status: completed |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `extract_id_gemini.py` has zero test coverage | Test coverage audit | MEDIUM | Pre-existing gap — not caused by migration |
| Phase 2: Break down `process_bulk_import.py` God File (~1800 lines) into step functions | Discovery doc Phase 2, Step 2.1 | ⚠️ HIGH | Not started |
| Phase 2: Move business orchestration (batch state transitions, checklist, cross-check) back to `aquisicao` | Discovery doc Phase 2, Step 2.2 | ⚠️ HIGH | Not started |
| Phase 2: Introduce Repository layer in `documents_validation/repositories/` | Discovery doc Phase 2, Step 2.3 | MEDIUM | Not started |
| Phase 2: Enforce `empresa_geradora`-based extraction routing | Discovery doc Phase 2, Step 2.4 | MEDIUM | Not started |
| `documents_validation` still imports from `aquisicao.repositories.models` | Accepted Phase 1 tech debt | ⚠️ HIGH | Known — resolved in Phase 2 |

## Next Steps

### Immediate (before starting any new feature work on the pipeline)

1. **Commit and push** the migration. Run `npx gitnexus analyze --embeddings` to update the code index — the current index is stale after 24 file moves.

### Phase 2: Refactoring & Logical Decoupling

Phase 2 resolves the architectural debt accepted in Phase 1. The `documents_validation` domain currently has hard imports from `aquisicao.repositories.models` — this is the core coupling that Phase 2 eliminates.

2. **Step 2.1 — Break down the `process_bulk_import.py` God File.** The ~1800-line orchestrator should be decomposed into cohesive step functions:
   - `_step_classify_dvs` → standalone classification module
   - `find_matching_template` → template matching module
   - `_step_extract_fields` → extraction orchestration module
   - `_step_kit_evaluation` → kit evaluation module
   - `_step_contract_matching` → contract matching module
   - Each step function gets its own file, its own tests, and clear input/output contracts.

3. **Step 2.2 — Move business orchestration back to `aquisicao`.** Domain-specific logic that was moved alongside the pipeline in Phase 1 but logically belongs in `aquisicao`:
   - `BulkImportBatch` state transitions (approve, complete)
   - `generate_checklist` business logic
   - `cross_check_extracted_fields.py` (validates against `aquisicao` models)
   - These become `aquisicao` use cases that *call* `documents_validation` services.

4. **Step 2.3 — Introduce a Repository layer.** Create `documents_validation/repositories/` with abstract interfaces (ports) that `aquisicao` implements. This eliminates the `from domains.aquisicao.repositories.models import X` coupling:
   - Define ports: `DocumentStore`, `TemplateStore`, `BatchStore`
   - `aquisicao` provides concrete implementations via dependency injection
   - `documents_validation` depends only on its own ports, never on `aquisicao`

5. **Step 2.4 — Enforce `empresa_geradora`-based extraction routing.** Replace the monolithic regex configs with smaller, target-specific extraction configurations keyed by the document originator (`empresa_geradora`):
   - Each `empresa_geradora` gets its own extraction config set
   - The pipeline routes to the correct config based on the matched template's `empresa_geradora`
   - This eliminates the fragile "God Object" regex patterns

### Phase 2 Spec Prerequisite

Before starting Phase 2 execution, a new implementation plan spec should be written at `specs/002-ccb-validation-workflow/documents-validation-refactoring-implementation.md` detailing:
- Exact file-level plan for the God File decomposition
- Port/adapter interface definitions for the Repository layer
- Dependency injection wiring strategy
- Test migration plan (which tests stay, which move back with business logic)

## Open Questions

- Should `cross_check_extracted_fields.py` move back to `aquisicao` in Phase 2 (since it validates against `AquisicaoManual` installments), or should it stay in `documents_validation` with the cross-check logic abstracted behind a port?
- What is the right granularity for the step function decomposition? One file per pipeline step, or group related steps?
