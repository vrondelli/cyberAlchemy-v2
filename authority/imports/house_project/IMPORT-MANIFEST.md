---
tags: [cyberalchemy-v2, source-import, house-project-vault, knowledge-system, promotion-guardrail]
node_type: source-manifest
is_session: false
layer: knowledge-governance
nature: reference
status: active
created: 2026-06-21
dispatch_id: 2026-06-21-house-project-vault-import
sources: [/home/vrondelli/projects/house_project/docs/vault/]
---

# House Project Vault Import Manifest

## Snapshot

- Original source root: `/home/vrondelli/projects/house_project/docs/vault/`
- Imported source root: `cyberAlchemy-v2/authority/imports/house_project/docs/vault/`
- Import command class: local `rsync` snapshot, source read-only, with
  publish-safety exclusion for local `.obsidian/` app and plugin state.
- Files retained: 529.
- Size retained: 4.5M.
- Files excluded before parent publish: 21 `.obsidian/` local app/plugin config
  files.
- Source repository: `/home/vrondelli/projects/house_project`
- Source commit: `777c9b4b60e99e192986207bf0d75f53707ccb4b`
- Source commit date: `2026-06-08T10:17:03-03:00`
- Source commit subject: `chore(claude): install Arcanum skill packages + retire legacy command surface`
- Source dirty state for `docs/vault/`: no dirty tracked or untracked changes
  reported at import time.

## Top-Level Cohorts

| Cohort | File count | Import note |
| --- | ---: | --- |
| `conversations/` | 474 | Provenance/session corpus. Use indexes first. |
| `constitution/` | 14 | Governance rules, including framework constitutions. |
| `premise/` | 5 | Working bets and falsification-oriented premises. |
| `axiom/` | 4 | Foundational commitments for ontology, system, business, frontend. |
| `conceptual/` | 4 | Context and explanatory foundations. |
| `backlog/` | 4 | Open work and unresolved gaps. |
| Root indexes and dictionaries | 12 | Navigation, graph edges, session index, dictionaries, confidence levels. |

## Excluded Local App State

The source vault's `.obsidian/` directory was excluded from the publishable
CyberAlchemy v2 import because plugin settings can contain local credentials and
machine-specific state. The knowledge-bearing vault files remain imported; the
excluded Obsidian app/plugin files are not CAV2 source evidence.

## High-Signal Selectors

- `docs/vault/agent-navigation.md`: agent traversal, trust hierarchy,
  constitution-first search, sessions-as-provenance rules.
- `docs/vault/ontology-conventions.md`: frontmatter grammar, classification
  dimensions, orthogonality principle, edge catalog, confidence axes.
- `docs/vault/axiom/ontology-axioms.md`: retrieval entropy, orthogonal labels,
  unique-node rule, explicit-knowledge rule, questions-as-information,
  graph-navigation axiom family.
- `docs/vault/premise/ontology-premises.md`: label sufficiency, status
  hierarchy, confidence axes, session classification, frontmatter as source of
  truth, density-over-granularity, adaptive classification.
- `docs/vault/ontology-architecture-draft.md`: event-sourced knowledge graph
  lifecycle, vault agents, trust gates, storage ledger, graph-dropping RAG.
- `docs/vault/constitution/framework/`: schema amendment, frontmatter owner,
  edge acyclicity, runtime witness, bet ledger, discovery structure, and vault
  folder rules.
- `docs/vault/graph-edges.md` and `docs/vault/graph-session-index.md`: fast
  graph traversal and provenance lookup without opening every session.

## Boundary

This import is a source snapshot. It is not a canonical CyberAlchemy v2
definition, constitution, axiom, discipline, ontology node, or schema by itself.
Downstream owners must re-author accepted material into their own governed
surfaces and preserve this import as provenance.
