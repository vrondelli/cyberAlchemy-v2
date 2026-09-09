---
tags: [models, aquisicao, liquidacao]
layer: domain
nature: reference
status: active
created: 2026-03-08
timestamp: 2026-03-08T00:00:00-03:00
expires: 2026-05-07
conversation_id: f766a5f0-7eab-4981-bbbd-fa118ac7ee4a
node_type: spec
is_session: true
version: 0.1.0
last_updated: 2026-03-08
expected_importance: 4
importance_rationale: "Added contrato count feature spanning aquisicao/liquidacao domains, moderate cross-domain impact."
---

# Implementing Contrato Count

**Date:** 2026-03-08  
**Tags:** #models #aquisicao #liquidacao

## Summary

Added `quantidade_contratos` column to `RemessaAquisicaoId` and `RemessaLiquidacaoId`. The field stores the count of distinct `numero_titulo` for each remessa, computed from `clean_df` using Polars during staging.

## Key Decisions

- `quantidade_contratos = models.IntegerField(null=True)` — nullable to support historical rows without values
- Populated in `StageRemessaService.stage()` from `clean_df` using Polars (not SQL)
- Django migrations created for both models

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[development-practices-constitution]] | `derives-from` | Data pipeline changes are deterministic and idempotent |
