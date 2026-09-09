---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-24
timestamp: 2026-03-24T12:11:25-03:00
expires: 2026-05-23
conversation_id: 63294bd4-1554-48d7-ba6c-fb5c11b6ed46
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/missing-critical-reason-and-kit-quality-gate-implementation.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Introduced REASON_MISSING_CRITICAL distinction and kit counter quality gate — affects operator visibility and kit matching accuracy across the bulk import pipeline."
---

# Missing Critical Reason Code & Kit Counter Quality Gate Implementation

**Date:** 2026-03-24 12:11 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session implemented the two-part spec `missing-critical-reason-and-kit-quality-gate-implementation.md`. The first part introduces a new `REASON_MISSING_CRITICAL` reason code to disambiguate "truly no template found" from "template matched but critical fields incomplete." The second part adds a quality gate to the kit counter so only documents with successfully extracted mandatory fields count toward `documents_matched`. Before implementation, all spec claims were cross-referenced against the live codebase and verified correct. Impact analysis via GitNexus confirmed all modified symbols had LOW risk.

### Part 1 — REASON_MISSING_CRITICAL Reason Code
- **Problem:** `REASON_NO_TEMPLATE` was used for two semantically different situations: truly no template vs. template matched but critical fields incomplete. This confused operators.
- **Decision:** Add `REASON_MISSING_CRITICAL = 'missing_critical'` as a distinct reason code. Also reduce Averbação Dataprev critical fields from 5 to 2 (only `cpf` and `nome_trabalhador`).
- **Changes:** Added the constant to both `DocumentVersion` and `DocumentsFolderResult` models. Replaced `REASON_NO_TEMPLATE` with `REASON_MISSING_CRITICAL` at 3 pipeline locations (Gemini unmatched path, universal partial extraction, matched non-CCB template). Updated `averbacao_dataprev.json` critical fields. Updated 8 test assertions.

### Part 2 — Kit Counter Quality Gate
- **Problem:** `_step_kit_evaluation` counted any doc with a `doc_type` toward the kit, even if extraction failed. `_update_batch_counters` overwrote `documents_matched` with raw SQL, erasing kit evaluation results.
- **Decision:** Add a `_KIT_QUALIFYING_REASONS` frozenset filter and stop the finalization SQL from overwriting `documents_matched`.
- **Changes:** Added reason filter to `_step_kit_evaluation`. Removed `documents_matched` from `_update_batch_counters` raw SQL. Fixed `test_excludes_ccb_from_folder_docs` to set qualifying reasons. Added 5 new kit gate tests.

Key outputs:
- `models.py` — `REASON_MISSING_CRITICAL` constant on both models
- `process_bulk_import.py` — 3 reason replacements, quality gate filter, SQL fix
- `averbacao_dataprev.json` — critical fields reduced to 2
- `test_parallel_bulk_import.py` — 8 assertions updated, 1 test fixed, 5 new tests added

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | 8 existing tests: reason assertion `NO_TEMPLATE` → `MISSING_CRITICAL` | Documents with matched templates but incomplete critical fields must show `missing_critical`, not `no_template` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_excludes_ccb_from_folder_docs` (fixed) | Non-CCB DVs must have a qualifying reason to count in kit evaluation |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_excludes_dvs_without_qualifying_reason` | DVs with `no_template` reason must NOT count toward kit |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_excludes_dvs_with_missing_critical_reason` | DVs with `missing_critical` reason must NOT count toward kit |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_includes_dvs_with_extracted_reason` | DVs with `extracted_not_cross_checked` DO count toward kit |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_includes_dvs_with_ocr_match_reason` | DVs with `ocr_match` DO count toward kit |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_includes_dvs_with_cross_check_failed_reason` | DVs with `cross_check_failed` DO count toward kit |

**Why these tests matter:** Without the quality gate, operators see inflated kit completion counters for documents that failed extraction — leading to false confidence that a contract's documentation is complete when critical fields are actually missing.

## Key Decisions

- **`REASON_MISSING_CRITICAL` vs renaming existing code:** Chose to add a new reason code rather than modifying `REASON_NO_TEMPLATE` semantics, preserving backward compatibility for truly unmatched documents.
- **`cross_check_failed` included in qualifying reasons:** Extraction succeeded (mandatory fields present), only DB-side validation disagreed — the document should still count toward kit completion.
- **`_update_batch_counters` stops overwriting `documents_matched`:** The kit evaluation result from `_run_kit_eval` is now the single source of truth for this counter.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `REASON_MISSING_CRITICAL` to `DocumentVersion` and `DocumentsFolderResult` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | 3 reason replacements, `_KIT_QUALIFYING_REASONS` frozenset + filter in `_step_kit_evaluation`, removed `documents_matched` overwrite from `_update_batch_counters` |
| `domains/aquisicao/domain/extraction_configs/averbacao_dataprev.json` | `modified` | Reduced critical_fields from 5 to 2 (`cpf`, `nome_trabalhador`) |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | 8 assertion updates, 1 test fix, 5 new tests |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| DB migration: update template ID 10 `critical_fields` | Spec Part 1 | ⚠️ HIGH | Pending — JSON config updated but DB template row needs SQL migration |
| `TestTwoPhaseKitCount` tests may need reason updates | Spec Part 2 | MEDIUM | Not yet verified — tests should still pass if DVs get reasons from pipeline |
| Full test suite run | Verification | ⚠️ HIGH | User started `run_tests.py` — results not yet confirmed |
