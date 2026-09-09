---
tags: [ccb, pipeline, architecture]
node_type: discovery
is_session: true
layer: [architecture, domain]
nature: [explanatory, technical]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:10:20-03:00
expires: 2026-05-23
conversation_id: a2b37b64-5226-4896-8053-e402a1eea712
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Phase-by-phase mapping of proposed pipeline to current codebase establishes the analytical foundation for the documents_validation migration and subsequent pipeline refactoring."
---

# Analyzing Document Validation Pipeline Phases

**Date:** 2026-03-24 16:10 (UTC-3)
**Tags:** #ccb #pipeline #architecture

## Summary

This session reviewed the business problem described in `document-validation-pipeline-discovery.md` and validated its core thesis: precise, hierarchical failure reasons are essential for operator productivity. The session then mapped each of the 7 proposed pipeline phases to their actual locations in the current `process_bulk_import.py` monolith, identifying which phases are already well-isolated (Phases 6-7) and which are tangled together (Phases 1+2 and Phases 3+4+5).

A key clarification was made about `no_id` — it's not a Phase 2 (classification) failure but a Phase 6 (CCB Database Linkage) failure, meaning the CCB was classified and extracted but `numero_ccb`/`id_titulo` came back empty. The session concluded with agreement that domain migration to `documents_validation` must precede any pipeline refactoring, and the analysis was persisted as a companion document to the original discovery.

### Business Problem Validation
- **Problem/Goal:** Assess whether the business problem in `document-validation-pipeline-discovery.md` is sound.
- **Decision:** The core insight is valid — a generic `PENDENTE` status forces operators into diagnostic guessing, and the hierarchical failure reason concept is the right solution.
- **Changes:** No changes to the discovery document.

### Phase-to-Code Mapping
- **Problem/Goal:** Ground each of the 7 proposed phases in the actual codebase to understand the gap between vision and current state.
- **Decision:** Phases 1+2 are fused in `_step_classify_dvs()`, Phases 3+4+5 are fused in `_step_extract_and_match()` and sub-functions. Phases 6-7 are already clean. The `no_id` reason was correctly placed in Phase 6, not Phase 2.
- **Changes:** Created `document-validation-pipeline-phase-analysis.md` documenting the full mapping.

### Implementation Sequencing
- **Problem/Goal:** Determine the right order for implementation.
- **Decision:** Migrate to `documents_validation` domain first (lift-and-shift), then untangle phases (pure refactor), then optionally introduce Chain of Responsibility pattern.
- **Changes:** Sequencing documented in the phase analysis file.

Key outputs:
- `specs/002-ccb-validation-workflow/document-validation-pipeline-phase-analysis.md` — Maps 7 pipeline phases to current code, documents tangled areas, and establishes implementation sequence.

## Key Decisions

- **Migration before refactoring:** Pipeline refactoring must happen after code is migrated to `documents_validation` domain to avoid doing the work twice.
- **`no_id` belongs to Phase 6:** Clarified that `no_id` is a CCB Database Linkage failure (no `numero_ccb` extracted), not a classification failure.
- **Three-step refactoring sequence:** (1) domain migration, (2) function decomposition (untangle fused phases), (3) optional pipeline pattern (Chain of Responsibility classes).

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-validation-pipeline-phase-analysis.md` | `created` | Phase-by-phase mapping of the 7 proposed pipeline phases to current codebase locations, with implementation sequencing |

## Open Questions

- Should Phase 4 own a distinct `extraction_failed` reason instead of falling through to `missing_critical`?
- Full Chain of Responsibility (class-based) or clean function decomposition after migration?
- Should `empresa_geradora` inference be its own sub-phase between classification and template matching?
