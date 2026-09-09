---
tags: [vault, frontend, ontology]
node_type: spec
is_session: true
layer: [architecture, application]
nature: [technical, reference]
status: active
created: 2026-03-24
timestamp: 2026-03-24T22:11:45-03:00
expires: 2026-05-23
conversation_id: 6987e81d-71f1-4405-bcb3-df354e0f014e
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/newspaper/README_AESTHETICS.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Established the ideological foundations, four constitutional UX pillars (including absolute context focus), and the structural 3-column architecture (Gen 008) for the O Grafo Diário internal newspaper."
user_satisfaction: 9
user_satisfaction_min: 8
user_satisfaction_max: 10
user_satisfaction_std: 0.5
---

# Evolução Genética e Constituição Estética do Grafo Diário

**Date:** 2026-03-24 22:11 (UTC-3)
**Tags:** #vault #frontend #ontology

## Summary

Esta sessão foi dedicada à definição arquitetural, estrutural e estética da interface do **O Grafo Diário** (o jornal interno gerado pelo cofre). Utilizando uma abordagem de "Máquina de Gödel", a sessão iterou rapidamente através de oito "gerações" de mockups HTML puros, guiados por *fitness scores* do usuário. 

A exploração começou buscando uma estética "Amazonian Solarpunk / Retofuturista Brasileira" e evoluiu para resolver o problema central de usabilidade de jornais de conhecimento: **a perda de contexto durante a leitura profunda**. O resultado das iterações foi a consolidação da **Arquitetura Gen 008**, um layout estrutural de três colunas (Índice Esquerda, Leitura Central, Meta/Diagnósticos Direita) que permite a troca de contexto instantânea sem recarregar a página e sem perder a visão do Grafo Global. 

Os princípios ideológicos (como "Gritar a Intenção", "Extinção da Rolagem Infinita" e "Foco no Contexto") foram formalmente cristalizados em uma Constituição (`README_AESTHETICS.md`).

### A Máquina Evolutiva (Gen 000 a 008)
- **Problem/Goal:** O jornal interno precisava de uma cara que não fosse um simples feed cronológico. Precisava refletir densidade epistêmica, ter tons que remetem à temática Solarpunk brasileira, e ser cristalino na visualização.
- **Decision:** Adotar um modelo genético. Testamos layouts narrativos de uma única coluna (Gen 001-003), testamos Huds Cyberpunks intrusivos (Gen 006, reprovado), e iteramos a navegabilidade para um formato "Reader / Split-pane" (Gen 007).
- **Changes:** Refinamos a base do Gen 007 para criar o **Gen 008**, a "Semente Ômega". O Gen 008 traz o Menu Genético Oculto, um Ranker de Fitness numérico para calibragem fina (0 a 10), Contextual Tooltips obrigatórias, um Leitor Central, e abas laterais para os Diagnósticos do Cofre e a Árvore Genealógica (Lore) da própria interface.

### O Mandamento do "Contexto Absoluto"
- **Problem/Goal:** A leitura de um nó de conhecimento do vault frequentemente leva à alienação da posição original desse conhecimento dentro da teia.
- **Decision:** Ficou estipulado na constituição (`README_AESTHETICS.md`) que nenhuma informação será lida fora de contexto. Toda "notícia" deve apresentar um mergulho no grafo vivo. 
- **Changes:** Adicionado o botão funcional e nativo `[ ↘ ENTER THE GRAPH ]` na renderização das notícias no Gen 008.

### Limpeza e Conservação Arquivística
- **Problem/Goal:** A rápida iteração de mockups poluiu a pasta `specs/newspaper/evolution/`.
- **Decision:** Manter o *foreground* (diretório raiz da funcionalidade) limpo, guardando apenas o que sobreviveu à seleção natural (Gen 005 como exploração alternativa e Gen 008 como candidata padrão). 
- **Changes:** Criação da estrutura `.archive/` e migração mecânica e seletiva de todas as "gerações fósseis" para esconderijos orgânicos. A catalogação das mutações foi transferida e documentada na seção *Catálogo Genético* do `README_AESTHETICS.md`.

## Key Decisions

- **Arquitetura UI:** Estabelecimento definitivo do modelo App Split-Pane/3-Colunas (*Gen 008 Solarpunk*) abandonando feeds tradicionais de notícia roláveis.
- **Constituição Estética:** Formalizadas 4 leis pétreas no projeto (Contexto Absoluto, Fim da Rolagem, Gritar Intenção, Evolução Rápida).
- **Governança de Assets Temporários:** Arquiteturas obsoletas de protótipos devem ser sepultadas em `/.archive` para manter `specs/` imaculado, preservando o código para extrações genéticas futuras se necessário.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/newspaper/evolution/gen_008_solarpunk_complete.html` | `modified` | Aperfeiçoado com ranker de notas numérico e funcionalidade de mergulho "Enter the Graph", finalizando a fundação de layout. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/newspaper/README_AESTHETICS.md` | `created` | Escrita do manifesto constitucional e catálogo da mutação do Grafo Diário. |
| `specs/newspaper/evolution/README-evolution.md` | `deleted` | Movido para `.archive`, unificado com o README_AESTHETICS.md |
| `specs/newspaper/mockups/*.html` | `deleted` | Todas ancestrais e estudos (Gen 001, 002, 003, mockups a-e) varridos para subdiretórios furtivos (`.archive/`). |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Motor Python Gerador de HTML Estático | Gen 008 | ⚠️ HIGH | Next Step |
| Renderização das Notícias Locais (Extração de LLM para popular JS) | Gen 008 | MEDIUM | Backlog |
