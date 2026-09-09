---
tags: [models, event-system, frontend, spec]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T09:04:36-03:00
expires: 2026-05-16
conversation_id: 3ee66458-6035-41aa-a85f-94662a3befd9
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 7
importance_rationale: "Designed extra columns architecture with domain-based config and data tables, high blast radius decision."
---

# Extra Cols Architecture — Domain-Based Config, Data Tables & EventLog

**Date:** 2026-03-17 09:04 (UTC-3)  
**Tags:** #models #event-system #frontend #spec

## Summary

Implemented the extra columns architecture with domain-based scoping (`aquisicao`/`liquidacao`) instead of per-fund (`cnpj_fundo`). Created `ComplementaryTableColumnConfig` (table: `extra_cols_config`) with a `domain` field, plus two data models `AquisicaoExtraCols` and `LiquidacaoExtraCols` with JSON storage (`registered_data`, `unregistered_data`). Integrated 3 new EventLog types for config CRUD operations. Updated frontend to use a domain selector instead of a fund dropdown, and refactored the form to a single-line layout with data type descriptions. Updated both spec documents to reflect the new architecture. All 1323 tests pass.

## Key Decisions

- Config table uses `domain` (aquisicao/liquidacao) instead of `cnpj_fundo` — global config, not per-fund
- Two separate data tables (`aquisicao_extra_cols`, `liquidacao_extra_cols`) with JSON fields for column values
- `CnpjFundoSuggestionsView` removed — replaced by domain selector as first UI interaction
- 3 EventLog types (`EXTRA_COL_CONFIG_CREATED/UPDATED/DELETED`) with `entity_domain=system`, `object_type=config`
- `config` added to ontology vocabulary for `object_type`
- `Bancarizador` model gained a `description` field (user change)

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `updates` | Replaced cnpj_fundo scoping with domain-based architecture, added 3-table design, EventLog events, domain selector UI |
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Updated Components 1, 5, 6, 8 to reflect implemented domain-based config, data tables, EventLog, removed CnpjFundoSuggestionsView |
| [[aquisicao/repositories/models.py]] | `updates` | Added ComplementaryTableColumnConfig (domain field), AquisicaoExtraCols, Bancarizador.description |
| [[liquidacao/repositories/models.py]] | `updates` | Added LiquidacaoExtraCols model |
| [[messaging/event_catalog.py]] | `updates` | Added 3 event catalog entries for extra col config CRUD |
| [[tests/test_event_log_service.py]] | `updates` | Added 'config' to ontology vocabulary |
| [[src/pages/Cadastros.jsx]] | `updates` | Domain selector, single-line form, data type descriptions |
