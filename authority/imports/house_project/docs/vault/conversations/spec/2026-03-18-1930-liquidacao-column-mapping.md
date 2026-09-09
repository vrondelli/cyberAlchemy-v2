---
tags: [liquidation, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-18
timestamp: 2026-03-18T19:30:20-03:00
expires: 2026-05-17
conversation_id: bde3d3e9-b038-479c-9c62-9605cc8dbdc2
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 5
importance_rationale: "Mapped liquidação CSV columns and investigated has_ocr_flow, domain data mapping decisions."
---

# Liquidação CSV Column Mapping & has_ocr_flow Investigation

**Date:** 2026-03-18 19:30 (UTC-3)
**Tags:** #liquidation #pipeline

## Summary

This session addressed a gap between the `template-liquidacoes.csv` template and the `LiquidacaoManual` model. The CSV template used user-facing column names (`id_titulo`, `id_parcela`, `tipo_liquidação`, `sacado_cnpj_cpf`, `data_baixa`) that had no mapping in `LiquidacaoUploadRules.FORMATTING_MAP`, meaning uploads using the template would fail with missing-column errors. Five new mappings were added along with a `_derive_columns` fallback, following the same pattern already established in `AquisicaoUploadRules`. The session also included a Q&A investigation into the `has_ocr_flow` flag on `DocumentTemplate`, confirming it is currently a metadata-only flag with no gating logic in the extraction pipeline.

### Liquidação Column Mapping Gap

- **Problem/Goal:** The `template-liquidacoes.csv` header contained columns (`id_titulo`, `id_parcela`, `tipo_liquidação`, `sacado_cnpj_cpf`, `tipo_baixa`, `data_baixa`) that did not have entries in `LiquidacaoUploadRules.FORMATTING_MAP`, so CSVs using the template would fail validation.
- **Decision:** Add all missing mappings to `FORMATTING_MAP` and implement a `_derive_columns` override (mirroring `AquisicaoUploadRules`) to handle `id_parcela`→`campo_chave` and `id_titulo`→`numero_titulo` when the canonical columns are absent.
- **Changes:** Updated `LiquidacaoUploadRules` in `domains/liquidacao/domain/upload_rules.py` with 5 new `FORMATTING_MAP` entries and a new `_derive_columns` classmethod.

### has_ocr_flow Investigation

- **Problem/Goal:** Understand what `has_ocr_flow` does on `DocumentTemplate` and how it affects text extraction.
- **Decision:** No code changes needed — `has_ocr_flow` is a declarative boolean flag (default `False`) exposed in API responses and Django admin. It does not gate any extraction logic; actual extraction behavior is driven by `extraction_config`.

Key outputs:
- `domains/liquidacao/domain/upload_rules.py` — Added 5 column mappings and `_derive_columns` fallback

## Key Decisions

- **Column mapping strategy:** CSV template columns map through `FORMATTING_MAP` (direct rename) plus `_derive_columns` (fallback synthesis), consistent with the pattern in `AquisicaoUploadRules`.
- **Mapping specifics:** `id_parcela`→`campo_chave`, `id_titulo`→`numero_titulo`, `tipo_liquidação`/`tipo_liquidacao`→`tipo_baixo`, `sacado_cnpj_cpf`→`cpfcnpj_sacado`, `data_baixa`→`data_baixa_custod`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/liquidacao/domain/upload_rules.py` | modified | Added 5 new FORMATTING_MAP entries and `_derive_columns` classmethod for fallback column derivation |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[003-remessa-upload-with-events/pipeline/implementation-plan-sprint-2-tables.md]] | `contextualizes` | Sprint 2 upload pipeline design that defines the remessa/installment model structure |
