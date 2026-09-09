---
tags: [spec, models, event-system]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T09:39:22-03:00
expires: 2026-05-16
conversation_id: 311e2667-dc43-4a12-a42b-22c38c885cae
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 7
importance_rationale: "Pivoted extra columns architecture after discovering design flaws, major course correction."
---

# Extra Cols Architecture Pivot & Test Implementation

**Date:** 2026-03-17 09:39 (UTC-3)  
**Tags:** #spec #models #event-system

## Summary

Major architectural pivot in the complementary table feature: replaced `cnpj_fundo`-scoped config with `domain`-scoped config (`aquisicao`/`liquidacao`), replaced `complementary_data` JSONField on `AquisicaoManual` with separate data tables (`AquisicaoExtraCols`, `LiquidacaoExtraCols`), and added EventLog tracking for all config CRUD operations. Most components marked as implemented with passing tests.

## Key Decisions

- **Domain-based scoping** — `ComplementaryTableColumnConfig` uses `domain` field (`aquisicao`/`liquidacao`) instead of `cnpj_fundo`. `CnpjFundoSuggestionsView` removed entirely.
- **Separate data tables** — Extra column values stored in `aquisicao_extra_cols` and `liquidacao_extra_cols` (with `registered_data` and `unregistered_data` JSON fields), not on `AquisicaoManual` directly. Avoids ALTER TABLE on production tables.
- **Event logging** — Config CRUD emits `EXTRA_COL_CONFIG_CREATED`, `EXTRA_COL_CONFIG_UPDATED`, `EXTRA_COL_CONFIG_DELETED` events with `origin=HUMAN`.
- **Test status** — 59+ tests implemented and passing across 8 test files. 13 tests remaining (base class OPTIONAL_COLS, registry validation integration, Celery complementary field handling).

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Architecture pivot: domain scoping, separate data tables, event logging, components marked implemented, test status section added |
