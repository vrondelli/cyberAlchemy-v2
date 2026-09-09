---
tags: [acquisition, ccb, pipeline, application]
node_type: discovery
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T14:08:57-03:00
expires: 2026-05-18
conversation_id: 5a38b183-ca8a-4b1e-99d8-96a8da9eca63
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/002-ccb-validation-workflow/rg-document-extraction-implementation.md
  - specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md
promoted_candidates:
  - specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md
expected_importance: 7
importance_rationale: "Debugged RG extraction, established quality gates, and discovered Identificacao doc type unification need."
version: 0.1.0
last_updated: 2026-03-19
---

# RG Extraction Logic — Debugging, Quality Gates e Discovery de Identificacao

**Date:** 2026-03-19 14:08 (UTC-3)  
**Tags:** #acquisition #ccb #spec #frontend

## Summary

Esta sessão focou em depurar e refinar o pipeline de classificação e extração de documentos RG dentro do fluxo de bulk import. O ponto de partida foi que documentos RG não estavam sendo extraídos corretamente — ou eram marcados incorretamente como `low_quality_image`, ou ficavam sem dados mesmo quando legíveis. A sessão evoluiu para implementar um quality gate de dois níveis para RG, corrigir a lógica de persistência dos dados extraídos e identificar uma limitação estrutural: o `doc_type = "RG"` está sendo usado como proxy para qualquer documento de identidade pessoal, incluindo CNH, o que não é correto.

Um discovery foi produzido propondo a unificação dos tipos de identificação sob o `doc_type = "Identificacao"`, com detecção automática de sub-tipo via keywords OCR. A sessão também incluiu a implementação de `extract_text_force_ocr` no `ocr_service.py`, que força o Tesseract a renderizar o PDF como imagem para capturar conteúdo embutido em documentos como a CNH Serpro digital.

### Quality Gate para RG: `MIN_RG_OCR_CHARS` e `RG_FIELD_EXTRACTION_THRESHOLD`

- **Problema/Goal:** RGs com scans de baixa qualidade passavam pelo pipeline sem sinalização, gerando `extracted_data` vazio ou incompleto sem que o operador soubesse.
- **Decisão:** Two-gate approach: (1) mínimo de caracteres OCR para garantir que o scan não é ilegível; (2) completude dos `critical_fields` do template.
- **Mudanças:** Adicionadas as constantes `MIN_RG_OCR_CHARS = 60` e `RG_FIELD_EXTRACTION_THRESHOLD = 1.0` em `bulk_import_config.py`. Implementada a lógica em `process_bulk_import.py` na seção non-CCB do pipeline.

### `extracted_data` Preservado Mesmo com `low_quality_image`

- **Problema/Goal:** Documentos marcados como `low_quality_image` não tinham `extracted_data` salvo, então o `rg_numero` extraído era perdido — impossibilitando kit matching downstream.
- **Decisão:** O `extracted_data` deve ser salvo **sempre que houver campos extraídos**, independent da reason. A reason sinaliza qualidade para o operador, mas não bloqueia o processamento.
- **Mudanças:** Lógica em `process_bulk_import.py` atualizada para sempre fazer `dv.extracted_data = fields` antes de checar a `completion_rate`.

### Detecção de `critical_fields` vs. Todos os Campos

- **Problema/Goal:** Com `RG_FIELD_EXTRACTION_THRESHOLD = 1.0`, documentos legíveis (RG físico com `rg_numero` extraído) continuavam sendo marcados como `low_quality_image` porque campos opcionais como `cnh`, `ctps`, `nis_pis_pasep` estavam vazios.
- **Decisão:** O threshold se aplica apenas aos `critical_fields` do template, não a todos os campos. Campos não-críticos nunca devem barrar a extração.
- **Mudanças:** Gate 2 em `process_bulk_import.py` modificado para usar `matched.critical_fields` em vez de `extraction_config['fields'].keys()`. Template no banco atualizado: `critical_fields = ['rg_numero']`, todos os demais como `non_critical_fields`.

### `extract_text_force_ocr`: Sempre Tesseract para Docs Baseados em Imagem

- **Problema/Goal:** PDFs como a CNH Serpro têm uma camada de texto limpa (cabeçalho + rodapé), mas o cartão de identidade em si é uma imagem rasterizada. O `extract_text_with_fallback` retornava a camada de texto e nunca chamava o Tesseract — os dados do cartão ficavam invisíveis para o pipeline.
- **Decisão:** Para doc_type `"RG"` (e futuramente `"Identificacao"`), sempre forçar renderização da página como imagem + Tesseract, independente da camada de texto. PyMuPDF é ainda combinado para não perder conteúdo da assinatura digital.
- **Mudanças:** Nova função `extract_text_force_ocr()` em `ocr_service.py`. Em `process_bulk_import.py`, branch `if doc_type == "RG": extract_text_force_ocr(...)` adicionado.

### Discovery: `doc_type = "Identificacao"`

- **Problema/Goal:** O nome `RG` é inadequado para cobrir CNH, RNE, Passaporte, etc. Estamos criando um acoplamento implícito entre o nome de arquivo (`RG1_*`) e o conteúdo do documento.
- **Decisão:** Renomear `"RG"` → `"Identificacao"` como categoria genérica, e adicionar `id_subtype` como campo de extração automático para diferenciar RG, CNH, RNE via keywords no texto.
- **Mudanças:** Document de discovery criado em `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` com roadmap de mudanças.

Key outputs:
- `bulk_import_config.py` — constantes `MIN_RG_OCR_CHARS` e `RG_FIELD_EXTRACTION_THRESHOLD`
- `ocr_service.py` — função `extract_text_force_ocr`
- `process_bulk_import.py` — quality gates revisados, force-OCR para RG
- `template_matching_config.py` — regex RG corrigida em `FILENAME_KEYWORDS`
- `Contratos.jsx` — labels `no_text_found` / `low_quality_image` → "Qualidade de imagem insuficiente"
- `identificacao-doc-type-discovery.md` — discovery e roadmap

## Key Decisions

- **Quality gate em `critical_fields` apenas:** O `RG_FIELD_EXTRACTION_THRESHOLD` se aplica somente às `critical_fields` do template (atualmente só `rg_numero`), não a todos os campos configurados.
- **`extracted_data` sempre persiste:** Mesmo com `reason=low_quality_image`, qualquer campo que foi extraído é salvo para permitir kit matching e cross-check downstream.
- **Force OCR para identificação:** Para qualquer documento que seja tipicamente baseado em imagem, sempre renderizar a página completa e rodar Tesseract — não confiar que a camada de texto do PDF é suficiente.
- **Não criar `doc_type=CNH` agora:** CNH será coberta pelo futuro `doc_type=Identificacao` com `id_subtype=CNH` via OCR, em vez de um tipo separado.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/bulk_import_config.py` | `modified` | Adicionadas constantes `MIN_RG_OCR_CHARS` e `RG_FIELD_EXTRACTION_THRESHOLD` |
| `domains/aquisicao/services/ocr_service.py` | `modified` | Adicionada `extract_text_force_ocr()` — sempre Tesseract + merge com PyMuPDF |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Quality gates Gate 1 (OCR chars) e Gate 2 (critical fields), force-OCR para RG, persistência de `extracted_data` mesmo em `low_quality_image` |
| `domains/aquisicao/domain/template_matching_config.py` | `modified` | Regex `FILENAME_KEYWORDS["RG"]` corrigida para `(?i)^RG\d*[_\-]` |
| `frontend/src/pages/Contratos.jsx` | `modified` | Labels `no_text_found` e `low_quality_image` → "Qualidade de imagem insuficiente" |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/identificacao-doc-type-discovery.md` | `created` | Discovery e roadmap para unificação de tipos de identificação |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implementar `doc_type=Identificacao` com `id_subtype` | Discovery desta sessão | ⚠️ HIGH | backlog |
| CNH Serpro (PDF com cartão como imagem) não extrai dados do cartão nem com force-OCR | Observado nos testes | MEDIUM | open |
| `nome` não extrai de fotos físicas de RG (OCR garbled) | Observado nos testes | LOW | accepted |

## Open Questions

- O `id_subtype` deve ser um campo no `extracted_data` (JSON) ou uma coluna separada em `document_version`?
- Kit Types que exigem `"RG"` devem aceitar qualquer `Identificacao`, ou precisamos granularidade (aceitar CNH mas não RNE, etc.)?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[002-ccb-validation-workflow/rg-document-extraction-implementation.md]] | `updates` | Esta sessão expandiu e corrigiu a implementação descrita neste spec |
| [[002-ccb-validation-workflow/identificacao-doc-type-discovery.md]] | `derives-from` | Discovery produzido durante esta sessão |
