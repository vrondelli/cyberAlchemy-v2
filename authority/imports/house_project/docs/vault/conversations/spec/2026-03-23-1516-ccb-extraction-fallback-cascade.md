---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T15:46:00-03:00
expires: 2026-05-22
conversation_id: 694530a5-5a43-4926-9c95-33f6a51234e4
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Implemented CCB extraction fallback cascade, generalized universal regex to handle multiple CCB layouts, expanded text extraction to 4 pages, and added score persistence — collectively fixing silent extraction failures across all CCB variants."
user_satisfaction: 8
user_satisfaction_min: 7
user_satisfaction_max: 9
user_satisfaction_std: 0.7
version: 0.1.0
last_updated: 2026-03-23
---

# CCB Extraction Fallback Cascade + Regex Generalization

**Date:** 2026-03-23 15:46 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session implemented three major improvements to the CCB extraction pipeline: (1) `MatchResult` dataclass and score persistence for observability, (2) a fallback extraction cascade when template extraction misses critical fields, and (3) generalization of the universal CCB regex patterns to handle multiple layout variants. An investigation of a specific CCB (`CCB_202310116-1.pdf`) that failed extraction revealed that the regex patterns in `ccb_cap.json` required numbered section prefixes (`1.1`, `3.7`, `c3)`) that don't exist in all CCB layouts, causing 29 of 53 fields to be empty despite visible data in the document.

The session also expanded text extraction from 3 pages to 4 pages to capture the authentication/signature page where `envelope_hash` and `documento_hash` are located. Combined, these changes increased field extraction from 24 to 39 fields for the affected CCB, with all critical fields (`cpf`, `nome`, `numero_ccb`, `valor_liberado`, `valor_parcela`, `quantidade_parcelas`) successfully extracted.

### Score Persistence on DocumentVersion
- **Problem/Goal:** No observability into template matching quality — Jaccard scores and pHash distances were discarded after the match decision.
- **Decision:** Add `jaccard_similarity` (FloatField) and `phash_distance` (IntegerField) to `DocumentVersion`. Create `MatchResult` dataclass to wrap the return of `find_matching_template`.
- **Changes:** Model fields, `MatchResult` dataclass, `find_matching_template` updated, migration `0043`, 70+ test mock patches updated.

### CCB Extraction Fallback Cascade
- **Problem/Goal:** Template extraction silently produces incomplete data when regex patterns miss fields, with no fallback attempt.
- **Decision:** Template extraction → check critical fields → if incomplete, try universal extraction → merge best results. Confidence set to `MEDIA`/`BAIXA` for fallback paths.
- **Changes:** Implemented in `_process_folder` in `process_bulk_import.py`.

### Universal Regex Generalization
- **Problem/Goal:** `ccb_cap.json` regex patterns required numbered prefixes (`1.1 Nome:\n`, `c3) tributos R$`, `3.7 Valor do IOF R$`) that exist only in the "Quadro" layout. The "Cartão Crédito Saque" layout uses plain `Nome: VALUE`, `IOF: 67,08` on the same line.
- **Decision:** Remove all numbered section prefixes and make `\n` between label and value optional. Patterns now match both `1.1 Nome:\nVALUE` and `Nome: VALUE`.
- **Changes:** All 53 regex patterns rewritten in `ccb_cap.json`. CET and taxa_juros patterns simplified from same-line format (`X% ao mês e Y% ao ano`) to separate-line format (`CET mensal: 4,99 %`).

### Page Expansion for Authentication/Signature
- **Problem/Goal:** `envelope_hash` was not extracted because it lives on the authentication page (page 3+), but extraction only covered pages 0-2.
- **Decision:** Expand text extraction from `[0, 1, 2]` to `[0, 1, 2, 3]` in both Step 2a (classification) and the config.
- **Changes:** Updated `ccb_cap.json` pages, `process_bulk_import.py` Step 2a extraction, and cache check range.

Key outputs:
- `ccb_cap.json` — generalized regex, 4-page coverage
- `models.py` — `jaccard_similarity` + `phash_distance`
- `manage_document_template.py` — `MatchResult` dataclass
- `process_bulk_import.py` — score persistence + fallback cascade + 4-page extraction
- Migration `0043_add_matching_scores_to_dv`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | 70+ mock patches updated to `MatchResult` | `find_matching_template` contract: callers handle `MatchResult` wrapper |
| `domains/aquisicao/tests/test_ocr.py` | 3 mock patches updated to `MatchResult` | OCR pipeline integration with updated template matching |

**Why these tests matter:** The `find_matching_template` signature changed from `DocumentTemplate | None` to `MatchResult`. All 70+ mock updates ensure pipeline test coverage (CCB identification, template matching, universal fallback, kit evaluation) works with the new return type.

## Key Decisions

- **MatchResult dataclass:** Single structured return type instead of tuple, for clarity and extensibility.
- **Field merge strategy:** Universal extraction forms base, template values overlay (non-empty wins).
- **Confidence levels:** `ALTA` for template-sufficient, `MEDIA` for universal fallback, `NENHUMA` for failure.
- **Regex philosophy:** Universal config (`ccb_cap.json`) should use the most general patterns possible — no numbered prefixes, optional `\n`, optional `R$`.
- **4-page extraction:** Authentication pages (with `ENVELOPE` hash) are standard in signed CCBs, so 4 pages is the safe default.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `jaccard_similarity` and `phash_distance` to `DocumentVersion` |
| `domains/aquisicao/use_cases/manage_document_template.py` | `modified` | Added `MatchResult` dataclass; `find_matching_template` returns it |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Score persistence, fallback cascade, expanded text extraction to 4 pages |
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `modified` | Generalized all 53 regex patterns; expanded pages to `[0,1,2,3]` |
| `migrations/aquisicao/0043_add_matching_scores_to_dv.py` | `created` | Migration for score fields |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | 70+ mock patches → `MatchResult` |
| `domains/aquisicao/tests/test_ocr.py` | `modified` | 3 mock patches → `MatchResult` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `modified` | User updated: added Holerite RJ support, empresa list, version bump to 1.1.0 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/business-rules.md` | `implements` | Critical field check after extraction now has a fallback path |
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `updates` | Pipeline spec updated with Holerite RJ and empresa list |
| `docs/vault/conversations/2026-03-23-1430-ccb-extraction-alignment.md` | `continues` | Implements gaps identified in the extraction alignment session |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add dedicated test cases for the fallback cascade (template incomplete → universal → merge) | This session | MEDIUM | Open |
| Add test cases for generalized regex patterns against both CCB layout variants | This session | MEDIUM | Open |
| Critical field check for non-CCB doc types (Holerite, Identificacao) — only CCBs have fallback | This session | LOW | Open |
| Update DB template `ccb-consig-template` extraction_config to also be more general | This session | MEDIUM | Open |

## Open Questions

- Should the DB template `ccb-consig-template` regex also be generalized, or should it remain specific to the "Quadro" layout since it was validated against that exact format?
- Should the fallback cascade be extended to non-CCB document types?
