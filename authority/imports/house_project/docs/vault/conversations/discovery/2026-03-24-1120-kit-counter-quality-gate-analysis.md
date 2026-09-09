---
tags: [pipeline, ccb]
node_type: discovery
is_session: true
layer: application
nature: [explanatory, technical]
status: active
created: 2026-03-24
timestamp: 2026-03-24T11:20:44-03:00
expires: 2026-05-23
conversation_id: cd4821c2-5837-4eef-af6a-a628010f5e5b
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: true
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Surfaced a semantic conflict in `documents_matched` (kit evaluation vs finalization SQL overwrite) and defined the quality gate business rules that will change how kit completion is counted across all batches."
---

# Kit Counter Quality Gate Analysis

**Date:** 2026-03-24 11:20 (UTC-3)
**Tags:** #pipeline #ccb

## Summary

This session investigated how the `documents_matched` / `required_docs_count` counters on `DocumentsFolderResult` are managed in the bulk import pipeline. The investigation revealed two bugs: (1) `_step_kit_evaluation` has no quality gate — any document with a `doc_type` counts toward the kit regardless of extraction success, and (2) `_update_batch_counters` overwrites the kit-based `documents_matched` with a raw SQL count of DVs with non-null `extracted_data`, erasing the kit evaluation semantics entirely.

The session also explored the feasibility of removing the hardcoded 4-page limit (`[0, 1, 2, 3]`) on OCR/PyMuPDF text extraction in Step 2a, and discovered that the per-template `pages` config in `extraction_config` is effectively a no-op since Step 2a already covers all configured page ranges.

### Kit Counter Chain of Responsibility
- **Problem/Goal:** Understand why some folders show 5/5 and others 4/5 despite having the same document types.
- **Decision:** The discrepancy is caused by `_update_batch_counters` overwriting `documents_matched` with `COUNT(*) FILTER (WHERE extracted_data IS NOT NULL)`. Folders where Averbação had null `extracted_data` got 4/5; others got 5/5. This had nothing to do with kit evaluation.
- **Changes:** No code changes. Produced an implementation plan for fixing the logic.

### Quality Gate Business Rules Defined
- **Problem/Goal:** Define when a document should count as "matched" in the kit evaluation.
- **Decision:** Non-CCB documents count only when all mandatory fields are extracted (`reason ∈ {extracted_not_cross_checked, ocr_match, cross_check_failed}`). CCB counts only when mandatory fields are extracted AND contrato is found in DB.
- **Changes:** Implementation plan created but not yet executed.

### OCR Page Limit Analysis
- **Problem/Goal:** Assess feasibility of removing the hardcoded `[0, 1, 2, 3]` page limit in Step 2a.
- **Decision:** Code change is trivial. PyMuPDF extraction is near-instant for all pages. The concern is Tesseract fallback at ~2-5s/page for scanned PDFs. A safe approach: all pages for PyMuPDF, limited pages for Tesseract. The per-template `pages` config is effectively unused since Step 2a always covers all configured ranges.
- **Changes:** No code changes. Analysis only.

Key outputs:
- Implementation plan artifact for kit counter quality gate (not yet executed)

## Key Decisions

- **Kit counter quality gate:** A non-CCB document counts toward kit completion ONLY if `reason ∈ {extracted_not_cross_checked, ocr_match, cross_check_failed}` — i.e., all mandatory fields were successfully extracted.
- **CCB counting rule:** CCB counts toward kit completion ONLY when mandatory fields are extracted AND contrato is found in DB (already handled by two-phase evaluation design).
- **Finalization SQL fix:** `_update_batch_counters` must stop overwriting `documents_matched` — the kit evaluation result should be preserved.

## Files Changed

### Code

No code files were changed in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/2026-03-24-1120-kit-counter-quality-gate-analysis.md` | `created` | This session node |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement kit counter quality gate in `_step_kit_evaluation` | This session | ⚠️ HIGH | Implementation plan ready, not yet executed |
| Fix `_update_batch_counters` SQL overwriting `documents_matched` | This session | ⚠️ HIGH | Implementation plan ready, not yet executed |
| Remove hardcoded 4-page OCR limit in Step 2a | This session | MEDIUM | Analysis complete, no plan written |
| Per-template `pages` config is a no-op | This session | LOW | Known, no action required unless Step 2a changes |

## Open Questions

- Should `cross_check_failed` reason count toward kit completion? (Current decision: yes, since the rule is about extraction not validation — but worth confirming)
- When removing the OCR page limit, should Tesseract fallback remain limited to first N pages for performance?
