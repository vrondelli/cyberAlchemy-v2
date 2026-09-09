---
tags: [ccb, acquisition, pipeline]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T17:18:00-03:00
expires: 2026-05-20
conversation_id: 287dc5a4-1719-41c2-a6c0-e4f5003783bb
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Rebuilt `ccb_cap.json` extraction config to handle both the standard numbered-section CCB layout and the Cartão/Saque variant (shifted section numbers), boosting field extraction from 18→49/53, and established the code-as-source-of-truth pattern with data migration; this has lasting operational impact on the fallback pipeline branch used when no template matches."
version: 0.1.0
last_updated: 2026-03-21
---

# CCB Fallback Extractor Rebuild & Distance Analysis

**Date:** 2026-03-21 17:18 (UTC-3)
**Tags:** #ccb #acquisition #pipeline

## Summary

This session focused on diagnosing and fixing the universal (fallback) CCB extractor used when no specific template matches a document. The user uploaded a batch of CCBs (Batch 142 / DOCS-20260321) from Capital Consig. 7 of the 9 CCBs in the batch did not match any registered template and were failing to extract the vast majority of fields (only 17–18 of 53). The root cause was that the `ccb_cap.json` extraction regexes were written for a different text layout than what the OCR was producing for these documents.

We diagnosed the problem by running Jaccard similarity and pHash Hamming distance calculations for each CCB against both registered templates, confirming that the documents were far from both templates both textually (~16-48% vs. 85% threshold) and visually (11-27 vs. 10 threshold). This also clarified why pHash was only computed for some documents — it is lazily evaluated, only when Jaccard already fails.

The extraction gap was understood by printing the raw OCR text of an unmatched CCB, which revealed that the PDF format had all field values on the **next line** after the label (e.g., `1.1 Nome:\nADRIANA CALHEIROS SILVA` instead of `Nome: ADRIANA`). The original regexes expected inline values. We rewrote all regexes in `ccb_cap.json` to use `\n?` between label and value. Additionally, a second CCB sub-type (Cartão de Crédito / Saque) was found in the same batch with section numbers shifted by 1-2 (e.g., CET at `3.15` instead of `3.17`). Alternation patterns `(?:17|15)` were added for all those section numbers.

After fixes, the six standard CCBs went from 18→49/53 extracted fields. The Cartão variant went from 6→43/53. The remaining missing fields are genuinely absent in these document types (e.g., `nome_social`, `taxa_emissao_cartao`, `consignataria`). The config was synced to both the DB (Template 16) and the `ccb_cap.json` file. A clarifying Q&A explored the architecture of two-source configs (disk JSON for fallback vs. DB config for template-matched extraction) and why they use the same `extract_fields()` function under the hood.

Finally, test failures in `test_universal_extraction.py` were fixed by updating the `CCB_SAMPLE_TEXT` fixture to use the new numbered-section format, and the cache assertion was updated to expect `ccb_cap.json` instead of `ccb_consig.json`.

### Template Distance Analysis

- **Problem/Goal:** Understand mathematically why CCBs weren't matching templates.
- **Decision:** Ran live Jaccard (text) and pHash Hamming (image) distance calculations in the DB shell via `python manage.py shell`.
- **Changes:** No code change — pure diagnostic. Explained that pHash is only computed lazily (when Jaccard already fails).

### CCB Extractor Rebuild (`ccb_cap.json`)

- **Problem/Goal:** 7/9 CCBs were using the fallback extractor but extracting only 18/53 fields because regexes expected inline labels (`Nome: ADRIANA`) but OCR produced multi-line (`1.1 Nome:\nADRIANA`).
- **Decision:** Rewrite the entire `ccb_cap.json` with `\n?` gaps between label and value, numbered-section anchors (`1.1–1.19`, `2.1–2.4`, `3.1–3.17`), and section-number alternation groups for the Cartão/Saque CCB sub-type.
- **Changes:** Complete rewrite of `ccb_cap.json`. The config was then synced to Template 16 in the DB via a `manage.py shell` script.

### Architecture Clarification (extraction_configs vs. DB)

- **Problem/Goal:** User asked whether the JSONs in `extraction_configs/` are the same as the DB `extraction_config` field.
- **Decision:** They are structurally identical but two separate sources. Disk JSONs = fallback universal extractor. DB field = template-matched extractor. Both feed the same `extract_fields()` function.
- **Changes:** No code change — architectural Q&A.

### Test Fixture Update

- **Problem/Goal:** 5 tests in `test_universal_extraction.py` failed because `CCB_SAMPLE_TEXT` fixture used the old flat-format layout.
- **Decision:** Update fixture to use the full Quadro I/II/III numbered-section format matching the new `ccb_cap.json`.
- **Changes:** Updated `CCB_SAMPLE_TEXT` and partial-match fixture text. Fixed cache assertion from `ccb_consig.json` → `ccb_cap.json`. All 23 tests now pass.

Key outputs:
- `ccb_cap.json` — completely rebuilt with multi-line and alternation-aware regexes
- `test_universal_extraction.py` — fixture updated to reflect the new format

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|-----------------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | `CCB_SAMPLE_TEXT` fixture rewritten; `test_config_caching` assertion updated | The fallback extractor must correctly extract CCB fields from the numbered-section layout produced by Capital Consig OCR text when no template matches |

**Why these tests matter:** Without these tests, a future change to the regex patterns in `ccb_cap.json` could silently cause 0 fields to be extracted for all unmatched CCBs — which in production means missing data for entire batches without any error surfaced.

## Key Decisions

- **Config source of truth:** `ccb_cap.json` (disk) is the primary specification; the DB template is kept in sync via the `0041` migration and manual reload scripts. Edits to the JSON require a re-sync step.
- **pHash is lazily evaluated:** pHash comparison only runs when Jaccard already fails. This is a documented performance optimization.
- **Section-number alternation:** Instead of creating a separate config for the Cartão/Saque CCB sub-type, alternation groups (`(?:17|15)`) were added to cover both variants within the same `ccb_cap.json`. This is a maintainability trade-off — reduces file count but adds regex complexity.
- **Remaining 12 test failures not fixed:** The `test_document_template.py` and `test_kit_management.py` failures caused by the data migration (0041) populating the DB during tests were identified but deferred to a future session.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `modified` | Complete rewrite of all 53 extraction regexes to handle multi-line Quadro layout and Cartão sub-type section-number alternation |
| `domains/aquisicao/tests/test_universal_extraction.py` | `modified` | Updated `CCB_SAMPLE_TEXT` fixture to Quadro I/II/III numbered-section format; fixed partial-match fixture and cache assertion |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `CCB_701004483-7.pdf` Cartão variant still misses 10/53 fields (`encargos`, `empregador`, `originador`, `multa_moratoria`, `valor_financiado`, `valor_total_devido`, `estado`) | Observed in batch 142 analysis | MEDIUM | Open |
| 12 test failures in `test_document_template.py` and `test_kit_management.py` caused by data migration `0041` seeding template in test DB | Observed in `run_tests.py` output | MEDIUM | Open |
| `ccb_cap.json` and Template 16 DB extraction_config can drift if JSON is edited without re-syncing to DB | Architectural gap identified | LOW | Open |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/spec-pipeline-identificacao-extracao.md` | `derives-from` | This session implements the universal extraction fallback path described in the pipeline spec |
