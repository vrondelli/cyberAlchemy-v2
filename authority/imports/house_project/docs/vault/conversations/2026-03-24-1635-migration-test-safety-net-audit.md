---
tags: [documents-validation, pipeline, ccb]
node_type: audit
is_session: true
layer: [application, domain]
nature: [reference, technical]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:35:00-03:00
expires: 2026-05-23
conversation_id: 31c484cc-8263-456e-9b5f-ba1a22020570
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced the complete test extraction code for 43 tests across 2 domain modules (cross_check + kit_matching) that must pass to confirm the documents_validation migration preserves behavioral parity."
---

# Migration Test Safety Net Audit

**Date:** 2026-03-24 16:35 (UTC-3)
**Tags:** #documents-validation #pipeline #ccb

## Summary

This session audited the `documents-validation-migration-implementation.md` specification to identify every test that must be running and green before, during, and after the migration of the CCB validation pipeline from the `aquisicao` domain to the `documents_validation` domain. The goal was to build a "safety net" — a set of tests that, when all passing, proves the system behaves identically to today.

The audit covered all 10 test files involved in the migration (8 direct-move files + 2 files with embedded tests), the `conftest.py` shared fixtures, and the full module-to-test coverage map. The key finding was that **no new tests need to be written** — every module being migrated already has test coverage. However, two test extraction operations are required to split embedded test classes into standalone files.

The session produced a comprehensive document (`migration-test-safety-net.md`) containing the complete, ready-to-use source code for three new files: `conftest.py`, `test_cross_check_extracted_fields.py` (26 tests, 12 classes), and `test_kit_matching.py` (17 tests, 2 classes) — all with post-migration import paths pre-applied.

### Test Coverage Audit
- **Problem/Goal:** Determine which tests are needed to guarantee the migration preserves behavioral parity with the current system.
- **Decision:** Existing test suite is sufficient; no new tests needed. Two embedded test extractions are required.
- **Changes:** Created `migration-test-safety-net.md` with full test source code.

### Embedded Test Identification
- **Problem/Goal:** Two test files (`test_field_column_mapping.py` and `test_kit_management.py`) contain tests for migrated modules mixed with `aquisicao`-only tests.
- **Decision:** 12 cross-check test classes (L256–L799) and 2 kit-matching test classes (L974–L1266) will be copied to new files in `documents_validation/tests/` and removed from the originals.
- **Changes:** Documented the exact line ranges, class names, and test counts for each extraction.

### Conftest Fixture Analysis
- **Problem/Goal:** Determine which shared fixtures from `aquisicao/tests/conftest.py` are needed by the migrated tests.
- **Decision:** Most test files define their own fixtures locally. The new conftest needs `test_user`, `upload_file`, `remessa_pendente`, `remessa_aprovado`, and CSV helper functions.
- **Changes:** Full `conftest.py` source included in the safety-net document.

Key outputs:
- `migration-test-safety-net.md` — Complete test code for all 3 files to create during migration (43 tests total)

## Key Decisions

- **No new tests needed:** Every migrated module already has test coverage; the safety net is the existing suite itself.
- **Import path strategy:** All extracted test files use `domains.documents_validation.*` import paths, ready for post-migration.
- **Fixture isolation:** Kit-matching tests get their own `operator` and `ccb_template` fixtures to avoid collisions with the original `test_kit_management.py` fixtures.

## Files Changed

### Code

No code files were changed in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `migration-test-safety-net.md` | `created` | Complete test gap analysis with full source code for 3 new test files |

## Connections

- **validates:** [documents-validation-migration-implementation.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md) — The test safety net validates the migration spec's verification plan by providing the exact tests and commands to run.

## Open Questions

- Should the pre-migration baseline be captured as a CI artifact before starting migration work?
- The `extract_id_gemini.py` management command has only indirect test coverage (via `test_gemini_extraction.py` functional overlap) — is a dedicated test needed?
