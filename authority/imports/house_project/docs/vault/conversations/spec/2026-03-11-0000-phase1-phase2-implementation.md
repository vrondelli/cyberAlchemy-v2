---
tags: [ccb, models, spec]
layer: domain
nature: reference
status: active
created: 2026-03-11
timestamp: 2026-03-11T00:00:00-03:00
expires: 2026-05-10
conversation_id: c500dd23-e7d1-4b57-9452-21ae77f3d6ba
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-11
expected_importance: 6
importance_rationale: "Implemented phases 1-2 of the CCB refactor, structural changes to models and migrations."
---

# Phase 1 & Phase 2 Implementation — CCB Document Workflow

**Date:** 2026-03-11  
**Tags:** #ccb #models #spec

## Summary

Implemented all Phase 1 model changes (new registry models `Bancarizador` and `TipoProduto`, FK upgrade on `ProdutoKitConfig`, rename `s3_path → gcs_path` on `DocumentVersion`, new `BulkImportBatch`, `CCBExtractionResult`, `DocumentTypeConfig` models) and Phase 2 use cases and API (CRUD for `Bancarizador`/`TipoProduto`, updated `assign_kit_to_produto`/`get_active_kits_for_produto` signatures to use FK IDs, 10 API endpoints). Migrations `aquisicao.0014` and `infrastructure_database.0034` were generated and applied. Fixed all broken tests (admin.py `s3_path` reference, 12 occurrences in `test_document_models.py`, 6 `TestProdutoKitConfig` tests using raw string FKs). Final test run: **872 passed, 0 failed**.

## Key Decisions

- `ProdutoKitConfig.tipo_produto` and `bancarizador` are now ForeignKeys to the `TipoProduto` and `Bancarizador` registry models — not raw strings. Raw strings (`tipo_produto`, `bancarizador` columns) still exist on `AquisicaoManual` and `ContratoCCB` (CSV-sourced data) and are resolved to registry entries at checklist-generation time (Phase 3).
- `assign_kit_to_produto(tipo_produto_id: int, bancarizador_id: int, ...)` — signature changed from strings to FK integer IDs.
- `get_active_kits_for_produto(tipo_produto_id: int, bancarizador_id: int)` — same signature change.
- Registry delete is guarded: raises `ValueError` if any `ProdutoKitConfig` row references the entity.
- `/kit-configs/` response now returns `tipo_produto_id`, `tipo_produto_nome`, `bancarizador_id`, `bancarizador_nome` instead of plain strings.
- Migration `0034` for `infrastructure_database` had a stale `RenameIndex` (already applied in `0033`) that was removed before applying.
- `DocumentVersion.s3_path` renamed to `gcs_path` everywhere including admin.py and all test files.
- 3 new bulk-upload lifecycle event types added: `DOCUMENT_BULK_UPLOAD_INITIATED`, `DOCUMENT_BULK_UPLOAD_STAGED`, `DOCUMENT_BULK_SCAN_STARTED`.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/ccb-phase2-implementation.md]] | `updates` | Updated v1.2: FK signatures, new endpoints, new response shapes |
| [[aquisicao/repositories/models.py]] | `updates` | 7 new/modified models |
| [[aquisicao/use_cases/manage_kit_type.py]] | `updates` | FK IDs in assign/get_active signatures |
|[[aquisicao/use_cases/manage_bancarizador.py]]| `implements` |New CRUD use case file|
|[[aquisicao/use_cases/manage_tipo_produto.py]]| `implements` |New CRUD use case file|
| [[aquisicao/interfaces/views.py]] | `updates` | 4 new registry views, updated KitConfig response shape |
| [[aquisicao/interfaces/urls.py]] | `updates` | 4 new registry URL patterns |
| [[aquisicao/tests/test_kit_management.py]] | `updates` | All FK fixture/call-site updates |
|[[aquisicao/tests/test_registry_management.py]]| `implements` |38 new registry tests|
| [[aquisicao/tests/test_document_models.py]] | `updates` | gcs_path rename + ProdutoKitConfig FK fixtures |
|[[aquisicao/0014_phase1_new_models_fk_gcs.py]]| `implements` |Phase 1 migration|
|[[infrastructure_database/0034_bulk_upload_event_types.py]]| `implements` |New event type choices|
| [[messaging/event_catalog.py]] | `updates` | 3 new bulk-upload catalog entries |
