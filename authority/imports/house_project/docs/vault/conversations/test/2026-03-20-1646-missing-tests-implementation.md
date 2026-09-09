---
tags: [ccb, pipeline, acquisition]
node_type: test
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T16:46:47-03:00
expires: 2026-05-19
conversation_id: 86696a50-3ac3-4cf2-a1b8-6a50782bb032
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Added 17 tests across 3 files covering extraction_confidence persistence, 2-phase kit count correctness, delete_batch hard-delete cascade and event emission, and empresa-aware template matching — these tests guard the exact business rules introduced in the previous 3 sessions and prevent silent regressions in the CCB validation pipeline."
version: 0.1.0
last_updated: 2026-03-20
---

# Implementação dos Testes Faltantes: Pipeline CCB

**Date:** 2026-03-20 16:46 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Esta sessão implementou todos os testes críticos e importantes identificados no audit de testes `test_audit_20260320.md`. O audit havia mapeado 6 categorias de lacunas — esta sessão cobre as 4 críticas e as 2 importantes.

O trabalho começou com um audit completo das mudanças não-commitadas (Python + Terraform), que identificou os seguintes gaps: `extraction_confidence` não era testado em nenhum path, a lógica 2-fases de kit count não tinha guard, `delete_batch` não tinha nenhum teste, o endpoint HTTP `BulkImportDeleteView` era completamente untested, e a lógica empresa-aware de template matching não tinha cobertura. Os testes foram adicionados em 3 arquivos de teste existentes: `test_parallel_bulk_import.py`, `test_bulk_import.py`, e `test_document_template.py`.

Durante a implementação, dois bugs foram descobertos: (1) o mock path correto para `extract_fields` é `domains.aquisicao.use_cases.process_bulk_import.extract_fields` (não `ocr_service.extract_fields`), porque o import binding Python resolve no módulo chamador — o mock errado era um no-op silencioso nos testes existentes; (2) a fixture `kit_consignado` usa `'RG'` como doc_type, que não está em `SUPPORTED_DOC_TYPES` — isso causava `ValueError` no setup. Os 2-phase kit tests foram refatorados para criar o kit inline com doc types válidos (`CCB` + `Identificacao`).

Ao final, todos os 17 novos testes passam. O resultado do run foi `17 passed, 5 warnings` — os warnings são `SwigPyPacked DeprecationWarning` do binding C++ do PyMuPDF e não afetam nenhum teste.

### Test Audit — Classificação de Lacunas

- **Problem/Goal:** Quantificar e priorizar os testes faltantes para as features implementadas nas últimas 3 sessões (extraction_confidence, 2-phase kit, delete_batch, empresa-aware matching).
- **Decision:** Auditar apenas Python + Terraform (excluindo ontology-visualization).
- **Changes:** Criado `test_audit_20260320.md` com 3 categorias (crítico, importante, nice-to-have) e `task.md` como checklist de implementação.

### extraction_confidence — Testes de Persistência

- **Problem/Goal:** Sem testes, um refactor poderia mudar a lógica ALTA/NENHUMA sem quebrar nada — risco de regressão silenciosa que esconde falhas de OCR.
- **Decision:** Dois paths distintos: template matched + campos extraídos → ALTA; template matched + campos vazios → NENHUMA.
- **Changes:** `TestExtractionConfidenceCCB` com 2 testes em `test_parallel_bulk_import.py`. Requer mock correto em `process_bulk_import.extract_fields` (não `ocr_service.extract_fields`).

### 2-phase Kit Count — Guard de Correção

- **Problem/Goal:** Sem guard, uma regressão poderia incluir CCB no kit count antes do contrato ser confirmado — exatamente o bug que foi corrigido na sessão anterior.
- **Decision:** Dois cenários testados: sem contrato → CCB excluído, `documents_matched ≤ 1`; com contrato → CCB incluído, `documents_matched == 2`.
- **Changes:** `TestTwoPhaseKitCount` com 2 testes. Fixture `kit_consignado` foi contornada (estava quebrada com `'RG'`); testes criam kit inline com doc types válidos via `manage_kit_type`, `manage_tipo_produto`, e `manage_emissor`.

### delete_batch — Use Case + HTTP Endpoint

- **Problem/Goal:** Função de hard-delete completamente sem cobertura — risco de deixar DVs órfãos (FK SET_NULL) ou não emitir o evento de auditoria.
- **Decision:** 3 testes de use case + 4 testes HTTP, cobrindo cascade, ValueError, evento DECLINED, status 204/404/401.
- **Changes:** `TestDeleteBatch` em `test_parallel_bulk_import.py`; `TestBulkImportDeleteAPI` em `test_bulk_import.py`.

### empresa-Aware Template Matching — Register + Match

- **Problem/Goal:** `register_template` agora aceita `empresa`, e `find_matching_template` filtra por empresa antes de usar fallback genérico — sem testes, o fallback poderia ser silenciosamente dropado.
- **Decision:** Testar os 3 cenários do fallback: empresa-specific wins, unknown empresa falls back to generic, empresa=None searches all.
- **Changes:** `TestRegisterTemplateEmpresa` (3 testes) + `TestFindMatchingTemplateEmpresa` (3 testes) em `test_document_template.py`.

Key outputs:
- `domains/aquisicao/tests/test_parallel_bulk_import.py` — 7 novos testes (confidence + 2-phase + delete_batch)
- `domains/aquisicao/tests/test_bulk_import.py` — 4 novos testes (BulkImportDeleteView HTTP)
- `domains/aquisicao/tests/test_document_template.py` — 6 novos testes (empresa-aware matching)

## Tests Added/Modified

| Test file | Tests added | Business rule validated |
|-----------|-------------|-------------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestExtractionConfidenceCCB::test_extraction_confidence_alta_when_template_matched_with_fields` | Template match + campos extraídos → confidence=ALTA; evita que operadores confundam extração boa com ruim |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestExtractionConfidenceCCB::test_extraction_confidence_nenhuma_when_template_matched_but_no_fields` | Template matched mas OCR retorna vazio → confidence=NENHUMA; garante que esses casos entrem na fila de revisão |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestTwoPhaseKitCount::test_ccb_excluded_from_kit_count_when_no_contrato_found` | CCB não conta no kit enquanto o contrato não for confirmado no banco |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestTwoPhaseKitCount::test_ccb_included_in_kit_count_after_contrato_confirmed` | Após contrato confirmado, re-evaluation inclui CCB; `documents_matched` deve refletir ambos |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestDeleteBatch::test_delete_batch_cascades_document_versions` | Hard-delete de batch deve deletar DVs explicitamente antes (FK SET_NULL não faz cascade) |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestDeleteBatch::test_delete_batch_not_found_raises_value_error` | ID inválido deve levantar ValueError, não silenciosamente não-operar |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `TestDeleteBatch::test_delete_batch_logs_event` | Deleção deve emitir DOCUMENT_BULK_IMPORT_DECLINED com `action='deleted'` para rastreabilidade |
| `domains/aquisicao/tests/test_bulk_import.py` | `TestBulkImportDeleteAPI::test_delete_batch_returns_204` | DELETE bem-sucedido retorna 204 No Content (não 200) |
| `domains/aquisicao/tests/test_bulk_import.py` | `TestBulkImportDeleteAPI::test_delete_batch_removes_batch_from_db` | Após DELETE HTTP, nem o batch nem os DVs existem no banco |
| `domains/aquisicao/tests/test_bulk_import.py` | `TestBulkImportDeleteAPI::test_delete_batch_nonexistent_returns_404` | batch_id desconhecido retorna 404 |
| `domains/aquisicao/tests/test_bulk_import.py` | `TestBulkImportDeleteAPI::test_delete_batch_requires_auth` | Endpoint requer autenticação; sem token → 401 |
| `domains/aquisicao/tests/test_document_template.py` | `TestRegisterTemplateEmpresa::test_empresa_is_persisted_when_provided` | Campo `empresa` é salvo quando fornecido |
| `domains/aquisicao/tests/test_document_template.py` | `TestRegisterTemplateEmpresa::test_empresa_is_null_when_not_provided` | `empresa=None` quando omitido (template genérico) |
| `domains/aquisicao/tests/test_document_template.py` | `TestRegisterTemplateEmpresa::test_multiple_empresa_templates_per_doc_type_allowed` | Múltiplos templates de empresas diferentes do mesmo doc_type coexistem |
| `domains/aquisicao/tests/test_document_template.py` | `TestFindMatchingTemplateEmpresa::test_empresa_specific_template_preferred_over_generic` | Template empresa-específico ganha sobre genérico quando empresa é conhecida |
| `domains/aquisicao/tests/test_document_template.py` | `TestFindMatchingTemplateEmpresa::test_fallback_to_generic_when_no_empresa_template_exists` | empresa desconhecida faz fallback para template genérico |
| `domains/aquisicao/tests/test_document_template.py` | `TestFindMatchingTemplateEmpresa::test_empresa_none_matches_all_templates` | empresa=None busca em todos os templates (comportamento pré-existente preservado) |

**Why these tests matter:** Sem esses testes, as 4 features implementadas nas sessões anteriores (extraction_confidence, 2-phase kit, delete_batch, empresa-aware matching) poderiam regredir silenciosamente em qualquer refactor futuro do pipeline. Em particular: DVs órfãos por falta de cascade em delete_batch corrompem reporting; kit count incorreto engana o operador sobre completude do pacote; extraction_confidence errado distorce a fila de revisão prioritária.

## Key Decisions

- **Mock path para `extract_fields`:** Deve ser `domains.aquisicao.use_cases.process_bulk_import.extract_fields`, não `domains.aquisicao.services.ocr_service.extract_fields`. Mocking no ponto errado era um no-op silencioso — os testes existentes que usavam o path errado passavam por outras razões (texto sem regex match), mascarando o problema.
- **Não usar fixture `kit_consignado` nos 2-phase tests:** A fixture usa `'RG'` que não está em `SUPPORTED_DOC_TYPES`. Os testes de 2-phase criam kit inline com `'CCB'` + `'Identificacao'` via helpers de use case diretos.
- **Estrutura de `TestDeleteBatch` separada de `TestBulkImportDeleteAPI`:** Use case tests no arquivo de pipeline paralelo; HTTP tests no arquivo de endpoints — segue a separação existente no projeto.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Adicionado `TestExtractionConfidenceCCB` (2 tests), `TestTwoPhaseKitCount` (2 tests), `TestDeleteBatch` (3 tests) |
| `domains/aquisicao/tests/test_bulk_import.py` | `modified` | Adicionado `TestBulkImportDeleteAPI` (4 tests) |
| `domains/aquisicao/tests/test_document_template.py` | `modified` | Adicionado `TestRegisterTemplateEmpresa` (3 tests), `TestFindMatchingTemplateEmpresa` (3 tests) |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/2026-03-20-1646-missing-tests-implementation.md` | `created` | Este nó de sessão |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Fixture `kit_consignado` usa `'RG'` (não suportado) — deveria ser `'Identificacao'` | session | MEDIUM | Backlog |
| Testes de refactoring de fraglib existente (file handle leaks em `celery_tasks_test.py`) | audit | LOW | Backlog |
| Terraform CI validation não adicionada ao pipeline | audit | MEDIUM | Backlog |
