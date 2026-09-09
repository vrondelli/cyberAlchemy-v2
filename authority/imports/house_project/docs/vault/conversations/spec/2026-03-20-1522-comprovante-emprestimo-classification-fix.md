---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T15:22:00-03:00
expires: 2026-05-19
conversation_id: 145a5675-2f31-4e93-87c8-6aa39ce813e4
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/system-fragilities.md
promoted_candidates: []
expected_importance: 3
importance_rationale: "Fixed two silent bugs in DOC_TYPE_KEYWORDS (duplicate key dropped PIX pattern) and FILENAME_KEYWORDS (_EXT → COMPROVANTE_) in template_matching_config.py — localized config fix with regression test guard, low future reference value beyond the fragility catalog entry."
version: 0.1.0
last_updated: 2026-03-20
---

# Corrigindo Classificação ComprovanteEmprestimo no Upload

**Date:** 2026-03-20 15:22 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Esta sessão investigou por que o tipo de documento `ComprovanteEmprestimo` não estava sendo reconhecido durante o upload em lote de documentos. Após análise do pipeline de classificação em `process_bulk_import.py` e da configuração em `template_matching_config.py`, foram identificados dois bugs distintos que agiam em conjunto para impedir a classificação correta.

O primeiro bug foi uma chave duplicada no dicionário `DOC_TYPE_KEYWORDS`: `ComprovanteEmprestimo` era definido duas vezes, com os padrões PIX e TED em entradas separadas. Em Python, dicionários com chaves duplicadas descartam silenciosamente a primeira entrada — resultado: apenas o padrão TED sobrevivia no runtime. Qualquer documento com texto "Comprovante Transferência PIX Enviado" jamais era classificado como `ComprovanteEmprestimo`.

O segundo bug era um padrão de nome de arquivo incorreto em `FILENAME_KEYWORDS`: o padrão `_EXT` estava associado a `ComprovanteEmprestimo`, mas esse sufixo não é um marcador real para comprovantes. Substituído por `COMPROVANTE_` conforme confirmado pelo usuário.

Além da correção dos dois bugs, foram adicionados 4 testes para cobrir os cenários de classificação de `ComprovanteEmprestimo` (que tinha zero cobertura de testes anteriormente) e um teste de regressão específico que detectará recorrência do bug de chave duplicada.

Por fim, foram atualizados os documentos de arquitetura: `system-fragilities.md` ganhou nota de mitigação parcial no F-002 e uma nova entrada F-005 para o risco de chave duplicada em dicts de configuração.

### Diagnóstico da Falha de Classificação

- **Problema/Goal:** Usuário reportou que upload de `ComprovanteEmprestimo` não estava sendo reconhecido pelo sistema.
- **Decisão:** Investigar `template_matching_config.py` (configuração das keywords) e o pipeline de classificação 3-tier em `process_bulk_import.py`.
- **Descoberta:** Dois bugs independentes: (1) chave duplicada `DOC_TYPE_KEYWORDS["ComprovanteEmprestimo"]` descarta silenciosamente o padrão PIX; (2) `FILENAME_KEYWORDS["ComprovanteEmprestimo"] = _EXT` não é um marcador real para esses arquivos.

### Correções Aplicadas

- **Problema/Goal:** Corrigir ambos os bugs sem introduzir regressões.
- **Decisão:** Mesclar os dois padrões em uma única lista; substituir `_EXT` por `COMPROVANTE_`; corrigir o typo `Enviadaecon` → `Enviado` no padrão TED.
- **Changes:**
  - `template_matching_config.py` — `DOC_TYPE_KEYWORDS["ComprovanteEmprestimo"]` unificado com listas PIX + TED; `FILENAME_KEYWORDS["ComprovanteEmprestimo"]` corrigido para `COMPROVANTE_`.

Key outputs:
- `domains/aquisicao/domain/template_matching_config.py` — dois bugs corrigidos
- `domains/aquisicao/tests/test_parallel_bulk_import.py` — 4 testes adicionados
- `specs/002-ccb-validation-workflow/system-fragilities.md` — F-002 atualizado, F-005 criado

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|------------------------|
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_both_pix_and_ted_patterns_registered` | A config de classificação deve ter ambos os padrões PIX e TED para ComprovanteEmprestimo (guarda de regressão contra o bug de chave duplicada) |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_pix_text_keyword_classifies_as_comprovante` | Documentos com texto "Comprovante Transferência PIX Enviado" devem ser classificados como ComprovanteEmprestimo via Tier 1 |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_ted_text_keyword_classifies_as_comprovante` | Documentos com texto "Comprovante Transferência TED Enviado" devem ser classificados como ComprovanteEmprestimo via Tier 1 |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `test_comprovante_filename_classifies_via_tier0` | Arquivos cujo nome contém "COMPROVANTE_" devem ser classificados sem necessidade de OCR (Tier 0) |

**Por que esses testes importam:** Sem cobertura de `ComprovanteEmprestimo`, o bug de chave duplicada existiu silenciosamente. O teste `test_both_pix_and_ted_patterns_registered` é especialmente importante por ser um teste de integridade de configuração — ele detecta reintrodução do bug sem precisar de execução end-to-end.

## Key Decisions

- **PIX + TED em lista única:** Consolidar ambos os padrões em um único valor de dict elimina a possibilidade de sobrescrita silenciosa. Alternativa (`defaultdict(list)`) foi deferida como melhoria futura documentada em F-005.
- **Filename keyword `COMPROVANTE_`:** O usuário confirmou esse padrão como marcador válido para comprovantes (sufixo underscore garante que não haverá falsos positivos em arquivos que apenas contenham a substring "comprovante" no meio do nome).
- **Typo TED corrigido:** `Enviadaecon` → `Enviado` — tratado como correção óbvia de typo, não como decisão de negócio.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Merged duplicate DOC_TYPE_KEYWORDS entry; fixed TED typo; replaced _EXT filename pattern with COMPROVANTE_ |
| `domains/aquisicao/tests/test_parallel_bulk_import.py` | `modified` | Added TestComprovanteEmprestimoClassification with 4 tests |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `modified` | F-002 updated (partial mitigation noted), F-005 added (duplicate-key bug documented) |
| `specs/002-ccb-validation-workflow/ccb-parallel-documents-upload-implementation.md` | `modified` | Added missing YAML frontmatter per vault conventions |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Migrar `DOC_TYPE_KEYWORDS` para `defaultdict(list)` ou validar o dict em startup | F-005 | LOW | Backlog |
