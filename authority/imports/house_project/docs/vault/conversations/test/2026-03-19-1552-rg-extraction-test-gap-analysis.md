---
tags: [spec, testing, acquisition, vault]
node_type: test
is_session: true
layer: [domain, application]
nature: [explanatory, technical]
status: active
created: 2026-03-19
timestamp: 2026-03-19T15:52:00-03:00
expires: 2026-05-18
conversation_id: c4c7c674-f0ac-41f2-bb58-549df56ff9b9
#
expected_importance: 5
importance_rationale: "Analyzed test gaps in RG extraction revealing broken assertions and missing integration tests."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md"]
promoted_candidates: []
---

# RG Document Extraction - QA Test Gap Analysis

**Date:** 2026-03-19 15:52 (UTC-3)
**Tags:** #spec #testing #acquisition #vault

## Summary

This session focused on a comprehensive QA review of the uncommitted changes related to the transition from the legacy "RG" document extraction to the polymorphic "Identificacao" extraction logic. The goal was to evaluate E2E business rules coverage and unit-level code coverage.

The analysis revealed critical test gaps: the newly proposed unit tests (`TestRGExtraction`) were fundamentally broken because they still asserted the legacy `doc_type='RG'` while the pipeline was internally reconfigured to output `Identificacao`. Furthermore, crucial integration tests verifying the `KitType` evaluation structural mismatch (where the DB still required "RG" while the pipeline provided "Identificacao") and validations for the explicit OCR fallback mechanism (`extract_text_force_ocr`) were missing. The session concluded by formalizing these gaps as actionable items within the implementation plan.

### Uncommitted Code Evaluation
- **Problem/Goal:** Evaluate the quality and completeness of tests accompanying the new `Identificacao` pipeline. 
- **Decision:** The existing `TestRGExtraction` suite is obsolete and will fail. Missing E2E tests, force OCR unit tests, and Gate 2 validation tests are required for a safe deploy.
- **Changes:** Produced a QA gap analysis artifact and updated the verification plan in the `rg-document-extraction-implementation.md` spec.

### KitType Extracted Docs Missing Match
- **Problem/Goal:** The user queried why contract 902238281-7 had all 5 docs extracted but the folder evaluation marked only 4/5 matched, resulting in a missing required document.
- **Decision:** Diagnosed that the `matched_kit_type` stored in the DB strictly requires `"RG"`, whereas the new pipeline parses the file as `"Identificacao"`. This mismatch hides the extracted document from the kit evaluation logic.
- **Changes:** Explained the issue and reaffirmed the necessity of the KitType data migration outlined in the discovery doc.

Key outputs:
- `/Users/victorboscaro/.gemini/antigravity/brain/c4c7c674-f0ac-41f2-bb58-549df56ff9b9/qa_test_review.md` — Detailed analysis of missing, incomplete, and useless tests.

## Tests Added/Modified

> No tests were directly written, but the required tests were planned.

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | (Planned) `TestRGExtraction` refactor | KitType evaluation requires polymorphic `Identificacao` matching in the tests to properly vet the pipeline output without asserting obsolete states |

**Why these tests matter:** FIDC compliance strictly requires verified identification. Proceeding without updating the test assertions to reflect `Identificacao` disables our automated regression checks, leading to a massive increase in operator manual reviews due to false `no_id_match` drops.

## Key Decisions

- **Test Planning:** Decided that the `TestRGExtraction` suite must be refactored to assert `Identificacao`, and isolated tests for `extract_text_force_ocr()` are mandatory.
- **Data Migration Validation:** Reaffirmed that no pipeline tests will pass E2E Kit Matching unless the DB's `KitType` requirements are migrated from `RG` to `Identificacao`.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Updated the Verification Plan section to include the missing tests defined in the QA review process. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implementation of `TestRGExtraction` refactor and missing tests | QA Test Review | ⚠️ HIGH | Pending |
| Django Data Migration for KitType `required_docs` | Discovery / Debugging | ⚠️ HIGH | Pending |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Verification tests missing from the initial plan were added here |
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `validates` | Validated the prediction regarding the structural Tech Debt surrounding the KitType `"RG"` vs `"Identificacao"` mapping |
