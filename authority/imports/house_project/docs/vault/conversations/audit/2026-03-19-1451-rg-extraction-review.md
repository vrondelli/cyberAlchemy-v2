---
tags: [spec, acquisition]
node_type: audit
is_session: true
layer:[[domain, application]]
nature:[[explanatory, technical]]
status: active
created: 2026-03-19
timestamp: 2026-03-19T14:51:12-03:00
expires: 2026-05-18
conversation_id: f01b5e4f-5858-43bc-929d-ed49f3efa09d
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Reviewed RG document extraction implementation, confirming spec-to-code alignment."
version: 0.1.0
last_updated: 2026-03-19
---

# Review of RG Document Extraction Implementation

**Date:** 2026-03-19 14:51 (UTC-3)
**Tags:** #spec #acquisition

## Summary

This session focused on reviewing the proposed implementation plan for RG document extraction (`rg-document-extraction-implementation.md`). The user requested an analysis of the proposal, including its context, details, and potential pragmatic issues. Upon review, it became evident that the original plan of treating all identification documents strictly as "RG" was fundamentally flawed, as operators frequently upload CNHs and RNEs under the `RG_` prefix. This flaw was already identified in the `identificacao-doc-type-discovery.md`. The session produced a new implementation plan aligned with the identity unification discovery, proposing a generic `Identificacao` document type, an `id_subtype` field for specific routing, and smarter quality gating based on extraction success.

### Reviewing the RG-Only Implementation
- **Problem/Goal:** Evaluate the original `rg-document-extraction-implementation.md` to see if it's viable for extracting data from uploaded identity documents.
- **Decision:** The original plan is too rigid and brittle. It assumes only RGs are uploaded, relies on a strict `< 80` character count for quality gating, and mandates unreliable OCR on the `nome` field as a critical cross-check.
- **Changes:** Highlighted the fragilities. Decided to pivot to the `identificacao-doc-type-discovery.md` approach.

### Drafting the New Implementation Plan
- **Problem/Goal:** Create an actionable implementation plan based on the "Identificacao" discovery.
- **Decision:** Unify identity documents under the `Identificacao` doc type. Use OCR keywords to set an `id_subtype` (e.g., RG, CNH). Move away from strict character limits in favor of requiring at least one critical field (`id_subtype`) extraction.
- **Changes:** Authored `implementation_plan.md` artifact.

Key outputs:
- `implementation_plan.md` — Formalized plan to refactor the aquisição pipeline to handle a unified `Identificacao` document type rather than just `RG`.

## Key Decisions

- **Pipeline Scope:** The system must stop assuming `RG_` files are RGs and formally adopt the `Identificacao` generalized doc type to prevent false rejections of CNHs.
- **Cross-Checking:** The OCR extraction of the `nome` field from photos is too unreliable to be used as a strict cross-check gate; it should be extracted for human review only.
- **Quality Gates:** Instead of failing documents simply because the OCR output is short, the pipeline should fail gracefully only if no critical identifiers (`id_subtype`) can be extracted.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `implementation_plan.md` | `created` | Created the new implementation plan for the Identificacao unification. |

## Open Questions

- Does the proposed database migration for existing `DocumentVersion` and `DocumentTemplate` records require manual intervention for specific `KitType` definitions, or should the migration attempt to auto-update them?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `validates` | The session confirmed this discovery is the correct architectural path forward. |
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `contradicts` | The session exposed that this older implementation plan is fundamentally flawed and too narrow. |
