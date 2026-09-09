---
tags: [vault, ontology, agents]
node_type: conceptual
is_session: true
layer: ontology
nature: reference
status: active
created: 2026-03-19
timestamp: 2026-03-19T11:46:00-03:00
expires: 2026-05-18
conversation_id: 5e85d3e4-9519-48fc-855b-313d5d4b0bb1
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-19
expected_importance: 7
importance_rationale: "Audited all vault tags and fixed canonical docs, establishing tagging quality baseline for the entire vault."
---

# Vault Tagging Audit & Canonical Docs Fix

**Date:** 2026-03-19 11:07 (UTC-3)
**Tags:** #vault #ontology #agents

## Summary

This session performed a full frontmatter audit of all 127 markdown documents in `/docs/vault`, identifying zero documents with correct tagging. Three dominant problem patterns were identified: (1) old conversations using the deprecated `layer: session` / `node_type: session` schema; (2) recent conversations missing `version` and `last_updated`; and (3) canonical documents (constitutions, axioms, premises, navigation guides) with missing or zero frontmatter. All 107 conversation files and 19 canonical documents were corrected via automated scripts.

A key architectural decision was also formalized: **schema/meta documents** (`agent-navigation`, `confidence-levels`, `human-navigation`, `ontology-constitution`, `ontology-conventions`, `ontology-architecture-draft`, `dictionary`) are defined as existing **outside the knowledge graph** and should never have `## Connections` edges. `ontology-axioms.md` and `ontology-premises.md`, by contrast, are content nodes and may have connections.

The `/close-session` workflow was also created as a formal `agent-workflows/` file.

## Key Decisions

- **Schema docs are outside the graph:** `agent-navigation`, `confidence-levels`, `human-navigation`, `ontology-constitution`, `ontology-conventions`, `dictionary`, and `ontology-architecture-draft` must never declare `## Connections` edges. Their purpose is to define the graph's rules, not to participate as nodes.
- **`ontology-axioms` and `ontology-premises` are content nodes:** They make claims about the ontology system and may have typed edges to other nodes.
- **`is_session` is now the canonical flag for conversation records**, not `layer: session` or `node_type: session` — both deprecated values.
- **`copilot/` file is noise:** The file `copilot/copilot-conversations/why_do_we_have_an_event_system_foundations_and_constitution@20260310_140138.md` is an auto-exported Obsidian Copilot conversation consisting mostly of API errors. Contains no orthogonal information — decision left to user (migrate or delete).

## Files Changed

### Code

None.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conversations/*.md` (107 files) | `corrected` | Fixed `layer`, `node_type`, `is_session`, `version`, `last_updated`; removed `session` from tags |
| `docs/vault/agent-navigation.md` | `corrected` | Full frontmatter added |
| `docs/vault/confidence-levels.md` | `corrected` | Full frontmatter added (`node_type: constitution`) |
| `docs/vault/human-navigation.md` | `corrected` | Full frontmatter added |
| `docs/vault/ontology-constitution.md` | `corrected` | Full frontmatter added |
| `docs/vault/ontology-conventions.md` | `corrected` | Full frontmatter added (`version: 1.0.0`) |
| `docs/vault/ontology-architecture-draft.md` | `corrected` | Added `node_type`, `is_session`, `version`, `last_updated` |
| `docs/vault/architecture/*.md` (3 files) | `corrected` | Added `tags`, `node_type: constitution`, `is_session: false` |
| `docs/vault/market/*.md` (2 files) | `corrected` | Added `tags`, `node_type`, `is_session: false` |
| `docs/vault/concepts/event-system-foundations.md` | `corrected` | Added `tags`, `node_type: conceptual`, `is_session: false` |
| `docs/vault/dictionary-business.md` | `corrected` | Added `node_type: conceptual`, `is_session: false` |
| `docs/vault/premises/*.md` (4 files) | `corrected` | Added `tags`, `node_type: axiom/premise`, `is_session: false` |
| `docs/vault/ontology-axioms.md` | `corrected` | Added `is_session: false` |
| `docs/vault/ontology-premises.md` | `corrected` | Added `is_session: false` |
| `agent-workflows/close-session.md` | `created` | Formal workflow for closing sessions and creating vault conversation nodes |

## Open Questions

- **`copilot/` file:** Delete or migrate to standard conversation format? File has zero orthogonal value but includes a marginally useful "potential flaws" list that could be extracted into `event-system-constitution.md` as an `## Open Questions` entry.
- **`dictionary-business.md` tags format:** Uses multi-line YAML block (`- vault`, `- dictionary`) instead of inline `[vault, dictionary]`. Should it be normalized to inline format to match all other files?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `docs/vault/ontology-conventions.md` | `derives-from` | Audit criteria were derived from the required frontmatter schema defined in conventions |
| `docs/vault/ontology-axioms.md` | `validates` | Correcting all files to follow the conventions validates the ontology axiom about orthogonal labeling |
