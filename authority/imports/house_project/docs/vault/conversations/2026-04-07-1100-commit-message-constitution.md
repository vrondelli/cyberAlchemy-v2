---
tags: [git, commit, constitution, agent-workflow, developer-experience]
node_type: constitution
is_session: true
layer: architecture
nature: procedural, reference
status: active
created: 2026-04-07
timestamp: 2026-04-07T11:00:00-03:00
expires: 2026-06-06
conversation_id: k5r2m
# --- Structured fields ---
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [constitutions-produce-skills pattern → premise or constitution node]
expected_importance: 8
importance_rationale: "Established enforceable commit message standard and surfaced the architectural insight that every constitution should produce a compact execution-time skill."
---

# Commit Message Constitution & Skills Pattern

**Date:** 2026-04-07 11:00 (UTC-3)
**Tags:** #git #commit #constitution #agent-workflow #developer-experience

## Summary

The session started when the user identified a specific commit (`fix: strip extracted_data/ocr_text from bulk import list response`) as a model for how all commits should be written, and proposed creating a constitution to enforce that standard. We discussed the key qualities that made the commit good — conventional prefix, concise imperative subject, structured body with what/why/impact, test summary, and spec reference — and made several scoping decisions: only three prefixes (`fix`, `feat`, `refactor`), no scope parentheses, and a body structure with required and conditionally-required sections (Files for production code only, Tests when the suite changed, Ref only when directly implementing a planned item). The constitution was drafted at `docs/vault/constitution/commit-message-constitution.md` with full examples, anti-patterns, and governance.

A broader architectural insight emerged: constitutions are too heavy for agents to consume at execution time, so every constitution should produce a corresponding compact skill (~30 lines) that distills the actionable checklist. This led to creating `.claude/skills/custom/commit-message.md` as the execution-time counterpart, with the constitution as its authority. The Ref section was refined after discussion — tightened from "include when a spec exists" to "only when the commit directly implements a planned item," since most standalone fixes won't have a corresponding document. The session leaves one open question: whether CLAUDE.md should be updated to route to the commit-message skill at commit time.

## Epistemic Impact

- **Challenged:** Prior implicit belief that constitutions are sufficient for agent governance at execution time. Constitutions are too heavy to load at runtime — a compact skill is needed as the execution-time proxy.
- **Confirmed:** Constitutions encode non-negotiable rules that require governance to change. This session operationalized that pattern for commit messages.
- **Gap surfaced:** All existing constitutions (`development-practices`, `folder-structure`, `event-system`) lack companion skills. This means agents currently load full constitutions at execution time — exactly the pattern this session identified as too heavy.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `docs/vault/constitution/commit-message-constitution.md` | Created | Full constitution: 3 prefixes, required/conditional body sections, examples, anti-patterns, governance |
| `.claude/skills/custom/commit-message.md` | Created | Compact execution-time skill derived from the constitution |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[development-practices-constitution]] | `derives-from` | Inherits governance process and agent autonomy rules |
| [[commit-message-constitution]] | `operationalizes` | This session produced the constitution |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Create companion skills for existing constitutions (dev-practices, folder-structure, event-system) | This session | MEDIUM | Open |
| Promote "constitutions produce skills" pattern to a vault premise node | This session | LOW | Open |
| Wire commit-message skill into CLAUDE.md route table | This session | MEDIUM | Open |

## Open Questions

- Should CLAUDE.md be updated to load the commit-message skill at commit time? If so, which route does it belong to — a new route, or as a sub-step of Route 4 (Refactoring/Writing Code)?
