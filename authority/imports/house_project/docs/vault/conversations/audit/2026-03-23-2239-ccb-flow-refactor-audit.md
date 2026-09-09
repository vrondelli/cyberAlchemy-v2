---
tags: [ccb, pipeline, acquisition]
node_type: audit
is_session: true
layer: domain
nature: reference
status: active
created: 2026-03-23
timestamp: 2026-03-23T22:39:17-03:00
expires: 2026-05-22
conversation_id: 61a8364a-eee8-40ac-9929-bd9a4306cd70
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Corrected 11+ factual errors and aligned reason semantics (`no_template` absorbs missing critical fields, `low_quality_image` restricted to OCR quality) in the primary CCB refactoring spec, preventing implementation bugs in Parts B+C."
user_satisfaction: { mean: 7, min: 5, max: 9, std: 1.5 }
---

# CCB Flow Refactor Spec Audit

**Date:** 2026-03-23 22:39 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Performed a comprehensive audit of `ccb-flow-refactor.md` by cross-referencing it against the actual `process_bulk_import.py` codebase (1468 LOC), all three project constitutions (development practices, event system, folder structure), and `ontology-conventions.md`. Identified and corrected 11+ issues spanning factual errors (wrong save counts, import counts), internal contradictions (reason code semantics), and missing annotations.

A key business rule clarification was made mid-session: the `REASON_MISSING_CRITICAL` constant should NOT be used. Instead, missing critical fields should produce `REASON_NO_TEMPLATE` (document without sufficient data = treated as no template). `low_quality_image` must exclusively indicate OCR quality problems (too short or garbled text). This required updating 14 references across the spec.

### Save Count Corrections
- **Problem/Goal:** Verify the spec's claimed `dv.save()` and `result.save()` counts against the actual code
- **Decision:** Counts were wrong — spec undercounted `dv.save()` (19→20, missed L874) and conflated `old_result.save()` (L1008 on a different object) with `result.save()`
- **Changes:** Corrected to 20 `dv.save()` + 10 `result.save()` + 1 `old_result.save()` = 31 total. Updated Mermaid diagram and B1 section

### Reason Semantics Alignment
- **Problem/Goal:** Internal contradiction — Part A code blocks showed `REASON_MISSING_CRITICAL` as implemented, but production code uses `REASON_LOW_QUALITY_IMAGE`. Then user clarified: `missing_critical_fields` should not exist at all
- **Decision:** `no_template` absorbs the "missing critical fields" scenario. `low_quality_image` = only OCR quality (short/garbled). `missing_critical_fields` = dead constant to remove from model
- **Changes:** Replaced all 14 references to `missing_critical_fields` → `no_template`. Rewrote Reason Semantics table, code blocks, step function descriptions, changes table, and test expectations. Added `[!WARNING]` boxes for current vs proposed state

### Inline Import Inventory
- **Problem/Goal:** Spec said 9 inline imports but actual count is 8
- **Decision:** Fixed count and split table to show L621 vs L834 as distinct entries, added KitType alias detail
- **Changes:** Updated B4 section with corrected inventory and `_KitType` → `KitType` alias note

### Dedup Behavior
- **Problem/Goal:** Spec claimed `duplicate_contrato_database` would be "removed from DVs" but code bulk-updates DVs
- **Decision:** Reverted — DVs must keep the reason for operator queries
- **Changes:** Updated dedup description in C5 step table and WARNING box to include DVs bulk update in both paths

Key outputs:
- `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` — 11+ corrections applied

## Key Decisions

- **Reason semantics simplification:** `missing_critical_fields` eliminated as a reason. Missing critical fields → `no_template`. `low_quality_image` → exclusively OCR quality issues (text too short or garbled/nonsense)
- **`missing_critical_fields` constant:** Dead constant — to be removed from the model
- **Dedup DVs:** `duplicate_contrato_database` stays on DVs (reverted removal proposal) for operator query consistency

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) | `modified` | Fixed save counts (19→20 dv.save, 11→10+1 result.save), replaced all `missing_critical_fields` → `no_template`, corrected inline import inventory (9→8), fixed dedup behavior, added status column to changes table, added WARNING boxes for current vs proposed state |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Migrate QG2 from `REASON_LOW_QUALITY_IMAGE` to `REASON_NO_TEMPLATE` in code | Reason Semantics | ⚠️ HIGH | Part B pendente |
| Add `is_garbled_text()` check to QG1 in `_process_folder` | Reason Semantics | MEDIUM | Part B pendente |
| Remove `REASON_MISSING_CRITICAL` and `REASON_EXTRACTED_NO_TEMPLATE` from model | Dead constants | LOW | Pendente |
| Implement 4 Part A gap tests (Antifraude, Averbação, ComprovanteEmprestimo) | Test coverage | MEDIUM | Pendente |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [ccb-flow-refactor.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/ccb-flow-refactor.md) | `validates` | Audited spec accuracy against actual codebase |
| [business-rules.md](file:///Users/victorboscaro/house_project/specs/002-ccb-validation-workflow/business-rules.md) | `contextualizes` | Business rules for pipeline reason semantics |
