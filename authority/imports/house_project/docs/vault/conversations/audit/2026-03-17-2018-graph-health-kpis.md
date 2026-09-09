---
tags: [ontology, vault]
node_type: audit
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-17
timestamp: 2026-03-17T20:18:16-03:00
expires: 2026-05-16
conversation_id: e1a21f7b-01b8-4de1-a391-8d02453bda45
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 7
importance_rationale: "Defined graph health KPIs and engineering trade-offs, establishing measurable vault quality criteria."
---

# Graph Health KPIs and Engineering Trade-offs

**Date:** 2026-03-17 20:09 (UTC-3)
**Tags:** #ontology #vault

## Summary

This session extended the ontology axioms work by addressing the engineering gap between mathematical ideals and practical implementation. The user identified three key trade-offs (channel efficiency vs. search robustness, adaptive system scale cost, logical vs. physical ontology) and asked for numerical indicators that would detect axiom violations before the system degrades. The session produced a new spec `graph-health-kpis.md` with 8 KPIs (4 information-theoretic/global + 4 operational/local) and an engineering trade-offs section, and lowered the confidence level on `ontology-axioms.md` to reflect its exploratory status.

### Engineering Trade-offs for Ontology Axioms

- **Problem/Goal:** The axioms define mathematical ideals (MI=0, every node unique, etc.) but real systems don't achieve ideals. How do we bridge the gap?
- **Decision:** Document three explicit trade-offs: (1) Allow controlled redundancy for search robustness (up to 15% MI), (2) Use stochastic sampling instead of brute-force validation at scale, (3) Separate logical ontology (axioms) from physical ontology (Obsidian/SQL).
- **Changes:** Created `specs/ontology/graph-health-kpis.md` with a dedicated Engineering Trade-offs section.

### Graph Health KPIs

- **Problem/Goal:** Define numerical indicators that detect when axioms are being violated.
- **Decision:** 8 KPIs in two groups, each mapped to a specific axiom and pre-mortem risk:
  - **Global/Information-theoretic (KPI 1–4):**
    - **KPI-1: MI Drift** (AX-ONT-2, R-02/R-09) — max mutual information between label pairs
    - **KPI-2: Node Redundancy Score** (AX-ONT-3, R-09) — max cosine similarity between node embeddings
    - **KPI-3: Graph Mixing Time** (AX-ONT-7, R-09/R-18) — random walk convergence speed
    - **KPI-4: Staleness Index** (AX-ONT-6, R-04/R-11) — fraction of nodes without recent activity
  - **Local/Operational (KPI 5–8):**
    - **KPI-5: Label Overlap Coefficient** (AX-ONT-2, R-02) — Jaccard co-occurrence of label value pairs
    - **KPI-6: Neighborhood Entropy** (AX-ONT-7, R-09) — semantic coherence of per-node neighborhoods
    - **KPI-7: Node Irreducibility Index** (AX-ONT-3, R-09) — betweenness centrality for structural contribution
    - **KPI-8: Ghost Knowledge Ratio** (AX-ONT-5, R-05) — ratio of registered questions to content nodes
- **Changes:** Created `specs/ontology/graph-health-kpis.md` with formulas, thresholds, implementation notes, monitoring cadence, and implementation path.

### Axiom Confidence Adjustment

- **Problem/Goal:** The axioms document was marked `status: draft`, `veracidade: medium` — too confident for a document still being refined.
- **Decision:** Lower to `status: exploratory`, `veracidade: low`. We know these intuitively but the formalization is ongoing.
- **Changes:** Updated frontmatter in `docs/vault/premises/ontology-axioms.md`.

Key outputs:
- `specs/ontology/graph-health-kpis.md` — 4 KPIs with thresholds and engineering trade-offs
- `docs/vault/premises/ontology-axioms.md` — confidence lowered to exploratory/low

## Key Decisions

- **Allow controlled redundancy:** Don't target `I(Lᵢ; Lⱼ) = 0` absolute. 15% MI threshold as engineering compromise.
- **Stochastic validation at scale:** Brute-force orthogonality checks are O(n²). Use sparse co-occurrence monitoring instead.
- **Logical vs physical separation:** Axioms govern the logical ontology; the physical layer (SQL/Obsidian) may have controlled approximations.
- **8 KPIs with specific thresholds:** 4 global (MI Drift, Node Redundancy, Mixing Time, Staleness) + 4 local (Label Overlap, Neighborhood Entropy, Node Irreducibility, Ghost Knowledge Ratio).
- **GKR as confirmation bias detector:** Low GKR means the vault stopped tracking unknowns — trigger an "ignorance refactoring" session.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/graph-health-kpis.md` | `created` | 4 graph health KPIs with formulas, thresholds, and engineering trade-offs |
| `docs/vault/premises/ontology-axioms.md` | `modified` | Lowered confidence: status exploratory, veracidade low |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/premises/ontology-axioms.md]] | `updates` | Lowered confidence level |
| [[ontology/graph-health-kpis.md]] | `derives-from` | This session produced the KPIs spec |
| [[ontology/risks.md]] | `contextualizes` | KPIs operationalize the early warning signals from the risk analysis |
