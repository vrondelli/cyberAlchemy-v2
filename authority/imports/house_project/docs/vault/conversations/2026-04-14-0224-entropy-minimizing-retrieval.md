---
tags: [retrieval, embeddings, drift, entropy, agents-optimization, context-routing, vault-routing]
node_type: discovery
is_session: true
layer: ontology, architecture
nature: technical, explanatory
status: active
created: 2026-04-14
timestamp: 2026-04-14T02:24:00-03:00
expires: 2026-06-13
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 8
importance_rationale: "Produces the missing architectural link between the vault's existing trust ontology and automated agent behavior — operationalizes agent-navigation.md into a computable ranking function."
---

# Entropy-Minimizing Retrieval & the Drift Detector

**Date:** 2026-04-14 02:24 (UTC-3)
**Tags:** #retrieval #embeddings #drift #entropy #agents-optimization #context-routing #vault-routing

## Summary

Design session that started from Victor's question about using `embeddinggemma` for document retrieval and evolved into two interlinked theses.

**Thesis 1 — Retrieval minimizes entropy.** Context window is a scarce resource. Each token loaded must justify itself by the uncertainty reduction it produces. Lexical similarity is the weakest signal available in a structured vault. The correct objective function combines similarity with trust signals multiplicatively:

```
score(doc, query) = sim(query, doc) x trust(doc)
trust(doc) = w_status x w_type x w_confidence x w_centrality x w_recency
```

The function of score is the central optimization target. Calibrating weights without a labeled query set is guesswork — building that set is first-class work.

**Thesis 2 — Drift as guardrail.** Two vectors: `intent` (moving average of last 3-5 agent messages) and `context_loaded` (centroid of opened documents' `objetivo` fields). When distance grows beyond threshold, a drift signal fires: "you left the map you opened." This is a guardrail (err toward fewer alerts), not a recommender (err toward more suggestions).

**Design decisions locked:** embeddinggemma-300m (local, ~50ms/embedding, Matryoshka 128/256d), embed frontmatter+objetivo not body, new `vault-routing` MCP server (separate from `semantic-index` which indexes code anchors), SQLite+sqlite-vec storage, ring buffer of 10 for drift, sessions excluded from index, menu-based interaction pattern (no auto-load).

An initial error was caught and corrected: the discovery falsely criticized `semantic-index` for "ignoring trust signals" — in fact `semantic-index` indexes code anchors via spec.yaml, not vault docs. It serves a different purpose. The new `vault-routing` MCP is complementary, not a replacement.

## Epistemic Impact

The session operationalizes the existing trust hierarchy in `agent-navigation.md` into a computable ranking function. The trust signals (status, node_type, confidence, centrality) were already codified as human-reading heuristics — this session converts them into an automated retrieval layer. The drift detector introduces a new conceptual category (guardrail vs. recommender) that did not previously exist in the vault.

## Modified Artifacts

| Artifact | Action | What changed and why |
|----------|--------|----------------------|
| `docs/business-philosopher/assuntos/agents-optimization/README.md` | Created | Navigation entry point for agents-optimization topic |
| `docs/business-philosopher/assuntos/agents-optimization/tese-minimizacao-entropia.md` | Created | Core philosophical thesis |
| `docs/business-philosopher/assuntos/agents-optimization/perguntas-em-aberto.md` | Created | 7 structured open questions |
| `docs/business-philosopher/animations/embedding-search/README.md` | Created | Explainer for 3b1b-style drift animation |
| `specs/ontology/docs/context-routing/docs/documents-embeddings/discovery-documents-embeddings.md` | Created | Technical discovery — model, schema, score function, MCP contracts |
| `docs/vault/backlog/backlog.md` | Modified | Added item: "Documentar os MCPs disponiveis para agentes" |

## Connections

- contextualizes: `docs/vault/agent-navigation.md` (trust hierarchy operationalized)
- contextualizes: AX-ONT-7 ("reasoning is navigation") — this work instrumentalizes the topology
- related-to: `docs/business-philosopher/assuntos/orquestracao-multi-agente/` (entropy appears there as inter-agent metric; here it's intra-agent)
- related-to: `2026-04-13-1600-fundamental-thesis-hierarchy.md`

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| `objetivo` field absent on most vault docs — prerequisite for clean embedding | Q-DE-1 | High | open |
| Score weight calibration without labeled query set | Q-DE-3 | High | open |
| Drift threshold policy (static cosine > 0.4 vs. adaptive 2-sigma) | Q-DE-4 | Medium | open |
| Re-embedding trigger strategy undefined | Q-DE-3 | Medium | open |
| Prototype score function against vault before building MCP | Next step | Medium | open |

## Open Questions

- Q-DE-1: How to define and enforce `objetivo` on all existing docs? Migration plan?
- Q-DE-3: Calibrate score weights without labeled queries — build the 30-50 pair query/answer set first?
- Q-DE-4: Static drift threshold (cosine > 0.4) or adaptive (2-sigma above session baseline)?
