---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T23:28:00-03:00
expires: 2026-05-22
conversation_id: 57538a35-ffdf-451f-b7f2-dfa92395909f
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Decomposed the 570-line `_process_folder` God Function into 8 focused step functions with clear single-responsibility boundaries, establishing the structural pattern for all future pipeline modifications."
user_satisfaction: 7
user_satisfaction_min: 5
user_satisfaction_max: 8
user_satisfaction_std: 1.2
---

# CCB Pipeline God Function Decomposition

**Date:** 2026-03-23 23:28 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session completed the Part B structural refactoring of the CCB bulk import pipeline in `process_bulk_import.py`, then went further to decompose the 570-line `_process_folder` God Function into 8 focused step functions. The refactoring was driven by the `ccb-flow-refactor.md` plan and the user's directive that each function should handle exactly one pipeline stage. All 1664 tests pass after the changes.

The session began by implementing the remaining Part B items from the refactor plan: creating `_try_gemini_extraction` helper to consolidate 4 duplicate Gemini extraction blocks, hardening download failure handling (replacing silent `continue` with explicit status/reason), consolidating `dv.save()` with dirty sets, moving 3 inline imports to top-level, removing dead variables, and renaming `MIN_IDENTIFICACAO_OCR_CHARS` → `MIN_OCR_CHARS`. These changes introduced 10 test failures caused by mock patches targeting definition-site paths instead of consumer-site paths, which were systematically fixed across 12 patch sites in `test_parallel_bulk_import.py`.

After all tests passed, the user requested further decomposition so that each function handles a single pipeline stage. `_process_folder` was split into: `_step_classify_dvs`, `_step_extract_unmatched`, `_step_extract_matched_non_ccb`, `_step_extract_matched_ccb`, `_step_extract_and_match`, `_step_kit_evaluation`/`_run_kit_eval`, `_step_contrato_lookup`, `_step_cross_check`, and `_step_rename_documents`. The coordinator `_process_folder` itself shrunk to ~40 lines.

### Part B Structural Improvements
- **Problem/Goal:** `_process_folder` had 4 duplicate Gemini extraction blocks, scattered inline imports, silent download failures, and excessive `dv.save()` calls.
- **Decision:** Consolidate via `_try_gemini_extraction` helper, dirty set pattern, top-level imports, and explicit error marking.
- **Changes:** All Part B items from `ccb-flow-refactor.md` implemented. `MIN_IDENTIFICACAO_OCR_CHARS` renamed to `MIN_OCR_CHARS` in `bulk_import_config.py`.

### Test Patch Path Migration
- **Problem/Goal:** Moving `extract_holerite_with_gemini`, `extract_fields_universal`, and `infer_empresa` to top-level imports caused 10 test failures because mocks patched the definition-site path.
- **Decision:** Update all 12 patch sites to use consumer-site namespace (`process_bulk_import.*`).
- **Changes:** Fixed patches across `test_parallel_bulk_import.py` at lines 409, 746, 766, 3882-3883, 4038, 4062, 4291, 4539, 4561, 4601, 4757.

### God Function Decomposition
- **Problem/Goal:** `_process_folder` was ~570 lines, violating the user's requirement that each function handle exactly one pipeline stage.
- **Decision:** Extract 8 step functions (no logic changes, pure structural extraction). Accept LOC increase (1468→1560) in exchange for functions that are individually <100 lines.
- **Changes:** `_process_folder` is now a 40-line coordinator calling step functions in sequence.

Key outputs:
- `process_bulk_import.py` — Decomposed God Function into step functions
- `bulk_import_config.py` — Renamed constant
- `test_parallel_bulk_import.py` — Fixed 12 mock patch paths

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `test_parallel_bulk_import.py` | 12 patch paths updated across existing tests | Mock patches correctly target consumer-site namespace for `extract_fields_universal`, `extract_holerite_with_gemini`, `infer_empresa` after top-level import refactor |

**Why these tests matter:** The patches ensure that test mocks intercept extraction functions at the correct namespace. Without these fixes, the real extraction functions would execute during tests, causing non-deterministic behavior and database-dependent test failures.

## Key Decisions

- **Step function decomposition:** Each step function accepts explicit parameters and returns explicit outputs rather than sharing mutable state through closures. This makes data flow between pipeline stages visible and testable.
- **`_run_kit_eval` extracted as reusable:** Kit evaluation is called twice (once without CCB, once with CCB after contrato match), so it was extracted as a standalone function rather than staying inline.
- **LOC increase accepted:** Net +92 lines from function signatures and docstrings. The tradeoff is justified by the reduction in per-function cognitive complexity (max ~100 lines vs ~570 lines before).
- **`_step_extract_unmatched` returns `(consumed, ccb_fields)`:** This tuple pattern allows the caller to track CCB state across unmatched documents without the step function needing to know about the broader pipeline context.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Decomposed `_process_folder` into 8 step functions, added `_try_gemini_extraction` helper, consolidated `dv.save()` with dirty sets, moved imports to top-level, removed dead variables |
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Renamed `MIN_IDENTIFICACAO_OCR_CHARS` → `MIN_OCR_CHARS` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Fixed 12 mock patch paths from definition-site to consumer-site namespace |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `referenced` | Implementation plan that drove the Part B structural improvements |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `implements` | This session implements Part B (structural improvements) of the refactoring plan |
