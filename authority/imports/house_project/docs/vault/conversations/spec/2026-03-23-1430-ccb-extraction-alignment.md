---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-23
timestamp: 2026-03-23T14:30:00-03:00
expires: 2026-05-22
conversation_id: 694530a5-5a43-4926-9c95-33f6a51234e4
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Unified CCB critical_fields and field coverage across template and universal extraction paths, eliminating config drift that could cause inconsistent validation."
user_satisfaction: 8
user_satisfaction_min: 6
user_satisfaction_max: 9
user_satisfaction_std: 1.0
version: 0.1.0
last_updated: 2026-03-23
---

# CCB Extraction Config Alignment

**Date:** 2026-03-23 14:30 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

This session investigated how recent CCB documents were actually extracted by the pipeline, revealing a discrepancy between the template-based and universal extraction configs. The investigation confirmed that all 20 most recent CCBs matched the `ccb-consig-template` and were extracted via the template path with `extraction_confidence=ALTA`. The session then compared both extraction configs side by side, discovering that they had divergent `critical_fields` (6 vs 1) and that the template DB config was missing 12 fields present in `ccb_cap.json`. Both issues were resolved by aligning the configs.

Additionally, the user made live changes to `template_matching_config.py` during the session: adding Holerite-related keywords (`CONTRACHEQUE`, `Comprovante de Pagamento`), adding `gov_rj` and `pref_rj` to `EMPRESA_KEYWORDS`, and updating `SUPPORTED_EMPRESAS`. The user also updated `gemini_config.py` to split the Holerite prompt into SIAPE-specific and RJ-specific variants with a shared schema.

### CCB Extraction Path Investigation
- **Problem/Goal:** Determine which extraction path (template vs universal) the latest CCBs used, and what `extraction_confidence` they received.
- **Decision:** Queried the database directly — all 20 latest CCBs matched the `ccb-consig-template` (template path, `ALTA` confidence). None fell through to universal extraction.
- **Changes:** No code changes — this was an investigative query.

### Critical Fields Misalignment
- **Problem/Goal:** `ccb_cap.json` had `critical_fields: ["numero_ccb"]` while the DB template had 6 critical fields (`cpf`, `nome`, `numero_ccb`, `valor_liberado`, `valor_parcela`, `quantidade_parcelas`). This meant universal extraction would accept a CCB with only `numero_ccb` present, while template extraction required all 6.
- **Decision:** Standardize on the 6-field list from the DB template as the canonical critical fields for all CCB extraction paths.
- **Changes:** Updated `ccb_cap.json` critical_fields to the 6-field list; removed promoted fields from `non_critical_fields`.

### Missing Fields in Template Config
- **Problem/Goal:** The DB template `ccb-consig-template` had 41 field regexes, while `ccb_cap.json` had 53. Twelve fields were missing from the template: `email`, `setor`, `originador`, `tipo_conta`, `estado_civil`, `envelope_hash`, `multa_moratoria`, `numero_endereco`, `juros_moratorios`, `entidade_conveniada`, `juros_atraso_mensal`, `valor_total_financiado`.
- **Decision:** Add all 12 missing fields to the DB template to ensure both paths extract the same data.
- **Changes:** Updated the DB template `extraction_config` via Django shell: added 12 field regexes, 4 `field_types` entries, and updated `non_critical_fields`. Verified both configs now have 53 identical fields, identical critical_fields, and identical field_types.

### Holerite RJ Support (User Changes)
- **Problem/Goal:** Add support for Rio de Janeiro payslip classification and extraction.
- **Decision:** Add `CONTRACHEQUE` and `Comprovante de Pagamento` to `DOC_TYPE_KEYWORDS["Holerite"]`; add `gov_rj` and `pref_rj` to `EMPRESA_KEYWORDS` and `SUPPORTED_EMPRESAS`; split Gemini prompt into SIAPE and RJ variants.
- **Changes:** User edited `template_matching_config.py` and `gemini_config.py` directly.

Key outputs:
- `ccb_cap.json` — aligned critical_fields and non_critical_fields
- DB template `ccb-consig-template` — added 12 missing field regexes

## Key Decisions

- **CCB Critical Fields Standard:** All CCB extraction paths (template and universal) must use the same 6 critical fields: `cpf`, `nome`, `numero_ccb`, `valor_liberado`, `valor_parcela`, `quantidade_parcelas`.
- **Field Parity:** Both configs must extract the same 53 fields, even though they use different regex styles (template uses simpler `"Label:value"` patterns; universal uses more robust patterns tolerant of section numbers and layout variation).

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `modified` | Updated critical_fields from 1 to 6; removed promoted fields from non_critical_fields |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | (User) Added Holerite keywords, gov_rj/pref_rj empresa patterns, updated SUPPORTED_EMPRESAS |
| `domains/aquisicao/services/gemini_config.py` | `modified` | (User) Split Holerite prompt into SIAPE and RJ variants with shared schema |
| DB: `DocumentTemplate` (ccb-consig-template) | `modified` | Added 12 field regexes, 4 field_types, updated non_critical_fields via Django shell |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/business-rules.md` | `implements` | CCB extraction field coverage now matches validation requirements |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Universal extraction for CCBs still assigns `MEDIA` confidence even when all 6 critical fields are present — consider promoting to `ALTA` | This session | MEDIUM | Open |
| `ccb_cap.json` regexes and template DB regexes use different styles — consider generating one from the other to prevent future drift | This session | LOW | Open |
