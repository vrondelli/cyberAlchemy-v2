---
tags: [models, spec, frontend, testing]
layer: application
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T09:34:26-03:00
expires: 2026-05-16
conversation_id: 3ee66458-6035-41aa-a85f-94662a3befd9
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 4
importance_rationale: "Fixed extra columns migration and expanded tests, incremental follow-up."
---

# Extra Cols — Migration Fix, Column Registration & Test Expansion

**Date:** 2026-03-17 09:34 (UTC-3)  
**Tags:** #models #spec #frontend #testing

## Summary

Continued from earlier session node `2026-03-17-0904-extra-cols-architecture.md`. Fixed migration conflicts between Docker DB history and on-disk files, consolidated migrations 0029-0032 into a single idempotent 0029, registered 21 extra columns from `tabela_aquisicoes (1).csv` for the aquisicao domain, updated the frontend form to single-line layout with data type descriptions, and validated all 1349 tests pass (26 new user-added tests).

## Key Decisions

- Consolidated migrations 0029-0032 into single 0029 using `SeparateDatabaseAndState` + `RunPython` for idempotent table renames and `RunSQL IF NOT EXISTS` for description fields
- Registered 21 extra columns from the CSV: 5 number (taxa_de_desconto, taxa_de_juros, valor_iof, tac, seguro), 13 string (address/personal data), 2 date (data_nascimento, dat_vencimento_original), 1 boolean (renegociação)
- Frontend form refactored to single horizontal row with data type descriptions in dropdown options

## Connections

| Document | Type | Description |
|----------|------|-------------|
|[[vault/conversations/2026-03-17-0904-extra-cols-architecture.md]]| `refines` |Continuation of same session — migration fix and data seeding|
| [[aquisicao/0029_alter_complementarytablecolumnconfig_unique_together_and_more.py]] | `updates` | Consolidated 4 migrations into 1 idempotent migration |
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `updates` | Updated to reflect domain-based architecture |
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Updated Components 5, 6, 8 for domain-based config |
| [[src/pages/Cadastros.jsx]] | `updates` | Single-line form layout, data type descriptions |
