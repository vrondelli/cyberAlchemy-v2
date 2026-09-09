---
tags: [acquisition, pipeline, ccb]
node_type: implementation-plan
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T12:17:00-03:00
expires: 2026-05-20
conversation_id: d6ca5278-7d8f-4159-b198-f52cfa64ff61
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md
promoted_candidates: []
expected_importance: 5
importance_rationale: "Refinamento da spec `kit-matching-empresa-fallback-implementation.md` que desbloqueia implementação do fallback por empresa no kit matching, corrigindo 3 lacunas que causariam bugs silenciosos na contagem de kit e persistência de empresa_geradora."
version: 0.1.0
last_updated: 2026-03-21
---

# Kit Matching Empresa Fallback — Revisão e Correção da Spec

**Date:** 2026-03-21 12:17 (UTC-3)
**Tags:** #acquisition #pipeline #ccb

## Summary

Esta sessão consistiu em uma revisão de prontidão da spec `kit-matching-empresa-fallback-implementation.md` antes de sua implementação. O usuário pediu uma avaliação crítica do documento para identificar problemas ou ambiguidades que bloqueariam a implementação. Três lacunas foram identificadas e, após confirmação do usuário sobre a regra de negócio (empresa_geradora em todos os docs exceto Identificacao), a spec foi corrigida e promovida de `draft` para `ready`.

A spec aborda três problemas encadeados no pipeline de processamento de aquisição: (1) um guard `all_templates_exist` que aborta o pipeline prematuramente; (2) `empresa_geradora` sendo inferida apenas no caminho universal, não no caminho com template; (3) o kit matching exigindo `template_id` exato e bloqueando docs extraídos universalmente da mesma empresa.

### Revisão de Prontidão da Spec

- **Problem/Goal:** Verificar se a spec estava completa e sem ambiguidades antes da implementação
- **Decision:** Três lacunas identificadas, todas corrigidas após confirmação de regra de negócio
- **Changes:** Nenhuma — fase de análise apenas

### Lacuna 1 — Parte 1 ambígua sobre persistência no caminho com template

- **Problem/Goal:** A spec dizia para mover `infer_empresa` antes do `if matched is None`, mas não especificava quais `update_fields` nos ~5 `dv.save()` do caminho com template precisavam receber `'empresa_geradora'`
- **Decision:** `empresa_geradora` deve ser inferida e persistida em todos os docs exceto `Identificacao`, tanto no caminho universal quanto no caminho com template. A exceção de `Identificacao` foi confirmada pelo usuário.
- **Changes:** Parte 1 da spec reescrita com pseudocódigo explícito mostrando `if doc_type != "Identificacao"`, e anotação listando as linhas (~654, ~678, ~683, ~687, ~699) que precisam de `'empresa_geradora'` no `update_fields`

### Lacuna 2 — Segundo `folder_docs.append` do CCB não coberto

- **Problem/Goal:** A spec cobria o enriquecimento de `folder_docs` no Step 2c (non-CCB), mas havia um segundo ponto na linha ~863 onde o CCB é appendado na re-avaliação pós-contrato, também sem `empresa_geradora`
- **Decision:** Ambos os locais devem receber `'empresa_geradora'`
- **Changes:** Parte 2 da spec atualizada com seção explícita documentando os dois locais de append, incluindo diff antes/depois para o append do CCB

### Lacuna 3 — Retrocompatibilidade da assinatura não documentada

- **Problem/Goal:** A spec propunha adicionar `template_empresas` como parâmetro opcional a `evaluate_kit_completion`, mas não confirmava explicitamente que a chamada existente na linha ~730 não precisava mudar
- **Decision:** O parâmetro `None` por default garante compatibilidade retroativa; a chamada existente é preservada
- **Changes:** Parte 3 da spec atualizada com nota explícita de retrocompatibilidade

Key outputs:
- `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` — spec corrigida, status promovido de `draft` para `ready`

## Key Decisions

- **empresa_geradora para todos exceto Identificacao:** A inferência de `empresa_geradora` deve ocorrer para todos os tipos de documento classificados, com exceção explícita de `Identificacao`. Isso se aplica tanto ao caminho com template quanto ao caminho de extração universal.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `modified` | Corrigidas 3 lacunas de implementação; status promovido de `draft` para `ready` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [`kit-matching-empresa-fallback-implementation.md`](../../../specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md) | `refines` | Sessão que revisou e corrigiu este plano de implementação |
| [`empresa-geradora-implementation-plan.md`](../../../specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md) | `derives-from` | Plano original do qual esta spec deriva |
