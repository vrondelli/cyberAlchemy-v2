---
tags: [spec, acquisition, models]
node_type: spec
is_session: true
layer: [domain, application]
nature: [technical, procedural]
status: active
created: 2026-03-19
timestamp: 2026-03-19T14:59:58-03:00
expires: 2026-05-18
conversation_id: 553e4d4a-a0ba-4055-b72e-d7484bdb7eb9
#
expected_importance: 6
importance_rationale: "Refined Identificacao doc type with spec updates, resolving contradictions in document classification."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: ["specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md", "specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md"]
promoted_candidates: []
---

# Document Identification (Identificacao) Spec Refinement

**Date:** 2026-03-19 14:59 (UTC-3)
**Tags:** #spec #acquisition #models

## Summary

This session focused on refining the implementation plan for identifying and extracting data from personal identification documents (RG, CNH, RNE, etc.). Previously, the system used a generic `"RG"` `doc_type` which proved conceptually flawed and fragile, causing misclassifications and extraction failures for non-RG documents like CNHs. We updated the discovery document and the implementation plan to adopt a unified `"Identificacao"` `doc_type` with an `id_subtype` field extracted via OCR keywords. We also explicitly defined the graceful degradation behavior (sending to manual review if `id_subtype` is missing) and ensured comprehensive automated testing was included in the plan.

### Unifying Identification Documents
- **Problem/Goal:** The existing `"RG"` doc_type was being used as a catch-all for CNHs and other IDs, leading to "low quality image" false positives because extraction templates didn't match.
- **Decision:** Replace `"RG"` with `"Identificacao"` and extract `id_subtype` (e.g. RG, CNH, RNE) via Tier 1 OCR keywords. Treat `id_subtype` as a critical field.
- **Changes:** Updated `identificacao-doc-type-discovery.md` to add explicit testing and migration steps. Rewrote the older `rg-document-extraction-implementation.md` spec to completely align with the new `"Identificacao"` strategy and its quality gate rules.

Key outputs:
- `rg-document-extraction-implementation.md` — Complete rewrite of the plan for the new ID extraction flow.
- `identificacao-doc-type-discovery.md` — Added testing steps and `allowed_subtypes` data migration requirements.

## Key Decisions

- **Doc Type Unification:** `doc_type` for all personal IDs will be `"Identificacao"`.
- **Subtype Extraction:** `id_subtype` will be determined via a regex matching OCR keywords (e.g., "Senatran" -> CNH) and will be the only `critical_field` in the generic template.
- **Graceful Degradation:** If the OCR text lacks the `id_subtype` keyword, the system will flag the document as `low_quality_image` and route it to manual review instead of failing silently.
- **Kit Flexibility:** `KitType` models will receive an `allowed_subtypes` list to optionally restrict which IDs satisfy a kit requirement.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `modified` | Added automated testing plan and explicit data migration step for `allowed_subtypes`. |
| `specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md` | `modified` | Completely rewrote to reflect the `"Identificacao"` extraction implementation instead of the legacy `"RG"` logic. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `updates` | Formalized the next steps and operationalized the discovery into a concrete spec. |
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Replaced legacy RG extraction flow with unified Identificacao flow. |
