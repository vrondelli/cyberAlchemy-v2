---
tags: [ccb, pipeline]
node_type: implementation-plan
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T14:08:58-03:00
expires: 2026-05-22
conversation_id: ce582d03-ad07-4b6e-95e6-d7be1f85d155
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md", "specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md"]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Refined the implementation plan for extracting RJ payslips via Gemini, mapping missing tier 0 keywords and adding unit test requirements, alongside lowering the CCB Jaccard text similarity threshold to 0.80 to fix identification failures."
---

# Refining RJ Holerite Extraction & CCB Jaccard Threshold

**Date:** 2026-03-23 14:08 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

The session focused on two primary optimizations to the CCB classification and extraction pipeline. First, we reviewed and refined the implementation plan for extracting Holerite data for Rio de Janeiro (State and City) payslips using Gemini. The review identified missing `FILENAME_KEYWORDS` entries for Tier 0 classification, standardized key names (e.g. `banco_salario`) to align with existing SIAPE outputs, and pointed out the complete lack of base tests for `extract_holerite_with_gemini`, expanding the test requirements in the plan. Second, based on empirical data from recent valid CCB uploads scoring just under the existing cutoff (0.83-0.842), we surgically lowered the Jaccard text similarity threshold for template matching from `0.85` to `0.80` to prevent false negatives. The test suite was subsequently executed and passed without issues.

### RJ Holerite Extraction Plan Refinement
- **Problem/Goal:** The proposed implementation plan for RJ payslip extraction lacked comprehensiveness in identification and test coverage.
- **Decision:** Enhance the plan to include Tier 0 filename matching and require comprehensive baseline unit tests for the Holerite extraction service.
- **Changes:** Updated `gemini-holerite-rj-extraction-plan.md` to map `CONTRACHEQUE` to `FILENAME_KEYWORDS` and mandate base unit tests covering success, error retries, and invalid responses, in addition to the newly planned prompt routing tests. The schema mapping was also tweaked for consistency.

### CCB Template Similarity Tuning
- **Problem/Goal:** Valid CCB uploads were failing text-based template identification because their Jaccard similarity scores routinely landed between `0.83` and `0.842`, falling slightly below the `0.85` threshold.
- **Decision:** Lower the `TEXT_SIMILARITY_THRESHOLD` to `0.80` to safely capture these recent CCBs without opening the system to severe false positives.
- **Changes:** Modified `TEXT_SIMILARITY_THRESHOLD` to `0.80` within `domains/aquisicao/domain/template_matching_config.py` and updated empirical documentation in `spec-pipeline-identificacao-extracao.md`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Lowered `TEXT_SIMILARITY_THRESHOLD` from `0.85` to `0.80` to allow matching for recently seen valid CCB variations. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/gemini-holerite-rj-extraction-plan.md` | `modified` | Added Tier 0 identification rules, ensured key schema sync, and introduced comprehensive unit test requirements for the underlying extraction service. |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | Documented the updated Jaccard `TEXT_SIMILARITY_THRESHOLD` (0.80) and adjusted empirical reference ranges. |
