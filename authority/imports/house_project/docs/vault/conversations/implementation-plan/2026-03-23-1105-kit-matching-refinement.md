---
tags: [acquisition, ccb, kit-matching, validation]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T11:05:00-03:00
expires: 2026-05-22
conversation_id: e69cbaba-2af9-465d-ae4a-ddd4d867682d
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: ["specs/002-ccb-validation-workflow/spec-refinamento-kit-matching.md"]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Produced an implementation plan to refine kit matching logic based on the DB contract rather than early greedy extraction, fixing a UI false-positive bug."
---

# Kit Matching Refinement and Holerite Addition

**Date:** 2026-03-23 11:05 (UTC-3)
**Tags:** #acquisition #ccb #kit-matching #validation

## Summary

This session focused on analyzing the current workflow for document `kit_type` matching, specifically regarding the CCB document. By inspecting the document batches in the database and the pipeline execution flow (`process_bulk_import.py`), it was discovered that the current "best effort" greedy matching at Step 2c evaluates all non-CCB documents against all active kits. This led to a UI issue where folders without a matching CCB contract still displayed "5/5 docs" matched for a kit.

We decided to eliminate this early evaluation and tie the kit evaluation strictly to the `ProdutoKitConfig` retrieved from the `ContratoCCB` in Step 4. An implementation plan/spec was written documenting this refinement. Additionally, the user added a new `Holerite` document type to the system's OCR configurations.

### Investigating Kit Matching Logic
- **Problem/Goal:** The user observed that the database contained folders with `STATUS_PENDENTE` and `REASON_NO_ID_MATCH`, but the frontend showed "5/5 docs" for the kit.
- **Decision:** The kit matching should only be triggered after the CCB is validated against the database. If there is no contract, the kit should not be evaluated at all.
- **Changes:** Designed an implementation plan (`spec-refinamento-kit-matching.md`) detailing the move of `_run_kit_evaluation` exclusively to Step 4.

### Adding Holerite Support
- **Problem/Goal:** Support for a new document type was needed.
- **Decision:** N/A
- **Changes:** Added `Holerite` to `SUPPORTED_DOC_TYPES` and added keyword recognition for it in `DOC_TYPE_KEYWORDS` and `FILENAME_KEYWORDS` in `template_matching_config.py`.

Key outputs:
- `spec-refinamento-kit-matching.md` — Implementation plan for refining the CCB kit matching.

## Key Decisions

- **Kit Evaluation Timing:** Kit matching will be entirely deferred until Step 4, and only executed if the CCB contract is found.
- **Strict Kit Filtering:** Instead of evaluating against all active kits, the pipeline will only test the specific kits matching the `tipo_produto` and `emissor` from the DB contract.
- **UI Truthfulness:** Folders without a matched contract will have their `matched_kit_type` and `required_docs_count` strictly empty to prevent false positives in the frontend.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Added `Holerite` to supported types and defined keyword matching rules. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/spec-refinamento-kit-matching.md` | `created` | Created the specification and implementation plan for the kit matching refinement. |
