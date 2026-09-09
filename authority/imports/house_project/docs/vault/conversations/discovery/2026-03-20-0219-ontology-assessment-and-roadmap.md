---
tags: [ontology, vault, agents]
node_type: discovery
is_session: true
layer: ontology
nature: [explanatory, reference]
status: active
created: 2026-03-20
timestamp: 2026-03-20T02:19:32-03:00
expires: 2026-05-19
conversation_id: 79566ac4-619b-431d-8b93-2d221ca8fcb3
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Consolidated 7 scattered ontology planning documents into a single phased roadmap with risk-mapped exit criteria, providing the first actionable build sequence for the knowledge graph infrastructure."
satisfaction: { score: 7, min: 5, max: 9, std: 1.5 }
---

# Ontology Assessment and Roadmap

**Date:** 2026-03-20 02:19 (UTC-3)
**Tags:** #ontology #vault #agents

## Summary

This session assessed the entire vault ontology at `/docs/vault` for agent navigability, structural quality, and knowledge graph maturity. Every file in the vault was read — schema documents, content graph nodes, premises, axioms, constitutions, concepts, market docs, session samples, and the agent-workflows topology document. The assessment concluded that the vault is a strong starting point with a schema more mature than its content (~15 core nodes vs. 152 session logs).

The session then produced a phased ontology roadmap consolidating 7 scattered planning documents (`day-0-strategy.md`, `ontology-architecture-draft.md`, `risks.md`, `graph-health-kpis.md`, `backlog.md`, `informational-gravity-discovery.md`, `knowledge-graph-topology.md`) into a single build sequence with 8 phases, minimum data thresholds to prevent premature agent construction, and risk mitigation mapping to all 18 pre-mortem risks.

### Vault Assessment
- **Problem/Goal:** Determine if the ontology is clear for an agent to navigate and identify its strengths, surprises, and implicit structural properties
- **Decision:** The vault is significantly more agent-legible than typical project documentation due to 3 specific design decisions: dedicated agent navigation, structured frontmatter for filtering, and explicit trust hierarchy. Gaps exist in session integration (most are unconnected leaves) and edge validation (no automated consistency checks)
- **Changes:** Assessment artifact created with: 3 most important facts (probabilistic knowledge, single-root derivation, FIDC business context), 3 surprising facts (fragility self-tracking, agents as primary users, sessions classified by output role), and 5 non-obvious inferences (signal-to-noise building up, manual-vs-autonomous gap, tiny team, nature label weakness, constitution circularity risk)

### Ontology Roadmap
- **Problem/Goal:** Consolidate scattered planning materials into an actionable build sequence
- **Decision:** 8 phases from foundation hygiene → data substrate → linter/KPIs → embeddings/Info Keeper → graph health automation → Vault Keeper agent → Bayesian agent → future (Updater + full RAG). Each phase has explicit exit criteria and minimum data thresholds
- **Changes:** Roadmap artifact created. Explicitly deferred: Neo4j, SLM observers, dynamic document weighting, full Graph-Dropping RAG, spec migration into vault

Key outputs:
- `vault-ontology-assessment.md` — Full assessment with navigability analysis, important/surprising facts, and inferences
- `ontology-roadmap.md` — 8-phase roadmap with risk mapping

## Key Decisions

- **Assessment grounding:** Replaced ungrounded superlative ("most agent-legible I've encountered") with 3 specific, defensible reasons after user challenge
- **Phase 0 defaults for open questions:** Proposed defaults that activate on inaction: tags sufficient for domain (OQ-1), `## Objective` section is standard (OQ-2), manual promotion (OQ-3), veracidade for constitutions = tested in practice (OQ-4). Not yet ratified by user
- **Agent build order:** Vault Keeper first (safest, only creates drafts), Bayesian second (report-only first), Updater deferred (highest hallucination risk)

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `vault-ontology-assessment.md` (artifact) | `created` | Full assessment of vault ontology navigability, key facts, and implicit inferences |
| `vault-ontology-assessment.md` (artifact) | `modified` | Corrected ungrounded claim per user feedback |
| `ontology-roadmap.md` (artifact) | `created` | 8-phase roadmap consolidating 7 scattered planning documents |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Decide on OQ-1 through OQ-4 defaults | Phase 0 roadmap | ⚠️ HIGH | Proposed, user not yet confirmed |
| Move roadmap to `specs/ontology/` if desired | User question | MEDIUM | Awaiting user decision |
| Frontmatter backfill (~2 hours) | Phase 0 roadmap | ⚠️ HIGH | Not started |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [ontology-constitution.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-constitution.md) | `validates` | Assessment confirms the schema design is structurally sound |
| [ontology-conventions.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-conventions.md) | `questions` | Identified `nature` label as weakest orthogonality link, consistent with the document's own acknowledgment |
| [ontology-axioms.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-axioms.md) | `validates` | Assessment confirms the derivation hierarchy from AX-ONT-1 is coherent |
| [risks.md](file:///Users/victorboscaro/house_project/specs/ontology/risks.md) | `derives-from` | Roadmap phases are structured around mitigating the 18 pre-mortem risks |
| [graph-health-kpis.md](file:///Users/victorboscaro/house_project/specs/ontology/graph-health-kpis.md) | `derives-from` | KPIs assigned to Phases 2 and 4 of the roadmap |
| [day-0-strategy.md](file:///Users/victorboscaro/house_project/specs/ontology/day-0-strategy.md) | `refines` | Roadmap refines the day-0 strategy into a phased build sequence |
| [ontology-architecture-draft.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-architecture-draft.md) | `refines` | Roadmap phases implement the architecture vision incrementally |
