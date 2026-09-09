---
tags: [acquisition, pipeline, ccb, kit-matching, empresa-geradora]
node_type: implementation-plan
is_session: true
layer: domain
nature: [explanatory, technical]
status: active
created: 2026-03-21
timestamp: 2026-03-21T12:14:00-03:00
expires: 2026-05-20
conversation_id: fb706f75-25a5-4890-bfb0-3eed10c774b3
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates:
  - specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md
expected_importance: 6
importance_rationale: "Sessão identificou três bugs no pipeline de extração (guard prematuro, empresa_geradora não salva em template-match, kit matching ignorando extração universal) e produziu plano de implementação completo com 4 partes para corrigir o contador 1/5 → 2/5 e habilitar extração universal de ComprovanteEmprestimo."
version: 0.1.0
last_updated: 2026-03-21
---

# ComprovanteEmprestimo + Kit Matching Empresa Fallback

**Date:** 2026-03-21 12:14 (UTC-3)
**Tags:** #acquisition #pipeline #ccb #kit-matching #empresa-geradora

## Summary

Esta sessão investigou por que a pasta `700276737-9` não teve os dados do `ComprovanteEmprestimo` extraídos, identificou a causa raiz (ausência de entrada no `_CONFIG_LOOKUP` em `universal_extraction.py`), implementou a correção e, ao analisar o resultado visual em outra pasta (`700268571-2`), descobriu três problemas adicionais no pipeline.

O primeiro problema corrigido: `ComprovanteEmprestimo` não estava mapeado em `_CONFIG_LOOKUP`, então `extract_fields_universal` retornava `(None, False)`, marcando o documento como `no_template/NENHUMA`. A solução foi criar o arquivo `comprovante_emprestimo.json` com regex testados contra o OCR text real e adicionar as entradas no lookup.

O segundo problema identificado (não implementado): o kit mostra 1/5 em vez de 2/5 porque o `evaluate_kit_completion` exige match exato de `template_id`, mas a Averbação extraída universalmente tem `matched_template_id=None`. O usuário esclareceu que o critério correto é a `empresa_geradora`, não o template.

O terceiro problema: `empresa_geradora` só é inferida e salva no caminho de extração universal. Quando um template visual bate, o campo fica `None` — perdendo informação de empresa para o kit matching.

O quarto problema: o guard `all_templates_exist` em `process_bulk_import.py` aborta o pipeline inteiro antes de qualquer classificação quando não há templates cadastrados, impedindo a extração universal de funcionar como fallback real.

Todos os quatro problemas estão documentados no plano de implementação.

### ComprovanteEmprestimo — extração implementada

- **Problema/Goal:** `ComprovanteEmprestimo` sem extração — `no_template/NENHUMA` no banco
- **Decisão:** criar `comprovante_emprestimo.json` e adicionar entradas em `_CONFIG_LOOKUP`
- **Changes:** Criado `extraction_configs/comprovante_emprestimo.json` com 10 campos. Adicionadas entradas `("ComprovanteEmprestimo", None)` e `("ComprovanteEmprestimo", "capital_consig")` em `universal_extraction.py`. Regexes validados contra OCR text real: 9/10 campos OK, `conta_destino` non-critical ausente (esperado — comprovante TED não expõe conta do destinatário)

### Kit Matching — 1/5 em vez de 2/5

- **Problema/Goal:** Pasta `700268571-2` tem `Averbação` e `ComprovanteEmprestimo` extraídos, mas kit mostra 1/5
- **Decisão:** fallback no kit matching por `empresa_geradora` — se o doc tem mesmo `doc_type` e mesma empresa do template exigido, conta como match
- **Changes:** Não implementado — plano criado em `kit-matching-empresa-fallback-implementation.md`

### guard `all_templates_exist` — pipeline aborta prematuramente

- **Problema/Goal:** Docs com `no_template` em massa bloqueiam extração universal
- **Decisão:** remover o guard — o loop já lida com `matched=None` individualmente
- **Changes:** Não implementado — incluído na Parte 0 do plano

Key outputs:
- `domains/aquisicao/domain/extraction_configs/comprovante_emprestimo.json` — novo config de extração
- `domains/aquisicao/domain/universal_extraction.py` — `_CONFIG_LOOKUP` atualizado
- `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` — plano de implementação

## Key Decisions

- **Regex por OCR text:** usamos regex direto contra o texto extraído pelo PyMuPDF em vez de criar template visual — o comprovante TED tem layout textual padronizado pelo Banco Central
- **empresa_geradora como critério de kit matching:** template_id exato é muito restritivo para extração universal; empresa_geradora é o proxy correto
- **Remover guard all_templates_exist:** o guard era legado do pipeline original sem extração universal e agora é um bloqueador

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/comprovante_emprestimo.json` | `created` | Config de extração com 10 campos regex para comprovante TED/PIX |
| `domains/aquisicao/domain/universal_extraction.py` | `modified` | Adicionadas entradas `ComprovanteEmprestimo` no `_CONFIG_LOOKUP` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `created` | Plano de implementação com 4 partes para corrigir kit matching |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implementar Parte 0: remover guard `all_templates_exist` | Sessão | ⚠️ HIGH | Pendente |
| Implementar Parte 1: sempre inferir `empresa_geradora` | Sessão | ⚠️ HIGH | Pendente |
| Implementar Partes 2-3: pré-carregar template_empresas + fallback em `evaluate_kit_completion` | Sessão | ⚠️ HIGH | Pendente |
| Adicionar testes para empresa_fallback no kit matching | Sessão | MEDIUM | Pendente |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [`empresa-geradora-implementation-plan.md`](./empresa-geradora-implementation-plan.md) | `derives-from` | Plano original de empresa_geradora e extração universal |
| [`kit-matching-empresa-fallback-implementation.md`](./kit-matching-empresa-fallback-implementation.md) | `grounds` | Plano produzido nesta sessão |
| [`upload-flow-diagram.md`](./upload-flow-diagram.md) | `contextualizes` | Diagrama do pipeline onde os bugs foram encontrados |
