---
tags: [spec, models, ccb]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:30:55-03:00
expires: 2026-05-16
conversation_id: 28bbd933-ab43-40bc-a58f-564ab5a36372
node_type: implementation-plan
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 6
importance_rationale: "Produced detailed implementation plan for complementary table feature, comprehensive spec."
---

# Complementary Table — Detailed Implementation Plan

**Date:** 2026-03-17 01:23 (UTC-3)  
**Tags:** #spec #models #ccb

## Summary

Reviewed the complementary table review document (`implementation-plan-complementary-table-registration.md`) and the original spec, then performed a full codebase analysis to produce a detailed, file-level implementation plan. The plan covers 4 phases (model changes, backend APIs, frontend tabs, deferred mandatory_condition engine) across 15 files. Three key design decisions were made: JSONField for secondary table storage, deferred `tipo_produto` FK conversion, and deferred `mandatory_condition` grammar.

## Key Decisions

- **Secondary table storage:** `JSONField` (`complementary_data`) on `AquisicaoManual`/`AquisicaoManualStaging` — simple, avoids new tables, secondary data doesn't need SQL-level column queries.
- **`tipo_produto` FK conversion deferred:** Stays as CharField in this phase; FK migration requires a separate data migration (Phase 1b).
- **`mandatory_condition` engine deferred:** Field stored as JSON but not evaluated; requires its own spec for grammar definition and evaluation engine.
- **`ContratoCCB.tipo_produto` stays CharField:** Resolved at runtime, same pattern as `bancarizador`.
- **Pre-existing bug identified:** `approve_remessa.py` field-by-field copy skips `tipo_produto`, `bancarizador`, `cnpj_bancarizador` — must be fixed alongside new columns.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Added full detailed implementation plan (phases, files, functions, verification) |
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `implements` | This plan implements the complementary table spec |
|[[aquisicao/repositories/models.py]]| `refines` |New models (TipoInstrumento, ComplementaryTableColumnConfig) + column additions to AquisicaoManual, Staging, ContratoCCB|
|[[aquisicao/use_cases/approve_remessa.py]]| `refines` |Fix pre-existing field copy bug + add new column copies|
