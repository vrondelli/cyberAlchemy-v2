---
tags: [semantic-index, ontology, mcp, embeddings, infrastructure]
node_type: spec
is_session: true
layer: application, architecture
nature: technical
status: active
created: 2026-04-12
timestamp: 2026-04-12T16:52:00-03:00
expires: 2026-06-11
conversation_id: 2026-04-12-1600-m3x8k-semantic-index-mcp-server
decisions_made: true
contradictions_found: false
specs_updated:
  - specs/ontology/docs/context-routing/README.md
  - specs/ontology/docs/context-routing/docs/code-embeddings/DISCOVERY-agent-domain-consumption.md
  - specs/ontology/docs/context-routing/docs/code-embeddings/implementation-plan-mcp-server.md
promoted_candidates: []
expected_importance: 8
importance_rationale: "Closes the loop from discovery to working infrastructure for the semantic query layer — the MCP server becomes the primary agent interface to the ontology."
---

# Semantic Index MCP Server

## Summary

Built the Semantic Index MCP server end-to-end: executed the 5-task plan (edge tests, `domain_slice`, `vector_search`, FastMCP entry, `.mcp.json` registration), then reorganized `internal_tools/semantic_index/` so only README/backlog/docs stay at the root and all code moves under `application/`. Canonical `spec.yaml` source decided (`domains/spec.yaml`), hardcoded cwd removed from MCP config (path resolves via `__file__`), and `extract` added to the pre-commit hook plus a new `ontology pipeline` CLI chaining extract → embed for deploy use. All 157 tests pass; MCP server activates on Claude Code restart.

## Contradictions

- validates [DISCOVERY-agent-domain-consumption.md](../../../specs/ontology/docs/context-routing/docs/code-embeddings/DISCOVERY-agent-domain-consumption.md) — D1 proposed this exact MCP server design; this session implemented it end-to-end.

## Files touched

- internal_tools/semantic_index/application/mcp_server.py
- internal_tools/semantic_index/application/query/{__init__,domain_slice,vector_search}.py
- internal_tools/semantic_index/application/tests/{test_domain_slice,test_vector_search,test_embeddings}.py
- internal_tools/semantic_index/application/cli.py
- internal_tools/semantic_index/application/ (all code moved here)
- internal_tools/semantic_index/README.md
- internal_tools/personal_assistant/{README.md, backend/{README.md,agent.py,views.py,tests.py}}
- .mcp.json, .pre-commit-config.yaml, .claude/scripts/pre-commit-hook.sh, requirements.txt
- specs/ontology/docs/context-routing/{README.md, docs/code-embeddings/{DISCOVERY-agent-domain-consumption.md, implementation-plan-mcp-server.md}}
