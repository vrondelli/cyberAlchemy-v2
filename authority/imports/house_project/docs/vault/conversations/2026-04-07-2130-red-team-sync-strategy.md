---
tags: [ontology, red-team, cache-invalidation, sync-strategy, multi-agent]
node_type: discovery
is_session: true
layer: ontology, architecture
nature: adversarial, decisional
status: active
created: 2026-04-07
timestamp: 2026-04-07T21:30:00-03:00
expires: 2026-06-06
conversation_id: r8p2q
decisions_made: true
contradictions_found: false
specs_updated: []
promoted_candidates: []
expected_importance: 7
importance_rationale: "Identified a critical architectural gap (3 of 4 relational tables unpopulated) beyond the original cache invalidation question, and produced a concrete recommendation (Option A: Full Re-Index) that will shape the next implementation phase of the ontology pipeline."
---

# Red Team — Cache Invalidation & Sync Strategy

## Summary

This session conducted an adversarial red-team analysis of cache invalidation vulnerabilities in the ontology extraction pipeline. It discovered that 3 of 4 prescribed relational tables (terms, anchors, edges) were never populated — a more serious architectural gap than the original cache question. Two sync strategies were evaluated (Full Re-Index vs Intelligent Upsert), and Option A (Full Re-Index) was recommended for correctness at current scale (~40 terms, <$0.01/run). Several open questions remain around deploy workflow Postgres access and command structure.

## Files touched

- `specs/ontology/docs/data-foundations/discovery-data-foundations.md`
- `specs/ontology/docs/data-foundations/discovery-pipeline-operationalization.md`
- `tools/ontology/embeddings/client.py`
- `tools/ontology/models.py`
- `docs/business-philosopher/assuntos/orquestracao-multi-agente/protocolo-tecnico.md`
