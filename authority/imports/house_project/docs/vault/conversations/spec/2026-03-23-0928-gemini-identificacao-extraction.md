---
tags: [pipeline, acquisition]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T09:28:00-03:00
expires: 2026-05-22
conversation_id: ea2efb42-48fb-451c-a51d-a1637ebd43de
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Integrated Gemini 2.5 Flash as primary ID document extraction backend with 7-level self-reported confidence, fundamentally changing how Identificacao docs are processed and replacing unreliable OCR+regex for low-quality scans."
---

# Gemini Identificacao Extraction — Implementation

**Date:** 2026-03-23 09:28 (UTC-3)
**Tags:** #pipeline #acquisition

## Summary

This session implemented the integration of Gemini 2.5 Flash as the primary extraction method for Identificacao documents (CNH/RG) in the bulk import pipeline. The existing regex-based extraction was failing systematically on low-quality scans because Tesseract OCR produced noisy text that regex couldn't parse. The solution introduces Gemini as a vision model that reads document images directly, with automatic fallback to the existing regex extraction when Gemini is unavailable.

The session began by reviewing and correcting the existing implementation plan (`gemini-identificacao-extraction-implementation.md`), finding 8 issues including an incorrect `elif` in Gate 2 pseudocode, wrong line references, and 3 missing tests. After the plan was approved, the user requested an additional feature: Gemini should self-report its extraction confidence on a 7-level scale mapped to the `ExtractionConfidence` enum, replacing the previously hardcoded `ALTA`.

During implementation, a regression was discovered: the simplified Gate 2 rule (`nome + id|cpf`) broke existing RG regex tests because regex templates use different field names (`rg_numero`, not `id_documento`). This was resolved by bifurcating Gate 2 — simplified rule for Gemini, original `critical_fields` gate for regex.

### Spec Review & Correction (v1.2 → v1.3)
- **Problem:** Implementation plan had 8 issues found during cross-referencing against the actual codebase
- **Decision:** Fixed all issues directly in the spec document
- **Changes:** Corrected `elif` → `if` in Gate 2, updated line references, reversed the dead-code guidance on markdown-fence stripping (now kept defensively), added 3 missing tests (safety block, `time.sleep` on 4xx, large PDF page), corrected integration test file path to `test_parallel_bulk_import.py`

### ExtractionConfidence Expansion (v1.3 → v1.4)
- **Problem:** User wanted Gemini to self-report extraction confidence instead of hardcoding `ALTA`
- **Decision:** Expanded enum from 4 to 7 levels (Certeza, Muito Alta, Alta, Media, Baixa, Muito Baixa, Nenhuma); Gemini prompt instructs it to return an `extraction_confidence` field
- **Changes:** Updated `models.py`, created migration `0042`, added `GEMINI_CONFIDENCE_MAPPING` to `gemini_config.py`, service returns `(fields, confidence)` tuple

### Pipeline Integration
- **Problem:** Gemini extraction needed to be integrated into both template-matched (Path A) and no-template (Path B) code paths
- **Decision:** Gemini runs first for Identificacao docs; on failure, falls back to regex silently. Gate 1 (OCR chars) skipped for Gemini. Gate 2 bifurcated by extraction backend.
- **Changes:** Modified `_process_folder()` with Gemini intercept in both paths, updated quality gates

### Gate 2 Bifurcation (discovered during testing)
- **Problem:** Unified `nome + (id|cpf)` Gate 2 rule broke `test_rg_extraction_stores_fields` — regex extracts `rg_numero` not `id_documento`
- **Decision:** Gate 2 uses simplified rule only for Gemini; regex preserves original `critical_fields` + threshold logic
- **Changes:** Bifurcated Gate 2 in `process_bulk_import.py` behind `gemini_succeeded` flag

Key outputs:
- `gemini_extraction.py` — Gemini extraction service
- `gemini_config.py` — prompt, field mapping, confidence mapping
- `test_gemini_extraction.py` — 16 unit tests
- Migration `0042` — expanded ExtractionConfidence enum

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_gemini_extraction.py` | 16 new tests (success, retries, recovery, invalid JSON, no API key, field mapping ×2, PDF conversion, MIME detect, 4xx, empty candidates, safety block, confidence ×4) | Gemini extraction service must normalize fields to regex schema, retry on 5xx only, map 7 confidence levels, handle all error modes gracefully |

**Why these tests matter:** Without them, a Gemini API change (new response structure, different error codes, missing confidence field) could silently break ID document extraction for thousands of uploads, with no indication until operators notice missing data.

## Key Decisions

- **Gemini as primary, regex as fallback:** Gemini runs first for all Identificacao docs; regex only runs when Gemini is unavailable or fails.
- **Self-reported confidence:** Gemini assesses its own extraction quality on a 7-level scale, stored in `extraction_confidence` on `DocumentVersion`.
- **Gate 2 bifurcation:** Different field-completeness rules for Gemini (normalized schema: `nome + id|cpf`) vs regex (template-specific `critical_fields`).
- **Defensive markdown-fence stripping preserved:** Despite `responseMimeType: "application/json"`, the service tries `json.loads()` first, then strips fences and retries.
- **GEMINI_API_KEY required in worker environment:** Added to `docker-compose.dev.yml` for `celery_worker` service.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Expanded `ExtractionConfidence` from 4 to 7 levels |
| `migrations/aquisicao/0042_expand_extraction_confidence.py` | `created` | Migration for expanded choices |
| `domains/aquisicao/services/gemini_config.py` | `created` | Prompt, field mapping, confidence mapping, retry config |
| `domains/aquisicao/services/gemini_extraction.py` | `created` | Main extraction service |
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Added `GEMINI_IDENTIFICACAO_ENABLED = True` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Gemini integration in Path A + Path B + bifurcated Gate 2 |
| `domains/aquisicao/tests/test_gemini_extraction.py` | `created` | 16 unit tests |
| `docker-compose.dev.yml` | `modified` | Added `GEMINI_API_KEY` to `celery_worker` service |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md` | `modified` | Updated to v1.4.0: fixed 8 issues, added confidence level section, expanded test plan |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Integration tests (14-23) need `GEMINI_API_KEY` in CI or pipeline-level mocking | Test plan | MEDIUM | Pending |
| `GEMINI_API_KEY` not yet set in `.env` — Gemini extraction inactive until key is provided | Worker logs | ⚠️ HIGH | Pending |
| Stale Celery tasks re-execute on worker restart (batches 13-18, 115, 146, 158, 159) | Worker logs | LOW | Known issue |

## Open Questions

- Should there be a dashboard indicator showing whether a DV was extracted via Gemini or regex (extraction source tracking)?
- Should `GEMINI_IDENTIFICACAO_ENABLED` be exposed in the admin/frontend for operators to toggle without code deploy?

## User Satisfaction

- **Score:** 8
- **Min:** 7
- **Max:** 9
- **Std:** 0.7
