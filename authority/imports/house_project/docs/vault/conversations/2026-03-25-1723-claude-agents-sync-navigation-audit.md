---
tags: [vault, agents, ontology]
node_type: audit
is_session: true
layer: [ontology, architecture]
nature: technical
status: active
created: 2026-03-25
timestamp: 2026-03-25T17:23:12-03:00
expires: 2026-05-24
conversation_id: c3a7f2d1-84b6-4e09-a1f5-9d0e2c6b3a88
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [CLAUDE.md]
promoted_candidates: []
expected_importance: 3
importance_rationale: "Synced CLAUDE.md to AGENTS.md (adding items 4 new-feature guard, 7 testing route, 8 newspaper route) and audited navigation low-hanging fruits; low lasting relevance as the CLAUDE.md improvements supersede this session's artifacts."
version: 0.1.0
last_updated: 2026-03-25
---

# CLAUDE.md ↔ AGENTS.md Sync + Navigation Audit

**Date:** 2026-03-25 17:23 (UTC-3)
**Tags:** #vault #agents #ontology

## Summary

This session started with a question about which file is read first by the agent (answer: CLAUDE.md, auto-injected via system context). The user then asked for low-hanging fruit improvements to agent navigation. An initial audit was performed identifying 4 issues: dead workflow links (turned out to be wrong — all workflow files exist), CLAUDE.md/AGENTS.md sync drift, missing `## Connections` in `agent-navigation.md`, and the `graph-edges.md` gap already in the backlog.

The user then asked to compare CLAUDE.md and AGENTS.md explicitly. They were not equal: AGENTS.md had a new-feature guard in item 4, a `/close-session` workflow mention in item 5, and two entirely missing routes (item 7 Testing, item 8 Newspaper/Gödel). Three targeted edits synced CLAUDE.md to AGENTS.md. Afterwards, the user further improved CLAUDE.md into a cleaner format (numbered headings, removed redundancy, added a "Section 0" for memory loading and a Section 9 for ambiguous tasks) — this was done directly by the user outside the agent.

The final state of CLAUDE.md is now more structured than AGENTS.md. A follow-up sync of AGENTS.md to the new CLAUDE.md format may be warranted.

### CLAUDE.md ↔ AGENTS.md Drift
- **Problem/Goal:** Ensure both agent entry-point files route identically so all agent runtimes (Claude Code, Codex, etc.) behave consistently.
- **Decision:** CLAUDE.md is the lagging copy; make it match AGENTS.md.
- **Changes:** Added new-feature guard to item 4, updated item 5 wording, added items 7 (Testing) and 8 (Newspaper/Gödel) to CLAUDE.md.

### User Refactored CLAUDE.md Further
- **Problem/Goal:** The router was a flat numbered list; could be cleaner and more scannable.
- **Decision:** User restructured it with `##` section headings, added Section 0 (always read MEMORY.md), added Section 9 (ambiguous task fallback), and extracted GitNexus reference to a dedicated workflow file reference.
- **Changes:** CLAUDE.md rewritten by user into current cleaner format. AGENTS.md not yet updated to match.

### Navigation Low-Hanging Fruits Identified
- **Problem/Goal:** What's easiest to improve about agent navigation?
- **Decision:** Four items identified; existing workflow files confirmed present (initial "dead links" concern was wrong).
- **Changes:** No changes — audit only. Items logged below in Gaps & Backlog.

Key outputs:
- `CLAUDE.md` — synced to AGENTS.md then further restructured by user

## Key Decisions

- **Sync direction:** CLAUDE.md is treated as the copy, AGENTS.md as the source of truth — but after user's restructuring, CLAUDE.md is now ahead. Future sessions should sync AGENTS.md to CLAUDE.md.
- **Workflow files exist:** All `.agent/workflows/*.md` files referenced in the router are present — initial "dead links" concern was incorrect.
- **`testing.md` filename note:** Item 7 points to `testing.md`; the file `test-uncommited-changes.md` also exists but is separate. No conflict, but worth awareness.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `CLAUDE.md` | `modified` | Synced items 4, 5, 7, 8 from AGENTS.md; then user restructured into cleaner heading-based format |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Sync AGENTS.md to new CLAUDE.md format | This session | MEDIUM | Open |
| `agent-navigation.md` missing `## Connections` section | Navigation audit | LOW | Open |
| `graph-edges.md` — flat source/target/edge_type index | Backlog (pre-existing) | MEDIUM | Open |
| `decisions.md` extracted from conversations | Backlog (pre-existing) | MEDIUM | Open |
| `agent-navigation.md` for Newspaper | Backlog (pre-existing) | LOW | Open |

## Connections

- `derives-from`: `docs/vault/agent-navigation.md`
- `modifies`: `CLAUDE.md`
