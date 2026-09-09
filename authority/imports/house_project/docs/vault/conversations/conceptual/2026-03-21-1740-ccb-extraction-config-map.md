---
tags: [ccb, pipeline, acquisition]
node_type: conceptual
is_session: true
layer: domain
nature: [reference, explanatory]
status: active
created: 2026-03-21
timestamp: 2026-03-21T17:40:00-03:00
expires: 2026-05-20
conversation_id: 1c76ccde-4ecd-4f3f-97ea-db397e3317fb
decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 2
importance_rationale: "Mapeamento de referência sobre onde vivem os configs de extração CCB (JSON files vs banco), útil como lookup mas sem mudanças arquiteturais ou de lógica de negócio."
version: 0.1.0
last_updated: 2026-03-21
---

# CCB Extraction Config Map

**Date:** 2026-03-21 17:40 (UTC-3)
**Tags:** #ccb #pipeline #acquisition

## Summary

Sessão exploratória de referência para entender como o sistema organiza as configurações de extração regex para documentos CCB. O usuário perguntou onde ficam os configs de extração (globais e por `doc_type + empresa`), e depois onde ficam especificamente as extrações por template vs. as extrações genéricas do CCB.

O mapeamento revelou que existem **duas camadas** de extração: (1) por template visual (`DocumentTemplate.extraction_config` no banco de dados, preenchido pelo operador via frontend), com confiança `ALTA`; e (2) universal/genérica (`_CONFIG_LOOKUP` em `universal_extraction.py` apontando para JSONs em `extraction_configs/`), com confiança `MEDIA` ou `BAIXA`.

Para o CCB, o `ccb_cap.json` é o config ativo no lookup (`("CCB", None)` e `("CCB", "capital_consig")`). O `ccb_consig.json` existe mas **não está no `_CONFIG_LOOKUP`**, portanto não é acionado automaticamente — é um artefato legado. O usuário então reformatou o `ccb_consig.json` para alinhar sua estrutura com o `ccb_cap.json` (mesmos padrões modernos de regex, mesmos campos).

Por fim, o usuário pediu que campos do `ccb_consig` que não estivessem no `ccb_cap` fossem adicionados — mas a análise mostrou que `ccb_cap.json` já é um **superset completo** do `ccb_consig.json` em termos de campos (ccb_cap tem todos os campos do consig + mais ~15 campos extras como `email`, `setor`, `proposta`, `originador`, `tipo_conta`, `estado_civil`, `envelope_hash`, `documento_hash`, `multa_moratoria`, `numero_endereco`, `juros_moratorios`, `juros_atraso_mensal`, `entidade_conveniada`, `valor_total_financiado`).

### Mapeamento: onde ficam os configs

- **Problema/Goal:** Entender a topografia dos configs de extração regex.
- **Descoberta:** Dois locais distintos:
  - `domains/aquisicao/domain/extraction_configs/` — JSONs estáticos com `fields`, `field_types`, `critical_fields`
  - `DocumentTemplate.extraction_config` — JSON por template no banco (preenchido pelo operador)
- **Lookup:** `_CONFIG_LOOKUP` em `universal_extraction.py` mapeia `(doc_type, empresa)` → arquivo JSON

### Ordem de resolução no pipeline universal

```
(doc_type, empresa)  →  config específico por empresa
(doc_type, None)     →  config genérico (fallback)
None                 →  falha (returns None, False)
```

### Estado do ccb_consig.json

- **Problema:** `ccb_consig.json` existia com estrutura legada (patterns antigos, menos campos).
- **Decisão:** Usuário reformatou o arquivo para alinhar com o estilo moderno do `ccb_cap.json`.
- **Resultado:** `ccb_consig.json` agora tem a mesma estrutura, mas ainda **não está no `_CONFIG_LOOKUP`** — é um fallback não acionado automaticamente.

Key outputs:
- `domains/aquisicao/domain/extraction_configs/ccb_consig.json` — reformatado pelo usuário

## Key Decisions

- **Nenhuma decisão de arquitetura** foi tomada — sessão foi puramente de mapeamento e entendimento.
- `ccb_cap.json` é o config canônico para CCB universal; `ccb_consig.json` é legado e não está no lookup.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `domains/aquisicao/domain/extraction_configs/ccb_consig.json` | `modified` | Usuário reformatou para alinhar estrutura e patterns com o estilo do `ccb_cap.json` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `domains/aquisicao/domain/universal_extraction.py` | `contextualizes` | Contém o `_CONFIG_LOOKUP` que mapeia (doc_type, empresa) para arquivos JSON |
| `domains/aquisicao/domain/extraction_configs/ccb_cap.json` | `contextualizes` | Config canônico ativo para extração universal de CCB |
