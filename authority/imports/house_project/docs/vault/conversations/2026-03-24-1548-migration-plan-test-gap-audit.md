---
tags: [architecture, pipeline]
node_type: audit
is_session: true
layer: [architecture, domain]
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T15:48:00-03:00
expires: 2026-05-23
conversation_id: 613ffd76-38a1-43b9-9cca-eb47bf59a1cd
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Surfaced a critical test coverage gap in the documents-validation migration plan that would have left cross_check_extracted_fields and kit_matching with zero tests post-migration, preventing a silently broken lift-and-shift."
version: 0.1.0
last_updated: 2026-03-24
---

# Auditing the Documents-Validation Migration Implementation Plan

**Date:** 2026-03-24 15:48 (UTC-3)
**Tags:** #architecture #pipeline

## Summary

This session reviewed `documents-validation-migration-implementation.md` for correctness and migration readiness. The review discovered that two domain modules slated for migration (`cross_check_extracted_fields.py` and `kit_matching.py`) have their unit tests embedded inside test files that are **not** being moved (`test_field_column_mapping.py` and `test_kit_management.py`). Executing the plan as-written would have resulted in zero test coverage for these critical modules in the new domain. The implementation plan was updated (v1.0.0 → v1.1.0) to include explicit test extraction steps.

### Test Coverage Gap in Migration Plan

- **Problem/Goal:** The migration plan claimed to "relocate the entire test suite to preserve 100% test coverage," but the test-to-module mapping was incomplete.
- **Decision:** Add an "Embedded Test Extractions" subsection with explicit instructions to extract cross-check tests (12 classes from `test_field_column_mapping.py`) and kit-matching tests into dedicated files in the new domain.
- **Changes:** Updated `documents-validation-migration-implementation.md` with a `[!WARNING]` block, new `[NEW]` file entries for `test_cross_check_extracted_fields.py` and `test_kit_matching.py`, and a `[MODIFY]` entry for `test_field_column_mapping.py` to remove duplicated tests.

### Python Package Naming

- **Problem/Goal:** Initial review flagged the use of hyphens in package paths (`documents-validation`) as a Python syntax error.
- **Decision:** User confirmed the domain name is intentionally `documents-validation` (hyphenated), so no change was made.

Key outputs:
- `documents-validation-migration-implementation.md` — v1.1.0 with embedded test extraction steps

## Key Decisions

- **Test extraction over test duplication:** Extracted test classes must be removed from the original host files after copying to avoid duplicate test runs.
- **Kit matching test gap acknowledgment:** If `kit_matching.py` is only indirectly tested through pipeline tests (already migrating), the gap is documented as a Phase 2 test-authoring task rather than blocking Phase 1.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `modified` | Added WARNING about embedded tests, added test extraction steps for cross_check and kit_matching, bumped version to 1.1.0 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `documents-validation-migration-discovery.md` | `validates` | Confirmed the discovery document's file listing is accurate |
| `documents-validation-migration-implementation.md` | `refines` | Fixed test coverage gap in the implementation plan |

## Open Questions

- Should the hyphenated `documents-validation` domain name be used as-is, given that Python imports with hyphens require special handling (e.g., `importlib` or directory renaming with underscores)?
