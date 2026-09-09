---
tags: [document-processing, template-matching, ocr, ccb]
layer: domain
nature: reference
status: active
created: 2026-03-16
timestamp: 2026-03-16T00:00:00-03:00
expires: 2026-05-15
conversation_id: 147deb6c-cde3-4b40-8bc7-fcc8b9587cd0
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-16
expected_importance: 5
importance_rationale: "Refined template matching algorithm, improving document classification accuracy."
---

# Refining Template Matching Logic and Extraction Configs

**Date:** 2026-03-16
**Tags:** #document-processing #template-matching #ocr #ccb

## Summary

This session focused on refining the document identification pipeline to be more robust. We removed the auto-match "shortcut" for single-template document types, requiring all text-based documents to pass a Jaccard similarity threshold, which was successfully raised to `0.85` based on empirical analysis. We also extended the OCR extraction system to support table parsing, created JSON-based extraction configurations for all templates, and optimized processing speed by deferring expensive perceptual hash computations when Jaccard matches.

Key outputs:
- `domains/aquisicao/use_cases/process_bulk_import.py` — deferred fingerprinting, bulk-updated `contrato_extracted_id`, saved `ocr_text`
- `domains/aquisicao/services/ocr_service.py` — added `table` field type to `extract_fields`
- `domains/aquisicao/domain/extraction_configs/*.json` — extracted template configs into version-controlled JSON
- `domains/aquisicao/repositories/management/commands/load_extraction_configs.py` — new manage.py command
- `specs/002-ccb-validation-workflow/business-rules.md` — updated flowchart and docs

## Conversation Arc

**Started:** The user asked to remove the "auto-match" shortcut from template matching, raise the Jaccard similarity threshold to 0.85, and ensure all CCBs had their distance calculated against the template.

**Ended:** The session concluded with refining the OCR extraction logic to support table fields for a new Averbação document, migrating extraction configs to JSON files, fixing a bottleneck by deferring `dHash` computation on Jaccard matches, and running `close-session`.

## Key Decisions

- **Jaccard Threshold:** Raised from `0.15` to `0.85` because empirical data showed true matches score ~`0.89` while false matches score ~`0.03`.
- **Auto-match Removal:** The system previously skipped similarity checks if only one template existed for a `doc_type`. This was removed to enforce validation on every document.
- **Table Extraction:** Rather than complicated single-regex acrobatics for tables, we added a `table` field type to `extraction_config` that parses blocks of text into row dicts based on `table_columns`.
- **JSON Configs:** Instead of relying purely on database state (lost on resets) or messy data migrations, extraction configs were moved to static `.json` files loaded via a new management command.
- **Deferred Fingerprinting:** `_compute_fingerprint` (PDF rendering + dHash) is skipped during folder processing if Jaccard similarity already found a template, cutting processing time per file significantly.
- **Folder-level Contrato ID:** Extracted `id_titulo` is bulk-updated to all DVs in a folder, so related documents (like Antifraude) carry the same ID as the CCB.

## Code Changes Made

| File | Change |
|------|--------|
| `template_matching_config.py` | Raised `TEXT_SIMILARITY_THRESHOLD` to 0.85 |
| `manage_document_template.py` | Removed auto-match shortcut; re-extracts text on PDF updates |
| `process_bulk_import.py` | Defer fingerprinting; bulk-update `contrato_extracted_id`; save raw `ocr_text` |
| `run_ocr.py` | Persist raw `ocr_text` during async OCR |
| `models.py` | Added `ocr_text` to `DocumentVersion`; added `REASON_PENDING_OCR` |
| `test_document_template.py` | Replaced auto-match tests with Jaccard-specific threshold tests |
| `test_parallel_bulk_import.py` | Updated assertions for `PENDING_OCR`; added Jaccard hit/miss fingerprint tests |
| `test_ocr.py` | Added test for `ocr_text` persistence |
| `ocr_service.py` | Added `table` parsing logic to `extract_fields` |
| `extraction_configs/*.json` | Created 4 JSON payload files for templates |
| `load_extraction_configs.py` | Command to load JSON configs to DB |

## Code Gaps / Tasks Identified

| Gap / Task | Rule or Source | Status |
|---|---|---|
| Configure CI/CD to run `load_extraction_configs` | Operational gap after adding JSON configs | Pending |
| Implement periodic Celery task to backfill perceptual hashes | Noted as follow-up to deferred fingerprinting | Pending |
| Create frontend UI for extraction config management | Feature request mentioned by user | Pending |

## Backlog Items Added

- `MEDIUM` Configure deployment pipeline to run `python manage.py load_extraction_configs`
- `LOW` Create periodic task to calculate missing `perceptual_hash` for documents that matched via Jaccard

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/business-rules.md]] | `updates` | Removed auto-match flowchart, documented `0.85` threshold, added JSON Extraction Configs spec |
