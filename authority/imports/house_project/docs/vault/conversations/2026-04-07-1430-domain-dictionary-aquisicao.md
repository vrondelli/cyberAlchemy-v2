---
tags: [ontology, dictionary, aquisicao, events, edges, constitution, vocabulary, tooling]
node_type: discovery
is_session: true
layer: ontology
nature: technical, decisional
status: active
created: 2026-04-07
timestamp: 2026-04-07T14:30:00-03:00
expires: 2026-06-06
conversation_id: n4b7k
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Established the three-dictionary architecture (business/events/system), created taxonomy.py as single source of truth for edge vocabulary, and fixed all edge violations across aquisicao domain — foundational for all future ontology work."
---

# Domain Dictionary — Aquisicao: Full Audit and Event Integration

## Summary

This mega-session (7 merged sub-sessions) closed the vocabulary gap between the aquisicao domain and the project's ontology dictionaries. It created `dictionary-events.md` with all 56 business-tier events, audited and fixed edge vocabulary across both business and system dictionaries for constitution compliance, restructured the domain-tagging constitution, and created `taxonomy.py` as the single source of truth for 20 forward + 20 inverse approved edge verbs. The system dictionary was confirmed as domain-agnostic by design. Eight dictionary fixes from the final pass remain open.

## Files touched

- `docs/vault/dictionary-events.md`
- `docs/vault/dictionary-business.md`
- `docs/vault/dictionary-sys.md`
- `docs/vault/constitution/domain-tagging-constitution.md`
- `docs/vault/constitution/event-system-constitution.md`
- `infrastructure/messaging/event_catalog.py`
- `infrastructure/tests/test_event_log_service.py`
- `tools/ontology/taxonomy.py`
- `tools/ontology/models.py`
- `tools/ontology/registry/builder.py`
- `tools/ontology/extractors/tag_scanner.py`
- `tools/ontology/extractors/dictionary_linter.py`
- `tools/ontology/docs/domain-tagging-constitution.md`
- `tools/ontology/docs/quick-reference.md`
- `tools/ontology/docs/USAGE.md`
- `specs/ontology/docs/data-foundations/discovery-extraction-pipeline.md`
- `specs/ontology/docs/data-foundations/discovery-pipeline-operationalization.md`
- `specs/ontology/backlog-ontology.md`
