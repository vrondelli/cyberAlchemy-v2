---
tags: [ccb, pipeline]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:16:16-03:00
expires: 2026-05-19
conversation_id: 7c7ee154-2871-44d7-82d2-620dd554b3ad
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: ["specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md"]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Implementou fallback de metadados parciais e definiu taxonomia formal de confiança da extração (Alta, Média, Baixa), criando lastro para governança futura de dashboards e aprovações."
---

# Extração Universal Parcial e Hierarquia de Confiança

**Date:** 2026-03-20 14:16 (UTC-3)
**Tags:** #ccb #pipeline

## Summary

A sessão evoluiu sobre a lógica do Extrator Universal (via Regex). Primeiramente, constatou-se que o extrator repudiava completamente OCRs úteis que carecem apenas de uma variável crítica. O código foi refatorado e testado para passar a retornar e salvar as variáveis parciais no banco. A posteriori, avaliamos juntas as camadas de assertividade das vias de extração, formatando e projetando a taxonomia rigorosa que servirá de insumo para `ExtractionConfidence` no futuro, ranqueada por Alta, Média e Baixa confiança, a depender se usou Template Visual, Universal Regex Específico ou Universal Regex Genérico. O documento de design da sprint atualizou-se com o pendente. Todas as suítes passaram 100%.

### Retenção de OCR Parciais no Fallback Universal
- **Problem/Goal:** O Extrator Universal descartava o JSON inteiro de `fields` (`return None`) na ausência de qualquer "critical_field" parametrizado, o que apagava do banco dados úteis que o parser já tinha conseguido ler (prejudicando auditoria e reaproveitamento humano).
- **Decision:** Assegurar que dados recuperados jamais sejam perdidos. O Extrator passa a responder com tuple `(fields_dict, bool_success)` onde a flag determina se o status será processual de erro ou progresso.
- **Changes:** `universal_extraction.py` foi reimplementado para as devoluções parciais, `process_bulk_import.py` foi amarrado na gravação condicional da tupla e todos os `test_universal_extraction.py` foram adequados à nova estrutura, passando assertivamente. 

### Rastreio do Nível de Confiança
- **Problem/Goal:** Conforme o Universal entra na jogada, dependemos de RegEx para apurar metadados, e precisamos que seja explícito sistemicamente e documentalmente onde a chance do OCR falhar ou alucinar é maior.
- **Decision:** Estabeleceu-se uma tabela em escala: `1. (doc_type + empresa + template) confianca alta`, `2. (doc_type + empresa) confianca média` e `3. (doc_type genérico) confianca baixa`.
- **Changes:** Essa constatação foi mapeada e adicionada explicitamente no plano de implementação como `Componente 4.5: Rastreio do Nível de Confiança da Extração` com status de `PENDING IMPLEMENTATION`.  A sugestão pautou de guiar qual será o modelo de banco responsável para armazenar essa taxonomia.

Key outputs:
- `empresa-geradora-implementation-plan.md` — Modificado c/ Design da Confiança na Sessão.
- `universal_extraction.py` — Modificado.
- `process_bulk_import.py` — Modificado.
- `test_universal_extraction.py` — Modificado.

## Tests Added/Modified

| Test file | Tests added/modified | Business rule validated |
|-----------|---------------------|----------------------|
| `domains/aquisicao/tests/test_universal_extraction.py` | `test_ccb_missing_critical_field_returns_partial_fields_and_false_success` | A recusa de um documento gerador sem template não deve causar apagão nos dados capturados no JSON; o dict deve voltar preenchido com parciais validáveis pro banco |

**Why these tests matter:** No ambiente de produção, OCRs variam. Garantir com o Pytest essa retenção preserva esforço do Backoffice. O teste evita regressão caso outra sprint tente simplificar indevidamente o script devolvendo Nulo novamente.

## Key Decisions

- **Taxonomia Estrita:** O código oficializa a escada: (1) Template - ALTA, (2) Empresa Regex - MEDIA, (3) Universal Generic - BAIXA. E orienta construção futura pro Django.
- **Preservação de Dado Bruto:** Tuplas substituem nulos secos nas funções de OCR universal.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/universal_extraction.py` | `modified` | Passou a voltar tupla `(fields, success)` em vez de `dict | None` |
| `domains/aquisicao/use_cases/process_bulk_import.py` | `modified` | Grava `dv.extracted_data` compulsoriamente do output universal |
| `domains/aquisicao/tests/test_universal_extraction.py` | `modified` | Suite test reescrita inteira em cima da var tuple |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md` | `modified` | Atualização do documento contemplando a devolução parcial e detalhando no radar a feature pendente das Hierarquias de Confiança |
