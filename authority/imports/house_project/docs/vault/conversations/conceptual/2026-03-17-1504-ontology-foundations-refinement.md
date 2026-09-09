---
tags: [ontology, vault, agents, meta]
node_type: conceptual
layer: ontology
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T15:04:00-03:00
expires: 2026-05-16
conversation_id: c538fade-8594-446a-ae24-415cd7226366
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - docs/vault/conventions.md
  - specs/ontology/data-foundations/discovery-data-foundations.md
  - .agent/workflows/close-session.md
promoted_candidates:
  - specs/ontology/day-0-strategy.md
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 8
importance_rationale: "Refined ontology foundations including classification axioms, shaping all future vault node creation."
---

# Ontology Foundations Refinement

**Date:** 2026-03-17 15:04 (UTC-3)
**Tags:** #ontology #vault #agents #meta

## Summary

This session was a structured review and refinement of the ontology architecture design from the previous session. The previous session had produced a high-level architecture diagram and discovery documents for trust gates, event sourcing, agent roles, and data foundations. This session critically reviewed those outputs, identified concrete gaps, and moved from conceptual intent to implementable design decisions.

The key shift was moving from vague "recommendations" to concrete **schema definitions** — specifically for the frontmatter model that governs every vault node, the SQL schema for the graph index tables, and the structured output of the `close-session` workflow. The session also resolved two recurring design tensions: (1) where bidirectionality of edges lives (SQL layer, not Markdown), and (2) whether `close-session` is a Bayesian trigger (it is not — it is a data producer).

The conversation also addressed the scope of Day 0 work: agents are out of scope for now. The focus is on getting clean, well-labeled data into the vault so that agents, when eventually built, have reliable inputs to operate on.

### Reviewing the Previous Session's Gaps

- **Problem/Goal:** The previous conversation had left several gaps: missing `node_type` field, bidirectionality question unanswered, no concrete SQL schema, `close-session` coupling to Bayesian undefined.
- **Decision:** Address all gaps, but scope the conversation to *foundations only* — agent specification is premature.
- **Changes:** Produced a structured analysis of 7 gaps, each resolved or consciously deferred.

### Introducing `node_type` to the Frontmatter Schema

- **Problem/Goal:** Tags were doing double duty — encoding both epistemic role (`#axiom`, `#premise`) and topic (`#fidc`, `#event-system`). This made filtering unreliable.
- **Decision:** Introduce a dedicated `node_type` field to `conventions.md`. Epistemic role moves entirely into `node_type`. Tags become purely topical. The missing `spec` node type for "documents that describe how the system behaves" was added.
- **Changes:** `conventions.md` updated with `node_type` catalog including `axiom | premise | constitution | spec | conceptual | business | session`. The distinction between `spec` (behavioral description, can drift) and `constitution` (enforceable rule, can only be superseded) was recorded.

### Edge Directionality — Markdown vs. SQL

- **Problem/Goal:** Should edges be declared bidirectionally in Markdown to make agent queries easier?
- **Decision:** No. Markdown edges remain single-directional (child → parent / dependent → dependency) to preserve DRY and prevent drift. Bidirectionality is handled at the SQL layer: `sync_vault_node()` auto-generates inverse rows in `ontology_edges` with `is_inverse=TRUE`.
- **Changes:** `conventions.md` updated with a "Directionality Principle" section. `discovery-data-foundations.md` updated with the `ontology_edges` schema and the `is_inverse` column explanation.

### SQL Schema for `ontology_nodes` and `ontology_edges`

- **Problem/Goal:** The data-foundations document lacked concrete schemas for the graph index tables.
- **Decision:** Tables are a materialized index of the Markdown graph, not an independent store. The single write path is `sync_vault_node(path)`.
- **Changes:** `discovery-data-foundations.md` Phase 2 replaced with full SQL schemas for both tables, including `node_type`, `expires` (TTL for sessions), `embedding` (pgvector), and `is_inverse`. The 6-step update sequence for `sync_vault_node()` documented.

### `close-session` — Data Producer, Not Trigger

- **Problem/Goal:** Clarify whether the close-session workflow should trigger the Bayesian agent.
- **Decision:** It should not. `close-session` is a data producer. The Bayesian is a periodic consumer. Tight coupling would cause the Bayesian to run on every session even when nothing foundational changed.
- **Changes:** `close-session.md` updated in both `.agent/workflows/` and global. Added Step 4 (epistemic impact assessment) and structured frontmatter fields (`decisions_made`, `contradictions_found`, `contradictions_resolved`, `specs_updated`, `promoted_candidates`) for machine-readable Bayesian input.

## Key Decisions

- **`node_type` field:** Added to `conventions.md` frontmatter schema. Tags are now purely topical.
- **`spec` node type:** A new type for behavioral descriptions of the system. Distinct from `constitution`.
- **Edge directionality:** Single direction in Markdown, bidirectional in SQL via `is_inverse` rows.
- **`ontology_nodes` / `ontology_edges`:** These tables are a materialized index (cache), not a second source of truth. Updated exclusively via `sync_vault_node()`.
- **`close-session` coupling:** Session nodes are data inputs for the Bayesian, not triggers. Bayesian runs on a schedule.
- **Agent scope:** Agents remain out of scope for Day 0. The goal is clean, well-labeled data in the vault.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/conventions.md` | `modified` | Added `node_type` field and catalog, cleaned tag system (topical only), expanded edge directionality section |
| `specs/ontology/data-foundations/discovery-data-foundations.md` | `modified` | Phase 2 replaced with concrete SQL schemas for `ontology_nodes` and `ontology_edges` |
| `.agent/workflows/close-session.md` | `modified` | Added Step 4 (epistemic impact assessment), added structured Bayesian-ready frontmatter fields |
| `.gemini/antigravity/global_workflows/close-session.md` | `modified` | Synced with project close-session workflow |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Add `node_type` to frontmatter of all existing vault nodes | This session | MEDIUM | Open |
| Build `sync_vault_node()` helper | This session | HIGH | Open — next step after data layer is settled |
| Define Bayesian promotion rules explicitly (thresholds, triggers) | Previous session gap | MEDIUM | Open |
| Day 0 backfill script for existing vault nodes | Previous session gap | HIGH | Deferred — after foundations are locked |

## Open Questions

- Should `conventions.md` be formally elevated to a constitution (`node_type: constitution`, `status: consolidated`) given it now defines mandatory schema rules?
- What are the exact promotion thresholds for the Bayesian (days survived, citation count, contradiction absence)?

## Connections

| Document | Type | Description |
|----------|------|----------------|
| [[vault/conventions.md]] | `updates` | Frontmatter schema extended with `node_type` field and tag system refactored |
| [[ontology/data-foundations/discovery-data-foundations.md]] | `updates` | Phase 2 replaced with concrete SQL schemas |
| [[ontology/day-0-strategy.md]] | `validates` | Decisions made here are consistent with and reinforce the Day 0 strategy |
| [[vault/ontology-architecture-draft.md]] | `contextualizes` | High-level architecture diagram; this session provides implementation depth |
