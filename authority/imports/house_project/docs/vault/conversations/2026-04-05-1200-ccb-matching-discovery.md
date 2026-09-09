---
tags: [ccb-matching, normalization, extraction, bulk-import]
node_type: discovery
is_session: true
layer: domain
nature: technical
status: active
created: 2026-04-05
timestamp: 2026-04-05T12:00:00-03:00
expires: 2026-06-04
conversation_id: r8k3m
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/docs/ccb-matching/ccb-matching-discovery.md, specs/002-ccb-validation-workflow/docs/ccb-matching/ccb-matching-implementation-plan.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Discovered and resolved systematic CCB number mismatch between extraction and database via check-digit normalization, enabling reliable contract matching in bulk import pipeline."
---

# CCB Matching Discovery, Implementation Plan, Review & Implementation

**Date:** 2026-04-05–2026-04-06  
**Tags:** #ccb-matching #normalization #extraction #bulk-import

## Summary

The session investigated a systematic failure in CCB (Cédula de Crédito Bancário) contract matching during bulk document import. Extracted CCB numbers from PDFs included a trailing check digit (e.g., `600913767-7`), but upstream database records were pre-stripped to numeric form (e.g., `600913767`), causing exact-match lookups to fail silently.

### Investigation Phase

The team first investigated two failure patterns: (1) an averbação with no extracted data (correctly flagged as missing critical fields), and (2) a CCB with extracted `numero_ccb` containing a check digit that didn't match the database `contrato_ccb.numero_titulo`. Root cause analysis revealed that the mismatch was systematic and intentional: upstream Vortx data comes pre-formatted via `FORMATTING_MAP` in `upload_rules.py`, which strips check digits as part of normalization. Both extraction paths (regex fallback and Gemini OCR) independently produced check-digit-inclusive numbers, so the problem was asymmetrical normalization.

### Solution Design

The team decided to normalize extracted CCB numbers at the matching point (`_step_contrato_lookup` in `extraction_steps.py`), using a 3-step fallback strategy:
1. Try the normalized value (check digit stripped)
2. Fall back to sanitized form (unicode dashes converted, spaces removed)
3. Fall back to compact form (all hyphens removed) as a defensive measure

Implementation created a new pure domain function `strip_ccb_check_digit` in `ccb_normalization.py`, with helper functions `sanitize_ccb_id` and `ccb_id_compact_no_hyphen`. The contract lookup was moved to `BulkImportRepository.find_contrato_by_candidates()` to comply with repository pattern conventions. The extraction pipeline was refactored to pass a `repo` instance and use the new multi-candidate lookup strategy.

### Testing & Validation

The team created comprehensive unit tests in `test_ccb_normalization.py` (35 tests, all passing) covering sanitization, check-digit stripping, compacting, and repository fallback logic. Existing unit tests across four test classes were updated (11 modifications) to match the new `_step_contrato_lookup` signature. Integration tests in `TestStepContratoLookupNormalization` (10 tests) were added to validate the full pipeline. An audit script `audit_ccb_normalized_lookup.py` was created to backfill and validate normalized values.

### Outstanding Work

Integration tests in `test_parallel_bulk_import.py` were not fully validated before the run was interrupted. This remains a blocker for full validation of the fix in the broader parallel import context.

## Epistemic Impact

- **Validates:** The hypothesis that CCB numbers need normalization at match time to handle the upstream data format mismatch.
- **Confirms:** Both regex and Gemini extraction paths produce check-digit-inclusive numbers; the stripping is indeed upstream and systematic.
- **Questions:** Whether integration tests in `test_parallel_bulk_import.py` fully validate the fix in a concurrent execution context.
- **Contextualizes:** Added "Dígito Verificador" (Check Digit) definition to `docs/vault/dictionary-business.md` to anchor the normalization concept.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `domains/documents_validation/domain/ccb_normalization.py` | Created | New pure domain module with three functions: `strip_ccb_check_digit`, `sanitize_ccb_id`, `ccb_id_compact_no_hyphen` |
| `domains/documents_validation/services/extraction_steps.py` | Modified | Refactored `_step_contrato_lookup` to use repository-based multi-candidate lookup with 3-step fallback |
| `domains/documents_validation/repositories/bulk_import_repository.py` | Modified | Added `find_contrato_by_candidates()` method to handle normalized, sanitized, and compact CCB lookups |
| `apps/bulk_import/use_cases/process_bulk_import.py` | Modified | Updated caller to instantiate `BulkImportRepository()` locally and pass it to `_step_contrato_lookup` |
| `tests/unit/ccb_normalization/test_ccb_normalization.py` | Created | 35 unit tests covering sanitization, stripping, compacting, and repository fallback patterns |
| `tests/unit/extraction/test_extraction_steps.py` | Modified | Updated 11 test calls to match new `_step_contrato_lookup` signature with `repo` parameter |
| `tests/integration/test_extraction_steps.py` | Modified | Added `TestStepContratoLookupNormalization` with 10 integration tests for full pipeline |
| `docs/vault/dictionary-business.md` | Modified | Added "Dígito Verificador" definition under Formatting & Normalization section |
| `specs/002-ccb-validation-workflow/docs/ccb-matching/ccb-matching-discovery.md` | Modified | Created/updated discovery doc to v0.5.0 |
| `specs/002-ccb-validation-workflow/docs/ccb-matching/ccb-matching-implementation-plan.md` | Modified | Created/updated implementation plan to v2.0.0 with full test case matrix |
| `scripts/audit_ccb_normalized_lookup.py` | Created | Audit script for backfilling and validating normalized CCB values |

## Connections

### Derives from
- Sessions `k9m3d` and `t7w2p` — Review and implementation decisions

### Validates
- `upload_rules.py` FORMATTING_MAP behavior (confirmed systematic check-digit stripping)
- Both extraction methods (regex + Gemini) produce check-digit-inclusive output

### Implements
- `ccb-matching-implementation-plan.md` v2.0.0 — Full code implementation with repository pattern compliance

### Contextualizes
- `docs/vault/dictionary-business.md` — Added Dígito Verificador definition

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Validate integration tests in `test_parallel_bulk_import.py` | Implementation blocker | HIGH | Pending — run was interrupted |
| Backfill existing failed rows with normalized CCB values | Optional data cleanup | MEDIUM | Not started — deferred to batch reprocessing |
| Elevate normalization strategy to architecture if needed system-wide | Potential promotion | LOW | Pending — monitor if other domains need similar handling |

## Open Questions

1. Do integration tests in `test_parallel_bulk_import.py` pass with the new `_step_contrato_lookup` signature and repository injection pattern?
2. Should the normalization strategy be extracted to a system-wide convention if other domains need check-digit handling?
3. Are there other document types (besides CCB) that require similar check-digit or data format normalization?
