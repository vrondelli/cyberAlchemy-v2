---
tags: [ccb, pipeline, acquisition]
node_type: spec
is_session: true
layer: [domain, application]
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T15:50:00-03:00
expires: 2026-05-19
conversation_id: 145a5675-2f31-4e93-87c8-6aa39ce813e4
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - specs/002-ccb-validation-workflow/system-fragilities.md
  - domains/aquisicao/domain/extraction_configs/ccb_consig.json
  - domains/aquisicao/domain/extraction_configs/averbacao_sape.json
  - domains/aquisicao/domain/universal_extraction.py
promoted_candidates: []
expected_importance: 4
importance_rationale: "Fixed silent extraction failures in ccb_consig.json (labels and values on separate lines not handled) and averbacao_sape.json (wrong CPF label + missing empresa mapping) — localized config fixes with direct impact on field extraction yield for all CCB and SIAPE Averbação documents."
version: 0.1.0
last_updated: 2026-03-20
---

# Corrigindo Configs de Extração Universal: CCB e Averbação

**Date:** 2026-03-20 15:50 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Esta sessão investigou por que os dados extraídos das CCBs e averbações estavam sendo salvos com campos vazios, mesmo quando o texto OCR continha todos os dados visíveis. A análise do `extracted_data` no banco revelou que os dicionários tinham as chaves certas mas todos os valores como strings vazias (`''`).

O problema foi identificado como uma **incompatibilidade entre o layout real do documento PyMuPDF e os regex patterns no `ccb_consig.json`**. O PyMuPDF extrai o conteúdo de PDFs tabulares quebrando os valores para a linha seguinte ao label (ex: `CPF:\n905.149.717-20`), mas todos os regexes no config assumiam que label e valor estariam na mesma linha (`CPF: 905.149.717-20`). Resultado: 19 de 21 campos extraíam strings vazias.

Para as averbações SIAPE, dois problemas independentes foram encontrados: (1) o regex `CPF\n` não batia com `CPF Consignado *\n`, o label real no sistema SIAPE; e (2) o `_CONFIG_LOOKUP` em `universal_extraction.py` não tinha entrada para `(Averbação, capital_consig)` — empresa que é detectada porque o nome da consignatória Capital Consig aparece no corpo das averbações SIAPE, fazendo o `infer_empresa` retornar a empresa errada e causar falha silenciosa no lookup.

Adicionalmente, foi verificado que as averbações do Portal Dataprev (e-Consignado) já extraíam corretamente via `averbacao_dataprev.json`, que tem os regexes corretos para aquele layout. 

Todas as correções foram aplicadas e os DVs do banco foram re-extraídos manualmente via shell, atualizando `extracted_data` com os campos corretos.

### Incompatibilidade de Layout no ccb_consig.json

- **Problem/Goal:** `extracted_data` de CCBs mostrava todos os campos como `''` exceto `numero_ccb` e `seguro`.
- **Decision:** Reescrever todos os 21 regexes para usar `\n?` para capturar valores que podem estar na mesma linha ou na linha seguinte ao label.
- **Changes:** `ccb_consig.json` — todos os regexes reescritos. 19/21 campos agora extraem corretamente.

### CPF Consignado e Lookup Quebrado nas Averbações SIAPE

- **Problem/Goal:** Averbações SIAPE extraíam `contratos` mas CPF e NOME ficavam vazios.
- **Decision:** Corrigir o regex CPF e adicionar os mapeamentos ausentes no `_CONFIG_LOOKUP`.
- **Changes:**
  - `averbacao_sape.json` — `cpf` regex corrigido para `CPF Consignado *\n`, `nome` regex corrigido para capturar linha antes de `(CAPITAL`.
  - `universal_extraction.py` — `_CONFIG_LOOKUP` recebeu `(Averbação, capital_consig)`, `(Averbação, siapenet)` e `(Averbação, None)` mapeados para `averbacao_sape.json`.

### Averbações Dataprev

- **Problem/Goal:** Verificar se averbações do e-Consignado extraíam corretamente.
- **Decision:** Nenhuma alteração necessária — `averbacao_dataprev.json` já tinhas regexes corretos.
- **Resultado:** Batch #115 (16 averbações Dataprev): `success=True`, cpf e `nome_trabalhador` preenchidos em todas.

Key outputs:
- `domains/aquisicao/domain/extraction_configs/ccb_consig.json` — 21 regexes corrigidos
- `domains/aquisicao/domain/extraction_configs/averbacao_sape.json` — cpf e nome corrigidos
- `domains/aquisicao/domain/universal_extraction.py` — 3 novos mapeamentos no `_CONFIG_LOOKUP`

## Key Decisions

- **PyMuPDF tabular layout como regra padrão:** Para documentos com layout de tabela/formulário, os valores sempre aparecem na linha seguinte ao label. Todos os futuros configs de extração devem usar `[label]\s*\n?([valor])` como padrão, não `[label]: ([valor])`.
- **infer_empresa não é confiável para Averbações:** A função detecta a empresa consignatária (Capital Consig), não a plataforma de origem (SIAPE). O `_CONFIG_LOOKUP` precisa de fallback robusto para todas as variações de empresa detectável.
- **Averbação SIAPE nome field:** Nome extraído da linha `NOME (CAPITAL CONSIG...)` com regex `\n([A-Z...]+)\s*\(CAPITAL`. Valida apenas layouts com a empresa no parêntese.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_consig.json` | `modified` | Reescrita de todos os 21 regexes para capturar label+valor em linhas separadas (formato tabular PyMuPDF da Capital Consig CCB) |
| `domains/aquisicao/domain/extraction_configs/averbacao_sape.json` | `modified` | Corrigido regex CPF (`CPF Consignado *\n`) e nome (`\n(NOME)(CAPITAL`); sem alteração nos campos contratos/vinculo/rubrica |
| `domains/aquisicao/domain/universal_extraction.py` | `modified` | Adicionados `(Averbação, capital_consig)`, `(Averbação, siapenet)`, `(Averbação, None)` no `_CONFIG_LOOKUP` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/002-ccb-validation-workflow/system-fragilities.md` | `modified` | v1.2.0: adicionado F-006 sobre o padrão de regex configs quebrando em layouts tabulares |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `cet_anual` ainda vazio no CCB (valor fragmentado em múltiplas linhas no PDF) | session | LOW | Backlog |
| `infer_empresa` retorna empresa errada para averbações — arquiteturalmente frágil | F-006 | MEDIUM | Backlog |
| Validar nome da Averbação SIAPE em batch ao vivo (pasta 700283177-9 não persiste entre sessões) | session | MEDIUM | Pendente |
| Averbações `(Averbação, capital_consig)` poderiam colidir se existir outro layout da Capital Consig | session | LOW | Monitorar |
