---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T14:28:00-03:00
expires: 2026-05-22
conversation_id: 35c30e65-1ac7-4703-8c22-65235aea592d
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md
  - specs/002-ccb-validation-workflow/business-rules.md
promoted_candidates: []
expected_importance: 5
importance_rationale: "Lowered Jaccard threshold to 0.80 and generalized universal CCB regex extraction to accept flat-format layouts, directly unblocking recent CCB uploads that failed identification."
version: 0.1.0
last_updated: 2026-03-23
---

# CCB Identification Fix — Threshold and Universal Extraction

**Date:** 2026-03-23 14:28 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

This session investigated and resolved the root cause of recent CCB documents failing identification in the upload pipeline. The latest batch (`Kit_Lastros-20260323`) had 15 CCBs, and all of them were marked as `no_template` or `no_id_match`. Two interconnected issues were discovered and fixed.

First, the Jaccard text similarity threshold was too tight: recent CCBs scored 0.83–0.84 against the template, but the threshold was set at 0.85, causing them to narrowly miss template matching. Second, the universal (template-free) extraction fallback also failed because the regex patterns in `ccb_cap.json` required numbered prefixes (`1.1 Nome:`, `1.2 CPF:`) that the actual production CCBs don't have — they use a flat format (`Nome:`, `CPF:`). Additionally, the `critical_fields` list was too strict, requiring 5 fields when only `numero_ccb` is truly necessary for the pipeline to proceed.

### Investigating CCB Identification Failures
- **Problem/Goal:** Understand why 15/15 recently uploaded CCBs were not identified.
- **Decision:** A diagnostic script (`query_ccb_distances.py`) was created to calculate the pHash Hamming distance and Jaccard text similarity between each uploaded CCB and the existing templates. Results revealed that documents scored 0.83–0.84 (vs threshold 0.85) on text similarity and 11–14 (vs threshold 10) on pHash distance.
- **Changes:** Script created and run to gather empirical data for the investigation.

### Lowering Jaccard Threshold
- **Problem/Goal:** CCBs narrowly failing the 0.85 text similarity threshold.
- **Decision:** Lower `TEXT_SIMILARITY_THRESHOLD` from 0.85 to 0.80. The gap between correct matches (~0.83+) and incorrect matches (~0.00–0.03) provides a safe margin even at 0.80.
- **Changes:** `template_matching_config.py` updated with new threshold and empirical justification. All 68 template-matching tests pass.

### Generalizing Universal CCB Extraction
- **Problem/Goal:** Even when template matching fails, the universal extraction fallback (`extract_fields_universal`) was also failing because regexes required numbered field prefixes and `critical_fields` demanded 5 fields.
- **Decision:** (1) Make all numbered prefixes optional via `(?:prefix)?`. (2) Make `R$` optional in value fields. (3) Reduce `critical_fields` to only `["numero_ccb"]`.
- **Changes:** `ccb_cap.json` updated with 28 regex changes and reduced critical fields. Test added for flat-format CCB text from production.

Key outputs:
- `template_matching_config.py` — Threshold lowered to 0.80
- `ccb_cap.json` — Generalized regex patterns, reduced critical fields
- `test_universal_extraction.py` — New flat-format extraction tests
- `test_parallel_bulk_import.py` — Updated pipeline reason code expectation

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_ccb_flat_format_extracts_fields`, `test_ccb_flat_format_without_empresa` | CCB extraction must work for both numbered-prefix and flat-format layouts |
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_ccb_missing_critical_field_returns_partial_fields_and_false_success` (updated) | Only `numero_ccb` is critical for universal extraction success |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_ccb_found_but_no_template_match` (updated) | When template matching fails but universal extraction finds `numero_ccb`, the pipeline correctly proceeds to contrato lookup |

**Why these tests matter:** Without flat-format coverage, any layout variation in production CCBs would silently fail extraction and leave documents stuck in `no_template` status, blocking the entire validation workflow.

## Key Decisions

- **Threshold lowered to 0.80:** The empirical gap between valid matches (0.83+) and false matches (0.00–0.03) is wide enough that 0.80 is safe. This directly unblocks the recent batch.
- **Only `numero_ccb` is critical:** For universal (template-free) CCB extraction, other personal data fields (nome, cpf, etc.) are valuable but not required to proceed with the pipeline. This avoids blocking extraction on regex fragility.
- **Optional numbered prefixes:** The regex now accepts both Capital Consig's numbered format (`1.1 Nome:`) and the flat format (`Nome:`) observed in recent production documents.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | modified | Lowered `TEXT_SIMILARITY_THRESHOLD` from 0.85 to 0.80 |
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | modified | Made 28 regex prefixes optional, made `R$` optional in value fields, reduced `critical_fields` to `["numero_ccb"]` |
| `domains/aquisicao/tests/test_universal_extraction.py` | modified | Added flat-format CCB test cases, updated critical field test |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | modified | Updated `test_ccb_found_but_no_template_match` to expect `no_id_match` (correct behavior after generalization) |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | modified | Updated threshold references from 0.85 to 0.80 (by user) |
| `specs/002-ccb-validation-workflow/business-rules.md` | modified | Updated `TEXT_SIMILARITY_THRESHOLD` from 0.85 to 0.80 in config table and description |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `updates` | Updated threshold values in the pipeline spec |
| `specs/002-ccb-validation-workflow/business-rules.md` | `updates` | Updated threshold values in business rules |

## Satisfaction

- **Score:** 8
- **Min:** 7
- **Max:** 9
- **Std:** 0.7
