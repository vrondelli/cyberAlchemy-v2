---
tags: [ccb, pipeline, frontend]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T17:40:00-03:00
expires: 2026-05-20
conversation_id: 68588fae-d702-45a7-aa90-6088657a8628
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed Template 11 extraction_config in DB (13→41 matching fields) by replacing section-numbered regexes with label-only patterns matching the actual OCR text layout, deleted unused ccb_consig.json, and added % suffix display for percentage fields in the frontend extracted data panel."
version: 0.1.0
last_updated: 2026-03-21
---

# CCB Extraction Config Map & Percentage Display

**Date:** 2026-03-21 17:40 (UTC-3)
**Tags:** #ccb #pipeline #frontend

## Summary

This session analyzed and fixed the extraction configurations for CCB (Cédula de Crédito Bancário) templates. The user wanted to understand which extraction configs exist, where they're used, and the differences between them. Analysis revealed that `ccb_consig.json` was a dead/legacy file not referenced by any code path, while `ccb_cap.json` is the active config for universal extraction. The user deleted `ccb_consig.json`.

The main technical work was diagnosing and fixing Template 11's extraction_config in the database. Testing against real OCR text showed only 13 of 56 fields were matching — the root cause was that regexes used section-number anchors (`1.2 CPF:`, `2.1 Banco:`, `3.8 Taxa de Juros:`) but the actual document layout uses simple labels without section numbers (`CPF:`, `Banco:`, `Taxa de Juros mensal:`). All regexes were rewritten and applied directly to the database via psql, achieving 41/41 field match rate.

Additionally, the frontend extracted data panel in `Contratos.jsx` was updated to display a `%` suffix for percentage fields (taxa_juros_mensal, taxa_juros_anual, cet_mensal, cet_anual, multa_moratoria, juros_moratorios, juros_atraso_mensal).

### CCB Config Landscape Analysis
- **Problem/Goal:** User wanted to understand what ccb_consig.json and ccb_cap.json are used for.
- **Decision:** `ccb_consig.json` is unused legacy (not in `_CONFIG_LOOKUP`); `ccb_cap.json` is the active universal extraction config. The ccb_cap is a superset of ccb_consig (all 39 fields + 14 extras).
- **Changes:** User deleted `ccb_consig.json`. No code changes needed — it was already dead code.

### Template 11 Extraction Config Fix
- **Problem/Goal:** Template 11 (created 2026-03-15, the first CCB template) had regexes anchored to numbered sections (`1.1`, `2.1`, `3.8`, etc.) but the actual OCR text uses simple labels (`Nome:`, `CPF:`, `Banco:`). Only 13 of 56 fields matched.
- **Decision:** Rewrite all regexes to use simple label patterns matching the actual document layout. Remove fields that don't exist in this layout (email, setor, tipo_conta, etc.). Add fields that do exist but were missing (proposta, documento_hash).
- **Changes:** Updated `extraction_config` of Template 11 directly in DB via psql. New config has 41 fields, all matching the real OCR text. Verified on all 16 documents matched to this template.

### Frontend Percentage Display
- **Problem/Goal:** Percentage fields (e.g., taxa_juros_mensal = "7.50") displayed without `%` suffix in the extracted data preview panel.
- **Decision:** Add `%` suffix for known percentage field names in the `renderValue` function.
- **Changes:** Modified `Contratos.jsx` to check field keys against a `PERCENTAGE_FIELDS` set and append `%` to the displayed value.

Key outputs:
- Template 11 extraction_config — 41 fields, all matching real OCR text
- `ccb_consig.json` — deleted (was unused)
- `Contratos.jsx` — percentage fields now show `%` suffix

## Key Decisions

- **ccb_consig.json removal:** Confirmed it was dead code (not in `_CONFIG_LOOKUP`) and user deleted it.
- **Template 11 regex strategy:** Use simple label-only patterns (no section numbers) since this template's documents don't have numbered sections.
- **consignataria regex:** Used `Rubrica de Consignação):` as anchor instead of `Consignatária` due to UTF-8 accent matching issues in regex.
- **Percentage display approach:** Frontend hardcodes known percentage field names rather than fetching `field_types` from backend — simpler and sufficient.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/Contratos.jsx` | `modified` | Added `PERCENTAGE_FIELDS` set and `%` suffix rendering in the extracted data preview panel |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_consig.json` | `deleted` | Removed unused legacy extraction config |

### Database

| Change | Description |
|--------|-------------|
| Template 11 `extraction_config` | Rewrote all regexes from section-numbered to simple-label patterns (13→41 matching fields) |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Template configs only in DB, no disk backup for template-specific configs | Session analysis | LOW | Open |
| `consignataria` regex relies on `Rubrica de Consignação` anchor — may not work for other CCB layouts | Regex debugging | LOW | Open |
