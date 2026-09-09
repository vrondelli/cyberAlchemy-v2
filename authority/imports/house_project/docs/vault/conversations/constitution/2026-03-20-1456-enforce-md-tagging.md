---
tags: [vault, agents, ontology]
node_type: constitution
is_session: true
layer: ontology
nature: procedural
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:56:12-03:00
expires: 2026-05-19
conversation_id: 82072049-16c4-4d3d-8cc0-d1ad2b75412e
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Established a global enforceable rule in AGENTS.md and CLAUDE.md mandating strict adherence to ontology-conventions.md frontmatter for all newly created markdown files by agents."
---

# Enforce Markdown Tagging Pattern

**Date:** 2026-03-20 14:56 (UTC-03:00)
**Tags:** #vault #agents #ontology

## Summary

The session was initiated by the user to establish a standardized tagging pattern for all newly created markdown (`.md`) files. The objective was to ensure that any autonomous agent (like Claude, Cursor, or Windsurf) automatically applies this standard without requiring explicit user instructions each time. 

We investigated the existing vault conventions, specifically `docs/vault/ontology-conventions.md`, which defines the rigorous classification system and required frontmatter for the project. To enforce this behavior globally, we updated the root-level agent instruction files (`AGENTS.md` and `CLAUDE.md`). A new mandatory rule was added to both files, explicitly instructing agents to prepend the complete YAML frontmatter schema to every new markdown file they create. This guarantees consistent metadata tracking and ontology adherence across the entire project moving forward.

### Establish Global MD Tagging Rule
- **Problem/Goal:** Autonomous agents were not consistently adding the correct metadata (frontmatter) to new markdown files, leading to untracked or misclassified vault nodes.
- **Decision:** It was decided to enforce the `ontology-conventions.md` frontmatter schema globally at the agent level by updating the system instruction files.
- **Changes:** Modified `AGENTS.md` and `CLAUDE.md` to include a strict, mandatory rule under the file creation section, providing the exact YAML template that must be used.

Key outputs:
- `AGENTS.md` — Updated with the mandatory frontmatter rule for `.md` file creation.
- `CLAUDE.md` — Updated with the mandatory frontmatter rule for `.md` file creation.

## Key Decisions

- **Global Agent Rules:** Agents must unconditionally prepend the standard YAML frontmatter from `docs/vault/ontology-conventions.md` to every globally created markdown file.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `AGENTS.md` | `modified` | Added the rule and template for markdown file creation. |
| `CLAUDE.md` | `modified` | Added the rule and template for markdown file creation. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology-conventions.md]] | `implements` | This session's rule implements the frontmatter standard defined in the conventions. |
