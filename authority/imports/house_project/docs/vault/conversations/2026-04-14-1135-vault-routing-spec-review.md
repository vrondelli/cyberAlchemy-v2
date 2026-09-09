---
tags: [embeddings, vault-routing, mcp-server, scoring, context-routing, spec-review]
node_type: discovery
is_session: true
layer: architecture, ontology
nature: technical, procedural
status: active
created: 2026-04-14
timestamp: 2026-04-14T11:35:30-0300
expires: 2026-06-13
conversation_id: vault-routing-spec-review-20260414
decisions_made: true
contradictions_found: false
specs_updated:
  - specs/ontology/docs/context-routing/docs/documents-embeddings/discovery-documents-embeddings.md
promoted_candidates: []
expected_importance: 7
importance_rationale: "Defines the embedding strategy and scoring model for vault-routing, a foundational infrastructure decision that affects how all future context retrieval works."
---

# vault-routing Discovery Review and Implementation Plan

## Summary

Reviewed `discovery-documents-embeddings.md` for consistency. Found and resolved: deprecated `node_type: session` in the score function (removed; `is_session: true` filtering at index time is the correct mechanism); in-degree signal misattributed to GitNexus (vault docs are not code entities); recency signal removed. Score simplified to 3 signals re-normalized to `0.55 × w_status + 0.25 × w_type + 0.20 × w_conf`. Embedding strategy changed from `frontmatter + objetivo` (blocked on `objetivo` migration) to full-document truncation (~2k tokens via model tokenizer). Drift detection (Subsystem B) deferred to backlog. Discovery updated to v0.2.0 and a full TDD implementation plan written for the `vault-routing` MCP server.

## Files touched

- `specs/ontology/docs/context-routing/docs/documents-embeddings/discovery-documents-embeddings.md`
- `specs/ontology/docs/context-routing/docs/documents-embeddings/backlog-documents-embeddings.md`
- `specs/ontology/docs/context-routing/docs/documents-embeddings/implementation-plan-vault-routing.md`
