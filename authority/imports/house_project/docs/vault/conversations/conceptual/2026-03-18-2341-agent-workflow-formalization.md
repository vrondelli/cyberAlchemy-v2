---
tags: [agents, vault, ontology, architecture]
node_type: conceptual
is_session: true
layer: [architecture, ontology]
nature: explanatory
status: active
created: 2026-03-18
timestamp: 2026-03-18T23:41:00-03:00
expires: 2026-05-17
conversation_id: a24970fc-5927-4cc6-8137-1196472e09cf
decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-18
expected_importance: 7
importance_rationale: "Formalized agent workflow system defining how AI agents interact with the vault and codebase."
---

# Agent Workflow Formalization — Exploração Inicial

**Date:** 2026-03-18 23:41 (UTC-3)
**Tags:** #agents #vault #ontology #architecture

## Summary

A sessão foi inteiramente exploratória — sem código e sem mudanças em documentos do vault. O objetivo foi começar a pensar mais formalmente no workflow de trabalho com agentes no projeto. O ponto de partida foi reconhecer que o projeto tem estruturas maduras (Constitutions, Vault ontológico, Skills e Workflows), mas que essas estruturas ainda não são usadas de forma sistemática para guiar os agentes.

### O que temos

O repositório conta com um sistema de governança bem construído: `project_constitutions/` com regras arquiteturais, `docs/vault/` com ontologia e taxonomia de domínio, `.claude/skills/` com guias de ferramentas, e `.agent/workflows/` com roteiros procedimentais (como o `/close-session`). O `AGENTS.md` e o `CLAUDE.md` existem como ponto de entrada dos agentes, mas são atualmente cópias do guia do GitNexus.

### A hipótese central

A questão que emergiu foi: **como aproveitar melhor a janela de contexto do LLM**. Carregar tudo (constitutions, vault, skills, etc.) em todas as sessões degrada a qualidade do raciocínio. A intuição é que o conteúdo útil no contexto depende do tipo de trabalho — documentação, planejamento, refatoração, debugging — e que o `AGENTS.md` poderia atuar como um roteador condicional, carregando subconjuntos distintos de documentação conforme a intenção da tarefa.

A ontologia aparece como elemento capaz de preencher lacunas quando o roteamento falhar — mas o quanto isso é real ainda não está testado.

### Dúvidas em aberto

- Onde está a linha entre restringir o contexto (foco) e dar autonomia exploratória ao agente quando a heurística falhar?
- A ontologia tem força semântica suficiente para guiar o agente mesmo sem as constitutions no contexto?
- Como o roteamento se comporta em tarefas que cruzam múltiplas camadas simultaneamente?
- O custo de validação humana que esse modelo exige é compatível com a velocidade de desenvolvimento necessária?

## Key Decisions

- Nenhuma decisão tomada. Sessão puramente exploratória.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `brain/a24970fc.../agent_workflow_strategy.md` | `created` | Rascunho de contexto e dúvidas sobre o workflow de agentes (artefato de sessão, não vault) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `questions` | Sessão levanta dúvidas sobre até onde a ontologia guia o agente em ausência de constitutions carregadas |
| [[constitution_developement_practices.md]] | `questions` | Levanta a questão de quando o agente realmente precisa dessas regras no contexto vs quando pode inferir |
