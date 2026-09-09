---
tags: [frontend, contratos, cadastros, field-mapping, ui]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T21:09:24-03:00
expires: 2026-05-17
conversation_id: 889db00d-be6f-4892-a504-1abbb575cde8
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Built frontend field mapping UI and cadastros edit/delete, multi-component feature delivery."
---

# Frontend: Field Mapping UI + Cadastros Edit/Delete

**Date:** 2026-03-18 21:09 (UTC-3)
**Tags:** #frontend #contratos #cadastros #field-mapping #ui

## Summary

This session added frontend UI for the field-to-column mapping feature and improved the Cadastros page. All changes are exclusively in `Contratos.jsx` and `Cadastros.jsx` — no backend changes needed.

### Mapeamento de Campos Tab (Contratos)
- **Added 4th tab** "Mapeamento de Campos" on `/contratos` with Settings gear icon
- **Template selector** dropdown listing all registered templates
- **Mapping table** — one row per extracted field, each with a column dropdown
- **Template document preview** — right-side panel showing the actual template file (PDF/image iframe) alongside the mapping table, with a field-name overlay at the bottom (teal = mapped, translucent = unmapped)
- **Save button** with dirty-state tracking, calls `PUT /api/aquisicao/document-templates/<pk>/field-mappings/`

### Cadastros — Edit & Delete for Complementary Columns
- **Edit button** (pencil icon) on each row in Tabela Complementar — opens a modal to modify csv_column_name, display_name, data_type, description via `PATCH`
- **Delete button** (trash icon) on each row — calls `DELETE` endpoint
- **Scroll position preserved** — `loadConfigs` now accepts a `silent` parameter; toggle/edit/delete handlers pass `silent=true` to skip the loading spinner, preventing DOM remount and scroll reset

## Key Decisions

- **Side-by-side layout for mapping tab:** Chose a flex layout with mapping table taking `flex-1` and document preview at `w-[45%]` with `sticky` positioning so it stays visible while scrolling through mappings.
- **Silent refresh pattern:** Instead of saving/restoring `scrollY` (brittle), skipped `setLoading(true)` for inline updates so the table DOM never unmounts — scroll naturally stays in place.
- **No backend changes:** All endpoints (`available-columns`, `field-mappings`, template `file`, complementary-columns PATCH/DELETE) already existed and were tested.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/Contratos.jsx` | `modified` | Added `FieldMappingsTab` component (~200 lines), 4th tab entry, `Settings` icon import |
| `frontend/src/pages/Cadastros.jsx` | `modified` | Added edit modal + delete button to `TabelaComplementarTab`, `Pencil` icon import, silent `loadConfigs` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
|`specs/002-ccb-validation-workflow/documents-table-check.md`| `refines` |This session added the frontend UI layer for the field-mapping backend built in the cross-check implementation|
|`docs/vault/conversations/2026-03-18-2031-cross-check-implementation.md`| `updates` |Backend for field mappings was built in that session; this session adds the frontend|
