---
tags: [agents, workflows, ontology]
node_type: conceptual
is_session: true
layer: architecture
nature: procedural
status: active
created: 2026-03-19
timestamp: 2026-03-19T15:53:01-03:00
expires: 2026-05-18
conversation_id: f804b1f6-2348-4d7d-929a-3f668f656dea
#
expected_importance: 7
importance_rationale: "Established agent workflows as hints philosophy, resolving contradiction between imperative and graph-driven routing."
version: 0.1.0
last_updated: 2026-03-19
--- Structured fields for Bayesian consumption ---
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated: []
promoted_candidates: []
---

# Agent Workflows as Hints, Not Commands

**Date:** 2026-03-19 15:53 (UTC-03:00)
**Tags:** #agents #workflows #ontology

## Summary

This session started with the user asking to verify the broken links in `AGENTS.md`, specifically the references to non-existent workflow files for debugging, refactoring, and spec-writing. Initially, it was proposed to point these links directly to GitNexus skills, but we realized that would bypass the essential architectural context (`project_constitutions/`) and the domain graph (`docs/vault/`). Therefore, the missing files were created in `.agent/workflows/`. However, the initial implementation was too restrictive, giving the agent step-by-step imperative commands. The user clarified that the philosophy of the agent's context routing relies on the graph structure itself. Instead of dictating strict execution paths, workflows should act merely as *hints*, pointing the agent to look up the correct semantic neighborhood and allowing `derives-from` and `contradicts` edges to guide the reasoning dynamically. The files were consequently rewritten as conceptual guides.

### Verifying and Replacing Missing Workflows
- **Problem/Goal:** `AGENTS.md` pointed to `debugging.md`, `refactoring.md`, and `spec-writing.md` inside `.agent/workflows/`, which did not exist.
- **Decision:** Create the files to act as orchestrators instead of linking directly to GitNexus skills, making sure the agent consults `project_constitutions` and `docs/vault`.
- **Changes:** Created `.agent/workflows/debugging.md`, `.agent/workflows/refactoring.md`, and `.agent/workflows/spec-writing.md`.

### Changing Agent Mentality to Graph-Guided Hints
- **Problem/Goal:** The newly created workflows were too strict, behaving like imperative scripts. This broke the intended design pattern, which favors an organic traversal of the knowledge graph.
- **Decision:** Rewrite the orchestrating workflows to be pure *hints*. They must guide the intent and rely on the Vault and Constitutions structures to provide the constraints, rather than hardcoding steps.
- **Changes:** Completely rewrote the 3 files in `.agent/workflows/` to act as subtle signposts pointing the agent toward exploring the Domain (Vault) and Architecture (Constitutions) before safely modifying code using GitNexus.

### Origin of `docs/vault/agent-workflows/`
- **Problem/Goal:** User inquired about the creation history and purpose of `docs/vault/agent-workflows/`.
- **Decision:** Analyzed past conversation nodes via `grep_search` and explained the architectural split between executable `.agent/workflows/` and theoretical `docs/vault/agent-workflows/`.
- **Changes:** No code changes; provided an explanatory summary asserting the split was decided earlier today to separate agent execution scripts from agent systemic studies.

## Key Decisions

- **Architectural Checkpoint:** Ensure that agents always consult `project_constitutions/` before changing code.
- **Domain Checkpoint:** Ensure agents ground vocabulary in `docs/vault/` before writing specifications or implementing domain changes.
- **Organic Navigation:** Agent workflows must be structured as hints, avoiding restrictive commands. Trust the graph's connections (`derives-from`, `contradicts`, `updates`) to provide context organically.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `.agent/workflows/debugging.md` | `created` | Missing workflow recreated as a hint for resolving bugs. |
| `.agent/workflows/refactoring.md` | `created` | Missing workflow recreated as a hint for safe code modifications. |
| `.agent/workflows/spec-writing.md` | `created` | Missing workflow recreated as a hint for grounding terminology and architecture rules. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/agent-navigation.md]] | `updates` | Enforces the heuristics that the graph's edges should guide the agent instead of imperative workflow files. |
| [[vault/agent-workflows/informational-gravity-discovery.md]] | `validates` | Confirms the principle that the system should be structured around information gravity and organic discovery, not rigid scripts. |
