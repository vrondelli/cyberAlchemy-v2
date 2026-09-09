---
tags: [ontology, agent-workflow, knowledge-management, session-management]
node_type: constitution
is_session: true
layer: ontology
nature: procedural
status: active
created: 2026-04-02
timestamp: 2026-04-02T19:13:00-03:00
expires: 2026-06-01
conversation_id: 2026-04-02-1913-active-conversation-management
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/discovery-active-conversation-management.md]
promoted_candidates: [premise/session-scratchpad-graduation-pattern, premise/scratchpad-write-trigger]
expected_importance: 8
importance_rationale: "This session established two enforceable, persistent rules — the session scratchpad creation trigger in CLAUDE.md and the Pre-Step in close-session.md — that will affect the quality of every future session closure and knowledge capture in this vault."
---

# Active Conversation Management — Implementation Session

**Date:** 2026-04-02 19:13 (UTC-3)
**Tags:** #ontology #agent-workflow #knowledge-management #session-management

## Summary

This session reviewed `discovery-active-conversation-management.md` and implemented the session scratchpad system end-to-end. It began as an assessment of whether the discovery was worth implementing, and concluded with all three open questions resolved and the changes live in CLAUDE.md and close-session.md.

### Problem and Core Finding

The discovery diagnosed the right problem but was missing its most critical piece — CLAUDE.md changes. Without encoding the scratchpad lifecycle in the router, the system would never be used regardless of how well the design was specified.

### Location Decision

`.claude/current_conversations/` over `docs/current_conversations/`. Rationale: scratchpad files are ephemeral working memory, not knowledge artifacts. They shouldn't accumulate in git history until they graduate to the vault. Added to `.gitignore`.

### Trigger Decision

The user's heuristic ("if a topic passes quickly, it's not relevant") was encoded as: write when a topic spans more than one exchange OR produces a concrete output (decision, document, insight, question, blocker). Single-exchange topics are skipped. Token overhead is near zero.

### Session-Start Scope

Initially encoded as code changes only — the user correctly pushed back. Writing a discovery or capturing an important insight is as valid a reason to open a scratchpad as a code change. The trigger was broadened to any session involving document creation/modification or multi-turn discussion.

### close-session.md Trim

Reduced from 204 → 171 lines. Removed: Purpose section (meta-commentary), Step 4 (duplicate of Step 1 quality bar), `agent-navigation.md` cross-reference (per user — don't send agent to another document), Examples column from importance table. Added: Pre-Step to load scratchpad before Triage Gate.

### Secondary Finding: ontology-conventions.md Bloat

`ontology-conventions.md` at 544 lines (~10k tokens) is loaded by Route 7 on every new `.md` file creation. The agent only needs the frontmatter schema and allowed values (~50 lines) for that task. A discovery spec was created (`specs/ontology/discovery-ontology-quick-reference.md`); implementation deferred.

## Epistemic Impact

- `specs/ontology/discovery-active-conversation-management.md` — `validates`: all three open questions resolved affirmatively; scratchpad pattern confirmed as the right approach.
- `CLAUDE.md` as sole context router — `validates`: the rule was added to CLAUDE.md rather than a separate config, confirming the design principle that the router governs all agent behavior.
- `close-session.md` had accumulated structural redundancy (Purpose section, duplicate Step 4, stale cross-references). Discovered and corrected.

**Promoted candidates:**
- `premise/session-scratchpad-graduation-pattern` — the rule that ephemeral scratchpads graduate to vault only after triage, to be validated across real sessions.
- `premise/scratchpad-write-trigger` — the multi-exchange-or-concrete-output rule, candidate for promotion to a constitution clause if stable.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `CLAUDE.md` | modified | Added Standing Rule: scratchpad creation trigger, incremental writing heuristic, location, format |
| `.claude/skills/custom/close-session.md` | modified | Added Pre-Step to load scratchpad; trimmed 204→171 lines |
| `.gitignore` | modified | Added `.claude/current_conversations/` |
| `specs/ontology/discovery-active-conversation-management.md` | modified | Status → active; open questions replaced with Decisions Made |
| `specs/ontology/discovery-ontology-quick-reference.md` | created | Discovery spec for quick-reference extraction; implementation deferred |

## Connections

| Document | Type | Description |
|---|---|---|
| [discovery-active-conversation-management.md](../../../specs/ontology/discovery-active-conversation-management.md) | `implements` | This session is the execution of that discovery |
| [CLAUDE.md](../../../CLAUDE.md) | `updates` | Standing Rule added as a result of this session |
| [close-session.md](../../../.claude/skills/custom/close-session.md) | `updates` | Pre-Step added and file trimmed |
| [discovery-ontology-quick-reference.md](../../../specs/ontology/discovery-ontology-quick-reference.md) | `derives-from` | Secondary finding from this session |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Extract `ontology-conventions.md` quick-reference (~50 lines) to reduce Route 7 token load | `specs/ontology/discovery-ontology-quick-reference.md` | MEDIUM | Deferred |
| Validate scratchpad pattern across 3–5 real sessions, then promote graduation rule to `premise` | Epistemic impact — promoted candidate | LOW | Open |
| Evaluate scratchpad write-trigger as candidate for dedicated constitution clause | Epistemic impact — promoted candidate | LOW | Open |

## Open Questions

- Sync burden: if `ontology-conventions.md` or `close-session.md` evolves, the scratchpad format must stay aligned. No enforcement mechanism yet.
