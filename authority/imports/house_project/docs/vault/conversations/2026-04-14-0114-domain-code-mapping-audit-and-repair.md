---
tags: [architecture, vault, agents, ontology]
node_type: audit
is_session: true
layer: architecture
nature: technical
status: active
created: 2026-04-14
timestamp: 2026-04-14T01:14:58-03:00
expires: 2026-06-13
conversation_id: 6e2bbd26-6667-4c8a-a925-caf4b376442a
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Unblocked domain-code-mapping for external use and locked in where edges belong, but scoped to a support tool."
---

# domain-code-mapping Audit and Repair

## Summary

Audited the `domain-code-mapping` repo for public usability and found it partially ported from `house_project` with ~15 broken namespace imports (`tools.semantic_index.*` → `semantic_index.*`), three runtime bugs (`registry.anchors` nonexistent, `cmd_embed` using `json.loads` on YAML, `BuildResult` imported but undefined), and stale internal doc references. All were fixed and committed as `442d874`. The session also produced an architectural decision: **edges belong in code docstrings via `@edge:` syntax — dictionaries carry only term, description, and aliases.** This was enforced in `dictionary_extractor.py`, `models.py`, `tag_scanner.py`, and all tests and docs updated accordingly.

## Files touched

- semantic_index/models.py
- semantic_index/extractors/tag_scanner.py
- semantic_index/registry/builder.py
- semantic_index/extractors/dictionary_extractor.py
- semantic_index/extractors/dictionary_linter.py
- semantic_index/embeddings/client.py
- semantic_index/__init__.py
- semantic_index/cli.py
- semantic_index/CLAUDE.md
- semantic_index/OVERVIEW.md
- semantic_index/QUERY_SYSTEM.md
- semantic_index/tests/test_builder.py
- semantic_index/tests/test_cli_integration.py
- semantic_index/tests/test_dictionary_extractor.py
- semantic_index/tests/test_dictionary_linter.py
- semantic_index/tests/test_embeddings.py
- semantic_index/tests/test_event_validator.py
- semantic_index/tests/test_tag_scanner.py
- USAGE_GUIDE.md
- README.md
- REFACTORING_NOTES.md (deleted)
