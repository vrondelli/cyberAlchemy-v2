---
tags: [ccb, pipeline, architecture]
node_type: discovery
is_session: true
layer: [architecture, domain]
nature: [explanatory, technical]
status: active
created: 2026-03-24
timestamp: 2026-03-24T16:05:14-03:00
expires: 2026-05-23
conversation_id: e21c5897-78ff-4ebf-8d4c-46b20237cab1
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Abstracted the CCB validation pipeline into 7 logical phases to formalize hierarchical failure fallbacks, proposing a Chain of Responsibility pattern instead of procedural extraction."
---

# Document Processing Pipeline Re-architecture Discovery

**Date:** 2026-03-24 16:05 (UTC-03)
**Tags:** #ccb #pipeline #architecture

## Summary

This session explored the reasons for `DocumentVersion` status flags within the `aquisicao` domain's bulk import pipeline. Specifically, the conversation addressed the challenge of providing clear feedback to human operators when automated extractions fail. Because the extraction flow is currently a procedural behemoth (`traverse_and_identify`), reason assignment is tightly coupled to nested conditional statements, making it difficult to implement hierarchical fallbacks safely (e.g., trying universal extraction if a specific templated regex fails).

To address this, we drafted a formal Discovery document proposing a "Chain of Responsibility" architecture. The pipeline was conceptually decoupled into 7 distinct phases, each governing specific fallback rules. The core design principle established here is the "Earliest Fatal Failure Priority Rule"—if Phase 1 (Raw Text Extraction) fails, the document is flagged `no_text_found`, preventing subsequent phases from improperly flagging it as `no_template` or `missing_critical`.

### Current State Analysis
- **Problem/Goal:** The user wanted to know how different `REASON_*` constants are reached in the document validation lifecycle.
- **Decision:** Analyzed `process_bulk_import.py` and `run_ocr.py` to map the trigger conditions for all FSM states.
- **Changes:** Produced a temporary FSM state machine mapping artifact identifying the raw `DocumentVersion.status` + `reason` transitions currently residing in procedural code.

### Pipeline Re-architecture Proposal
- **Problem/Goal:** The need for granular operator feedback collides with the difficulty of adding fallback strategies (like Gemini or general regex) without creating spaghetti code.
- **Decision:** Proposed isolating the 7 validation steps into individual classes connected via a Chain of Responsibility pattern.
- **Changes:** Created a formal Discovery document inside `specs/002-ccb-validation-workflow/` explicitly outlining the business context, operator pain points, and abstract structural goals for this migration.

## Key Decisions

- **Pipeline Phasing:** Identified 7 linear phases for document import matching: Text Extraction, Entity Identification, Template Matching, Field Extraction, Critical Verification, CCB Database Linkage, and Data Cross-Check.
- **Priority Resolution:** Formally established that a document's failure reason operates on a First-Failure-Wins hierarchy.
- **Chain of Responsibility:** Proposed building individual "Step" instances to execute the pipeline linearly, giving each step autonomy to handle local fallbacks before raising a terminal failure to the operator.

## Files Changed

### Code

No code changes were made in this session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/document-validation-pipeline-discovery.md` | `created` | A structured Discovery specification conceptualizing the pipeline re-architecture, incorporating explicit business context to explain the operator feedback problem. |
