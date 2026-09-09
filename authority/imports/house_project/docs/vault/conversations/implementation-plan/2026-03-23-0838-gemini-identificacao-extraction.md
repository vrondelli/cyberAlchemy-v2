---
tags: [pipeline, ccb, acquisition]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T08:38:00-03:00
expires: 2026-05-22
conversation_id: b2465266-9400-40f9-89d5-962c04f755c1
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md
expected_importance: 7
importance_rationale: "Introduced Gemini 2.5 Flash as the primary Identificacao extraction method, proving 5/6 success on documents that regex+Tesseract could not handle, and produced a full integration spec for the bulk import pipeline."
---

# Gemini Identificacao Extraction — PoC & Pipeline Integration Spec

**Date:** 2026-03-23 08:38 (UTC-3)
**Tags:** #pipeline #ccb #acquisition

## Summary

This session had two phases: first, a quick-wins analysis of `structured_report.md`, and second — the main focus — building and testing a Gemini 2.5 Flash integration for extracting structured data from Identificacao (CNH/RG) documents. The session culminated in a working management command and a full implementation spec for integrating Gemini into the bulk import pipeline.

The Identificacao documents in the system were all stuck at `low_quality_image` status because the regex-based extraction (Tesseract OCR → regex patterns) couldn't handle noisy scanned documents. Gemini 2.5 Flash, using vision capabilities to read document images directly, succeeded on 5 out of 6 of these documents — a dramatic improvement over the 0/6 success rate of the existing pipeline.

### Quick Wins Analysis
- **Problem/Goal:** Identify the easiest items to implement from `structured_report.md`
- **Decision:** Ranked 4 quick wins by effort: F-001 uppercase enforcement (~15 min), FS-004 timezone fix (~30 min), B-001 case-insensitive filters (~45 min), F-008 audit log UI (~2-3 hrs)
- **Changes:** Wrote an implementation plan artifact (not committed to specs — superseded by the Gemini work)

### Gemini Extraction — Management Command (PoC)
- **Problem/Goal:** Use the `GEMINI_API_KEY` to extract structured data from Identificacao documents
- **Decision:** Use `gemini-2.5-flash` model with raw `requests` (no SDK), store results in `extracted_data` JSONField
- **Changes:**
  - Created `extract_id_gemini.py` management command
  - Added `GEMINI_API_KEY` to `docker-compose.dev.yml`
  - Tested on 6 real documents: 5/6 succeeded, 1 truncated JSON response
  - Fixed image size issue (41MB PNG → ~500KB JPEG via 150dpi + quality 85)
  - Added retry logic with exponential backoff for 5xx errors

### Gemini Pipeline Integration Spec
- **Problem/Goal:** Promote the PoC into the main extraction pipeline for Identificacao documents
- **Decision:** Gemini as primary extractor, regex as fallback; field mapping layer normalizes Gemini schema to match existing field names; quality gates unchanged
- **Changes:** Wrote full spec at `specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md` with 10 tests (6 unit + 4 integration)

Key outputs:
- `extract_id_gemini.py` — Working management command for batch Gemini extraction
- `gemini-identificacao-extraction-implementation.md` — Full implementation spec for pipeline integration

## Key Decisions

- **Model selection:** `gemini-2.5-flash` over Pro — sufficient accuracy for standardized ID layouts, 8x cheaper, faster
- **No SDK dependency:** Raw `requests` calls to Gemini REST API — zero new pip dependencies
- **Image compression:** PDF → JPEG at 150dpi, quality 85 — keeps images under 1MB while preserving readability
- **Fallback architecture:** Gemini primary, regex fallback — if `GEMINI_API_KEY` missing or API fails, existing behavior is preserved
- **Field mapping normalization:** Gemini's schema (`full_name`, `birth_date`) mapped to existing regex schema (`nome`, `data_nascimento`) so downstream code (quality gates, cross-check) works unchanged

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/management/commands/extract_id_gemini.py` | `created` | Management command for batch Gemini extraction of Identificacao docs |
| `docker-compose.dev.yml` | `modified` | Added `GEMINI_API_KEY` env var to API container |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/gemini-identificacao-extraction-implementation.md` | `created` | Full implementation spec for Gemini pipeline integration with test plan |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implement Gemini pipeline integration per spec | This session | ⚠️ HIGH | Spec written, awaiting implementation |
| Quick wins (F-001, FS-004, B-001, F-008) | structured_report.md | MEDIUM | Plan written, not started |
| Retry truncated JSON responses from Gemini (pk=7341) | PoC testing | LOW | Can retry with `--reprocess` flag |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `spec-pipeline-identificacao-extracao.md` | `extends` | The Gemini spec adds a new extraction tier to the pipeline described there |
| `rg-document-extraction-implementation.md` | `supersedes` | Gemini replaces regex as primary extraction for Identificacao |
| `cloud-vision-migration-implementation.md` | `contextualizes` | Both address OCR limitations; Gemini may reduce need for Cloud Vision for IDs |

## Open Questions

- Should Gemini extraction be async (Celery task) or synchronous within `_process_folder()`? Current spec proposes synchronous with timeout.
- Should the field mapping layer be configurable (JSON config) or hardcoded? Current spec proposes hardcoded constants.

## User Satisfaction

| Metric | Value |
|--------|-------|
| Score | 9 |
| Min | 7 |
| Max | 10 |
| Std | 0.8 |
