---
tags: [ccb, spec-review, critical-fields, status-semantics]
layer: domain
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T00:00:00-03:00
expires: 2026-05-14
conversation_id: 90d31efa-18c8-4a06-a3fe-11dd6355ce27
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 5
importance_rationale: "Reviewed critical field validation spec, refining status semantics for domain validation."
---

# Critical Field Spec Review & Status Fix

**Date:** 2026-03-15
**Tags:** #ccb #spec-review #critical-fields #status-semantics

## Summary

Reviewed `ccb-critical-field-check-implementation.md` (Phase 5 spec) for inconsistencies against the actual codebase. Identified a major status semantics mismatch: the spec used `completado/ocr_match` in multiple places where the actual code uses `pendente/ocr_match`. Applied 13 edits to align the spec with the rule that `completado` is reserved for after cross-check validation (not yet implemented).

Key outputs:
- `specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md` — fixed all `completado` → `pendente` references in success paths, added explicit notes for `run_ocr.py` step 7 and CCB finalization changes

## Conversation Arc

**Started:** User asked to review `ccb-critical-field-check-implementation.md` for inconsistencies, errors, or problems.

**Ended:** All `completado` references in success paths corrected to `pendente/ocr_match`. User confirmed the rule: `completado` is only after cross-check validation, which is not yet implemented — all documents and folders must be tagged `pendente` until then.

## Key Decisions

- **Status semantics rule:** `completado` is reserved exclusively for after cross-check validation. Until that phase is implemented, every successful document/folder must use `pendente/ocr_match`.
- **Spec accuracy over aspiration:** The "before" code snippets in the spec must match the actual current code (`STATUS_PENDENTE` for non-CCB), not describe an ideal state.
- **Explicit change notes added:** Rather than just fixing proposed code, added explicit "Also modify..." notes for `run_ocr.py` step 7 (lines 91-92) and CCB DV finalization (lines 663-664) since the spec's insert-based changes would otherwise leave these existing `completado` usages untouched.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `run_ocr.py` step 7 still uses `STATUS_COMPLETADO` | Status semantics rule | ⬜ Noted in spec, not yet implemented |
| CCB DV finalization (lines 663-664) still uses `STATUS_COMPLETADO` | Status semantics rule | ⬜ Noted in spec, not yet implemented |
| `REASON_LOW_NON_CRITICAL` missing from `DocumentVersion` and `DocumentsFolderResult` | Phase 5 spec | ⬜ Noted in spec, not yet implemented |
| `EventLogEntities` / `EventLog` imports not mentioned for `process_bulk_import.py` | Phase 5 spec | ⬜ Minor spec gap |
| Cross-check validation (unlocks `completado` status) | Future phase | ⬜ Not started |

## Backlog Items Added

- ⚠️ HIGH — Implement Phase 5 critical field checks per the corrected spec
- MEDIUM — Change existing `completado` usages in `run_ocr.py` and CCB finalization to `pendente`
- LOW — Add `EventLogEntities`/`EventLog` import note to Phase 5 spec

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-critical-field-check-implementation.md]] | `updates` | Fixed status semantics: completado → pendente across all success paths |
|[[002-ccb-validation-workflow/business-rules.md]]| `contextualizes` |Cross-referenced for document identification pipeline context|
|[[aquisicao/use_cases/process_bulk_import.py]]| `contextualizes` |Verified actual status values in `_process_folder` non-CCB and CCB paths|
|[[aquisicao/use_cases/run_ocr.py]]| `contextualizes` |Verified actual status values in `run_ocr_for_version`|
|[[aquisicao/repositories/models.py]]| `contextualizes` |Verified existing model constants and confirmed missing ones|
