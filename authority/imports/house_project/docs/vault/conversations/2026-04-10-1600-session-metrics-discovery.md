---
tags: [ontology, agents, vault, pipeline]
node_type: discovery
is_session: true
layer: [ontology, architecture]
nature: [technical, reference]
status: active
created: 2026-04-10
timestamp: 2026-04-10T16:00:00-03:00
expires: 2026-06-09
conversation_id: m3x9k
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Closes a real observability gap in the vault pipeline with a concrete schema, but scoped entirely to internal tooling with no direct effect on business domain logic."
metrics:
  started_at: "2026-04-10T16:00:00-03:00"
  ended_at: "2026-04-10T17:00:00-03:00"
  duration_minutes: 60
  human_turns: 4
  assistant_turns: 4
  estimated_tokens: 32000
  files_read: 8
  files_written: 4
  subagents_spawned: 3
  route_used: "3 — Specs/Planning"
  tools_used:
    Read: 5
    Write: 3
    Edit: 5
    Agent: 3
    Bash: 2
    Glob: 0
    Grep: 0
---

# Session: Discovery for Session Metrics & Observability

**Date:** 2026-04-10 16:00 (UTC-3)
**Tags:** #ontology #agents #vault #pipeline

## Summary

This session explored whether and how to capture quantitative metadata from agent sessions. The user identified a gap: the existing scratchpad-to-vault pipeline produces rich qualitative signal (decisions, insights, open questions) but zero quantitative data — no duration, message counts, token estimates, tool usage, or file-touch metrics. After discussing feasibility constraints (Claude Code doesn't expose exact API token counts within conversations), we agreed on a pragmatic Phase 1 approach: collect what the agent can observe through introspection at close-session time, using a character-based heuristic for token estimation (~4 chars/token, ~15% accuracy margin).

The key architectural decision was **dual storage**: a `metrics:` block in vault node frontmatter (so future agents immediately see a session's "weight") and a JSONL append log (`docs/vault/sessions/metrics.jsonl`) for cross-session analytics queryable via `jq` or Python. Exact API token counts and cost estimation were explicitly deferred to Phase 2.

A new discovery document was created at `specs/ontology/docs/session-observability/discovery-session-metrics.md` in a new subfolder, following the existing pattern of ontology/docs subfolders (like `data-foundations/`, `trust-gates/`). The discovery defines 11 metrics, documents exactly where each JSONL field's data comes from (all via agent introspection — no hooks or external scripts), includes a Mermaid data flow diagram, and surfaces 6 open questions covering context window truncation risks, JSONL git noise, and token heuristic calibration. A README following the readme-pattern skill was also created for the new folder.

All implementation changes are scoped to a single file: `.claude/skills/custom/close-session.md` — a new step between Summary and Assemble that collects metrics and writes to both destinations.

## Epistemic Impact

No prior premise was directly contradicted. However, the session surfaces a quiet assumption: the vault's session capture system was implicitly treated as qualitatively complete. This session makes explicit that it is quantitatively blind — zero signal on session cost, duration, or output volume.

The `chars/4` heuristic for token estimation is a candidate for a future `premise` node — a testable belief about a measurable proxy that could be validated or superseded by Phase 2 exact-token integration.

## Modified Artifacts

| Artifact | Action | What changed and why |
|---|---|---|
| `specs/ontology/docs/session-observability/discovery-session-metrics.md` | Created | Discovery doc: 11 session metrics, JSONL field sourcing table, Mermaid data flow, 6 open questions |
| `specs/ontology/docs/session-observability/README.md` | Created | Navigation index for the new session-observability subfolder |
| `claude/current_conversations/2026-04-10-1600-m3x9k-session-metrics-discovery.md` | Created | Session scratchpad tracking goal and key decisions |

## Connections

- **contextualizes** → [discovery-active-conversation-management.md](../../../specs/ontology/discovery-active-conversation-management.md) — this discovery adds quantitative metrics to the qualitative session lifecycle defined there
- **contextualizes** → [close-session.md](../../../.claude/skills/custom/close-session.md) — the implementation will modify this workflow

## Gaps & Backlog

| Item | Source | Priority | Status |
|---|---|---|---|
| Implement metrics collection step in `close-session.md` | Session decision | High | Open |
| Phase 2: exact API token counts via log parsing | Deferred — Claude Code doesn't expose tokens today | Medium | Deferred |
| Validate `chars/4` heuristic against real sessions | Open question in discovery | Medium | Open |
| Decide JSONL schema versioning and per-month splitting | Open question in discovery | Low | Open |

## Open Questions

- Should the scratchpad maintain a running tally as a hedge against context window truncation at close time?
- Is JSONL git noise a real risk given we work on `main` only, or should we mitigate with per-month files?
