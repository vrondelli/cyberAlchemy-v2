---
tags: [ccb, pipeline]
node_type: audit
is_session: true
layer: domain
nature: reference
status: active
created: 2026-03-23
timestamp: 2026-03-23T22:13:26-03:00
expires: 2026-05-22
conversation_id: 58ae55c9-2ae4-4f06-a68c-65f0bdf3a5a7
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-23

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/ccb-flow-refactor.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Auditou e corrigiu o plano de refatoração da God Function `_process_folder` (v0.6→v0.7), eliminando um bug de double-save no orquestrador Part C e elevando a robustez da decomposição em step functions."
---

# CCB Refactor Plan Audit (v0.6 → v0.7)

**Date:** 2026-03-23 22:13 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

Sessão focada em auditar o plano `ccb-flow-refactor.md` — cross-referenciando cada claim do spec contra o código real em `process_bulk_import.py` (L489–L1105). Verificou contagens de saves, imports inline, variáveis mortas, LOC, e return types. Identificou um bug no design do orquestrador Part C (double-save), uma sobrecarga de responsabilidade no `_step_extract_fields`, e campos faltantes nos context objects. Corrigiu todos os problemas e aplicou melhorias de robustez ao plano.

### Audit do Part C — Orquestrador per-DV
- **Problema:** `_step_persist_dv` dentro do loop de steps + chamado novamente no bloco `if ctx.terminal` criava risco de double-save.
- **Decisão:** Separar persist do loop — roda sempre 1× após o loop, garantindo exatamente 1 save por DV.
- **Mudança:** Refatorado o padrão do orquestrador em ambos `_process_dv` e `_process_folder_post_loop`.

### Decomposição do `_step_extract_fields`
- **Problema:** Step único cobria Gemini + regex + universal + CCB cascade — responsabilidade excessiva.
- **Decisão:** Dividir em `_step_try_gemini`, `_step_extract_fields`, e `_step_check_ocr_quality` (QG1 como step próprio).
- **Mudança:** Tabela de steps atualizada, testes adicionados para os novos steps.

### `FolderProcessingContext` incompleto
- **Problema:** Faltavam `folder_docs` e `result_dirty` — o kit evaluation não teria dados e o result não teria save consolidado.
- **Decisão:** Adicionar ambos campos; `folder_docs` populado em memória pelo orquestrador (sem query extra).
- **Mudança:** Dataclass e orquestrador `_process_folder` atualizados.

### B2 caller example incompleto
- **Problema:** Mostrava apenas o caminho template-matched, omitindo o unmatched (que também tem Gemini duplicado).
- **Mudança:** Adicionado exemplo do caminho unmatched com validação inline de campos críticos.

Key outputs:
- `ccb-flow-refactor.md` v0.7.0 — spec corrigido e melhorado

## Key Decisions

- **Persist fora do loop:** `_step_persist_dv` sempre roda após o loop, nunca dentro dele — elimina edge case de double-save.
- **Gemini como step separado:** `_step_try_gemini` separado de `_step_extract_fields` para responsabilidade única.
- **QG1 como step próprio:** `_step_check_ocr_quality` extraído do bloco inline para ser testável independentemente.
- **Pipeline steps como constantes:** `_DV_PIPELINE_STEPS` e `_POST_LOOP_STEPS` expostos como constantes de módulo para facilitar testes.
- **`folder_docs` from memory:** Kit evaluation usa dados dos `dv_contexts` em memória em vez de query ao DB.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/ccb-flow-refactor.md` | `modified` | v0.6→v0.7: fix double-save, split steps, add context fields, enrich B2 examples, add dependency column, +8 testes |

## Satisfaction

| Metric | Value |
|--------|-------|
| Score | 8 |
| Min | 7 |
| Max | 9 |
| Std | 0.5 |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [ccb-flow-refactor.md](../../../specs/002-ccb-validation-workflow/ccb-flow-refactor.md) | `validates` | Auditou claims do spec contra o código real e corrigiu inconsistências |
| [business-rules.md](../../../specs/002-ccb-validation-workflow/business-rules.md) | `contextualizes` | Pipeline diagram referenciado durante a auditoria |
