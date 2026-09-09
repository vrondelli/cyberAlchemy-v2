---
tags: [models, refactor, ccb]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T10:20:15-03:00
expires: 2026-05-16
conversation_id: 8f26a18e-8c64-4131-bb4d-0f18ba3f8b36
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 4
importance_rationale: "Executed registry table and column renames, mechanical refactoring."
---
# Registry Table and Column Renames Execution Started
**Date:** 2026-03-17 10:20 (UTC-3)
**Tags:** #models #refactor #ccb

## Summary
This session focused on executing the implementation plan to rename the registry tables (`Bancarizador`, `TipoProduto`, `TipoInstrumento`) and their associated columns to improve data consistency. The plan was fully approved by the user, specifically confirming that the Django model names would remain unchanged while updating the underlying `db_table` definitions to `cadastro_emissor`, `cadastro_tipo_produto`, and `cadastro_tipo_instrumento` respectively. We successfully initiated the code modifications in the core models and began updating the related use cases before the session was closed. Significant work remains to propagate these changes across the upload pipeline, frontend components, and tests.

### Renaming Cadastro Models and Related Columns
- **Problem/Goal:** The registry models used inconsistent naming schemas and did not match the newly established complementary table columns. They needed to be refactored to use the `cadastro_*` prefix in the database, while standardizing columns like `bancarizador` to `emissor` and `id_instrumento` to `tipo_instrumento`.
- **Decision:** It was decided to rename the database tables via `db_table` but keep the Django model class names (`Bancarizador`, `TipoProduto`, `TipoInstrumento`) intact to reduce the refactoring footprint. The legacy `bancarizador` CharField on `AquisicaoManual` and `ContratoCCB` was removed in favor of using the newly standardized `cnpj_emissor` references. The unused `get_bancarizador_suggestions` function was also slated for removal.
- **Changes:** Updated `models.py` with the new table names, dropped legacy fields, and renamed FK relationships (`ProdutoKitConfig.bancarizador` to `emissor`). Updated `manage_bancarizador.py` and `manage_tipo_instrumento.py` with the new column identifiers.

Key outputs:
- `implementation_plan.md` — Detailed step-by-step plan for executing the rename safely.
- `models.py` — Core schema changes established.

## Key Decisions
- **Table Rename Strategy:** Keep existing Django model classes (`Bancarizador`, `TipoProduto`, `TipoInstrumento`) but update `db_table` strings to `cadastro_emissor`, `cadastro_tipo_produto`, and `cadastro_tipo_instrumento`.
- **Field Cleanup:** Completely remove the legacy `bancarizador` text field from `AquisicaoManual` and `ContratoCCB` since it is redundant with `cnpj_emissor`.
- **API and Naming Consolidation:** Rename `ProdutoKitConfig.bancarizador` FK to `emissor` and update API endpoints to use `/emissores/` instead of `/bancarizadores/`.

## Files Changed
### Code
| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Applied `db_table` renames and column refactors (`cnpj_emissor`, `nome_emissor`, `tipo_instrumento`, `emissor`). |
| `domains/aquisicao/use_cases/manage_bancarizador.py` | `modified` | Updated registry queries to target new `cnpj_emissor` and `nome_emissor` fields, and updated `ProdutoKitConfig` FK reference. |
| `domains/aquisicao/use_cases/manage_tipo_instrumento.py` | `modified` | Updated relationship checks from `id_instrumento` to `tipo_instrumento`. |

## Gaps & Backlog
| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Finish updating `approve_remessa.py`, `generate_checklist.py`, and `process_bulk_import.py` | session | ⚠️ HIGH | Pending |
| Propagate column renames to upload pipeline (`upload_rules.py`, `validate_complementary_columns.py`, Celery tasks) | session | ⚠️ HIGH | Pending |
| Refactor `views.py` and `urls.py` to use `/emissores/` endpoints and new field inputs | session | MEDIUM | Pending |
| Update React frontend (`Cadastros.jsx`, `Contratos.jsx`) to consume new field names and endpoints | session | MEDIUM | Pending |
| Generate Django migration script and update test suite | session | ⚠️ HIGH | Pending |

## Connections
| Document | Type | Description |
|----------|------|-------------|
| [[vault/conversations/2026-03-17-0130-complementary-table-detailed-implementation-plan.md]] | `derives-from` | Execution of the follow-up work stemming from the extra columns architecture definitions. |
