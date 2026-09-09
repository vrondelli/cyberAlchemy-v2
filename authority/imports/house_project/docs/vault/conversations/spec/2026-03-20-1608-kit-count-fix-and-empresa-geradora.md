---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T16:08:00-03:00
expires: 2026-05-19
conversation_id: 145a5675-2f31-4e93-87c8-6aa39ce813e4
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/system-fragilities.md
  - domains/aquisicao/use_cases/process_bulk_import.py
  - domains/aquisicao/repositories/models.py
  - migrations/aquisicao/0039_documentversion_empresa_geradora.py
promoted_candidates: []
expected_importance: 5
importance_rationale: "Redesigned kit evaluation into a 2-phase architecture (non-CCB counted immediately, CCB counted only after contrato confirmed in DB) and added empresa_geradora persistence to DocumentVersion — both are correctness fixes that affect every future batch's kit count display and data auditability."
version: 0.1.0
last_updated: 2026-03-20
---

# Kit Count Fix e empresa_geradora: Dois Bugs de Pipeline

**Date:** 2026-03-20 16:08 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Esta sessão identificou e corrigiu dois bugs independentes de pipeline observados pela leitura da UI:

**Bug 1 — Kit count incorreto:** A pasta `700268571-2` mostrava `1/5 docs` no kit apesar de ter CCB + Averbação + ComprovanteEmprestimo classificados e extraídos. A causa: o Step 2c rodava o kit evaluation **antes** do contrato lookup (Step 4), incluindo o CCB no `folder_docs` mesmo quando o contrato não seria encontrado no banco. Resultado: contagens incorretas que misturavam documentos verificados com não-verificados.

**Bug 2 — empresa_geradora não persistida:** O campo `empresa` inferido por `infer_empresa()` era usado apenas para parametrizar `extract_fields_universal()`, mas nunca salvo no banco. A UI não tinha como mostrar qual empresa produziu cada documento.

Ambos os problemas foram corrigidos. Os testes passaram sem regressões (115/115 em `test_universal_extraction.py` + `test_parallel_bulk_import.py`).

### Kit Evaluation — Refatoração em 2 Fases

- **Problem/Goal:** Pasta sem contrato no DB mostrava `1/5` (CCB + alguns outros), em vez de `2/5` (apenas docs verificados sem CCB).
- **Decision:** CCB é um documento "condicional" — só confirma kit quando o contrato bate. Não-CCBs (Averbação, Comprovante, etc.) são documentos "independentes" — classificação suficiente.
- **Changes:**
  - Step 2c agora exclui `doc_type == 'CCB'` do `folder_docs`.
  - Código de avaliação de kit extraído para função local `_run_kit_evaluation(docs)` para reutilização.
  - Após Step 4 (contrato matched), re-chama `_run_kit_evaluation` incluindo o CCB na lista.
  - Resultado esperado: sem contrato → `2/5`; com contrato → `3/5`.

### empresa_geradora — Migration + Persistência

- **Problem/Goal:** `infer_empresa()` retornava `capital_consig`, `dataprev`, etc. mas o valor era descartado após usar na extração. Sem campo no banco para guardar.
- **Decision:** Adicionar `empresa_geradora` como `CharField(null=True)` no `DocumentVersion`. Diferente de `DocumentTemplate.empresa` (empresa registrada no template), este campo é a empresa **detectada no documento uploadado em runtime**.
- **Changes:**
  - `models.py` — `DocumentVersion.empresa_geradora` adicionado.
  - `migrations/aquisicao/0039_documentversion_empresa_geradora.py` — migração gerada e aplicada (removida operação `AlterUniqueTogether` espúria auto-gerada pelo Django).
  - `process_bulk_import.py` — `dv.empresa_geradora = empresa` adicionado nas duas paths de save do universal extraction (success e partial).

### Remoção de REASON_EXTRACTED_NO_TEMPLATE

- **Decision:** Documentos extraídos com sucesso via universal extraction devem usar `REASON_EXTRACTED_NOT_CROSS_CHECKED`, não um reason separado. O cross-check é o próximo passo natural.
- **Changes:** Linha única em `process_bulk_import.py`. 2 DVs existentes no banco migrados via bulk_update.

Key outputs:
- `domains/aquisicao/use_cases/process_bulk_import.py` — kit 2-fases + empresa_geradora save
- `domains/aquisicao/repositories/models.py` — campo empresa_geradora
- `migrations/aquisicao/0039_documentversion_empresa_geradora.py` — migração aplicada

## Key Decisions

- **CCB só conta no kit após contrato confirmado:** Ao contrário dos outros docs, o CCB representa o contrato em si — sem match no DB, é incompleto por definição.
- **empresa_geradora em DocumentVersion (não em DocumentTemplate):** O campo em `DocumentTemplate.empresa` registra o layout esperado; DocumentVersion.empresa_geradora registra o que foi **detectado** no documento em runtime — são informações distintas.
- **_run_kit_evaluation como função local:** Evita duplicação do boilerplate de kit evaluation sem criar abstração de serviço prematura.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Kit evaluation em 2 fases; empresa_geradora salvo; REASON_EXTRACTED_NO_TEMPLATE removido do pipeline |
| `domains/aquisicao/repositories/models.py` | `modified` | `DocumentVersion.empresa_geradora` CharField nullable adicionado |
| `migrations/aquisicao/0039_documentversion_empresa_geradora.py` | `created` | Migração para novo campo; operação espúria AlterUniqueTogether removida |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `modified` | v1.3.0: F-007 adicionado sobre kit count incorreto por CCB prematuro |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Frontend não exibe `empresa_geradora` na UI de documentos | session | LOW | Backlog |
| `_run_kit_evaluation` duplica acesso a ProdutoKitConfig — poderia ser memoizado | session | LOW | Backlog |
