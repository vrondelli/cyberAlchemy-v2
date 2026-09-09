---
tags: [ccb, architecture, documents-validation]
node_type: discovery
is_session: true
layer: [architecture, domain]
nature: [explanatory, procedural]
status: active
created: 2026-03-24
timestamp: 2026-03-24T14:34:24-03:00
expires: 2026-05-23
conversation_id: b6485b56-6719-480a-958b-70120f04875a
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Created a comprehensive discovery specification outlining the two-phase architectural migration of the CCB extraction pipeline from the aquisicao domain to a new, isolated documents_validation domain."
user_satisfaction: {"score": 9, "min": 8, "max": 10, "std": 1}
---

# Auditing CCB Workflow & Migration Discovery

**Date:** 2026-03-24 14:34 (UTC-3)
**Tags:** #ccb #architecture #documents-validation

## Summary

The session focused on auditing the current implementation of the CCB validation workflow within the `aquisicao` domain and planning its architectural evolution. We started by verifying the current document extraction and template matching pipeline, correctly identifying how `_step_classify_dvs`, `infer_empresa`, and `find_matching_template` operate together in a multi-tier fallback system (Jaccard -> pHash -> Gemini -> Universal Regex). Acknowledging the technical debt caused by the 1,800-line "God File" (`process_bulk_import.py`) and its tight coupling to the Django ORM, we mapped out a path forward. The session culminated in the creation of a formal Discovery document outlining a two-phase migration strategy (Lift and Shift followed by Refactoring) to isolate this logic into a new `documents_validation` domain.

### Clarifying the Extraction Pipeline
- **Problem/Goal:** Understand exactly how classification, template matching, and fallbacks operate in the current CCB bulk import pipeline.
- **Decision:** Confirmed the pipeline uses a strict hierarchy, filtering templates by `doc_type` and `empresa_geradora`, utilizing Jaccard/pHash for matching, and falling back to Gemini or Universal extraction when templates fail or lack critical fields.
- **Changes:** Solidified the shared understanding of the existing architecture to inform the subsequent migration plan.

### Drafting the Domain Migration Discovery
- **Problem/Goal:** The document validation logic structurally violates Single Level of Abstraction (SLA) and pollutes the Acquisition domain with complex OCR/Regex mechanics.
- **Decision:** Formally propose migrating the ecosystem to a dedicated `documents_validation` domain.
- **Changes:** Created `documents-validation-migration-discovery.md` detailing the business/code context, enumerating all files to be moved (Use Cases, Services, Domain config), and specifying a risk-averse, two-phase migration roadmap.

## Key Decisions

- **Architecture:** Move the entire document extraction ecosystem out of `aquisicao` and into a dedicated `documents_validation` domain.
- **Migration Strategy:** Execute the migration in two phases: Phase 1 (Lift and Shift unchanged files) and Phase 2 (Refactor the God File into Step Functions and Repositories).

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `created` | Formal discovery specification mapping the business context, code context, and architectural strategy for the domain migration. |
