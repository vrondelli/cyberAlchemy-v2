---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: domain
nature: technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T16:00:00-03:00
expires: 2026-05-26
conversation_id: kit-matching-empresa-implementation
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Implementou filtragem de kits candidatos por empresa_geradora da CCB em ambas as rodadas de kit eval, com regra de negócio nova (CCB sem empresa = sem kit) que altera o comportamento observável de documentos sem empresa identificada."
---

# Kit Matching — Implementação de Filtragem por Empresa da CCB

**Date:** 2026-03-27 16:00 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

Esta sessão implementou o plano `kit-matching-require-empresa-implementation.md` com uma revisão de escopo: a regra de fallback para CCB sem empresa mudou do plano original ("usa todos os kits") para "sem kit" (sem contagem). A implementação seguiu TDD estrito — testes escritos e confirmados vermelhos antes do código de produção. Todas as três partes do plano foram implementadas: `_run_kit_eval`, `_step_kit_evaluation`, e `_step_contrato_lookup`. Uma regressão em `TestTwoPhaseKitCount` foi identificada e corrigida com mock de `infer_empresa`. O teste pré-existente `test_averbacao_dataprev_extracts_fields` foi removido (arquivo JSON referenciado já havia sido deletado no branch). A suite final fechou em 255/255 no arquivo principal e 648/648 no domínio (excluindo o test removido).

### Revisão de Escopo: CCB sem empresa

- **Problema/Goal:** O plano original dizia "CCB sem empresa → usa todos os kits (wildcard)". O usuário clarificou que a regra correta é: CCB sem empresa deve ter campos extraídos, mas não deve ser associada a nenhum kit — sem contagem.
- **Decisão:** `ccb_empresa is None` → `_run_kit_eval` retorna imediatamente, sem executar nenhuma avaliação. O fallback "usa todos os kits" só se aplica quando `ccb_empresa` é fornecida mas nenhum kit tem template CCB com empresa correspondente.
- **Changes:** Lógica de early-return no início de `_run_kit_eval` condicionada a `ccb_empresa is None`.

### Parte 1 — `_run_kit_eval` com filtragem por empresa

- **Problem/Goal:** A função não tinha conhecimento de empresa; avaliava todos os kits ativos indiscriminadamente.
- **Decision:** Novo parâmetro `ccb_empresa: str | None`. Se None → early return. Se definido → coleta `template_id` dos requirements CCB de todos os kits ativos, faz lookup de `DocumentTemplate.empresa_geradora`, filtra kits onde algum requirement CCB aponta para template com empresa matching. Se `filtered = []` → fallback para todos os kits (templates ainda não catalogados).
- **Changes:** `_run_kit_eval` em `process_bulk_import.py` reescrito com o bloco de filtragem por empresa antes de `evaluate_kit_completion`.

### Parte 2 — `_step_kit_evaluation` lê e passa empresa

- **Problem/Goal:** A função iterava os DVs sem capturar `empresa_geradora` do CCB DV.
- **Decision:** Adicionar `ccb_empresa = None` antes do loop, setá-lo ao encontrar DV com `doc_type == _KIT_EMPRESA_ANCHOR_DOC_TYPE`, e passar via `ccb_empresa=ccb_empresa` para `_run_kit_eval`. Também substituir `'CCB'` hardcoded por `_KIT_EMPRESA_ANCHOR_DOC_TYPE` no filtro do loop.
- **Changes:** `_step_kit_evaluation` atualizado.

### Parte 3 — `_step_contrato_lookup` passa empresa na rodada 2

- **Problem/Goal:** A chamada de re-avaliação do kit após contrato confirmado não passava empresa.
- **Decision:** Passar `ccb_empresa=ccb_dv.empresa_geradora` na chamada de round 2.
- **Changes:** Linha `_run_kit_eval(result, full_folder_docs)` → `_run_kit_eval(result, full_folder_docs, ccb_empresa=ccb_dv.empresa_geradora)`.

### Regressão corrigida: `TestTwoPhaseKitCount`

- **Problem/Goal:** O teste `test_ccb_included_in_kit_count_after_contrato_confirmed` passou a falhar porque o CCB_TEXT não contém keyword de empresa → `infer_empresa` retorna None → kit eval skipped → `documents_matched=0`.
- **Decision:** Adicionar mock de `infer_empresa` retornando `'capital_consig'`. O kit tem `template_id=None` no requirement CCB → não entra no filtro de empresa → `filtered=[]` → fallback para todos os kits → kit é avaliado normalmente → `documents_matched=2`.
- **Changes:** Mock adicionado ao teste existente.

### Remoção de teste pré-existente quebrado

- **Problem/Goal:** `test_averbacao_dataprev_extracts_fields` estava falhando porque `averbacao_dataprev.json` foi deletado anteriormente no branch.
- **Decision:** Remover o teste (usuário confirmou).
- **Changes:** Teste removido de `test_universal_extraction.py`.

### Diagrama de fluxo atualizado

- **Problem/Goal:** O diagrama `upload-flow-diagram.md` na seleção IDE não refletia a nova lógica de filtragem por empresa na Fase 3.
- **Decision:** Desdobrar o nó `F3_Kit` em 4 nós expressando a decisão de empresa, o filtro, o fallback, e a avaliação. Anotar `F3_ReKit` com a mesma lógica.
- **Changes:** Diagrama atualizado fornecido na conversa (não gravado em arquivo — aguarda confirmação do usuário).

Key outputs:
- `domains/documents_validation/use_cases/process_bulk_import.py` — implementação das 3 partes
- `domains/documents_validation/tests/test_parallel_bulk_import.py` — 7 novos testes + fix de regressão + import de `_run_kit_eval`
- `domains/documents_validation/tests/test_universal_extraction.py` — remoção de teste quebrado

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestRunKitEvalEmpresaFilter::test_ccb_empresa_none_skips_kit_eval` | CCB sem empresa_geradora não deve ser associada a nenhum kit |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestRunKitEvalEmpresaFilter::test_kit_with_matching_empresa_is_used` | Kit cujo template CCB tem empresa matching é candidato válido |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestRunKitEvalEmpresaFilter::test_no_kit_matches_empresa_falls_back_to_all` | Se nenhum kit bater a empresa, fallback usa todos os kits (contagens populadas) |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestRunKitEvalEmpresaFilter::test_only_matching_empresa_kit_used_when_multiple_kits` | Com múltiplos kits, apenas o de empresa matching é candidato |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestStepKitEvaluationEmpresaPassing::test_ccb_empresa_read_and_passed_to_run_kit_eval` | `_step_kit_evaluation` propaga empresa do CCB DV |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestStepKitEvaluationEmpresaPassing::test_ccb_empresa_none_passed_when_ccb_has_no_empresa` | Empresa None é propagada corretamente (triggering skip) |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestContratoLookupPassesEmpresaToRound2::test_round2_kit_eval_gets_ccb_empresa` | Round 2 de kit eval recebe empresa da CCB após contrato confirmado |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `TestTwoPhaseKitCount::test_ccb_included_in_kit_count_after_contrato_confirmed` | Regressão corrigida: mock de infer_empresa garante CCB com empresa → fallback → kit contado |

**Why these tests matter:** Sem a filtragem por empresa, kits de uma financeira poderiam ser associados a CCBs de outra, gerando validações incorretas de completude de documentação. A regra "sem empresa = sem kit" previne que CCBs não identificadas recebam aprovação indevida por matching de kit genérico.

## Key Decisions

- **CCB sem empresa = sem kit:** Confirmado pelo usuário que a ausência de `empresa_geradora` na CCB deve impedir qualquer associação de kit, mesmo que os outros documentos da pasta satisfaçam um kit. Campos são extraídos normalmente.
- **Fallback para templates não catalogados:** Quando `ccb_empresa` é definida mas nenhum kit tem template CCB com empresa correspondente, todos os kits são usados como fallback — evita regressão silenciosa enquanto o cadastro de templates está incompleto.
- **Kit com `template_id=None` no requirement CCB vai pelo fallback:** Kits genéricos (sem template_id no requirement CCB) não entram no filtro de empresa e só chegam ao eval via fallback.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/use_cases/process_bulk_import.py` | `modified` | `_run_kit_eval`: novo param `ccb_empresa`, early-return se None, filtro de kits por empresa com fallback. `_step_kit_evaluation`: lê `ccb_empresa` do CCB DV, passa para `_run_kit_eval`, usa constante `_KIT_EMPRESA_ANCHOR_DOC_TYPE`. `_step_contrato_lookup`: passa `ccb_empresa` na round 2. |
| `domains/documents_validation/tests/test_parallel_bulk_import.py` | `modified` | Adicionado import de `_run_kit_eval`. 3 novas classes de teste (7 testes). Mock de `infer_empresa` no teste de regressão `TestTwoPhaseKitCount`. |
| `domains/documents_validation/tests/test_universal_extraction.py` | `modified` | Removido `test_averbacao_dataprev_extracts_fields` (arquivo JSON referenciado deletado). |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-require-empresa-implementation.md` | `referenced` | Plano executado nesta sessão; checklist completo. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Diagrama `upload-flow-diagram.md` não atualizado em arquivo | Sessão | LOW | Diagrama fornecido na conversa, pendente gravação |

## Open Questions
