---
tags: [vault-routing, embeddings, mcp, infrastructure, semantic-search, sqlite]
node_type: implementation-plan
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-04-14
timestamp: 2026-04-14T13:24:00-03:00
expires: 2026-06-13
conversation_id: bc3b545f-8143-4cce-91e8-e389b48318d3
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "First local-embedding MCP tool; establishes the pattern for vector-based vault retrieval."
---

# Vault-routing MCP implementation

## Summary

Executed the vault-routing implementation plan end-to-end: built `internal_tools/vault_routing/` (models, store, walker, scorer, embedder, indexer, search, mcp_server) which indexes vault docs via local Gemma embeddings into SQLite and exposes a `context_menu(query, k)` MCP tool returning top-k paths ranked by `cosine × trust` (status × node_type × confidence). 25 tests pass; code.md audit approved; registered in `.mcp.json`. During setup, patched `walker.py` with a custom YAML loader that treats timestamps as strings after the indexer crashed on a vault doc with an invalid-hour timestamp, and guided the user through HuggingFace gated-repo auth to unblock Gemma.

## Files touched

- internal_tools/vault_routing/__init__.py
- internal_tools/vault_routing/models.py
- internal_tools/vault_routing/store.py
- internal_tools/vault_routing/walker.py
- internal_tools/vault_routing/scorer.py
- internal_tools/vault_routing/embedder.py
- internal_tools/vault_routing/indexer.py
- internal_tools/vault_routing/search.py
- internal_tools/vault_routing/mcp_server.py
- internal_tools/vault_routing/tests/__init__.py
- internal_tools/vault_routing/tests/test_store.py
- internal_tools/vault_routing/tests/test_walker.py
- internal_tools/vault_routing/tests/test_scorer.py
- internal_tools/vault_routing/tests/test_search.py
- .mcp.json
- requirements.txt
