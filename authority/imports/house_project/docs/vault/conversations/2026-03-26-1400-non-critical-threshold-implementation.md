---
tags: [ccb-validation, pipeline, ccb]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T14:00:00-03:00
expires: 2026-05-25
conversation_id: non-critical-threshold-impl-2026-03-26
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md, specs/002-ccb-validation-workflow/backlog-ccb.md, specs/002-ccb-validation-workflow/upload-flow-diagram.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Implemented non-critical field threshold gate across all extraction paths, fixed critical field falsy bug, and added field checks to run_ocr.py — completing Phase 5 of the CCB pipeline with 28 new tests."
user_satisfaction: {mean: 8, min: 7, max: 9, std: 0.7}
---

# Non-Critical Threshold Implementation & Critical Field Completeness

**Date:** 2026-03-26 14:00 (UTC-3)
**Tags:** #ccb-validation #pipeline #ccb

## Summary

This session completed Phase 5 of the CCB validation pipeline — the critical field check and non-critical threshold gate after OCR extraction. The work began with a review of what could be done while waiting for GCP account owner action on `terraform apply`, which led to choosing the CCB validation pipeline backlog. A thorough code review revealed that critical field checks were already partially implemented in `process_bulk_import.py` (across three step functions), but the implementation plan was stale and didn't reflect this. The session then discovered a subtle falsy bug in the existing checks and identified that non-critical threshold validation and `run_ocr.py` field checks were completely missing.

The implementation followed strict TDD: 28 new tests were written across 3 test files before any production code, all verified to fail for the right reasons before implementing. A shared `field_validation.py` helper module was created with `check_critical_fields()` and `check_non_critical_coverage()` pure functions. The `run_ocr.py` pipeline gained critical field (step 6b) and non-critical threshold (step 6c) checks with event logging. The `process_bulk_import.py` inline `all()` pattern was replaced with the shared helpers in 3 call sites.

### Stale Implementation Plan Discovery

- **Problem/Goal:** The implementation plan at `ccb-critical-field-check-implementation.md` referenced line numbers and code paths from before the refactor into `_step_*` functions, and didn't know critical field checks already existed.
- **Decision:** Updated the plan to version 1.1.0 with accurate current status, marking Phase 5a (critical in bulk import) as done with known bug, and 5b/5c/5d as not done.
- **Changes:** Updated frontmatter to `status: partially-implemented`, added "Current Status" section with implementation matrix, corrected the "Remaining gap" description.

### Falsy Bug in Critical Field Check

- **Problem/Goal:** The existing `all(fields.get(k) for k in critical)` pattern uses Python truthiness. While `'0'` (string) is truthy so the bug doesn't manifest for regex extraction (which always returns strings), the pattern is semantically incorrect and fragile — it would break if any extraction path returned numeric `0` or `False`.
- **Decision:** Replace with explicit `is None or == ''` check via shared helper `check_critical_fields()`, which is correct for all value types.
- **Changes:** Replaced inline `all()` in `_step_extract_matched_non_ccb()`, `_step_extract_unmatched()`, and `_step_extract_matched_ccb()`.

### Non-Critical Threshold Gate

- **Problem/Goal:** `DocumentTemplate` has `non_critical_fields` and `non_critical_threshold` columns populated in the database, but no code reads or enforces them. Documents with poor non-critical field coverage were passing through as `extracted_not_cross_checked`.
- **Decision:** Add a third quality gate after critical fields that checks `check_non_critical_coverage()`. If coverage % < threshold, mark as `pendente/low_non_critical_coverage`.
- **Changes:** Added `REASON_LOW_NON_CRITICAL` constants to both `DocumentVersion` and `DocumentsFolderResult`. Implemented the check in `_step_extract_matched_non_ccb()` and `run_ocr.py`.

### Critical Field Check in run_ocr.py

- **Problem/Goal:** `run_ocr.py` had zero field validation — it unconditionally marked documents as `pendente/ocr_match` regardless of whether critical fields were extracted.
- **Decision:** Add both critical and non-critical checks between extraction (step 6) and persist (step 7), with `EventLogEntities` emission on failure.
- **Changes:** Added steps 6b (critical check) and 6c (non-critical threshold) with early return and event logging.

### Flow Diagram Update

- **Problem/Goal:** The pipeline flow diagram didn't reflect the three-tier quality gate structure.
- **Decision:** Update the Mermaid diagram and prose to show all 3 gates with their failure paths, and add an English context summary.
- **Changes:** Added decision diamonds after quality gate nodes showing `REASON_LOW_QUALITY_IMAGE`, `REASON_MISSING_CRITICAL`, and `REASON_LOW_NON_CRITICAL_COVERAGE` failure paths. Added English "Context" section with updated Phase 2 description.

Key outputs:
- `domains/documents_validation/services/field_validation.py` — shared pure-function helpers
- `domains/documents_validation/tests/test_field_validation.py` — 14 unit tests
- 10 new tests in `test_ocr.py`, 4 new tests in `test_parallel_bulk_import.py`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/documents_validation/tests/test_field_validation.py` | 14 new (7 critical, 7 non-critical) | Field values of `''`, `None`, or absent key are missing; `'0'` is valid; coverage % computed correctly against threshold |
| `domains/documents_validation/tests/test_ocr.py` | 10 new (5 critical, 5 non-critical) | `run_ocr_for_version` must check critical fields and non-critical threshold after extraction; failures emit `DOCUMENT_OCR_EXTRACTION_FAILED`; critical check runs before non-critical |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | 4 new (3 non-critical, 1 falsy regression) | `_step_extract_matched_non_ccb` must enforce non-critical threshold; field value `'0'` must not be treated as missing |

**Why these tests matter:** Without critical field validation, documents with empty mandatory fields (CPF, contract number) would be marked as successfully extracted, passing through to cross-check and potentially being approved with incomplete data. Without the non-critical threshold, documents missing most supplementary fields would be treated identically to fully-extracted ones, reducing data quality assurance.

## Key Decisions

- **Shared helper over inline checks:** Created `field_validation.py` as a pure-function module importable by both `run_ocr.py` and `process_bulk_import.py`, avoiding cross-module import issues.
- **Explicit None/'' check over truthiness:** `check_critical_fields()` uses `is None or == ''` instead of `all()` truthiness to correctly handle `'0'` and other falsy-but-valid values.
- **Sequential gate evaluation:** Quality gates run in strict order (OCR quality → critical → non-critical), and the first failure determines the reason code — no short-circuit skipping.
- **Event logging on field failures:** Both critical and non-critical failures emit `DOCUMENT_OCR_EXTRACTION_FAILED` via `log_entity_event_safe()` with metadata including missing field names and threshold details.
- **Module location:** `field_validation.py` placed in `domains/documents_validation/services/` (not `domains/aquisicao/services/` as the stale plan suggested) since it belongs to the documents_validation domain.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/services/field_validation.py` | `created` | Pure helpers: `check_critical_fields()`, `check_non_critical_coverage()` |
| `domains/documents_validation/use_cases/run_ocr.py` | `modified` | Added steps 6b (critical check) and 6c (non-critical threshold) with event logging |
| `domains/documents_validation/use_cases/process_bulk_import.py` | `modified` | Replaced inline `all()` with `check_critical_fields()` in 3 call sites; added non-critical threshold in `_step_extract_matched_non_ccb()` |
| `domains/aquisicao/repositories/models.py` | `modified` | Added `REASON_LOW_NON_CRITICAL` to `DocumentVersion` and `DocumentsFolderResult` |
| `domains/documents_validation/tests/test_field_validation.py` | `created` | 14 unit tests for field validation helpers |
| `domains/documents_validation/tests/test_ocr.py` | `modified` | 10 new tests for run_ocr critical/non-critical field checks |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `modified` | 4 new tests for non-critical threshold and falsy regression |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` | `modified` | Updated to v1.1.0: added current status matrix, corrected stale line numbers, split Phase 5 into 5a/5b/5c/5d |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `modified` | Marked Rule E4 critical check as done; rewrote non-critical threshold item with accurate remaining work |
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Updated Mermaid diagram with 3-tier quality gates and failure paths; added English context summary |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Non-critical threshold in `_step_extract_unmatched()` | Code review | MEDIUM | Not done — Gemini/universal path doesn't check non-critical threshold |
| Non-critical threshold in `_step_extract_matched_ccb()` | Code review | MEDIUM | Not done — CCB path checks critical for cascade but not non-critical |
| Event logging on critical field failure in `process_bulk_import.py` | Code review | MEDIUM | Not done — existing critical checks don't emit `EventLogEntities` |

## Connections

- **validates:** `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` — Phase 5 implementation plan
- **updates:** `specs/002-ccb-validation-workflow/backlog-ccb.md` — Rule E4 and non-critical threshold backlog items
- **updates:** `specs/002-ccb-validation-workflow/upload-flow-diagram.md` — Pipeline flow diagram
