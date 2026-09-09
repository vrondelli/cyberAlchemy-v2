---
tags: [spec, models]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:22:28-03:00
expires: 2026-05-16
conversation_id: 3793eb80-20f7-4e5c-84b5-e011a603cfce
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 6
importance_rationale: "Defined main table structure for complementary columns, schema-level architectural decision."
---

# Complementary Table — Main Table Definition & Spec Reorganization

**Date:** 2026-03-17 01:22 (UTC-3)  
**Tags:** #spec #models

## Summary

Refined the complementary table spec (`spec-complementary-table-registration.md`) to clearly define the **Main Table** as all 17 CSV columns up to Q plus all existing `AquisicaoManual` system columns (hashes, FKs, filter tracking). Clarified that `numero_titulo` moves to the Secondary Table, `cnpj_emissor` replaces both `bancarizador` and `cnpj_bancarizador`, and `id_produto` replaces `tipo_produto`. Updated the verification plan to use mechanism-based tests for dynamic secondary table configurations. Reorganized all 13 files in `specs/003-remessa-upload-with-events/` into 5 feature folders: `pipeline/`, `filter-system/`, `events/`, `user-management/`, `complementary-table/`.

## Key Decisions

- Main Table = all CSV columns A-Q (17 columns) + existing `AquisicaoManual` columns that stay (system/tracking columns like `installment_hash`, `remessa_hash`, `status`, filter fields, etc.)
- `numero_titulo` is the only existing column that moves to the Secondary Table
- `cnpj_emissor` replaces both `bancarizador` and `cnpj_bancarizador`
- `company_id` was removed from `ComplementaryTableColumnConfig` — replaced with `cnpj_fundo` (CharField) pending a future Company model
- Secondary Table mandatory enforcement is tested via mechanism tests (programmatic config creation → CSV upload → verify enforcement), not hardcoded column tests
- Spec directory reorganized into feature-based subfolders: `pipeline/`, `filter-system/`, `events/`, `user-management/`, `complementary-table/`

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `updates` | Rewrote Main Table definition, added system columns, fixed `cnpj_fundo` reference, updated verification plan |
|[[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]]| `contextualizes` |Review doc that flags critical issues with the spec|
