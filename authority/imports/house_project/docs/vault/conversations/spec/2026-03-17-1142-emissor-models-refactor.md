---
tags: [models, refactor, testing, ccb]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T11:42:03-03:00
expires: 2026-05-16
conversation_id: 8f26a18e-8c64-4131-bb4d-0f18ba3f8b36
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 5
importance_rationale: "Refactored emissor models aligning with registry architecture, cross-model impact."
---
# Emissor Models Refactoring & Registry Alignment
**Date:** 2026-03-17 11:42 (UTC-3)
**Tags:** #models #refactor #testing #ccb

## Summary
This session involved a massive, codebase-wide refactoring to properly align registry models and terminologies with the business vocabulary. The focal point was renaming the `Bancarizador` model to `CadastroEmissor` and updating all references across models, views, the CSV upload pipeline, and tests to use `emissor` and `cnpj_emissor`. This also included renaming `TipoProduto` and `TipoInstrumento` to `CadastroTipoProduto` and `CadastroTipoInstrumento` respectively.

We faced and successfully debugged complex, cascading test failures (involving over 1,116 tests). The errors spanned across `KeyError`s from overzealous find-and-replaces, hidden ORM optimizations like `select_related('bancarizador')`, and broken Celery builder logic that still expected the legacy `bancarizador` and `id_instrumento` fields. The session concluded with a fully green test suite and a generated data migration.

### Registry Model and Field Renaming
- **Problem/Goal:** The old `Bancarizador`, `TipoProduto`, and `TipoInstrumento` names didn't match the new business vocabulary which standardizes on "Emissor".
- **Decision:** Rename the tables to `cadastro_emissor`, `cadastro_tipo_produto`, and `cadastro_tipo_instrumento`. Strip legacy fields (`bancarizador`) from `AquisicaoManual`, `AquisicaoManualStaging`, and `ContratoCCB` and migrate `cnpj_bancarizador` to `cnpj_emissor`. 
- **Changes:** Executed a massive find-and-replace, updated `upload_rules.py` pipeline behaviors to funnel data correctly, stripped the legacy `get_bancarizador_suggestions()` helper since its dependencies were removed, and authored the Django data migration logic.

### Test Suite Repair
- **Problem/Goal:** The cascading changes broke ~25 major test files due to mismatched keys, incorrect ORM relations, and outdated setup fixtures.
- **Decision:** Methodically traverse the failed test suites (`test_approve_remessa.py`, `test_bulk_import.py`, `test_upload_tasks.py`, etc.) and adjust `cnpj_bancarizador`, `nome_emissor` overreaches, and hidden `.select_related()` dependencies.
- **Changes:** Updated 1,100+ automated test assertions. All unit and E2E tests for the acquisition domains now pass cleanly against the new `cnpj_emissor` and `tipo_instrumento` formats.

Key outputs:
- `walkthrough.md` — Detailed breakdown of changes and pipeline consequences.

## Key Decisions
- **`ContratoCCB` and `AquisicaoManual` Schema:** Removed the legacy `bancarizador` CharField entirely, shifting full reliance onto the `cnpj_emissor` identity for API serialization and mapping logic.
- **`get_bancarizador_suggestions` Removal:** Ripped out obsolete suggestion logic since native FKs and pipeline parsing now natively check `CadastroEmissor`.

## Files Changed

### Code
| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/repositories/models.py` | `modified` | Renamed models to `CadastroEmissor`, `CadastroTipoProduto`, `CadastroTipoInstrumento`. Removed legacy `bancarizador`. |
| `domains/aquisicao/domain/upload_rules.py` | `modified` | Adjusted column map dependencies for `tipo_instrumento` and `cnpj_emissor`. |
| `domains/aquisicao/tasks/celery_tasks.py` | `modified` | Fixed `_build_aquisicao_staging_installment` kwargs mapping logic. |
| `domains/aquisicao/use_cases/manage_emissor.py` | `modified` | Migrated logic and variable terms over from legacy `manage_bancarizador.py`. |
| `domains/aquisicao/interfaces/views.py` | `modified` | Updated APIs (e.g., `ContratoCCBListView`, `ProdutoKitConfigViewSet`) to serialize and query `emissor` fields. |
| `domains/aquisicao/tests/test_approve_remessa.py` | `modified` | Fixed test fixture assertions referencing old PKs or incorrect `cnpj` values. |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Removed legacy test helpers, updated responses and ORM `select_related` testing to enforce `emissor`. |

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `walkthrough.md` | `created` | Artifact capturing final state and verification results of the Emissor migration. |

## Connections
| Document | Type | Description |
|----------|------|-------------|
| [[2026-03-17-1020-registry-renames.md]] | `updates` | Continuation and completion of registry renames |
| [[2026-03-17-0933-registry-fixes-cadastros-refactor.md]] | `updates` | Parity updates on Cadastros forms and model validation |
