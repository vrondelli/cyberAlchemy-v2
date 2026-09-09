---
tags: [ccb, models, testing, event-system]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T20:31:55-03:00
expires: 2026-05-17
conversation_id: 889db00d-be6f-4892-a504-1abbb575cde8
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/documents-table-check.md]
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Implemented documents cross-check feature from spec to code."
---

# Implementing Documents ↔ AquisicaoManual Cross-Check

**Date:** 2026-03-18 20:31 (UTC-3)
**Tags:** #ccb #models #testing #event-system

## Summary

This session implemented the full Documents ↔ AquisicaoManual cross-check feature as designed in `documents-table-check.md`. The implementation spans model, domain logic, CRUD use case, API layer, pipeline integration, event system, and comprehensive tests (33 tests, 917 full suite — zero regressions).

The session began by reviewing the spec and verifying all codebase prerequisites. `id_titulo` was confirmed to be the same as `numero_titulo` (the extracted contract identifier mapped to `ContratoCCB.numero_titulo`). Implementation proceeded layer-by-layer from bottom up: model → events → admin → domain logic → use case → views → URLs → pipeline → tests.

### Model & Event System
- **Problem/Goal:** Need a persistent mapping between template fields and AquisicaoManual columns, with audit trail.
- **Decision:** `TemplateFieldColumnMapping` model with `(template, field_name)` unique constraint. Two new EventTypes: `TEMPLATE_FIELD_MAPPING_SET` and `TEMPLATE_FIELD_MAPPING_DELETED`.
- **Changes:** Added model to `models.py`, events to `EventLog.EventType`, catalog entries to `event_catalog.py`, admin inline on `DocumentTemplateAdmin`.

### Domain Logic — Cross-Check
- **Problem/Goal:** Pure function to compare extracted OCR values against DB installment data.
- **Decision:** Type-aware comparison: numeric ±0.01, case-insensitive strings, exact dates. OR semantics across installments. Empty/None values skipped.
- **Changes:** Created `cross_check_extracted_fields.py` with `cross_check_fields()`, `CrossCheckResult`, and `FieldCheckDetail` dataclasses.

### CRUD Use Case
- **Problem/Goal:** Manage field-to-column mappings with validation.
- **Decision:** Bulk-replace semantics via `set_field_mappings()`. Validates field_name against template's critical + non_critical fields, and target_column against model columns + ComplementaryTableColumnConfig.
- **Changes:** Created `manage_field_column_mapping.py` with 5 functions.

### API & Pipeline Integration
- **Problem/Goal:** Expose mapping management endpoints and integrate cross-check into the bulk import pipeline.
- **Decision:** Two views (`TemplateAvailableColumnsView`, `TemplateFieldMappingsView`) with GET/PUT. Pipeline Step 5 runs cross-check after contrato match for all DVs with matched templates.
- **Changes:** Added views + URL patterns. Added Step 5 in `_process_folder`.

### Migration Fixes
- **Problem/Goal:** Auto-generated migrations contained stale operations referencing removed fields/constraints.
- **Decision:** Manually removed `AlterUniqueTogether` (referencing deleted `contrato` field) and `RemoveConstraint` (referencing already-dropped constraint) from the generated migrations.
- **Changes:** Fixed `0034_template_field_column_mapping.py` and `0043_template_field_mapping_event_types.py`.

Key outputs:
- `domains/aquisicao/domain/cross_check_extracted_fields.py` — pure domain logic
- `domains/aquisicao/use_cases/manage_field_column_mapping.py` — CRUD use case
- `domains/aquisicao/tests/test_field_column_mapping.py` — 33 test cases

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_field_column_mapping.py` | 33 new tests | Cross-check verifies that OCR-extracted document values match the financial data in `aquisicao_manual`, preventing incorrect documents from being approved silently |

**Why these tests matter:** Without the cross-check, a document could pass OCR extraction with values that don't match the actual financial records — e.g., an extracted `valor` of R$1,000 when the contract says R$10,000. These tests validate the full chain from configuration through comparison to pipeline behavior.

## Key Decisions

- **`id_titulo` = `numero_titulo`:** Confirmed that the pipeline variable `id_titulo` refers to the extracted `numero_titulo`, which matches against `ContratoCCB.numero_titulo` and `AquisicaoManual.numero_titulo`.
- **Step 5 placement:** Cross-check runs only after contrato matching succeeds (Step 4). Documents in failed folders are not cross-checked.
- **Installment query outside DV loop:** Query `AquisicaoManual.objects.filter(numero_titulo=id_titulo)` once per folder, not once per DV.
- **Migration stale operation removal:** Django's `makemigrations` auto-included operations for model state drift unrelated to this feature. These were manually removed.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Added `TemplateFieldColumnMapping` model |
| `domains/aquisicao/repositories/admin.py` | `modified` | Added `TemplateFieldColumnMappingInline` on `DocumentTemplateAdmin` |
| `infrastructure/database/models.py` | `modified` | Added 2 EventType entries |
| `infrastructure/messaging/event_catalog.py` | `modified` | Added 2 catalog entries |
| `domains/aquisicao/domain/cross_check_extracted_fields.py` | `created` | Pure domain cross-check logic |
| `domains/aquisicao/use_cases/manage_field_column_mapping.py` | `created` | CRUD use case with validation |
| `domains/aquisicao/interfaces/views.py` | `modified` | Added 2 views |
| `domains/aquisicao/interfaces/urls.py` | `modified` | Added 2 URL patterns |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Added Step 5 cross-check in `_process_folder` |
| `domains/aquisicao/tests/test_field_column_mapping.py` | `created` | 33 test cases |
| `migrations/aquisicao/0034_template_field_column_mapping.py` | `created` | CreateModel for `TemplateFieldColumnMapping` |
| `migrations/infrastructure_database/0043_template_field_mapping_event_types.py` | `created` | AlterField for EventType choices |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `modified` | Status changed from 🟡 PLANNED to ✅ DONE |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/documents-table-check.md` | `implements` | This session implemented the full feature designed in that spec |
| `specs/002-ccb-validation-workflow/backlog-ccb.md` | `derives-from` | The cross-check capability was referenced in the backlog as a planned feature |
