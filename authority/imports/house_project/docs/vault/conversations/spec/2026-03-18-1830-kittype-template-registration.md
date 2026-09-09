---
tags: [ccb, models, frontend, testing, spec]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T18:30:36-03:00
expires: 2026-05-17
conversation_id: 91318fdf-1431-4aee-add4-0f2196fb0912
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/kittype-with-template-implementation.md]
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Implemented KitType document type and template registration, extending the configuration system."
---

# KitType Doc Type + Template Registration

**Date:** 2026-03-18 18:22 (UTC-3)
**Tags:** #ccb #models #frontend #testing #spec

## Summary

This session implemented the full KitType template registration feature, allowing operators to associate specific `DocumentTemplate` instances with each `doc_type` requirement in a KitType. The original spec proposed a `ManyToManyField` approach (`required_templates`), but this was abandoned in favor of evolving the existing `KitType.required_docs` JSONField from `list[str]` to `list[dict]`, where each dict contains `{"doc_type": "CCB", "template_id": 5}` (or `null` for "any template"). This simpler approach keeps all kit requirements consolidated in one field, avoids M2M complexity, and maintains full backwards compatibility with legacy `list[str]` data.

The session also included a review of which specs from `002-ccb-validation-workflow` were not yet implemented, producing an implementation status report. The user then requested the template registration feature with specific requirements: linking KitTypes to `tipo_produto + cnpj_emissor`, displaying emissor name (not CNPJ) in the UI, and enabling template preview buttons.

### Schema Evolution

- **Problem/Goal:** `KitType.required_docs` stored only doc_type strings, with no way to specify which exact template layout was required.
- **Decision:** Evolve the JSONField from `list[str]` to `list[dict]` rather than adding a separate M2M field. A `normalize_required_docs()` helper function handles both formats transparently.
- **Changes:** Updated model docstring, added `normalize_required_docs()` and `_validate_required_docs()` in `manage_kit_type.py`. Validation ensures doc_type ∈ `SUPPORTED_DOC_TYPES`, template_id references a valid `DocumentTemplate`, and the template's doc_type matches the declared doc_type (cross-validation).

### API Layer

- **Problem/Goal:** Frontend needed template data grouped by doc_type for dropdown population, and kit config list needed to include `required_docs`.
- **Decision:** Add a new `DocumentTemplatesByDocTypeView` endpoint and include `required_docs` in `ProdutoKitConfigListView` response.
- **Changes:** New `GET /api/aquisicao/document-templates/by-doc-type/` endpoint. `ProdutoKitConfigListView` now includes `required_docs` from the related `KitType`.

### Frontend (Cadastros.jsx)

- **Problem/Goal:** Users needed to select templates per doc_type when creating kits, preview template files, and see registered templates in the kit config table.
- **Decision:** Extend the existing `KitTypeTab` component with template dropdowns, an Eye icon preview button, and a "Documentos" column in the config table.
- **Changes:** Template dropdown appears for each selected doc_type (populated via API). All available templates show clickable preview buttons below the dropdown (always visible, no selection required). Preview opens in an in-page modal with an iframe (not a new tab). Config table displays docs with template names (e.g., "CCB (Layout A), RG (Qualquer)"). Table column and form label renamed from "Bancarizador" to "Emissor".

### Checklist Generation Fix

- **Problem/Goal:** `generate_checklist.py` iterated `kit.required_docs` expecting strings, which would break with the new `list[dict]` format.
- **Decision:** Update the iteration to handle both formats.
- **Changes:** `generate_checklist_for_contrato()` now extracts `doc_type` from both string items and dict items.

### Test Updates

- **Problem/Goal:** All test fixtures used the old `list[str]` format, and some used incorrect doc_type casing (`'AVERBAÇÃO'` vs `'Averbação'`).
- **Decision:** Update all fixtures and add comprehensive new test classes.
- **Changes:** Rewrote `test_kit_management.py` (84 tests), fixed casing in `test_checklist.py`. Added `TestNormalizeRequiredDocs`, `TestTemplatesByDocTypeAPI`, and template validation tests.

Key outputs:
- `manage_kit_type.py` — normalize + validate helpers for `required_docs`
- `views.py` — new templates-by-doc-type endpoint
- `Cadastros.jsx` — template dropdowns, in-page modal preview, Emissor label, always-visible template preview buttons
- `kittype-with-template-implementation.md` — spec rewritten to reflect implementation

### Post-Session Bugfixes

- **Token key:** `localStorage.getItem("authToken")` → `"token"` (matching all other pages and `Login.jsx`)
- **SUPPORTED_DOC_TYPES casing:** Frontend had `"AVERBAÇÃO"` but DB templates use `"Averbação"` — template lookup returned nothing. Fixed to match backend `template_matching_config.py`.
- **Preview as modal:** Changed from `window.open()` (new tab) to an in-page modal with iframe, dark backdrop, and close button.
- **Always-visible preview buttons:** Template preview buttons now appear below each doc_type dropdown regardless of selection, so users can browse templates before choosing.
- **Emissor label:** Renamed form label and table column from "Bancarizador" to "Emissor".
- **Multiple active kits per pair:** Removed the uniqueness guard from `create_kit_full`. One `tipo_produto + emissor` can now have multiple active KitTypes (OR logic — folder satisfies at least one).

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_kit_management.py` | `TestNormalizeRequiredDocs` (8), `TestValidateRequiredDocs` (7), `TestCreateKitType` (4 template tests), `TestUpdateKitType` (1), `TestTemplatesByDocTypeAPI` (6), `TestKitConfigRequiredDocsContent` (2), all fixtures updated | Kit creation must validate doc_type against supported types, cross-validate template doc_type match, and verify API response content |
| `domains/aquisicao/tests/test_checklist.py` | Fixed 3 assertions with corrected doc_type casing | Checklist generation uses canonical doc_type casing from SUPPORTED_DOC_TYPES |

**Why these tests matter:** Without template validation, operators could assign a CCB template to an RG requirement, leading to incorrect document matching. The normalization tests ensure legacy `list[str]` data continues working after the schema evolution.

## Key Decisions

- **JSONField over M2M:** Kept `required_docs` as a single JSONField evolving from `list[str]` to `list[dict]`, avoiding M2M table overhead and keeping all requirements consolidated.
- **Backwards compatibility via normalization:** `normalize_required_docs()` converts legacy strings to dicts automatically, so no data migration is needed.
- **Cross-validation:** A CCB template cannot be assigned to an RG doc_type requirement — the system validates the match.
- **Modal preview over new tab:** Template previews use an in-page modal instead of `window.open()` for better UX.
- **Multiple active kits per pair (OR logic):** Removed the guard that blocked adding a second kit to the same tipo_produto + emissor combination. Tests updated to verify the new behavior.
- **OR logic implemented:** The OR logic (evaluate each kit individually, pick closest to complete) was implemented in a follow-up session — see `2026-03-18-1950-kittype-or-logic-and-ui-marker.md`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Updated `KitType.required_docs` docstring for new `list[dict]` format |
| `domains/aquisicao/use_cases/manage_kit_type.py` | `modified` | Added `normalize_required_docs()`, `_validate_required_docs()`. Updated `create_kit_type`, `update_kit_type` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Updated `create_kit_full` — removed active config uniqueness guard (multiple kits per pair allowed) |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Updated 2 tests: "raises if active" → "allows multiple active kits per pair" |
| `domains/aquisicao/use_cases/generate_checklist.py` | `modified` | Handles both `list[str]` and `list[dict]` when iterating `kit.required_docs` |
| `domains/aquisicao/interfaces/views.py` | `modified` | Added `DocumentTemplatesByDocTypeView`, included `required_docs` in config list, updated docstring |
| `domains/aquisicao/interfaces/urls.py` | `modified` | Added URL pattern for `document-templates/by-doc-type/` |
| `frontend/src/pages/Cadastros.jsx` | `modified` | KitTypeTab: template dropdowns, in-page modal preview, Emissor label, always-visible preview buttons, fixed token key and doc_type casing |
| `domains/aquisicao/tests/test_kit_management.py` | `modified` | Rewrote to `list[dict]` format, added new test classes (normalize, validate, API, content assertions) |
| `domains/aquisicao/tests/test_checklist.py` | `modified` | Fixed `'AVERBAÇÃO'` → `'Averbação'` casing in 3 places |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kittype-with-template-implementation.md` | `modified` | Rewritten to reflect implemented JSONField approach (M2M abandoned), marked as IMPLEMENTED |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| OR logic for multi-kit evaluation | Original spec Phase 3-4 | MEDIUM | ✅ Done — see [[2026-03-18-1950-kittype-or-logic-and-ui-marker]] |
| Data migration for existing `list[str]` data | Schema evolution | LOW | Not needed (normalize handles it at runtime) |
| "Templates Registrados" panel in Kit Type tab | User request | LOW | Not started |

## Open Questions

- Should the OR logic (evaluate each kit individually, pick closest to complete) be implemented as a separate spec/PR?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/kittype-with-template-implementation.md]] | `updates` | Rewrote spec to reflect implemented JSONField approach |
