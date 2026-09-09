---
tags: [vault-routing, ontology, retrieval, knowledge-topology, mcp]
node_type: conceptual
is_session: true
layer: ontology, architecture
nature: technical, explanatory
status: active
created: 2026-04-14
timestamp: 2026-04-14T21:59:00-03:00
expires: 2026-06-13
conversation_id: b56ae922-2036-42ec-9162-b7b2fd3ff678
decisions_made: true
contradictions_found: true
specs_updated:
  - specs/ontology/docs/abstract-concrete/axiom-mapping-status.md
  - specs/ontology/docs/abstract-concrete/axiom-to-code-derivation-discovery.md
  - specs/ontology/docs/abstract-concrete/README.md
  - specs/ontology/docs/vault-processes/library-science-foundations-discovery.md
  - specs/ontology/docs/governance/graph-health-kpis.md
promoted_candidates:
  - docs/vault/axiom/ontology-axioms.md#ax-ont-7
  - docs/vault/premise/ontology-premises.md#p-ont-9
  - docs/business-philosopher/assuntos/knowledge-topology/knowledge-topology.md
expected_importance: 8
importance_rationale: "Introduced AX-ONT-7 as the new root axiom of the ontology and added 'essay' as a new node_type, both of which have structural consequences for the entire vault classification system."
---

# Vault-routing dual ranking and ontology axiom reorganization

## Summary

Shipped the dual-ranking version of the vault-routing MCP tool (separate routing and semantic top-k lists) and used a self-referential query against it as empirical evidence for a new business-philosopher essay (`knowledge-topology.md`) arguing routing and retrieval are distinct primitives. From that observation: introduced `essay` as a new `node_type`; added AX-ONT-7 — "Reasoning is navigation; topology can be engineered" — as the new root axiom; demoted the former adaptive-system axiom to P-ONT-9 (premise); upgraded AX-ONT-3's formalization from a Markov-π argument to content-conditional-entropy; and renumbered the axiom set to a contiguous 1–7 with cross-file references updated.

## Contradictions

- questions: prior single-ranking MCP design (resolved by dual-ranking implementation)
- validates: AX-ONT-7 ("Reasoning is navigation; topology can be engineered") — empirically supported by the self-referential retrieval failure
- contradicts: former AX-ONT-3 formalization (Markov-π argument superseded by content-conditional-entropy formulation)

## Files touched

- internal_tools/vault_routing/search.py
- internal_tools/vault_routing/mcp_server.py
- internal_tools/vault_routing/tests/test_search.py
- docs/business-philosopher/assuntos/knowledge-topology/knowledge-topology.md
- .claude/skills/custom/frontmatter.md
- docs/vault/ontology-conventions.md
- docs/vault/axiom/ontology-axioms.md
- docs/vault/premise/ontology-premises.md
- docs/vault/graph-edges.md
- specs/ontology/docs/abstract-concrete/axiom-mapping-status.md
- specs/ontology/docs/abstract-concrete/axiom-to-code-derivation-discovery.md
- specs/ontology/docs/abstract-concrete/README.md
- specs/ontology/docs/vault-processes/library-science-foundations-discovery.md
- specs/ontology/docs/governance/graph-health-kpis.md
