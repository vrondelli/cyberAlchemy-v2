---
tags: [acquisition, frontend, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T15:53:00-03:00
expires: 2026-05-20
conversation_id: 1a64e664-830c-476f-a2bc-1241ce173435
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Added `empresa_geradora` chip-selector (optional) to RegisterTemplateForm in Contratos.jsx and removed duplicate `sape` entry, aligning the frontend with the already-ready backend field — localized UI change with no architectural impact."
version: 0.1.0
last_updated: 2026-03-21
---

# Add `empresa_geradora` to Template Registration Form

**Date:** 2026-03-21 15:28 (UTC-3)
**Tags:** #acquisition #frontend #pipeline

## Summary

This session added the `empresa_geradora` field to the document template registration form in the frontend. The backend (`DocumentTemplateListCreateView` and `register_template` use case) already handled the field — it read `empresa_geradora` from the POST body and persisted it on the `DocumentTemplate` row. The gap was purely in the UI: the form had no way for the operator to select an empresa when uploading a reference template.

The change introduces a chip-selector styled identically to the existing `doc_type` selector — pill-shaped buttons with teal highlight on selection. The selector is optional (no empresa means the template is generic) and supports toggle behavior (clicking a selected chip deselects it). A new `Empresa` column was also added to the "Templates registrados" table, showing an indigo badge for empresa-specific templates and a `—` for generic ones.

A follow-up removal was also done: `sape` was removed from the empresa options because it is a duplicate of `siapenet`, leaving 4 clean options: `capital_consig`, `dataprev`, `siapenet`, `unico`.

### Adding `empresa_geradora` chip-selector to `RegisterTemplateForm`
- **Problem/Goal:** Operators registering templates had no way to associate them with a specific empresa, forcing all templates to be generic. The `empresa_geradora` column on `document_template` was present but unreachable from the UI.
- **Decision:** Add an optional chip-selector between `doc_type` and name/description, identical in visual design to the `doc_type` pill buttons.
- **Changes:** Added `SUPPORTED_EMPRESAS` constant, `empresaGeradora` state, chip-selector JSX block, `formData.append("empresa_geradora", ...)`, and reset-on-success logic.

### Adding `Empresa` column to `TemplatesTable`
- **Problem/Goal:** After registration, there was no way to see which templates were empresa-specific vs. generic.
- **Decision:** Add a new column between Tipo and Nome/arquivo.
- **Changes:** Added `"Empresa"` to the header array and a new `<td>` rendering an indigo badge or `—`.

### Removing `sape` from options
- **Problem/Goal:** `sape` is a duplicate/alias of `siapenet` — having both creates data inconsistency (two different string values for the same company).
- **Decision:** Remove `sape`, keeping only `siapenet`.
- **Changes:** One-line edit to `SUPPORTED_EMPRESAS`.

Key outputs:
- `frontend/src/pages/Contratos.jsx` — updated with empresa_geradora form field and table column

## Tests Added/Modified

None. All backend tests for `empresa_geradora` were already in `test_document_template.py` (`TestRegisterTemplateEmpresa`, `TestDocumentTemplateAPI`) and continued to pass without changes.

## Key Decisions

- **Optional field:** `empresa_geradora` is not required. An operator may register a generic template without selecting an empresa.
- **Toggle behavior:** Clicking an already-selected empresa chip clears the selection, so operators can easily deselect.
- **Remove `sape`:** Eliminated the `sape` string option because it duplicates `siapenet`; keeping both would fragment stored values for the same company.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/Contratos.jsx` | `modified` | Added `SUPPORTED_EMPRESAS` constant, `empresaGeradora` state + chip-selector UI, FormData integration, reset-on-success, `Empresa` column in table, and removed `sape` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `brain/1a64e664-.../implementation_plan.md` | `created` | Artifact plan for the session |
| `brain/1a64e664-.../walkthrough.md` | `created` | Proof-of-work walkthrough |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Validate `empresa_geradora` on the backend against the `SUPPORTED_EMPRESAS` tuple (currently accepts any string) | Session observation | LOW | Open |
