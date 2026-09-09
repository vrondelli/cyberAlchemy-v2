---
tags: [agents, workflows, ontology]
node_type: conceptual
is_session: true
layer: [architecture, ontology]
nature: [explanatory, procedural]
status: active
created: 2026-03-19
timestamp: 2026-03-19T15:10:00-03:00
expires: 2026-05-18
conversation_id: a451-7200abad913b
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [docs/vault/agent-workflows/informational-gravity-discovery.md]
expected_importance: 7
importance_rationale: "Designed informational gravity model for agent context routing, novel architecture concept for the vault."
version: 0.1.0
last_updated: 2026-03-19
---

# Context Routing and Informational Gravity Discovery

**Date:** 2026-03-19 15:10 (UTC-3)
**Tags:** #agents #workflows #ontology

## Summary

This session focused on analyzing the current state of agent context management within the project and proposing a more efficient approach. Initially, the goal was to evaluate existing exploratory artifacts regarding context routing to understand what practices to avoid (like "context stuffing" and prohibitive rules). Based on this analysis, a new Context Router was proposed and implemented directly into the `AGENTS.md` file, acting as an intent-based conditional guide for agents to load only necessary paths before acting.

Following this implementation, the project's folder structure for agent workflows was cleaned up. Loose architecture files were moved into `docs/vault/agent-workflows/` to centralize agent-related documentation, and a `backlog.md` was created to track future definitions and structural needs. Finally, the session expanded into a highly conceptual discovery phase concerning the "spacetime" and "gravitational" properties of information topology. An artifact was produced detailing an advanced theoretical model where Small Language Models (SLMs) could act as observer layers, tracking agent entropy to dynamically weigh and map document "gravity" for future RAG retrieval.

### Context Router Implementation
- **Problem/Goal:** Agents were loading too much context upfront, causing degradation in reasoning, or lacked sufficient guidance on what workflows to run for specific tasks.
- **Decision:** Implement a conditional "Context Router" in `AGENTS.md` based on task intention (e.g., debugging, refactoring, spec-writing) to guide agents to specific workflow files.
- **Changes:** Modified `AGENTS.md` to include a structured Context Router section above the GitNexus block.

### Folder Restructuring and Backlog
- **Problem/Goal:** Ambiguity in where agent artifacts should live, with files split between root `.agent/workflows`, `agent-workflows`, and the vault.
- **Decision:** Centralize non-executable agent workflow documentation under `docs/vault/agent-workflows/` while leaving executable steps in `.agent/workflows/`. Create a backlog to track upcoming metadata needs.
- **Changes:** Moved `knowledge-graph-topology.md` into `docs/vault/agent-workflows/` and created `docs/vault/agent-workflows/backlog.md`.

### Informational Gravity Concept
- **Problem/Goal:** How to naturally pull agents toward correct decisions using environment design rather than hard constraints.
- **Decision:** Document the hypothesis of "informational gravity" and "agent entropy" as a foundation for future dynamic retrieval mechanisms.
- **Changes:** Created `informational-gravity-discovery.md` exploring the use of SLMs as entropy observers to dynamically weigh graph RAG nodes.

Key outputs:
- `AGENTS.md` — Updated with foundational Context Router.
- `informational-gravity-discovery.md` — Conceptual foundation for dynamic context topology.

## Key Decisions

- **Context Routing:** Replaced the concept of broad contexts with an intent-based manual router in `AGENTS.md` to prevent context stuffing.
- **Vault Organization:** Consolidated agent workflow documentation into `docs/vault/agent-workflows/` to separate executable workflows from architectural studies.
- **Backlog Tracking:** Established a backlog specifically for agent workflow maturity and structural metadata.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `AGENTS.md` | `modified` | Injected intention-based Context Router before the auto-generated GitNexus block. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/agent-workflows/backlog.md` | `created` | Created to track pending metadata and workflow definition tasks. |
| `docs/vault/agent-workflows/informational-gravity-discovery.md` | `created` | Formulated the hypothesis of informational gravity and agent entropy observation. |
| `docs/vault/agent-workflows/knowledge-graph-topology.md` | `created` | Moved from root `agent-workflows/` to consolidate structural documents. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[AGENTS.md]] | `updates` | Formalized the agent entry point with conditional routing. |
| [[vault/agent-workflows/informational-gravity-discovery.md]] | `derives-from` | Expands on the need for better information topology conceptually. |
