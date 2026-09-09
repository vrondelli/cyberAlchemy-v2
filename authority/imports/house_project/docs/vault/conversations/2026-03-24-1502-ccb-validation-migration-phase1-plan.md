---
tags: [ccb, architecture]
node_type: implementation-plan
is_session: true
layer: [architecture, domain]
nature: procedural
status: active
created: 2026-03-24
timestamp: 2026-03-24T15:02:37-03:00
expires: 2026-05-23
conversation_id: 0f4308ce-1568-4ef0-be85-c24479e078fc
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md, specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced the Phase 1 implementation plan to physically decouple the document validation pipeline into the new documents_validation domain architecture."
---

# Phase 1 Migration Planning for CCB Validation Workflow

**Date:** 2026-03-24 15:02 (UTC-3)
**Tags:** #ccb #architecture

## Summary

This session focused on translating the architectural objectives established in the Phase 1 discovery document into a concrete, actionable implementation plan. The goal is to physically "Lift and Shift" the existing document validation ecosystem from the `aquisicao` domain to a dedicated `documents_validation` domain without altering any core business logic. I comprehensively investigated the current physical locations of all relevant code resources, mapped out the upcoming directory scaffolding, formulated the plan according to vault conventions, and linked the specs explicitly.

### Migration Mapping and Plan Generation
- **Problem/Goal:** The user needed a concrete implementation plan for Phase 1 of the document validation migration, translating the `documents-validation-migration-discovery.md` into exact file movements.
- **Decision:** It was decided that all domain services, use cases, API integrations (OCR and Gemini AI), config layouts, asynchronous celery tasks, and their corresponding unit tests will be systematically moved into `documents_validation`. Also, the `extract_id_gemini.py` and `load_extraction_configs.py` management commands and the `test_document_template.py` test suite were incorporated.
- **Changes:** A new procedural specification (`documents-validation-migration-implementation.md`) was generated. The discovery document was updated to include bidirectional traceability with the implementation plan via the `## Connections` block.

## Key Decisions

- **Management Commands Migration:** `extract_id_gemini.py` and `load_extraction_configs.py` were added to the migration scope because they are closely tied to the extraction routines moving from `aquisicao`.
- **Test File Migration:** `test_document_template.py` was designated for migration to ensure complete test coverage matching the physical layout isolation.
- **Strict "Lift and Shift":** As detailed in the discovery doc, Phase 1 strictly involves moving files and rewriting import statements globally; logical decoupling and Django ORM abstraction are deferred to Phase 2.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `created` | Created the formal Phase 1 implementation plan specifying precisely which files to relocate. |
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `modified` | Added the `Connections` Markdown table referencing the successful generation of the implementation schema. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/documents-validation-migration-discovery.md` | `derives-from` | This session was motivated by the architectural rationale in the discovery doc. |
| `specs/002-ccb-validation-workflow/documents-validation-migration-implementation.md` | `resolves` | The outcome of this session produced the aforementioned implementation plan. |
