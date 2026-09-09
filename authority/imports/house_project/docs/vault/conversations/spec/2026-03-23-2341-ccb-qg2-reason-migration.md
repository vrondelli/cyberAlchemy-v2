---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T23:41:08-03:00
expires: 2026-05-22
conversation_id: a91ca186-58bb-4953-9564-85a626d34178
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Separated QG1 (OCR quality) from QG2 (critical fields) reason codes in the CCB pipeline, eliminating a semantic conflation that made production diagnostics unreliable, and brought the ccb-flow-refactor.md spec to status=implemented."
---

# CCB QG2 Reason Migration & Spec Closure

**Date:** 2026-03-23 23:41 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session completed the final three pending Part B items from the CCB flow refactor spec and brought the `ccb-flow-refactor.md` document from `status: partially-implemented` to `status: implemented`. The core business logic change separates two previously conflated quality gate outcomes: QG1 (OCR quality — short or garbled text) now exclusively emits `REASON_LOW_QUALITY_IMAGE`, while QG2 (missing critical fields after extraction) now correctly emits `REASON_NO_TEMPLATE`. This resolves a long-standing semantic ambiguity where operators could not distinguish between "the image was unreadable" and "the document lacks required fields."

Additionally, `is_garbled_text()` was integrated into QG1 so that garbled font artifact text (common in scanned PDFs with embedded fonts) is now caught alongside the existing short-text check. Two dead constants (`REASON_MISSING_CRITICAL`, `REASON_EXTRACTED_NO_TEMPLATE`) were removed from the `DocumentVersion` model. The spec was comprehensively updated to reflect the actual architecture (step functions with explicit parameters instead of the originally proposed Context Object pattern) and all Part B/C items were marked as done.

### QG2 Reason Code Migration
- **Problem/Goal:** `REASON_LOW_QUALITY_IMAGE` was used for both OCR quality issues (QG1) and missing critical fields (QG2), making production diagnostics unreliable.
- **Decision:** QG2 (missing critical fields) → `REASON_NO_TEMPLATE`. QG1 retains `REASON_LOW_QUALITY_IMAGE`.
- **Changes:** 3 code points changed in `process_bulk_import.py` (L626 in `_step_extract_unmatched`, L721 and L737 in `_step_extract_matched_non_ccb`). 4 test assertions updated.

### is_garbled_text Integration in QG1
- **Problem/Goal:** QG1 only checked `len(text) < MIN_OCR_CHARS`, missing garbled text from scanned PDFs with embedded fonts.
- **Decision:** Add `is_garbled_text(text)` to the QG1 condition.
- **Changes:** Import added from `ocr_service`, QG1 condition expanded in `_step_extract_matched_non_ccb`.

### Dead Constant Removal
- **Problem/Goal:** `REASON_MISSING_CRITICAL` and `REASON_EXTRACTED_NO_TEMPLATE` defined in `DocumentVersion` model but never used in production code.
- **Decision:** Remove both constants.
- **Changes:** 2 lines removed from `models.py`. No references remained in `domains/`.

### Spec Update
- **Problem/Goal:** `ccb-flow-refactor.md` showed Part B and C as "Pendente" despite most being implemented.
- **Decision:** Bring spec to `status: implemented, version: 1.0.0`.
- **Changes:** Updated all Part B items to ✅ Done, rewrote Part C to reflect actual step-function architecture, updated Reason Semantics and Order of Execution tables.

Key outputs:
- `process_bulk_import.py` — QG2 reason migration + `is_garbled_text` in QG1
- `models.py` — dead constant removal
- `ccb-flow-refactor.md` — comprehensive status update to `implemented`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_gemini_extraction_without_critical_ids_fails_quality_gate` | Missing critical fields → `no_template` (not `low_quality_image`) |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_gemini_extraction_with_nome_and_cpf_but_no_id_fails_quality_gate` | Partial critical fields → `no_template` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_holerite_gemini_missing_critical_fails_gate` | Holerite missing CPF → `no_template` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_identificacao_gemini_missing_nome_fails_quality_gate` | Identificacao missing nome → `no_template` |

**Why these tests matter:** These tests enforce the separation between OCR quality issues and extraction logic issues. Without them, a regression could silently merge both failure modes back into `low_quality_image`, making it impossible for operators to distinguish "bad scan" from "document missing required fields" — which require different remediation actions.

## Key Decisions

- **QG2 uses `no_template` instead of `low_quality_image`:** Missing critical fields after successful extraction is semantically "document without sufficient data" (no_template), not an image quality problem.
- **`is_garbled_text` added to QG1:** Completes the OCR quality check alongside `MIN_OCR_CHARS`.
- **Dead constants removed immediately:** No migration needed since they were never serialized to the database.
- **Spec closed as `implemented`:** All three parts (A, B, C) are now done, with architecture notes reflecting the actual step-function approach used instead of the originally proposed Context Object pattern.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | QG2 reason migration (3 points), `is_garbled_text` import + QG1 integration |
| `domains/aquisicao/repositories/models.py` | `modified` | Removed `REASON_MISSING_CRITICAL` and `REASON_EXTRACTED_NO_TEMPLATE` dead constants |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Updated 4 test assertions from `REASON_LOW_QUALITY_IMAGE` to `REASON_NO_TEMPLATE` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `modified` | Updated to `status: implemented`, Part B/C marked done, reason semantics table updated, architecture description aligned with actual code |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Part A integration tests (4 doc_types) | ccb-flow-refactor.md | MEDIUM | Pendente |
| Part B unit tests (download failure, Gemini helper routes) | ccb-flow-refactor.md | LOW | Pendente |
| Post-loop save consolidation (dirty set pattern) | ccb-flow-refactor.md B1 | LOW | Parcial |

## Connections

- **updates** → [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) — brought spec to `implemented` status
- **validates** → [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) — QG2 reason migration confirmed working via 128+97 tests

## User Satisfaction

- **Score:** 9
- **Min:** 8 | **Max:** 10 | **Std:** 0.7

## Open Questions

None — all Part B items are implemented. Remaining work is test coverage (Part A integration gaps, Part B unit test gaps).
