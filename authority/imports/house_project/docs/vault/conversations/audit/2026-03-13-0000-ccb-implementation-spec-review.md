---
tags: [ccb, spec-review, business-rules, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-13
timestamp: 2026-03-13T00:00:00-03:00
expires: 2026-05-12
conversation_id: 00c613e6-dabc-4fd2-af01-101934fa14c2
node_type: audit
is_session: true
version: 0.1.0
last_updated: 2026-03-13
expected_importance: 5
importance_rationale: "Reviewed CCB implementation spec confirming business rule encoding approach."
---

# CCB Implementation Spec Review & Fixes

**Date:** 2026-03-13
**Tags:** #ccb #spec-review #business-rules #refactor

## Summary

Reviewed `ccb-business-rules-refactor-implementation.md` for missing items, ambiguities, and contradictions by cross-referencing against `ccb-business-rules.md`, `ccb-tables-column-refactor.md`, and the current codebase (`models.py`, `process_bulk_import.py`, `run_ocr.py`, `ocr_service.py`). Found 15 issues and applied fixes for 11 of them. Three open questions remain for the next session.

Key outputs:
- `ccb-business-rules-refactor-implementation.md` — 11 fixes applied in-place
- `review_findings.md` — original 15-issue review artifact (in brain dir)

## Conversation Arc

**Started:** User asked for a comprehensive review of `ccb-business-rules-refactor-implementation.md` to find what's missing, problematic, or ambiguous.

**Ended:** 11 of 15 issues fixed in the spec. Three open questions remain: (1) `ocr_match` as both pendente and aprovado reason — keep or rename? (2) Should sync pipeline become async — backlog item? (3) Confirm `get_checklist_for_folder` scope.

## Key Decisions

- **`REASON_PENDING_PROCESSING` dropped:** User decided to use `REASON_PENDING_OCR` for all upfront-created `DocumentVersion` rows, eliminating the new constant entirely.
- **`BULK_IMPORT_MIN_TEXT_CHARS` removed:** User confirmed removal. Simple `if not text or not text.strip()` replaces the 50-char threshold everywhere.
- **`_mark_unmatched` renamed:** Renamed to `_mark_no_text` in the spec to align with "no separate unmatched status" rule.
- **Batch rejection excludes `folders_deletado`:** User agreed that already-hidden duplicate folders should not transition to `rejeitado` during batch rejection.
- **Same-batch duplicates don't proceed to OCR:** Both folders stay `pendente/duplicate_contrato`. Operator must resolve before processing continues.
- **`total_documents` is set once, not F()-incremented:** User confirmed it doesn't change after initial set, so no atomic counter needed.

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| `REASON_PENDING_PROCESSING` not in models | Review finding #1 | ✅ Resolved (use `REASON_PENDING_OCR` instead) |
| Step numbering mismatch Pipeline Flow vs Counter Logic | Review finding #4 | ✅ Fixed (renumbered Steps 1-8) |
| `total_documents` missing from Counter Logic | Review finding #5 | ✅ Fixed (implementation guidance added) |
| `_mark_unmatched` naming contradicts spec | Review finding #8 | ✅ Renamed to `_mark_no_text` in spec |
| Gap 1 missing `total_documents` assignment | Review finding #10 | ✅ Added |
| Gap 2 missing `ocr_service.py` code snippet | Review finding #9 | ✅ Added |
| Cleanup 2 missing code example | Review finding #11 | ✅ Added (full `dict[int,int]` + both-folder retagging) |
| Cleanup 4 undefined `contrato` variable | Review finding #12 | ✅ Fixed (resolve from `folder_result.contract_hash`) |
| Batch rejection sweeps `folders_deletado` | Review finding #13 | ✅ Fixed (excluded) |
| No `failed` status in pipeline flow | Review finding #14 | ✅ Added error branch |
| `ocr_match` as both pendente and aprovado reason | Review finding #3 | ❓ Open — needs user decision |

## Backlog Items Added

- ⚠️ MEDIUM — Clarify whether `ocr_match` should be split into two distinct reasons (pendente vs aprovado) or kept as one reason valid for multiple statuses.
- ⚠️ LOW — Consider making `_process_folder` steps async (per-folder Celery tasks). Requires moving `matched_contratos` to DB-level check. Deferred until after current refactor.
- ⚠️ LOW — Confirm `get_checklist_for_folder` scope (required/present/missing only, or additional data).

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-business-rules-refactor-implementation.md]] | `updates` | Applied 11 fixes from review |
|[[002-ccb-validation-workflow/ccb-business-rules.md]]| `contextualizes` |Cross-referenced for rule alignment|
|[[002-ccb-validation-workflow/ccb-tables-column-refactor.md]]| `contextualizes` |Cross-referenced for schema alignment|
|[[aquisicao/repositories/models.py]]| `contextualizes` |Verified constants and model definitions|
|[[aquisicao/use_cases/process_bulk_import.py]]| `contextualizes` |Verified current pipeline implementation|
|[[aquisicao/use_cases/run_ocr.py]]| `contextualizes` |Verified OCR flow and `_mark_unmatched`|
|[[aquisicao/services/ocr_service.py]]| `contextualizes` |Verified `BULK_IMPORT_MIN_TEXT_CHARS` usage|
