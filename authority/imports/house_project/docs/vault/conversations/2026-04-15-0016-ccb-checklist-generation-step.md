---
tags: [ccb, pipeline, documents-validation, architecture]
node_type: spec
is_session: true
layer: [domain, application]
nature: [technical, procedural]
status: active
created: 2026-04-15
timestamp: 2026-04-15T00:16:54-03:00
expires: 2026-06-14
conversation_id: ~
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/002-ccb-validation-workflow/docs/check-list/discovery-check-list.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Closed a real interface gap between spec and code on FolderState, introduced ChecklistGenerationStep into the pipeline, and left one known outstanding item (backfill command)."
---

# CCB Pipeline — ChecklistGenerationStep Wired

## Summary

This session reviewed a discovery checklist for spec-002 and found four issues: an unverified interface claim (FolderState didn't expose `ContratoCCB`), silent `ValueError` swallowing, an unsupported cross-domain import assertion, and an underdeveloped backfill plan. The spec was corrected against the actual code. Implementation followed: `FolderState` was extended with a `contrato` field, `ContratoLookupStep` was wired to populate it on successful match, and `ChecklistGenerationStep` was inserted between `ContratoLookupStep` and `CrossCheckStep` in `build_default_pipeline()`. A backfill command for existing contracts remains outstanding.

## Contradictions

- Corrects `specs/002-ccb-validation-workflow/docs/check-list/discovery-check-list.md` — spec claimed `FolderState` exposed `ContratoCCB`; verified against code that it did not; spec updated.

## Files touched

- specs/002-ccb-validation-workflow/docs/check-list/discovery-check-list.md
- domains/documents_validation/domain/extraction/folder_state.py
- domains/documents_validation/domain/extraction/steps/contrato_lookup.py
- domains/documents_validation/use_cases/extraction/checklist_generation_step.py
- domains/documents_validation/use_cases/extraction_pipeline_factory.py
