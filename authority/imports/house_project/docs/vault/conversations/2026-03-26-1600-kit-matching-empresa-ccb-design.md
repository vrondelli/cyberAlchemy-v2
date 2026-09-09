---
tags: [ccb, pipeline, acquisition]
node_type: discovery
is_session: true
layer: domain, application
nature: explanatory, technical
status: active
created: 2026-03-26
timestamp: 2026-03-26T16:00:00-03:00
expires: 2026-05-25
conversation_id: ~
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/kit-matching-require-empresa-discovery.md
  - specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Establishes kit candidate filtering by CCB empresa_geradora, fixing incorrect cross-empresa kit matching and unifying Averbação extraction config — directly impacts X/Y doc counters shown to all users."
---

# Kit Matching — Design de Seleção por Empresa do CCB

**Date:** 2026-03-26 16:00 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

A sessão partiu da análise dos contadores X/Y docs na UI, onde docs com "Extração concluída" apareciam mas não contavam para o kit. O diagnóstico revelou que o campo `reason` do `DocumentVersion` mistura dois conceitos: qualidade de extração e gate do kit. Além disso, o sistema avaliava todos os kits ativos sem considerar a empresa do CCB uploadado, o que podia satisfazer kits errados.

O design final estabelece que os kits candidatos devem ser filtrados pela `empresa_geradora` do CCB antes de qualquer matching. Isso elimina a necessidade de um flag `require_empresa` por requisito — a empresa de referência emerge naturalmente do CCB. Docs sem empresa são coringas; Identificacao nunca usa empresa.

Dois bugs de extração foram corrigidos: os configs de Averbação foram unificados em um genérico (`averbacao.json`), e o campo duplicado em `comprovante_emprestimo.json` foi removido.

A sessão produziu um discovery atualizado e um plano de implementação com as três mudanças necessárias em `process_bulk_import.py`.

### Diagnóstico do contador X/Y docs

- **Problem/Goal:** Entender por que docs com `extracted_not_cross_checked` não entravam na contagem do kit
- **Decision:** O `reason` captura qualidade de extração, não contribuição para o kit. Um doc pode ter extração bem-sucedida e ainda não contar se o KitType não exige aquele `doc_type` ou se a empresa não bate
- **Changes:** Nenhuma mudança de código — apenas compreensão do comportamento existente documentada

### Papel do CCB na contagem

- **Problem/Goal:** Confirmar quando o CCB entra no kit count
- **Decision:** CCB só conta na rodada 2, após match com contrato no banco. Na rodada 1 é excluído explicitamente. Isso é comportamento correto e deve ser mantido
- **Changes:** Nenhuma

### Design require_empresa — iterações e decisão final

- **Problem/Goal:** Adicionar verificação de empresa ao kit matching para evitar match entre empresas erradas
- **Decision:** Abordagem por flag `require_empresa` por requisito foi descartada. O approach adotado: filtrar kits candidatos pela empresa do CCB antes de rodar `evaluate_kit_completion`. Se o CCB não tem empresa → todos os kits passam. Se doc não tem empresa → coringa. Docs sem `template_id` contam por `doc_type` apenas (não gera falso negativo por cobertura de template insuficiente)
- **Changes:** Discovery e implementation plan criados

### Campos críticos por doc_type e bugs de config

- **Problem/Goal:** Entender o fallback de campos críticos para docs sem template; identificar gaps
- **Decision:** `_resolve_critical_fields` já tem dois níveis: template model → `DEFAULT_EXTRACTION_CONFIGS[doc_type]`. O fallback existe. Bug: Averbação tinha dois configs conflitantes com mesmo `doc_type`, loader era não-determinístico
- **Changes:**
  - `averbacao.json` criado com `critical_fields: [cpf, nome_trabalhador]` (base dataprev, mais completo)
  - `averbacao_dataprev.json` e `averbacao_sape.json` removidos
  - `comprovante_emprestimo.json`: `nome_destino` duplicado removido

Key outputs:
- `specs/002-ccb-validation-workflow/kit-matching-require-empresa-discovery.md` — discovery atualizado com algoritmo final e bugs corrigidos
- `specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md` — plano de implementação com 4 partes e checklist

## Key Decisions

- **Filtragem de kits por empresa do CCB:** Antes de rodar `evaluate_kit_completion`, filtrar `active_kits` para os que têm template de CCB com `empresa_geradora == ccb_empresa`. Se CCB sem empresa → todos os kits passam. Se filtro não retornar nenhum kit → fallback para todos (evita regressão silenciosa)
- **Docs sem template_id contam no kit:** Match por `doc_type` apenas. Não contar geraria falso negativo por limitação de cobertura de template
- **Wildcard para docs sem empresa:** Qualquer doc sem `empresa_geradora` passa em qualquer requisito daquele `doc_type`
- **Identificacao: sem empresa:** Nunca tem `empresa_geradora`, sempre match por `doc_type`
- **`require_empresa` descartado como flag:** Resolver no nível de seleção de kits é mais simples e não exige alterar schema do `KitType.required_docs`
- **Averbação unificada:** `critical_fields: [cpf, nome_trabalhador]` como mínimo genérico. Templates específicos por empresa continuam no banco via `DocumentTemplate`

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/domain/extraction_configs/averbacao.json` | `created` | Config genérico de Averbação com critical_fields: [cpf, nome_trabalhador] |
| `domains/documents_validation/domain/extraction_configs/averbacao_dataprev.json` | `deleted` | Substituído pelo genérico |
| `domains/documents_validation/domain/extraction_configs/averbacao_sape.json` | `deleted` | Substituído pelo genérico |
| `domains/documents_validation/domain/extraction_configs/comprovante_emprestimo.json` | `modified` | Removido nome_destino duplicado em critical_fields |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-require-empresa-discovery.md` | `created/updated` | Discovery com algoritmo final, decisões e bugs corrigidos (v0.3.0) |
| `specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md` | `created` | Plano de implementação com 4 partes: _run_kit_eval, _step_kit_evaluation, _step_contrato_lookup, testes |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `kit_matched: bool` em `DocumentVersion` | discovery | MEDIUM | backlog — rastreabilidade por documento no kit eval |
| Verificar se DocumentTemplates no banco referenciam `averbacao-dataprev-template` ou `averbacao-sape-template` | sessão | MEDIUM | pendente |

## Open Questions

- **`kit_matched` no DV:** Separar a semântica de "extração bem-sucedida" de "contribuiu para o kit" exigiria um novo campo. Decidido adiar — não bloqueia a feature atual
