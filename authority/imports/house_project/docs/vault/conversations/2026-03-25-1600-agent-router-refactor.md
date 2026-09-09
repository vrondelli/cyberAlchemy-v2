---
tags: [vault, agents, ontology]
node_type: constitution
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-03-25
timestamp: 2026-03-25T16:00:00-03:00
expires: 2026-05-24
conversation_id: agent-router-refactor-2026-03-25
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: [CLAUDE.md, AGENTS.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "CLAUDE.md/AGENTS.md foram reestruturados para serem mais enxutos e precisos, consolidando as constitutions em docs/vault/constitution/ e extraindo o bloco GitNexus para um workflow dedicado — afetando o comportamento de todo agente futuro neste projeto."
version: 0.1.0
last_updated: 2026-03-25
---

# Agent Context Router — Refatoração e Consolidação

**Date:** 2026-03-25 16:00 (UTC-3)
**Tags:** #vault #agents #ontology

## Summary

Esta sessão focou em melhorar o `CLAUDE.md` e o `AGENTS.md`, que servem como o roteador de contexto central para todos os agentes no projeto. A inspeção revelou que os dois arquivos eram idênticos (AGENTS.md já era cópia exata do CLAUDE.md), que o bloco GitNexus de ~100 linhas era carregado desnecessariamente em toda sessão, que referências a arquivos inexistentes existiam no router, e que as constitutions estavam duplicadas em dois locais diferentes (`project_constitutions/` e `docs/vault/constitution/`). Todas essas inconsistências foram resolvidas. O router foi reescrito para ser enxuto (~50 linhas vs ~138 anteriores), com carregamento lazy do GitNexus. Os arquivos obsoletos foram deletados. O `AGENTS.md` foi sincronizado com o `CLAUDE.md` atualizado.

### CLAUDE.md vs AGENTS.md eram idênticos

- **Problem/Goal:** Verificar se os dois arquivos estavam em sincronia.
- **Decision:** Confirmar que eram byte-a-byte idênticos — nenhuma divergência a resolver.
- **Changes:** Sincronização mantida explicitamente via `cp` ao final de cada edição.

### GitNexus block extraído para workflow dedicado

- **Problem/Goal:** O bloco `<!-- gitnexus:start -->` de ~100 linhas era carregado em toda sessão, mesmo as que não envolvem código.
- **Decision:** Mover para `.agent/workflows/gitnexus.md` e referenciar só nos itens 2 (Debugging) e 4 (Refactoring) do router.
- **Changes:** Criado `.agent/workflows/gitnexus.md`; bloco removido do CLAUDE.md.

### Referências inválidas corrigidas

- **Problem/Goal:** `project_constitutions/constitution_developement_practices.md` referenciado no router não existia; havia um typo ("developement").
- **Decision:** Referenciar `docs/vault/constitution/` que já existia com os 3 arquivos corretos, nomeados por responsabilidade.
- **Changes:** Router atualizado com paths reais e nomes explícitos dos 3 arquivos de constitution.

### Constitutions consolidadas em docs/vault/constitution/

- **Problem/Goal:** `constitution.md` na raiz ("Easy MDA Constitution") e `project_constitutions/` com arquivos vazios/obsoletos existiam paralelamente ao vault.
- **Decision:** Deletar ambos; `docs/vault/constitution/` é a localização canônica.
- **Changes:** `constitution.md` deletado, `project_constitutions/` deletado.

### Melhorias estruturais ao router

- **Problem/Goal:** Router sem item de início de sessão, sem fallback para tarefas ambíguas, com qualificadores `(if it exists)` desnecessários.
- **Decision:** Adicionar item 0 (checar MEMORY.md), item 9 (fallback: pedir esclarecimento), remover qualificadores pois todos os workflows existem, marcar item 8 (Newspaper) como "skip para sessões normais".
- **Changes:** Router reescrito com 9 itens numerados, estrutura mais clara.

Key outputs:
- `CLAUDE.md` — reescrito (~50 linhas, estrutura mais clara)
- `AGENTS.md` — sincronizado com CLAUDE.md
- `.agent/workflows/gitnexus.md` — criado com o bloco GitNexus completo

## Key Decisions

- **Localização canônica das constitutions:** `docs/vault/constitution/` — outros locais são obsoletos e devem ser deletados.
- **GitNexus é carregamento lazy:** só referenciado nos itens de router onde é relevante (debugging e refactoring).
- **AGENTS.md é espelho de CLAUDE.md:** deve ser sincronizado manualmente via `cp` após cada edição ao CLAUDE.md.
- **Item 0 obrigatório:** todo agente deve checar MEMORY.md no início de cada sessão.

## Files Changed

### Code

*(nenhum arquivo de código alterado)*

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `CLAUDE.md` | `modified` | Router reescrito: mais enxuto, sem GitNexus inline, paths corretos, item 0 e item 9 adicionados |
| `AGENTS.md` | `modified` | Sincronizado com CLAUDE.md |
| `.agent/workflows/gitnexus.md` | `created` | GitNexus reference extraído do CLAUDE.md |
| `constitution.md` | `deleted` | Obsoleto; conteúdo canônico em docs/vault/constitution/ |
| `project_constitutions/` | `deleted` | Diretório obsoleto; arquivos já migrados para docs/vault/constitution/ |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Verificar se algum workflow referencia `project_constitutions/` ou `constitution.md` e atualizar | Esta sessão | LOW | open |

## Open Questions

*(nenhuma questão aberta)*

## Connections

- `modifies` → `docs/vault/constitution/development-practices-constitution.md` (agora referenciada corretamente no router)
- `modifies` → `docs/vault/constitution/folder-structure-constitution.md`
- `modifies` → `docs/vault/constitution/event-system-constitution.md`
- `modifies` → `docs/vault/ontology-conventions.md` (router agora instrui agentes a seguir suas regras de frontmatter)
