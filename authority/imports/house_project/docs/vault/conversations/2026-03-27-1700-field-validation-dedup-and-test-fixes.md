---
tags: [pipeline, ccb]
node_type: spec
is_session: true
layer: domain, application
nature: technical
status: active
created: 2026-03-27
timestamp: 2026-03-27T17:00:00-03:00
expires: 2026-05-26
conversation_id: ""
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/upload-flow-diagram.md
promoted_candidates: []
expected_importance: 3
importance_rationale: "DRY refactoring of `extract_fields_universal` to delegate critical-field checking to the canonical `check_critical_fields()`, plus e2e test setup fix to skip on missing fixture, have localized and low future reference value."
---

# Field Validation Deduplication e Correção de Testes

**Date:** 2026-03-27 17:00 (UTC-3)
**Tags:** #pipeline #ccb

## Summary

Esta sessão cobriu três tópicos inter-relacionados no pipeline de extração de documentos. Primeiro, uma exploração de como o check de campos críticos funciona em `documents_validation` — especificamente se há caminhos distintos para extração via regex vs. extração via IA (Gemini). A resposta foi que não: ambos os caminhos usam a mesma função `check_critical_fields()` do `field_validation.py`, exceto pelo path de fallback universal que reimplementava a mesma lógica inline.

A partir dessa descoberta, foi identificado um acoplamento por duplicação: `extract_fields_universal` continha um loop inline (`if not value`) que replicava o comportamento de `check_critical_fields()` sem delegar a ela. O refactoring foi executado via TDD — uma tentativa de escrever um teste que exporia um bug (`'0'` sendo tratado como ausente) foi descartada após confirmar que não existe bug comportamental (`'0'` é truthy em Python, portanto `not '0'` é `False`). O refactoring foi então realizado como remoção de duplicação pura, validada pelos testes existentes.

Paralelamente, foram corrigidos 9 erros na suite de testes E2E de aquisição: o `setUpClass` levantava `FileNotFoundError` quando o CSV de fixture não existia, causando `ERROR` em vez de `SKIP`. O path do CSV também estava errado (raiz do projeto em vez de `example_data/`).

O diagrama de fluxo do pipeline foi atualizado em dois momentos: primeiro unificando as três caixas de Quality Gate (Gemini matched, Gemini unmatched, RegEx clássico) em um único nó compartilhado `F2_QualityGate`, separando o Gate 1 de OCR (exclusivo do path RegEx) em um nó `F2_Gate1`; depois atualizando o tooltip do nó `F2_UnivMatch` para refletir a delegação a `check_critical_fields()`.

### Exploração: check de campos críticos (regex vs. IA)

- **Problem/Goal:** Entender se há tipos de check distintos para extração regex vs. extração IA
- **Decision:** Não há — a mesma `check_critical_fields()` é usada em ambos os paths. A diferença é que o path Gemini pula o `check_non_critical_coverage` e usa o enum de confiança da API como proxy qualitativo.
- **Changes:** Nenhuma — exploração via GitNexus.

### Refactoring: remoção do loop inline em `extract_fields_universal`

- **Problem/Goal:** `universal_extraction.py` reimplementava a checagem de campos críticos inline (`for field_name in critical: if not value`) em vez de delegar a `check_critical_fields()`
- **Decision:** Refactoring DRY — substituir o loop por chamada à função canônica. Não há bug comportamental a corrigir (ambas as lógicas são equivalentes para strings do OCR); o benefício é manutenção centralizada da regra.
- **Changes:** Import de `check_critical_fields` adicionado em `universal_extraction.py`; loop inline substituído por `missing = check_critical_fields(fields, critical)`. Log atualizado para reportar todos os campos faltando de uma vez (antes parava no primeiro).

### Fix: testes E2E de aquisição errando por CSV ausente

- **Problem/Goal:** 9 testes em `test_upload_e2e.py` entravam em `ERROR` (não `SKIP`) quando `new-aquisicoes-test.csv` não estava presente. O path também apontava para a raiz do projeto em vez de `example_data/`.
- **Decision:** Substituir `raise FileNotFoundError` por `raise unittest.SkipTest` no `setUpClass`, e corrigir o path para `example_data/new-aquisicoes-test.csv`.
- **Changes:** `test_upload_e2e.py` atualizado com `import unittest`, `setUpClass` usando `SkipTest`, e `_CSV_PATH` corrigido.

### Diagrama: unificação do Quality Gate

- **Problem/Goal:** Diagrama tinha três caixas de Quality Gate separadas (uma por path de extração), mas o código usa a mesma função para todas.
- **Decision:** Um único nó `F2_QualityGate` com Gate 1 de OCR separado antes, exclusivo do path RegEx.
- **Changes:** `upload-flow-diagram.md` atualizado: nós `F2_QualityGateGemini`, `F2_QGResultGemini`, `F2_QualityGateGemini2`, `F2_QGResultGemini2` removidos; `F2_Gate1` adicionado; `F2_UnivMatch` tooltip atualizado para mencionar `check_critical_fields()`.

Key outputs:
- `domains/documents_validation/domain/universal_extraction.py` — loop inline substituído por `check_critical_fields()`
- `domains/aquisicao/tests/test_upload_e2e.py` — `SkipTest` + path corrigido
- `specs/002-ccb-validation-workflow/upload-flow-diagram.md` — Quality Gate unificado + tooltip atualizado

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `domains/documents_validation/tests/test_universal_extraction.py` | Nenhum adicionado (teste incorreto descartado antes de commit) | — |
| `domains/aquisicao/tests/test_upload_e2e.py` | `setUpClass` corrigido para `SkipTest` + path do CSV | Upload E2E de remessa de aquisição com CSV real |

**Why these tests matter:** Os testes E2E de aquisição validam o pipeline completo de upload de remessa (validação, deduplicação, staging, criação de ContratoCCB) com dados reais. Sem o fix, os testes entravam em ERROR silencioso, mascarando cobertura de regressão crítica para o fluxo de ingestão.

## Key Decisions

- **DRY sem bug:** A duplicação em `extract_fields_universal` foi removida mesmo sem bug comportamental — a justificativa é manutenção centralizada da regra de "campo ausente".
- **SkipTest vs. FileNotFoundError:** Testes E2E que dependem de fixtures externas devem pular graciosamente em vez de errar, para não poluir o resultado da suite.
- **Gate 1 separado no diagrama:** O check de densidade de caracteres OCR é conceitualmente distinto do check de campos — merece nó próprio antes do Quality Gate compartilhado.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/documents_validation/domain/universal_extraction.py` | `modified` | Import de `check_critical_fields` adicionado; loop inline substituído; log melhorado |
| `domains/aquisicao/tests/test_upload_e2e.py` | `modified` | `SkipTest` em lugar de `FileNotFoundError`; path CSV corrigido para `example_data/` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/upload-flow-diagram.md` | `modified` | Quality Gate unificado; Gate 1 OCR separado; tooltip `F2_UnivMatch` atualizado |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `extract_fields_universal` não passa pelo `check_non_critical_coverage` — comportamento intencional ou lacuna? | Exploração desta sessão | LOW | open |
