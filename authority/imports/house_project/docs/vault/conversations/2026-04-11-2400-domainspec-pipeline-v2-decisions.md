---
tags: [pipeline, ontology, architecture]
node_type: discovery
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-04-11
timestamp: 2026-04-11T24:00:00-03:00
expires: 2026-06-10
conversation_id: current-session
decisions_made: true
contradictions_found: false
specs_updated:
  - internal_tools/semantic_index/docs/refactor/DISCOVERY-extraction-pipeline-v2.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Resolved four concrete open questions in DISCOVERY-extraction-pipeline-v2.md, advancing the design from v0.1 to v0.2.0 with binding decisions on spec.yaml sourcing, alias origin, registry replacement strategy, and edge tag production status."
---

# DomainSpec Pipeline v2 — Design Decisions

## Summary

This session reviewed the `domain-tagging` and `domainspec` systems, assessed their design, and resolved open questions in `DISCOVERY-extraction-pipeline-v2.md`. Key decisions: `description` in spec.yaml comes from the symbol's docstring (not the dictionary term); `aliases_in_conversation` comes from the dictionary per-term (not repeated per anchor); `ontology-registry.json` must be fully replaced (not phased out), with all 5 active consumers explicitly identified; and `@edge` tags already exist in production code (34 occurrences across 8 files — not aspirational). The discovery was updated to v0.2.0 and two session files (q3m7x + q7m2x) were merged.

## Files touched

- `internal_tools/semantic_index/docs/refactor/DISCOVERY-extraction-pipeline-v2.md`
- `claude/current_conversations/2026-04-11-1700-q3m7x-domainspec-edge-tags-pipeline.md`
- `claude/current_conversations/2026-04-11-1900-q7m2x-domainspec-tagging-completion.md` (deleted — merged into q3m7x)
