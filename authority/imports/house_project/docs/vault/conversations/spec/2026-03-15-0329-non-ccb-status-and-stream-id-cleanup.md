---
tags: [ccb, models, refactor]
layer: architecture
nature: reference
status: active
created: 2026-03-15
timestamp: 2026-03-15T03:29:06-03:00
expires: 2026-05-14
conversation_id: 812a833a-8754-4c27-83d5-e0f54bba5a85
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-15
expected_importance: 4
importance_rationale: "Cleaned up non-CCB status handling and stream IDs, localized refactoring."
---

# Non-CCB Extraction Status Fix & stream_id Removal

**Date:** 2026-03-15 03:06 (UTC-3)  
**Tags:** #ccb #models #refactor

## Summary

Changed non-CCB document extraction status from `completado` to `pendente` in `_process_folder`, since `completado` should only be assigned after a cross-check validation (not yet implemented). Removed the `stream_id` column from `DocumentVersion` — it was only used in `run_ocr.py` to pass a UUID to event logging, which now generates a fresh `uuid.uuid4()` per invocation. Updated the original migration `0013` to prevent the column from being recreated on fresh DB setups.

## Key Decisions

- Non-CCB documents (Antifraude, Averbação, etc.) stay `pendente` with reason `ocr_match` after successful extraction — `completado` is reserved for post-cross-check
- `stream_id` on `DocumentVersion` was unnecessary; events only need a unique stream_id per invocation, not a persisted one on the model
- OCR test event queries changed from `stream_id`-based to `entity_id`-based lookups (using `contract_hash`)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `updates` | Non-CCB status changed from completado to pendente |
| `domains/aquisicao/repositories/models.py` | `updates` | Removed stream_id field and save() override |
| `domains/aquisicao/use_cases/run_ocr.py` | `updates` | stream_id now generated fresh per call |
| `domains/aquisicao/repositories/admin.py` | `updates` | Removed stream_id from readonly_fields |
| `migrations/aquisicao/0013_kittype_aquisicaomanual_bancarizador_and_more.py` | `updates` | Removed stream_id from CreateModel |
