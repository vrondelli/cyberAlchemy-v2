---
tags: [acquisition, pipeline, ccb, kit-matching]
node_type: test
is_session: true
layer: [domain, application]
nature: [technical, reference]
status: active
created: 2026-03-21
timestamp: 2026-03-21T12:55:55-03:00
expires: 2026-05-20
conversation_id: ebe649d8-f085-4375-ae4f-5a439d3ebcaf
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md
promoted_candidates: []
expected_importance: 5
importance_rationale: "Test audit completo das mudanças uncommitted revelou que os gaps C1/C2/C3/I1/I2/I3 já estavam cobertos; o único gap real (empresa_geradora persistida no DV) foi implementado em TestEmpresaGeradoraPersistedOnDV — garantia crítica para o kit fallback end-to-end."
version: 0.1.0
last_updated: 2026-03-21
---

# Test Audit — Kit Matching Fallback & Storage Refactor

**Date:** 2026-03-21 12:55 (UTC-3)
**Tags:** #acquisition #pipeline #ccb #kit-matching

## Summary

Sessão de auditoria de cobertura de testes das mudanças uncommitted da aplicação, excluindo ontology-visualization. A auditoria mapeou 11 arquivos de produção e 6 de teste alterados em quatro áreas: (1) fallback de kit matching por `empresa_geradora`, (2) lógica de 2 fases para contagem de kit (CCB excluído até Step 4), (3) refator de `default_storage.path → default_storage.open` para compatibilidade com MinIO/GCS, e (4) novo use case `delete_batch`.

O audit gerou uma matriz de cobertura com 3 gaps críticos, 4 importantes e 3 nice-to-have. Ao verificar os arquivos de teste existentes, descobriu-se que a grande maioria dos gaps (C1, C2, C3, I1, I2, I3) já estava implementada nas mudanças uncommitted. O único gap real ausente era o I4: validação de que `empresa_geradora` é persistida no `DocumentVersion` após extração universal — pré-requisito silencioso para o fallback de kit matching funcionar end-to-end.

O gap foi corrigido com a implementação de `TestEmpresaGeradoraPersistedOnDV` (2 testes), e o spec `kit-matching-empresa-fallback-implementation.md` foi atualizado de `status: ready` para `status: implemented` com documentação completa de todos os testes de cobertura.

### Audit de cobertura de testes

- **Problema/Goal:** Identificar gaps de teste nas mudanças uncommitted antes do merge, seguindo o workflow `/test-uncommited-changes`.
- **Decisão:** Executar audit estruturado com classificação por nível de importância (CRÍTICO / IMPORTANTE / NICE-TO-HAVE).
- **Mudanças:** Artifact `test_audit.md` criado com matriz completa, 10 gaps identificados inicialmente.

### Gap I4 — empresa_geradora persistida no DV

- **Problema/Goal:** O fallback de kit matching por `empresa_geradora` em `evaluate_kit_completion` só funciona em produção se `dv.empresa_geradora` estiver salvo no banco. Sem esse teste, uma regressão poderia silenciosamente tornar o fallback inoperante.
- **Decisão:** Implementar `TestEmpresaGeradoraPersistedOnDV` cobrindo o caminho universal (sem template) e garantindo que Identificacao fica com `empresa_geradora=None`.
- **Mudanças:** 2 testes adicionados ao final de `test_parallel_bulk_import.py`; ambos passando.

### Atualização do spec

- **Problema/Goal:** Spec `kit-matching-empresa-fallback-implementation.md` estava em `status: ready` e não refletia a implementação concluída.
- **Decisão:** Atualizar para `status: implemented, version: 1.0.0` com tabela completa de todos os testes que cobrem a spec.
- **Mudanças:** Spec reescrito para refletir o estado atual: todas as Partes 0–3 marcadas como implementadas, tabelas de testes por classe.

Key outputs:
- `domains/aquisicao/tests/test_parallel_bulk_import.py` — `TestEmpresaGeradoraPersistedOnDV` adicionada
- `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` — atualizado para `implemented`

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestEmpresaGeradoraPersistedOnDV::test_empresa_geradora_saved_on_dv_after_universal_extraction` | `empresa_geradora` inferida por `infer_empresa()` deve ser persistida no `DocumentVersion` — pré-requisito para o kit fallback funcionar when `template_id=None` |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestEmpresaGeradoraPersistedOnDV::test_empresa_geradora_none_for_identificacao_doc` | Documentos Identificacao (RG, CNH) não têm empresa emissora — `empresa_geradora` deve ficar `None` para evitar falsos matches de kit |

**Why these tests matter:** O fallback de kit matching por empresa (`evaluate_kit_completion` com `template_empresas`) só ativa se `dv.empresa_geradora` estiver salvo. Sem esses testes, uma regressão no `save(update_fields=[...])` do pipeline tornaria o fallback silenciosamente inoperante em produção — kits que deviam fechar por empresa nunca fechariam, bloqueando aprovações.

## Key Decisions

- **Audit revela que os grandes gaps já estavam cobertos:** C1 (`test_delete_batch_cascades_document_versions`), C2 (`test_delete_batch_not_found_raises_value_error`), C3 (`TestTwoPhaseKitCount`), I1/I2 (`TestBulkImportDeleteAPI`), I3 (`TestFindMatchingTemplateEmpresa`) — todos implementados nas mudanças uncommitted.
- **Gap I4 como único realmente ausente:** A persistência de `empresa_geradora` no DV era o único elo da cadeia sem cobertura de teste explícita.
- **Spec atualizado para `implemented`:** Com todos os testes mapeados, o spec pode servir como referência completa do que foi feito e testado.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Adicionada `TestEmpresaGeradoraPersistedOnDV` com 2 testes ao final do arquivo |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `modified` | Atualizado de `status: ready, version: 0.1.0` para `status: implemented, version: 1.0.0`; todas as Partes marcadas como ✅ implementadas; tabelas de cobertura de testes adicionadas |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `test_universal_fallback_creates_partial_doc`: assertion vaga (`in [MEDIA, BAIXA]`) | audit | MEDIUM | Open — deveria ser valor exato |
| File handle leak em mocks de `celery_tasks_test.py` (`mock_open.return_value = open(...)`) | audit | LOW | Open |
| `MIN_IDENTIFICACAO_OCR_CHARS = 20` sem teste de regressão | audit | LOW | Open |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/kit-matching-empresa-fallback-implementation.md` | `validates` | Testes desta sessão validam a implementação descrita nesta spec |
| `domains/aquisicao/domain/kit_matching.py` | `validates` | TestEmpresaGeradoraPersistedOnDV garante o pré-requisito para o fallback em evaluate_kit_completion |
