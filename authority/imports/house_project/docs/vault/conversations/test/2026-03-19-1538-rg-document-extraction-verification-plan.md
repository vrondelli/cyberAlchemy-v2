---
tags: [spec, testing, ccb]
node_type: test
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T15:38:52-03:00
expires: 2026-05-18
conversation_id: d29c76be-b930-4e6e-bfc3-b1dd08029f7e
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md"]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Refined verification plan for RG extraction, test planning without new architectural decisions."
version: 0.1.0
last_updated: 2026-03-19
---

# RG Document Extraction - Verification Plan Refinement

**Date:** 2026-03-19 15:38 (UTC-3)
**Tags:** #spec #testing #ccb

## Summary

This session focused on reviewing and refining the testing strategy for the newly proposed "Identificacao" document type extraction workflow. The initial plan relied mostly on a single integration test file (`test_parallel_bulk_import.py`) and a manual smoke test, which was deemed insufficient for a critical pipeline. We decided to expand the Verification Plan to cover the entire testing pyramid. The `rg-document-extraction-implementation.md` spec was updated to mandate Unit Tests for regular expressions and keyword matching, Integration Tests for cross-checking against the `Sacado`, and End-to-End (E2E) automation via the API, fully replacing the manual smoke test approach.

### Expanding the Verification Plan
- **Problem/Goal:** The existing verification plan for extracting the "Identificacao" document type lacked strict E2E automation and unit testing for complex regexes. 
- **Decision:** It was decided that testing must include isolated regex validations (to guarantee formats like RG, CNH, and RNE are captured correctly without database overhead), cross-check logic integration, and a fully automated API E2E test.
- **Changes:** Rewrote the "Verification Plan" section of `rg-document-extraction-implementation.md` to formally list these three layers of testing.

Key outputs:
- `rg-document-extraction-implementation.md` — Updated with comprehensive unit, integration, and E2E test requirements.

## Key Decisions

- **Testing Strategy:** The pipeline verification requires unit tests for `identificacao_generic.json` extractions to ensure edge cases in OCR output (variations in CNH/RG) are safely handled without requiring slow integration tests.
- **Automated E2E:** Manual smoke testing via the Django admin is deprecated in the plan in favor of comprehensive E2E automation hitting the bulk upload endpoint.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Completely rewrote the Verification Plan to add Unit, Integration, and E2E tests. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Redefined the scope of necessary tests for successful implementation. |
