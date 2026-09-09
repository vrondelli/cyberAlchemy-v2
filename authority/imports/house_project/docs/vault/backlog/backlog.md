---
tags: [agents, workflows, backlog]
node_type: backlog
layer: architecture
nature: operational
status: active
version: 0.2.0
last_updated: 2026-04-14
---

# Agent Workflows Backlog

Este documento concentra o backlog de pendências e evoluções relacionadas ao ecossistema de agentes (Context Routing, Workflows, e integração com o Vault).

## Pendências Atuais

- [ ] **Criar metadados para pastas**: Definir e documentar de forma clara os metadados e as propostas estruturais das pastas conforme a taxonomia do projeto for evoluindo. (Ex: O que exatamente caracteriza um workflow que deve ir para `.agent/workflows/` vs. specs de comportamento no Vault).
- [ ] **Implementar Context Router no `AGENTS.md`**: Aplicar o índice condicional no ponto de entrada do agente para carregar diferentes fluxos baseado na intenção.
- [ ] **Criar novos Workflows Específicos**:
  - `debugging.md`
  - `discovery-writing.md`
  - `refactoring.md`
- [ ] **Documentar os MCPs disponíveis para agentes**: Criar documento de referência listando todos os MCP servers configurados (`.mcp.json`), suas ferramentas, contratos de entrada/saída, e quando usar cada um. Hoje agentes descobrem MCPs por tentativa — falta um índice navegável. Particularmente urgente conforme `semantic-index` ganha novas tools (`context_menu`, `drift_check` — ver discovery em `specs/ontology/docs/context-routing/docs/documents-embeddings/`).

## Ideias e Descobertas Futuras

- **Graph-Dropping RAG**: Testar e validar mecanismos de retrieval dinâmico baseados no grafo de conhecimento do projeto em conjunto com o GitNexus, para depender menos de janelas inteiras na memória e apenas de contextos estruturais relevantes.

## Melhorias de Navegabilidade do Vault (feedback de agente, 2026-03-25)

Pontos levantados durante primeira travessia completa do grafo por agente externo:

- [ ] **Índice materializado de edges**: Criar um arquivo `graph-edges.md` (ou estrutura equivalente em banco) com tabela `source | target | edge_type` para permitir travessias sem necessidade de abrir cada arquivo individualmente. Hoje o agente precisa ler N documentos para descobrir as conexões.
- [ ] **Timestamps nos status de maturidade**: Registrar *quando* um documento transitou de status (ex: `active since: 2026-03-20`). Para um agente que precisa julgar se uma informação ainda é atual, a idade do status importa tanto quanto o status em si.
- [ ] **Extrato de decisões das Conversations**: Derivar um `decisions.md` (ou índice equivalente) a partir das sessions — apenas as decisões tomadas, sem a narrativa completa. Conversations é a zona de maior ruído do vault; minerar esse conteúdo em formato estruturado aumenta significativamente a relação sinal/ruído para agentes.
- [ ] **Limpeza da pasta Conversations**: Auditar e organizar os arquivos da pasta `conversations/` — arquivar ou remover sessions obsoletas, garantir que apenas sessions com valor de proveniência real permaneçam. A pasta cresceu sem curadoria e hoje tem mais de 100 arquivos sem índice.
- [ ] **`agent-navigation.md` para o Newspaper**: O newspaper tem muitos artefatos (manifestos, backlogs, newsletters, specs, evolution wall, system state, info-exchange) e a hierarquia entre eles não é tão imediata quanto a do vault. Um guia de navegação equivalente ao `agent-navigation.md` resolveria isso.

## Infraestrutura de Conhecimento (próximas evoluções)

- [ ] **Banco de dados para o grafo ontológico**: Persistir nodes e edges em banco (Neo4j, SQLite, ou similar) para queries estruturadas, travessias e análise de dependências sem depender de parsing de markdown.
- [ ] **RAG em grafo com embeddings (Google Gemini)**: Integrar embeddings semânticos aos nodes do vault para retrieval por similaridade, complementando a navegação estrutural com descoberta por proximidade conceitual.
- [ ] **Exploração divertida como métrica de design**: A experiência de navegação do agente deve ser tratada como first-class concern — se o grafo não é prazeroso de explorar, a arquitetura de informação precisa evoluir.
