---
tags: [agents, vault, context-router, superpowers, skills, ontology]
node_type: audit
is_session: true
layer: [ontology, architecture]
nature: [procedural, explanatory]
status: active
created: 2026-03-27
timestamp: 2026-03-27T22:00:00-03:00
expires: 2026-05-26
conversation_id:
decisions_made: true
contradictions_found: true
contradictions_resolved: true
specs_updated:
  - CLAUDE.md
  - ~/.claude/settings.json
  - ~/.claude/projects/.../memory/feedback_no_superpowers.md
  - ~/.claude/projects/.../memory/MEMORY.md
promoted_candidates:
  - "Vault validation system (schema enforcement + link integrity + orphan detection) — candidate for implementation-plan node"
expected_importance: 7
importance_rationale: "Resolved a live architectural contradiction — two systems routing context simultaneously — by designating CLAUDE.md as the sole authoritative router and removing the conflicting SessionStart hook."
---

# Agent Router Audit and Superpowers SessionStart Removal

**Date:** 2026-03-27 22:00 (UTC-3)
**Tags:** #agents #vault #context-router #superpowers #skills #ontology

## Summary

This session audited the agent guidance architecture of the project, specifically the relationship between the superpowers skill system and the CLAUDE.md context router.

The central finding was a live contradiction: both systems were acting as context routers simultaneously. The superpowers SessionStart hook (in `~/.claude/settings.json`) auto-loaded the `using-superpowers` skill at every session start, which itself loaded context and framed agent behavior — directly in conflict with CLAUDE.md's explicit philosophy of loading only what is relevant to the current objective.

**Decision:** CLAUDE.md is the authoritative router. The SessionStart hook was removed from `~/.claude/settings.json`. The superpowers system remains available on demand but is no longer injected automatically.

### CLAUDE.md router audit

With the superpowers conflict resolved, CLAUDE.md was audited for coverage gaps. Two workflow routes were missing:

- **Route 8 — Backlog pattern:** No guidance existed for creating or updating `node_type: backlog` files in `docs/vault/backlog/`. Added route pointing to `.agent/workflows/backlog-pattern.md`.
- **Route 9 — README pattern (specs):** No guidance existed for creating or updating READMEs inside `/specs/`. Added route pointing to `.agent/workflows/readme-pattern.md`, with the constraint that READMEs are navigation-only.

The old ambiguous-task route (previously route 8) was renumbered to route 10.

### Vault index idea — deferred

A vault index (a generated markdown file grouping vault nodes by `node_type` and `status`) was explored as a navigational aid. Deferred. The prerequisite is a vault validation system that enforces schema correctness, link integrity, status honesty, and orphan detection — the index would be untrustworthy without it. The validation system should be implemented as a PostToolUse hook on `.md` writes.

## Epistemic Impact

- **Contradicts → [agent-navigation.md](../agent-navigation.md) (implicitly):** Heuristic 1 says "start at the Constitutions" and CLAUDE.md functions as the routing constitution for agent behavior. The pre-existing SessionStart hook violated this by inserting an additional routing layer that bypassed CLAUDE.md's conditional loading principle. The contradiction is now resolved.
- **Validates → CLAUDE.md as authoritative constitution:** The decision to designate CLAUDE.md as the sole router confirms that routing is a governance concern and should live in a single, version-controlled, project-level file — not in a shell settings hook.
- **Gaps surfaced:** The absence of routes 8 and 9 was a spec-drift — the backlog and readme patterns existed as workflows (`.agent/workflows/`) but were not reachable through CLAUDE.md. Fixed.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `CLAUDE.md` | modified | Added routes 8 (backlog-pattern) and 9 (readme-pattern); renumbered old route 8 to 10 |
| `~/.claude/settings.json` | modified | Removed SessionStart hook that auto-loaded using-superpowers, eliminating the dual-router contradiction |
| `~/.claude/projects/.../memory/feedback_no_superpowers.md` | created | Feedback memory recording the decision: superpowers must not be auto-injected at session start |
| `~/.claude/projects/.../memory/MEMORY.md` | modified | Added pointer to new feedback memory |

## Connections

- `contradicts` (resolved) → [agent-navigation.md](../agent-navigation.md) — the SessionStart hook violated the single-router principle; now resolved
- `contextualizes` → `CLAUDE.md` — this session is the provenance record for routes 8, 9, and the renumbering to 10

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Build vault validation system: schema enforcement, link integrity, status honesty, orphan detection via PostToolUse hook on `.md` writes | This session | HIGH | open |
| Create vault index generator (grouped by `node_type` and `status`) — blocked on vault validation | This session | MEDIUM | open |
| Promote CLAUDE.md-as-sole-router decision to a formal premise node | This session | LOW | open |
