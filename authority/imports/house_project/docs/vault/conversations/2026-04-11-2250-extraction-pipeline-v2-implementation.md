---
tags: [extraction-pipeline, semantic-index, ontology, models, embeddings, spec-yaml, refactoring]
node_type: implementation-plan
is_session: true
layer: ontology
nature: procedural
status: active
created: 2026-04-11
timestamp: 2026-04-11T22:50:00-03:00
expires: 2026-06-10
decisions_made: true
contradictions_found: true
specs_updated: [specs/ontology/docs/domainspec/docs/IMPLEMENTATION-PLAN-extraction-pipeline-v2.md]
promoted_candidates: []
expected_importance: 8
importance_rationale: "Completes extraction pipeline v2 end-to-end — 141 concepts to spec.yaml, 207 embeddings persisted to Postgres."
---

# Extraction Pipeline v2 — Full Implementation

## Summary

Reviewed the extraction pipeline v2 implementation plan and found 8 inconsistencies (domain default mismatch, unvalidated category, orphan_anchors type confusion, commit conflicts, dead embedding references, strict parameter). Fixed the plan and implemented all 14 tasks: refactored models (Literal types, field renames, removed OperationalOntologyEdge/Registry/DictionaryTerm.edges), rewrote scanner to produce CodeAnchor directly with mandatory D6 validation, simplified builder to return BuildResult namedtuple, created spec_yaml_writer and domain_inference modules, updated CLI/embeddings/personal_assistant. Ran end-to-end: 141 concepts → domains/spec.yaml, 207 embeddings (66 terms + 141 anchors) persisted to Postgres. Updated all documentation with Mermaid diagrams.

## Contradictions

- Supersedes `ontology-extraction-implementation-status.md` — previous status showed 49 terms/44 anchors with old JSON output; now 141 concepts in YAML format with full embedding persistence.

## Files touched

- internal_tools/semantic_index/models/models.py
- internal_tools/semantic_index/models/__init__.py
- internal_tools/semantic_index/models/domain_inference.py
- internal_tools/semantic_index/extractors/tag_scanner.py
- internal_tools/semantic_index/extractors/dictionary_extractor.py
- internal_tools/semantic_index/registry/builder.py
- internal_tools/semantic_index/generators/spec_yaml_writer.py
- internal_tools/semantic_index/embeddings/client.py
- internal_tools/semantic_index/cli.py
- internal_tools/personal_assistant/backend/views.py
- internal_tools/personal_assistant/backend/agent.py
- internal_tools/personal_assistant/backend/tests.py
- internal_tools/semantic_index/tests/ (6 updated, 2 new)
- internal_tools/semantic_index/README.md
- internal_tools/semantic_index/ARCHITECTURE_DIAGRAM.md
- internal_tools/semantic_index/OVERVIEW.md
- internal_tools/semantic_index/QUERY_SYSTEM.md
- internal_tools/semantic_index/docs/USAGE.md
- domains/spec.yaml
- specs/ontology/docs/domainspec/docs/IMPLEMENTATION-PLAN-extraction-pipeline-v2.md
