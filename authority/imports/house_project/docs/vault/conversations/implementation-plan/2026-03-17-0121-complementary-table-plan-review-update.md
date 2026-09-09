---
tags: [spec, models]
layer: domain
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T01:21:21-03:00
expires: 2026-05-16
conversation_id: 061a1df7-06dc-4cf9-8a7e-a8f5e768ec6c
node_type: implementation-plan
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 5
importance_rationale: "Updated complementary table plan after review, refining column registration approach."
---

# Complementary Table Plan Review & Update

**Date:** 2026-03-17 01:12 (UTC-3)  
**Tags:** #spec #models

## Summary

Reviewed `implementation-plan-complementary-table-registration.md` against the codebase, verifying all 10 issues. Found the review mostly accurate but with errors in impact descriptions and 5 missed gaps. User then provided 7 corrections: `numero_titulo` stays on `AquisicaoManual`, `ProdutoKitConfig` is empty (low risk), `valor_nominal_atual` maps to existing `valor_nominal_original`, `tipo_produto` stays as name but becomes FK to `TipoProduto`. Both the spec and implementation plan review were updated accordingly.

## Key Decisions

- `numero_titulo` will NOT be moved to Secondary Table — stays on `AquisicaoManual`, `AquisicaoManualStaging`, and `ContratoCCB`
- `ProdutoKitConfig` is currently empty, so `bancarizador`/`cnpj_bancarizador` → `cnpj_emissor` replacement is low risk
- `valor_nominal_atual` (CSV) = `valor_nominal_original` (model) — no new column needed
- `tipo_produto` stays as field name, becomes FK to `TipoProduto`; CSV column `id_produto` maps to it
- `AquisicaoManualStaging` must always mirror `AquisicaoManual` (pre-existing `cnpj_bancarizador` gap identified)
- `approve_remessa.py` field-by-field copy must be updated for any new columns

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/complementary-table/implementation-plan-complementary-table-registration.md]] | `updates` | Rewrote with user corrections: resolved 5 issues, reorganized into Resolved vs Action Items |
| [[003-remessa-upload-with-events/complementary-table/spec-complementary-table-registration.md]] | `updates` | Removed numero_titulo "moves to Secondary Table", clarified tipo_produto and valor_nominal_atual |
