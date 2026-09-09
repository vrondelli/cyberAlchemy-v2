---
tags: [ccb, acquisition, pipeline]
node_type: conceptual
is_session: true
layer: [domain, application]
nature: explanatory
status: active
created: 2026-03-21
timestamp: 2026-03-21T11:39:54-03:00
expires: 2026-05-20
conversation_id: bf7f7a26-739a-4a07-9ff1-b7c111082351
decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Q&A explicativo sobre o pipeline de upload→extração de texto (ocr_service, process_bulk_import, template matching, OSD rotation) sem decisões novas — a fonte de verdade é o código, não este nó."
version: 0.1.0
last_updated: 2026-03-21
---

# Pipeline: Upload de Documentos → Extração de Texto

**Date:** 2026-03-21 11:39 (UTC-3)
**Tags:** #ccb #acquisition #pipeline

## Summary

Sessão exploratória que mapeou o pipeline completo de upload de documentos até a extração de texto no sistema de aquisição. O usuário queria entender como os documentos percorrem o sistema — desde o endpoint HTTP de upload, passando pela orquestração Celery, até a extração de texto por PyMuPDF e Tesseract. A conversa aprofundou quatro aspectos técnicos específicos: (1) como o `find_matching_template` filtra templates por `doc_type` e `empresa_geradora`; (2) as duas condições que levam ao `REASON_LOW_QUALITY_IMAGE`; (3) qual campo é usado para buscar o `ContratoCCB` no banco; e (4) como a correção de rotação OSD funciona e seu impacto no desempenho. Nenhuma mudança de código foi feita pelo agente — apenas o usuário modificou `bulk_import_config.py` para renomear a constante.

### Mapeamento do Pipeline Completo

- **Problema/Goal:** Entender todo o fluxo desde o upload do zip até o texto ser extraído.
- **Descoberta:** O pipeline é dividido em 6 fases claramente separadas:
  1. HTTP `POST /api/aquisicao/bulk-import/upload/` → `BulkImportUploadView` → `create_bulk_import_batch()` → enfileira `process_bulk_import_task.delay()`
  2. Celery task `traverse_and_identify`: faz stream do zip, classifica pastas (`_find_leaf_folders`), upload paralelo para MinIO (ThreadPoolExecutor, 20 workers, 3 retries), cria `DocumentVersion` rows, dispara chord de `process_folder_task`
  3. Celery task `process_folder_task` → `_process_folder`: por pasta em paralelo — download do MinIO, extração de texto (PyMuPDF ou Tesseract), classificação por `doc_type`, template matching, extração de campos, quality gates
  4. Para CCB: lookup de `ContratoCCB` por `CONTRATO_MATCH_FIELD = 'numero_titulo'`, cross-batch dedup, kit re-evaluation
  5. `finalize_batch_task`: dedup intra-batch, recomputa counters, emite `DOCUMENT_BULK_IMPORT_COMPLETED`
- **Extração de texto:** Dois caminhos — `extract_text_with_fallback` (PyMuPDF → garbled check → Tesseract fallback) e `extract_text_force_ocr` (sempre Tesseract, para `Identificacao`)

### Template Matching — Filtros

- **Problema/Goal:** Entender se `find_matching_template` filtra por `doc_type`.
- **Descoberta:** Sim — filtra por `doc_type` (primeiro filtro) e opcionalmente por `empresa_geradora` (segundo filtro, se inferida). Matching em dois tiers: Jaccard sobre texto (Tier 1, primário) + Hamming distance do pHash (Tier 2, fallback para docs sem texto).

### Quality Gates — REASON_LOW_QUALITY_IMAGE

- **Problema/Goal:** Entender exatamente as duas condições que geram `REASON_LOW_QUALITY_IMAGE`.
- **Descoberta:**
  - **Condição 1 (qualquer doc não-CCB):** `len(extract_text.strip()) < MIN_IDENTIFICACAO_OCR_CHARS` — texto bruto muito curto, qualidade de imagem insuficiente para tentar extração de campos.
  - **Condição 2 (só `Identificacao`):** `completion_rate < IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD` — texto suficiente mas campos críticos do template não foram extraídos; `completion_rate = filled_critical_fields / total_critical_fields`.

### OSD Rotation — Impacto de Performance

- **Problema/Goal:** Saber quanto a correção de rotação deixa o pipeline mais lento.
- **Descoberta:** Impacto ≈ +200–500ms por página, sobre um `image_to_string` que custa 3–10s — cerca de 5–15% overhead relativo. Irrelevante porque: (a) só executa quando Tesseract é chamado (não no happy path digital), e (b) o gargalo real é `image_to_string`, não o OSD.

### Modificação do Usuário em `bulk_import_config.py`

- **Mudança:** Renomeação de `MIN_RG_OCR_CHARS = 60` para `MIN_IDENTIFICACAO_OCR_CHARS = 20` (threshold mais permissivo) e adição de `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD = 1.0`.
- **Motivo:** Melhor nomenclatura (constante se aplica a todo `doc_type == "Identificacao"`, não só RG) e externalização do threshold de completeness dos campos críticos.

Key outputs:
- Mapa mental completo do pipeline: `BulkImportUploadView` → `create_bulk_import_batch` → `traverse_and_identify` → `_process_folder` → `extract_text_*` → `extract_fields` → lookup `ContratoCCB`

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Renomeação de `MIN_RG_OCR_CHARS` → `MIN_IDENTIFICACAO_OCR_CHARS` (valor: 60 → 20) e adição de `IDENTIFICACAO_FIELD_EXTRACTION_THRESHOLD = 1.0` pelo usuário |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `contextualizes` | Plano que originou grande parte do pipeline explorado nesta sessão |
