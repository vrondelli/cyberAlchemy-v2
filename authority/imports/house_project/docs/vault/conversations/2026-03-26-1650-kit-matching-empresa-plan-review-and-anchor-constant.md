---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: domain, application
nature: technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T16:50:17-03:00
expires: 2026-05-25
conversation_id: ""
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md
promoted_candidates: []
expected_importance: 3
importance_rationale: "Reviewed kit-matching empresa filtering plan, confirmed multiple-CCB guard already existed, and added _KIT_EMPRESA_ANCHOR_DOC_TYPE constant to make the CCB anchor doc type explicit and configurable in the bulk import pipeline."
---

# Kit Matching Empresa — Plan Review and Anchor Constant

**Date:** 2026-03-26 16:50 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session reviewed the implementation plan for the kit matching empresa filtering feature (`kit-matching-require-empresa-implementation.md`) before any code was written. The goal was to verify correctness and identify potential issues ahead of execution.

The review surfaced two concerns: a missing named constant for the doc type used as the empresa anchor in kit filtering (hardcoded `'CCB'` strings in the plan), and a question about behavior when multiple CCB files appear in a folder. Investigation of the existing code revealed that the multiple-CCB guard was already fully implemented — `_finalize_folder_multiple_ccb()` and `REASON_MULTIPLE_CCB_FOUND` both existed and were already wired into the pipeline. This saved implementation work and confirmed the plan was correct on that front.

For the anchor constant, a new module-level constant `_KIT_EMPRESA_ANCHOR_DOC_TYPE = 'CCB'` was added to `process_bulk_import.py` alongside `_KIT_QUALIFYING_REASONS`, and the implementation plan was updated to reference it instead of the hardcoded string. A third issue (extra DB query in `_run_kit_eval` during empresa filtering) was acknowledged but intentionally deferred by the user.

### Plan Review — Issues Found

- **Problem/Goal:** Verify the implementation plan for correctness before writing code.
- **Decision:** Two issues identified: (1) `'CCB'` hardcoded in the filtering logic — needs a named constant; (2) question about multiple CCBs in a folder — needs investigation.
- **Changes:** No code changes at this step; issues documented for follow-up.

### Multiple CCB Detection — Already Implemented

- **Problem/Goal:** Determine whether the pipeline already handles multiple CCBs in a folder, or if `REASON_MULTIPLE_CCB_FOUND` and the guard needed to be created.
- **Decision:** Already fully implemented. `_finalize_folder_multiple_ccb()` marks folder and all DVs with `REASON_MULTIPLE_CCB_FOUND`, and the guard runs at line 1453 right after `_step_classify_dvs()`, before any extraction.
- **Changes:** Nothing to do. The discovery doc and the plan were already correct on this point.

### Anchor Constant — `_KIT_EMPRESA_ANCHOR_DOC_TYPE`

- **Problem/Goal:** The plan's filtering logic used `'CCB'` as a hardcoded string in two places inside `_run_kit_eval` and `_step_kit_evaluation`. If the anchor doc type ever changes, it should be a single point of change.
- **Decision:** Add `_KIT_EMPRESA_ANCHOR_DOC_TYPE = 'CCB'` as a module-level constant in `process_bulk_import.py`, grouped with `_KIT_QUALIFYING_REASONS`. Update the implementation plan to reference the constant.
- **Changes:** Constant added to `process_bulk_import.py:1163`. Two occurrences of `'CCB'` in `kit-matching-require-empresa-implementation.md` replaced with `_KIT_EMPRESA_ANCHOR_DOC_TYPE`.

### Deferred — Extra DB Query

- **Problem/Goal:** The plan builds `ccb_template_empresas` via a separate `DocumentTemplate` query before the existing `template_empresas` query — two queries where one would suffice.
- **Decision:** Deferred by user. Not a blocker. Can be optimized when implementing Parte 1 by building `template_empresas` first and reusing it for the kit filter.
- **Changes:** None.

Key outputs:
- `domains/documents_validation/use_cases/process_bulk_import.py` — added `_KIT_EMPRESA_ANCHOR_DOC_TYPE = 'CCB'`
- `specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md` — replaced hardcoded `'CCB'` with `_KIT_EMPRESA_ANCHOR_DOC_TYPE` in filtering pseudocode

## Tests Added/Modified

No tests were added or modified. Existing tests for `_finalize_folder_multiple_ccb` and `test_multiple_ccb_files_mark_folder_pending_review` were confirmed to already cover the multiple-CCB guard. Tests for the kit empresa filtering (Parte 4 of the plan) will be written alongside the implementation of Partes 1–3.

## Key Decisions

- **Multiple CCB guard already done:** `REASON_MULTIPLE_CCB_FOUND`, `_finalize_folder_multiple_ccb`, and the pipeline guard at `ccb_count > 1` were all pre-existing. No implementation needed.
- **Anchor constant:** The doc type used as the empresa reference for kit filtering should be a named constant, not a magic string. `_KIT_EMPRESA_ANCHOR_DOC_TYPE` placed next to `_KIT_QUALIFYING_REASONS` for discoverability.
- **Deferred optimization:** Extra DB query in the filtering path is acceptable for now; to be addressed during Parte 1 implementation.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/use_cases/process_bulk_import.py` | `modified` | Added `_KIT_EMPRESA_ANCHOR_DOC_TYPE = 'CCB'` constant at line 1163, alongside `_KIT_QUALIFYING_REASONS` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md` | `modified` | Replaced hardcoded `'CCB'` strings in filtering pseudocode with `_KIT_EMPRESA_ANCHOR_DOC_TYPE` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Partes 1–3 of kit empresa filtering | `kit-matching-require-empresa-implementation.md` | MEDIUM | pending |
| Optimize `_run_kit_eval` to avoid extra DB query during empresa filtering | session review | LOW | deferred |

## Open Questions

- None blocking. The plan is ready to execute.
