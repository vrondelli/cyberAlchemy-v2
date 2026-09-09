---
tags: [ccb, pipeline, extraction]
node_type: implementation-plan
is_session: true
layer: [domain, application]
nature: [procedural, explanatory]
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:24:12-03:00
expires: 2026-05-19
conversation_id: 11b9d737-280e-48a8-ab85-b32ec95515f0
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: true
specs_updated: ["specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md"]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Elaborado plano de execução estruturado para implementar o Rastreio de Nível de Confiança da extração universal (Componente 4.5 pendente) na DocumentVersion."
---

# Planejamento do Rastreio de Nível de Confiança (Extraction)

**Date:** 2026-03-20 14:24 (UTC-3)
**Tags:** #ccb #pipeline #extraction

## Summary

Esta sessão foi focada em revisar o status da implementação do plano "Empresa Geradora + Universal Extraction" (`specs/002-ccb-validation-workflow/empresa-geradora-implementation-plan.md`). Identificamos que a funcionalidade principal havia sido implementada, mas percebemos uma lacuna: a falta de rastreio explícito de qual método extraiu os dados. Ao cruzar com a especificação original, confirmamos que esse rastreio já estava previsto sob o Componente 4.5 (Pendente), nomeado como `extraction_confidence`.

Um plano de implementação atualizado foi redigido no ambiente do agente com os passos exatos para executar essa pendência, preparando a adição do Choice `ExtractionConfidence` no model `DocumentVersion` e o seu subsequente preenchimento transversal pelo log do OCR.

### Auditoria do Plano Original
- **Problem/Goal:** O usuário questionou o que faltava implementar do plano original e questionou a ausência de uma coluna para salvar qual método extraiu os dados (template vs regex universal).
- **Decision:** Evitar a criação de uma coluna ad-hoc em string livre e, em vez disso, resgatar a diretriz oficial (Componente 4.5) que define o campo como `extraction_confidence` usando niveis ordinais (ALTA, MEDIA, BAIXA, NENHUMA).
- **Changes:** O agente rascunhou um Implementation Plan de execução para a próxima sessão para inserir os choices no Django Model e alimentar no `process_bulk_import.py`.

Key outputs:
- Agente redigiu o `implementation_plan.md` no brain contendo a estratégia de execução do Componente 4.5 da extração universal.

## Key Decisions

- **Taxonomia de rastreio:** Fazer enforce do uso do `ExtractionConfidence(models.TextChoices)` no model `DocumentVersion` ao invés de simples strings indicativas de fluxo, mantendo 100% de aderência à arquitetura declarada no spec de CCB original.

## Files Changed

Nenhum arquivo de código foi mutado nesta sessão. 

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/2026-03-20-1424-extraction-confidence-plan.md` | `created` | Nó gerado via close-session. |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Implementação do Componente 4.5 (Extraction Confidence) | `empresa-geradora-implementation-plan.md` | ⚠️ HIGH | Pending Execution |
