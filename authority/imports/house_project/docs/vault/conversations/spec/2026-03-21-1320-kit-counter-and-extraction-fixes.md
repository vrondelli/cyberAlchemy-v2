---
tags: [acquisition, pipeline, ccb]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T13:20:00-03:00
expires: 2026-05-20
conversation_id: 53bbf3b0-8346-4828-9872-7fc72a8cc3ee
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Corrected the kit document counter SQL criterion (reason-based → extracted_data IS NOT NULL), fixed CPF extraction regex for Averbação SIAPENET, re-ordered EMPRESA_KEYWORDS to prevent SIAPENET docs from being misclassified as capital_consig, and fixed CCB nome/numero_ccb regexes — all localized pipeline fixes with permanent effect on extraction accuracy."
version: 0.1.0
last_updated: 2026-03-21
---

# Kit Counter and Extraction Pipeline Fixes

**Date:** 2026-03-21 13:20 (UTC-3)
**Tags:** #acquisition #pipeline #ccb

## Summary

This session addressed multiple extraction pipeline correctness issues that were visible in the UI as wrong kit counts, empty extracted fields, and incorrect `empresa_geradora` classification. The root causes were spread across the SQL counter logic, the `EMPRESA_KEYWORDS` priority order, and regex patterns in the universal extraction JSON configs. All fixes were applied to both the source files (for future uploads) and directly to the affected DVs in the database (for existing data).

The main diagnostic finding was that `_update_batch_counters` was using `reason IN ('ocr_match', 'extracted_not_cross_checked')` to compute `documents_matched`, which excluded documents that went through universal extraction with partial success (`reason=no_template` but `extracted_data` set). The criterion was changed iteratively: first to `doc_type IS NOT NULL` (too broad), then corrected to `extracted_data IS NOT NULL` (semantically correct: a document has matched kit if it produced any extracted data).

The secondary investigation revealed that all Averbação/CCB `empresa_geradora` values were showing as `capital_consig` or `unico` due to `EMPRESA_KEYWORDS` iteration order — portal documents (SIAPENET, Dataprev) mention "Capital Consig" as the *consignatária* in their body, causing false early matches. Reordering the dict to check portal-specific URLs first resolved this for future uploads; 18 DVs were corrected retroactively.

The tertiary and quaternary issues were regex-level: (1) the Averbação SIAPENET CPF field regex expected `CPF Consignado\n<value>` but both the JSON config and the registered template in the DB had `CPF Consignado` (without leading `CPF` variant), causing CPF to go unmatched when the label was `CPF\n<value>` (no "Consignado"). (2) CCB `nome` regex required `Nome:` but table-layout CCBs use `1.1 Nome\n  <value>` — both the colon and the indentation needed handling.

### Kit Counter Logic Fix (`documents_matched`)

- **Problem/Goal:** UI showed `1/5` kit count for folders where Averbação and Comprovante were both extracted. Root cause: `_update_batch_counters` SQL used `reason IN ('ocr_match', 'extracted_not_cross_checked')` which excluded universal extraction with `reason=no_template` even when data was present.
- **Decision:** Criterion changed to `extracted_data IS NOT NULL` — any document that produced extracted fields counts toward the kit, regardless of the extraction path (template or universal).
- **Changes:** `process_bulk_import.py` SQL updated; two `TestUpdateBatchCountersFolderLevel` tests updated to use `extracted_data` fixture instead of `reason` to control expectations.

### Averbação CPF Regex Fix

- **Problem/Goal:** CPF field was empty for SIAPENET "Contratos" layout (`CPF Consignado *\n<value>`) and also lacked robustness for "Contratos Vigentes" layout (`CPF\n<value>`).
- **Decision:** Regex updated to `CPF(?:\s+Consignado)?\s*\*?\s*\n([^\n]+)` to handle both layouts.
- **Changes:** `averbacao_sape.json` updated. Template `averbacao-sape-template` (id=13) `extraction_config` updated in the DB. 3 DVs with empty CPF retroactively re-extracted and saved.

### EMPRESA_KEYWORDS Priority Order Fix

- **Problem/Goal:** All `DocumentVersion.empresa_geradora` values for Averbação were stored as `capital_consig` because SIAPENET docs contain "CAPITAL CONSIG" (the consignatária) in their body text, and `capital_consig` was the first key in the dict. CCBs were getting `empresa_geradora=unico` because they carry a "unico | sign" digital signature footer.
- **Decision:** Dict reordered to: `siapenet → dataprev → sape → capital_consig → unico`. Portal-specific identifiers (URLs, navigation bar text "SERVIÇOS SAIR") take priority. `capital_consig` becomes the fallback for genuine Capital Consig documents (CCBs). `unico` is last because genuine Antifraude docs do not mention Capital Consig.
- **Changes:** `template_matching_config.py` EMPRESA_KEYWORDS reordered. Added `SERVIÇOS\s+SAIR` pattern to `siapenet` (navigation bar present even when URL is not in OCR). 18 DVs retroactively corrected.

### CCB Extraction Regex Fixes (`nome`, `numero_ccb`)

- **Problem/Goal:** `reason=no_template` on CCBs that had all other fields extracted — `nome` was empty because the table-layout CCB uses `1.1 Nome\n  FERNANDO...` (no colon, indented value) rather than `Nome: FERNANDO`. `numero_ccb` captured just `:` from `Proposta Nº:` before reaching the actual `BANCÁRIO Nº 600281055-1`.
- **Decision:** `nome` regex made table-aware: `(?:1\.1\s+)?Nome:?\s*\n\s*([A-ZÁÉÍÓÚÃÕÂÊÔÇ][^\n]+)`. `numero_ccb` regex anchored to context: `BANCÁRIO\s+N[°º]\s*([\w\d][\w\d\-]+)`.
- **Changes:** `ccb_consig.json` updated. 21 CCBs with empty nome retroactively re-extracted and saved with `reason=extracted_not_cross_checked`.

Key outputs:
- `domains/aquisicao/use_cases/process_bulk_import.py` — SQL criterion for `documents_matched`
- `domains/aquisicao/domain/extraction_configs/averbacao_sape.json` — CPF regex
- `domains/aquisicao/domain/extraction_configs/ccb_consig.json` — nome and numero_ccb regexes
- `domains/aquisicao/domain/template_matching_config.py` — EMPRESA_KEYWORDS order
- `domains/aquisicao/tests/test_parallel_bulk_import.py` — counter tests

## Tests Added/Modified

| Test file | Tests modified | Business rule validated |
|-----------|---------------|------------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_folder_level_counters_computed`, `test_multiple_folders_independent_counters` | `documents_matched` counts DVs where extraction produced data (`extracted_data IS NOT NULL`), not where a specific `reason` was set |

**Why these tests matter:** The counter determines the kit progress displayed in the UI. If the wrong criterion is used, users see incorrect kit completion status (`1/5` instead of `2/5`), leading to incorrect triage decisions about which folders need attention.

## Key Decisions

- **`documents_matched` criterion:** `extracted_data IS NOT NULL` — a document has "matched" for kit purposes if any fields were extracted, regardless of which extraction path was used (template or universal).
- **`EMPRESA_KEYWORDS` order:** Portal-specific identifiers (SIAPENET URL, "SERVIÇOS SAIR" nav bar) must take priority over `CAPITAL CONSIG` substring matches to prevent consignatária name from misclassifying document origin.
- **`unico` placement:** `unico` goes after `capital_consig` because CCBs (Capital Consig documents) routinely carry "unico | sign" digital signature stamps, while true unico documents (Antifraude) do not mention Capital Consig.
- **CCB `nome` regex:** Must handle both `Nome:\n<value>` (old format) and `1.1 Nome\n  <value>` (table format with indentation) — `\s*` before the capture group is required.
- **CCB `numero_ccb` regex:** Must be anchored to `BANCÁRIO N°` context, not bare `N[°º]`, to avoid matching `Proposta Nº:` which comes earlier in the text.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | SQL in `_update_batch_counters`: `reason IN (...)` → `extracted_data IS NOT NULL` |
| `domains/aquisicao/domain/extraction_configs/averbacao_sape.json` | `modified` | CPF regex: handles both `CPF` and `CPF Consignado` label variants |
| `domains/aquisicao/domain/extraction_configs/ccb_consig.json` | `modified` | `nome` regex: table-layout support + indentation; `numero_ccb` regex: anchored to BANCÁRIO context |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | `EMPRESA_KEYWORDS` reordered (siapenet/dataprev/sape/capital_consig/unico); added `SERVIÇOS SAIR` pattern to siapenet |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Updated `TestUpdateBatchCountersFolderLevel` tests to use `extracted_data` fixture |
| `frontend/src/pages/Contratos.jsx` | `modified` | `REASON_LABELS.no_template`: generalized from CCB-specific to generic label |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Template `extraction_config` in DB diverges from JSON files on disk — two sources of truth | Discovered when template CPF regex didn't match the fixed JSON | MEDIUM | Open |
| `_config_cache` in `universal_extraction.py` is not invalidated on file change — requires process restart | Observed during debugging cycle | LOW | Open |
| Retroactive re-extraction is a manual shell process — no management command or admin UI | Needed multiple times this session for existing DVs | MEDIUM | Open |
