---
tags: [spec, models, event-system]
layer: architecture
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:54:24-03:00
expires: 2026-05-16
conversation_id: ee8d7f5b-7177-4931-a868-f9dcc3eb3842
node_type: implementation-plan
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 4
importance_rationale: "Final review pass on complementary table plan, minor adjustments."
---

# Complementary Table Implementation Plan Review

**Date:** 2026-03-17 01:54 (UTC-3)  
**Tags:** #spec #models #event-system

## Summary

Cross-referenced the complementary table implementation plan against the entire codebase and resolved multiple issues. Traced the full upload pipeline (`ProcessUploadService` → `StageRemessaService` → builder functions in `celery_tasks.py`) to identify exact integration points. Simplified `TipoInstrumento` model to match `TipoProduto` pattern (no `description` field), added upload-time registry validation for `cnpj_emissor`/`tipo_produto`/`id_instrumento`, clarified that `numero_ipoc` is mandatory from day 1, and confirmed no columns are deleted from `AquisicaoManual`. The user expanded the verification plan from summary tables to 71 individually specified tests across 8 test files.

## Key Decisions

- **No columns are deleted from `AquisicaoManual`** — `bancarizador`, `cnpj_bancarizador`, `numero_titulo`, `campo_chave` all stay. New columns are purely additive.
- **`TipoInstrumento` model simplified** — `nome`, `created_at`, `created_by` only (matches `TipoProduto` pattern exactly, no `description` field).
- **Registry validation added to upload pipeline** — `cnpj_emissor` validated against `Bancarizador.cnpj` (with CNPJ format normalization), `id_instrumento` against `TipoInstrumento.nome`, `tipo_produto` against `TipoProduto.nome`. Validation runs between `process_file()` and `StageRemessaService.stage()`.
- **`numero_ipoc` is mandatory from day 1** — added to `REQUIRED_COLS`, not `OPTIONAL_COLS`.
- **`cnpj_fundo` suggestions API added** — `GET /api/aquisicao/cnpj-fundo/suggestions/` returns distinct values for the ComplementaryTableTab company dropdown.
- **Builder functions in `celery_tasks.py` identified as key modification targets** — `_build_aquisicao_staging_installment` (line 31) and `_build_aquisicao_contracts` (line 59) must include all new fields.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Rewrote context section, added codebase reference, fixed 7 issues, consolidated user clarifications, expanded verification plan to 71 tests |
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `contradicts` | 5 spec inaccuracies identified: numero_titulo placement, valor_nominal_atual marked [NEW], campo_chave "not in CSV", bancarizador/cnpj_bancarizador "removed", Main Table omits numero_titulo |
