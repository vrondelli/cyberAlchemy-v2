---
tags: [pipeline, acquisition]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T11:00:03-03:00
expires: 2026-05-23
conversation_id: 890b6144-49ef-4ff9-9216-055c05a22a22
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Localized refactor of `_resolve_critical_fields` removing `extraction_config` JSON priority tier, consolidating `DocumentTemplate.critical_fields` column as the single source of truth for quality-gate critical field resolution across the bulk import pipeline."
---

# Simplify `_resolve_critical_fields` — DB Column as Single Source of Truth

**Date:** 2026-03-24 11:00 (UTC-3)
**Tags:** #pipeline #acquisition

## Summary

This session refactored the `_resolve_critical_fields` function in the bulk import pipeline to remove the `extraction_config` JSON blob as a source for critical fields. Previously, the function used a 3-tier priority cascade: (1) `extraction_config['critical_fields']` JSON key, (2) `DocumentTemplate.critical_fields` DB column, (3) default config file. The user identified that the `DocumentTemplate` model should be the single source of truth, making tier 1 redundant and potentially confusing.

The session also uncovered an inline duplicate of the same priority logic in `_step_extract_matched_ccb` (line 802) that was not using the centralized `_resolve_critical_fields` function — this was unified as part of the refactor.

### Critical Fields Priority Simplification
- **Problem/Goal:** `_resolve_critical_fields` had a 3-tier priority cascade where `extraction_config['critical_fields']` JSON key took precedence over the `DocumentTemplate.critical_fields` column, creating ambiguity about which was the source of truth.
- **Decision:** Remove the `extraction_config` parameter entirely. New 2-tier cascade: (1) `DocumentTemplate.critical_fields` column, (2) default config file fallback for unmatched docs.
- **Changes:** Modified `_resolve_critical_fields` signature and body, updated 3 call sites (`_step_extract_unmatched`, `_step_extract_matched_non_ccb`, `_step_extract_matched_ccb`).

### Test Fixture Migration
- **Problem/Goal:** ~20 test fixtures set `critical_fields` inside the `extraction_config` JSON blob, which was the old tier-1 source.
- **Decision:** Move all `critical_fields` declarations from JSON blob to the `DocumentTemplate.critical_fields` column parameter.
- **Changes:** Updated `TestResolveCriticalFields` (rewrote 5→4 unit tests), migrated ~20 template fixtures across integration tests, added `extract_fields_universal` mocks to 3 CCB confidence tests that now trigger the universal fallback cascade due to the default CCB config providing 6 critical fields.

Key outputs:
- `process_bulk_import.py` — Simplified `_resolve_critical_fields`, unified inline duplicate in CCB path
- `test_parallel_bulk_import.py` — Updated all test fixtures to use DB column

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestResolveCriticalFields` (4 tests rewritten) | Critical fields resolution uses DocumentTemplate column as single source of truth |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | ~20 integration test fixtures updated | Quality gate 2 (critical field completeness) works correctly with DB-column-only resolution |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | 3 CCB tests (`test_no_text_found`, `test_confidence_alta`, `test_confidence_nenhuma`) | CCB confidence/reason outcomes remain stable when default config provides critical fields |

**Why these tests matter:** The critical fields resolution drives Quality Gate 2 across the entire extraction pipeline. If `_resolve_critical_fields` returns incorrect or empty lists, documents would either pass QG2 without sufficient data (false positives in production) or fail when they shouldn't (blocking operator workflows).

## Key Decisions

- **DB column is sole source of truth:** `DocumentTemplate.critical_fields` column is now the only place critical fields are defined for matched templates. The `extraction_config` JSON blob no longer participates.
- **Inline duplicate unified:** The CCB path had a hand-rolled version of the same priority logic — replaced with a call to `_resolve_critical_fields(matched, "CCB")`.
- **Default config fallback preserved:** For unmatched documents (no template), the system still falls back to `DEFAULT_EXTRACTION_CONFIGS` JSON files per doc_type.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Simplified `_resolve_critical_fields` (removed `extraction_config` param), updated 3 call sites, unified inline duplicate in `_step_extract_matched_ccb` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Rewrote `TestResolveCriticalFields`, migrated ~20 template fixtures from JSON to DB column, added fallback mocks to 3 CCB tests |

## Verification

Full test suite: **1749 passed, 3 skipped** in 132.70s.
