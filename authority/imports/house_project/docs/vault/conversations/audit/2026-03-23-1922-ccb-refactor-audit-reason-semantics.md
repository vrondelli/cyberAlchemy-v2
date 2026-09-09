---
tags: [ccb, pipeline]
node_type: audit
is_session: true
layer: domain
nature: [technical, reference]
status: active
created: 2026-03-23
timestamp: 2026-03-23T22:13:00-03:00
expires: 2026-05-22
conversation_id: 93532e4f-9815-46dc-974e-76e6ac0084cc
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Canonical reason semantics defined for the upload pipeline — separates OCR quality (`low_quality_image`) from field validation (`missing_critical_fields`), restricts `no_template` to post-fallback-exhaustion, and removes stale model constants."
satisfaction_score: 8
satisfaction_min: 6
satisfaction_max: 9
satisfaction_std: 1.2
version: 0.1.0
last_updated: 2026-03-23
---

# CCB Refactor Audit — Reason Semantics & Step Function Corrections

**Date:** 2026-03-23 22:13 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session performed a rigorous audit of `ccb-flow-refactor.md` (v0.7.0 → v0.8.0) by cross-referencing its proposed decomposition against the actual `process_bulk_import.py` codebase. The audit covered three areas: (1) correcting technical inconsistencies in helper signatures and step definitions, (2) establishing canonical reason semantics for `DocumentVersion` and `DocumentsFolderResult`, and (3) expanding test coverage expectations to match the newly documented behaviors.

### Technical Audit Corrections

- **Problem/Goal:** Identify and fix inconsistencies between the spec's proposed steps and the actual code flow.
- **Decisions:**
  - `_try_gemini_extraction` return type corrected from `tuple[dict, str]` to `tuple[dict, ExtractionConfidence]`
  - `_step_ccb_fallback_cascade` extracted as a separate step (was bundled inside `_step_extract_fields`)
  - `_step_try_gemini` terminal condition documented: unmatched+success is terminal, matched+success is NOT
  - `_step_dedup_cross_batch` expanded to cover both prior-ativo (blocks) and prior-rejeitado (transitions) paths
  - `ccb_dv_dirty` set added to `FolderProcessingContext` for post-loop CCB DV save consolidation
  - `folder_docs` dependency on B1 (dirty set) explicitly documented as CAUTION
- **Changes:** Multiple sections of `ccb-flow-refactor.md` updated with step table, pipeline list, context dataclass, and orchestrator code.

### Reason Semantics Definition

- **Problem/Goal:** Reasons were a mix of overlapping concerns — `low_quality_image` served double duty (OCR quality AND missing fields), `duplicate_contrato_database` leaked to DVs, dead constants existed in the model.
- **Decisions:**
  - `low_quality_image` restricted to OCR quality only (`len(text) < MIN_OCR_CHARS` + `is_garbled_text()`)
  - `missing_critical_fields` activated for QG2 (critical field validation failures)
  - `no_template` requires exhausting ALL fallbacks before assignment
  - `duplicate_contrato_database` restricted to folder-only (removed from DV level)
  - `extracted_no_template` dead constant to be removed from model
- **Changes:** New "Reason Semantics" section added to spec with canonical trigger tables, DV vs folder scope, and step-to-reason mapping.

### Test Coverage Expansion

- **Problem/Goal:** Test expectations needed to match the refined reason semantics and new step functions.
- **Changes:** Added 7 new test cases (`test_step_check_ocr_quality_garbled`, `test_step_validate_critical_skipped_ccb`, `test_step_dedup_rejeitado_prior_transitions`, guard sub-tests, contrato backfill, cross-check no-installments, consolidated saves). Updated 5 existing test expectations from `low_quality_image` to `missing_critical_fields`.

Key outputs:
- `ccb-flow-refactor.md` — v0.8.0 with audit corrections, reason semantics, and expanded test plan

## Key Decisions

- **Reason separation:** `low_quality_image` (OCR quality) vs `missing_critical_fields` (extraction validation) — operators can now distinguish scan issues from regex failures.
- **`no_template` strictness:** Only assigned after ALL fallback paths (template, Gemini, universal) are exhausted.
- **`duplicate_contrato_database` scope:** Folder-only — DVs no longer receive this reason via bulk update.
- **`is_garbled_text()` in QG1:** Existing function from `ocr_service.py` to be incorporated into `_step_check_ocr_quality`.
- **Dead constant cleanup:** `extracted_no_template` to be removed; `missing_critical_fields` reactivated.
- **Events deferred:** Event logging for step functions deferred to a separate session (depends on decomposition being implemented first).

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| [[002-ccb-validation-workflow/ccb-flow-refactor.md]] | `modified` | v0.7.0 → v0.8.0: audit corrections (return types, step functions, terminal conditions), new Reason Semantics section, expanded test plan |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Part A gap tests (4 tests for Antifraude/Averbação/Comprovante critical field validation) | Audit | ⚠️ HIGH | Pendente — Part A in production without e2e test coverage |
| Remove `extracted_no_template` from `DocumentVersion` model | Audit | MEDIUM | Pendente |
| Remove `duplicate_contrato_database` from DV-level bulk updates in `_process_folder` | Audit | MEDIUM | Pendente (Part B/C) |
| Implement `is_garbled_text()` check in `_step_check_ocr_quality` QG1 | Audit | MEDIUM | Pendente (Part C) |
| Event logging for step functions | Session discussion | LOW | Deferred to separate session |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-flow-refactor.md]] | `validates` | Audited the spec's technical claims against the production codebase |
| [[002-ccb-validation-workflow/business-rules.md]] | `contextualizes` | Reason semantics align with the business rules for document processing |

## Open Questions

None surfaced during this session.
