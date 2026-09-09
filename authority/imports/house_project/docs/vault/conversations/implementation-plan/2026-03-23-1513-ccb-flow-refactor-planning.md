---
tags: [ccb, pipeline, extraction]
node_type: implementation-plan
is_session: true
layer: domain
nature: [technical, reference]
status: active
created: 2026-03-23
timestamp: 2026-03-23T15:13:00-03:00
expires: 2026-05-22
conversation_id: 6e0010ec-9bd4-46f7-9690-f5efb72eebd5
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/ccb-flow-refactor.md
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced the refactor spec for `_process_folder` — unifies critical field validation across all 7 doc_types and documents 7 structural issues (God Function, 21 DB round-trips, duplicated Gemini blocks), directly shaping the next implementation cycle."
---

# CCB Flow Refactor Planning

**Date:** 2026-03-23 15:13 (UTC-3)
**Tags:** #ccb #pipeline #extraction

## Summary

This session was a focused planning and code review session for the document extraction pipeline's `_process_folder` function in `process_bulk_import.py`. The user started by asking how critical field validation works for CCB uploads. The analysis revealed that while extraction config JSONs define `critical_fields` for all 7 document types, the template-matched path only validates them for CCB (via fallback cascade) and Identificacao (via completion rate threshold). Antifraude, Averbação, ComprovanteEmprestimo, and Holerite (regex path) skip critical field checks entirely — any extracted field passes them through as `extracted_not_cross_checked`.

After documenting the critical field gap, the user asked for a broader code quality review. A thorough analysis of `_process_folder` (~450 LOC) identified 7 additional improvement categories. Both the validation fix and the structural improvements were combined into a single comprehensive spec.

### Critical Field Validation Gap
- **Problem/Goal:** Ensure all document types validate critical fields after extraction, not just CCB and Identificacao.
- **Decision:** Create a `_resolve_critical_fields()` helper that centralizes field resolution from 3 sources (JSON config → template model → Gemini fallback) and apply a unified quality gate to all doc_types.
- **Changes:** Wrote the spec documenting the current fragmented state, the proposed unified approach, and the behavioral changes (Antifraude/Averbação/ComprovanteEmprestimo/Holerite will now enforce their defined critical fields).

### Code Quality Review
- **Problem/Goal:** Identify structural and maintenance issues in `_process_folder` beyond the critical field gap.
- **Decision:** Document 7 improvement categories with severity ratings and prioritized execution order.
- **Changes:** Produced analysis covering: God Function decomposition (deferred), 21 `dv.save()` round-trips (consolidate with dirty_fields), duplicated Gemini blocks (extract helper), swallowed download exceptions, 12 inline imports (4 duplicated), inconsistent `update_fields`, and dead variables.

### Regex Simplification (User-Initiated)
- **Problem/Goal:** Simplify overly complex CET and taxa regex patterns in `ccb_cap.json`.
- **Decision:** User directly simplified 4 regex patterns for `cet_anual`, `cet_mensal`, `taxa_juros_anual`, `taxa_juros_mensal` — removing lookahead-style multi-line captures in favor of direct label matching.
- **Changes:** `ccb_cap.json` modified by user.

Key outputs:
- `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` — Combined refactor spec (Part A: critical fields, Part B: structural improvements)

## Key Decisions

- **Unified critical field validation:** All doc_types will use the same `_resolve_critical_fields()` helper, with priority order: extraction_config JSON > DocumentTemplate model > Gemini hardcoded fallback.
- **All-or-nothing semantics:** `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` (already 1.0) will be removed — critical fields are binary (all present or flagged).
- **Inline helper over shared module:** `_resolve_critical_fields` stays inside `process_bulk_import.py` rather than creating `field_validation.py` (proposed in the old Phase 5 spec but never built). Keeps it simple.
- **God Function decomposition deferred:** The ~450 LOC function decomposition is out of scope for this refactor — will be planned separately after the current changes stabilize.
- **Behavioral change accepted:** Antifraude, Averbação, ComprovanteEmprestimo, and Holerite (regex) will now enforce critical field checks — documents with partial extraction will be flagged as `low_quality_image`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `modified` | User simplified regex patterns for CET anual/mensal and taxa juros anual/mensal — removed lookahead-style captures |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `created` | Combined refactor spec: Part A (unified critical field validation) + Part B (6 structural improvements) |
| `specs/002-ccb-validation-workflow/unified-critical-field-validation.md` | `deleted` | Merged into `ccb-flow-refactor.md` |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| God Function decomposition of `_process_folder` | Code review | ⚠️ HIGH | Deferred — plan after current refactor |
| `run_ocr.py` also lacks critical field checks | Phase 5 spec | MEDIUM | Not in scope — `run_ocr.py` off hot path |

## Open Questions

None — user approved the approach. Ready for implementation.

## Connections

- **produces**: [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) — the main output of this session
- **supersedes**: [ccb-critical-field-check-implementation.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-critical-field-check-implementation.md) — Phase 5 spec now obsolete
- **relates-to**: [business-rules.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/business-rules.md) — pipeline flow and classification rules
- **relates-to**: [system-fragilities.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/system-fragilities.md) — validation gaps documented as fragilities
