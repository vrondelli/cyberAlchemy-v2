---
tags: [ccb, phase5, spec-review, critical-fields]
layer: domain
nature: reference
status: active
created: 2026-03-14
timestamp: 2026-03-14T00:00:00-03:00
expires: 2026-05-13
conversation_id: 76dd9637-b667-45f4-b0f8-7c2a9e5719ad
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-14
expected_importance: 5
importance_rationale: "Fixed critical field check spec aligning domain validation rules with implementation reality."
---

# Fixing Critical Field Check Spec

**Date:** 2026-03-14
**Tags:** #ccb #phase5 #spec-review #critical-fields

## Summary

Reviewed `ccb-critical-field-check-implementation.md` (Phase 5 of the CCB refactoring) and identified 6 problems ranging from crash-causing bugs to design inconsistencies. All issues were fixed by rewriting the spec.

Key outputs:
- `ccb-critical-field-check-implementation.md` — rewrote with all 6 fixes applied

## Conversation Arc

**Started:** User asked to review `ccb-critical-field-check-implementation.md` for problems.

**Ended:** All 6 identified problems were fixed in the spec; user approved the changes.

## Key Decisions

- **Falsy check replacement:** Replaced `not fields.get(f)` with an explicit `None`/`''` check via a `_check_critical_fields()` helper, so legitimate values like `0` or `False` are not flagged as missing.
- **Critical check placement in `_process_folder`:** Moved the check to **after** the `id_titulo` guard so that `numero_ccb` missing triggers the more specific `REASON_NO_ID` instead of the generic `REASON_MISSING_CRITICAL`.
- **Event emission parity:** Added `EventLogEntities.objects.create(...)` to the `_process_folder` path to match the `run_ocr.py` path — both now emit `DOCUMENT_OCR_EXTRACTION_FAILED` on missing critical fields.
- **Line number removal:** Replaced hardcoded line numbers with descriptive step anchors to prevent drift.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `REASON_MISSING_CRITICAL` must be added to `DocumentsFolderResult` model | Spec review | Documented in spec, not yet implemented |
| `_check_critical_fields` helper needs to be created | Spec review | Documented in spec, not yet implemented |
| New test `test_zero_value_field_not_treated_as_missing` | Spec review | Added to spec test plan |
| New test `test_process_folder_critical_field_check_after_id_titulo` | Spec review | Added to spec test plan |

## Backlog Items Added

- None added to backlog (all items captured in the spec itself).

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-critical-field-check-implementation.md]] | `updates` | Rewrote Phase 5 spec fixing 6 identified problems |
|[[002-ccb-validation-workflow/ccb-refactor-phases.md]]| `contextualizes` |Phase roadmap containing Phase 5|
