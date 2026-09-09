---
tags: [architecture, application, pipeline]
node_type: implementation-plan
is_session: true
layer: application
nature: technical, procedural
status: active
created: 2026-04-03
timestamp: 2026-04-03T21:15:00-03:00
expires: 2026-06-02
conversation_id: r8f3j
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced the only actionable roadmap for Tesseract removal and documented a previously unknown pytesseract dependency that would have caused a production regression if missed."
---

# Tesseract Removal Implementation Plan

**Date:** 2026-04-03 21:15 (UTC-3)
**Tags:** #architecture #application #pipeline

## Summary

The session consumed `tesseract-removal-discovery.md` and wrote a detailed implementation plan. The discovery was validated as sound — Tesseract is redundant given Gemini covers all document types independently. A key insight confirmed that the entire change is code-only with no database migrations needed, making it a single-PR, single-revert operation — this means rollback is trivial if any production issues surface. A critical blocker was found during plan writing: `scripts/update_averbacao_config.py` directly uses `pytesseract` at lines 119 and 133, and this file was entirely missing from the original discovery document. The question was raised whether this is a one-off script that can be deleted or needs updating. The plan was updated with four fixes: Phase 2d added specifically for `update_averbacao_config.py`, explicit note that `is_garbled_text` must stay imported in `extraction_steps.py` (it's used at line 708 for a different purpose), Phase 2b added for cleaning up unused imports from `process_bulk_import.py`, and detailed guidance added on `side_effect` ordering for mixed-folder tests that currently patch both `extract_text_with_fallback` and `extract_text_force_ocr` — these must be consolidated to a single Gemini patch. All line numbers in the plan were verified accurate.

## Epistemic Impact

- Confirmed that OCR engine selection is cleanly encapsulated at the service layer — swapping engines doesn't leak into the persistence layer (no migrations).
- The discovery doc was found to have a gap: `scripts/update_averbacao_config.py` was not identified as a Tesseract consumer. The implementation plan supersedes on this point.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| Tesseract removal implementation plan | created | Full phased plan with Phase 2b (imports), Phase 2d (averbacao script), test guidance |
| Tesseract removal discovery doc | referenced | Validated; gap found (missing script) but doc not modified |

## Connections

- derives-from: tesseract-removal-discovery

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `scripts/update_averbacao_config.py` uses pytesseract — must be addressed in Phase 2d | Blocker | HIGH | Open |
| Discovery doc should be updated to record the missing-script gap | Housekeeping | LOW | Open |
