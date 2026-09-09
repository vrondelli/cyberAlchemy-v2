---
tags: [acquisition, pipeline, ccb, kit-matching]
node_type: audit
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-21
timestamp: 2026-03-21T12:19:52-03:00
expires: 2026-05-20
conversation_id: 9081978e-d6ba-4c70-a374-00f0b4624f62
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md
promoted_candidates: []
expected_importance: 4
importance_rationale: "Corrigiu 4 ambiguidades de implementação na spec kit-matching-empresa-fallback antes da execução, evitando bugs sutis no pipeline de extração e avaliação de kits no domínio de aquisição."
version: 0.1.0
last_updated: 2026-03-21
---

# Revisão e Correção da Spec Kit Matching Fallback

**Date:** 2026-03-21 12:19 (UTC-3)
**Tags:** #acquisition #pipeline #ccb #kit-matching

## Summary

Sessão de revisão da spec `kit-matching-empresa-fallback-implementation.md` para verificar se estava pronta para implementação. A spec cobria três problemas inter-relacionados no pipeline de `process_bulk_import.py`: remoção do guard `all_templates_exist`, inferência universal de `empresa_geradora`, e fallback de kit matching por empresa quando `template_id` não bate. A revisão cruzou a spec contra o código fonte real e identificou 4 ambiguidades que teriam causado bugs ou comportamentos incorretos durante a implementação. As correções foram aplicadas diretamente no arquivo de spec.

### Problema 1 — Guard all_templates_exist: remoção incompleta

- **Problem/Goal:** A spec dizia para "remover o guard completamente", mas não mencionava a linha de declaração da variável `all_templates_exist = DocumentTemplate.objects.exists()` (linha 457), que precede o `if`. Deixar apenas a declaração sem o guard seria um DB hit desnecessário em toda pasta processada.
- **Decision:** Remover **ambas** as linhas: a declaração da variável (457) e o bloco `if not all_templates_exist:` (464–471).
- **Changes:** Spec atualizada para listar os dois pontos de remoção explicitamente.

### Problema 2 — Parte 1: localização exata da atribuição empresa_geradora

- **Problem/Goal:** A spec mostrava um código esquemático em que `empresa_geradora` era atribuído "antes dos dois caminhos", mas não especificava onde exatamente no loop (linha ~540) isso deveria acontecer, nem tornava explícita a necessidade de mover o `import infer_empresa` para fora do bloco `if matched is None`.
- **Decision:** Especificar que a atribuição ocorre logo após `matched = find_matching_template(...)` e antes de qualquer `if matched is None`; incluir tabela explícita de todas as linhas de `dv.save()` que precisam de `'empresa_geradora'` no `update_fields`.
- **Changes:** Parte 1 reescrita com snippet contextualizado e tabela de linhas afetadas.

### Problema 3 — Parte 2: pré-carregamento deve estar dentro de _run_kit_evaluation

- **Problem/Goal:** A spec descrevia o pré-carregamento de `template_empresas` como se fosse externo à função, mas `_run_kit_evaluation` é uma função interna chamada em dois lugares (~738 e ~864). Se o pré-carregamento ficasse fora, o segundo call site (re-avaliação pós-contrato com CCB) não teria o mapa.
- **Decision:** O pré-carregamento deve ser **dentro** de `_run_kit_evaluation`, apresentando o bloco completo da função modificada.
- **Changes:** Parte 2 reestruturada em 2a (enriquecer dicts) e 2b (função completa com pré-carregamento interno).

### Problema 4 — Verification Plan sem assertivas concretas

- **Problem/Goal:** Os 3 novos testes eram nomeados corretamente mas sem setup e assert explícitos, deixando ambíguo o que cada teste deve verificar.
- **Decision:** Expandir cada teste com Setup completo (valores de `template_empresas`, `folder_docs`) e Assert explícito (`matched_kit is not None`, `best_matched == 1`, etc.).
- **Changes:** Seção de Verification Plan expandida com setup/assert por teste.

Key outputs:
- `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` — spec corrigida com as 4 precisões

## Key Decisions

- **Remoção dupla no guard:** remover tanto o `if not all_templates_exist:` quanto a query `DocumentTemplate.objects.exists()` — a variável não tem mais uso após a remoção.
- **Pré-carregamento interno:** `template_empresas` deve ser carregado **dentro** de `_run_kit_evaluation` para ser aplicado nos dois call sites da função.
- **Assertivas explícitas nos testes:** setup e assert concretos evitam interpretações divergentes durante a implementação.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `modified` | 4 correções de ambiguidade: remoção completa do guard, localização da atribuição empresa_geradora, pré-carregamento interno na _run_kit_evaluation, e assertivas dos testes |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [`kit-matching-empresa-fallback-implementation.md`](../../../specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md) | `validates` | Revisão pré-implementação que auditou e corrigiu a spec antes da execução |
