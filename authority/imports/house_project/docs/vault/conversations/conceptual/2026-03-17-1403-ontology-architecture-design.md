---
tags: [vault, meta, ontology]
layer: ontology
nature: reference
status: active
created: 2026-03-17
timestamp: 2026-03-17T14:03:47-03:00
expires: 2026-05-16
conversation_id: c538fade-8594-446a-ae24-415cd7226366
node_type: conceptual
is_session: true
version: 0.1.0
last_updated: 2026-03-17
expected_importance: 8
importance_rationale: "Designed ontology architecture and data foundations, establishing the vault's structural principles."
---

# Ontology Architecture Design & Data Foundations Discovery

**Date:** 2026-03-17 14:03 (UTC-3)
**Tags:** #vault #meta #ontology

## Summary

This session was a deep design and discovery session focused entirely on architecting the company's ontology system from the ground up. No application code was written. The work produced the conceptual and technical blueprint for how the knowledge graph (`docs/vault/`) will be governed, maintained, and queried autonomously by AI agents. The session began with a review of the existing vault structure and the Ubiquitous Language Dictionary, moved through the design of a 5-agent framework (Vault Keeper, Updater, Reviewer, Bayesian, Information Keeper), established the trust gates that protect the graph from hallucination, and concluded with a detailed data foundations discovery proposing a Django-native tech stack using pgvector and Gemini contextual embeddings.

The most significant output is the complete ontology data architecture: a dedicated `ontology/` Django application with models for `OntologyEvent`, `OntologyNode`, and `OntologyEdge`, a `sync_vault_node()` single update path that keeps all stores consistent, and an 8-step build sequence from the event table to the full agent system. The session also produced multiple discovery documents for each sub-system and proposed updates to `ontology-constitution.md`.

### Dictionary Improvements
- **Problem/Goal:** The Ubiquitous Language dictionary in `docs/vault/dictionary-business.md` was sparse and imprecise.
- **Decision:** Improve definitions based on user feedback and code references (`models.py`).
- **Changes:** Clarified the distinction between `Direitos Creditórios` and `CCB`, expanded the `FIDC` definition, described `Parcela` as "future cash flow the fund should receive", and added `Filtros` (Filters) as a new rule-based entry referencing `FilterResult` enum. KitType nuance updated to include template bindings.

### Day-0 Strategy & Agent Framework
- **Problem/Goal:** How should a 2-person startup begin building a self-updating ontology?
- **Decision:** Adopt a "Propose, Validate, Merge" system of trust, delegating cognitive load to 5 specialized AI agents.
- **Changes:** Rewrote `specs/ontology/day-0-strategy.md` multiple times. Final version introduces the Architecture of Trust, the 5-Agent Framework, the Event Sourcing pattern borrowed from the financial engine, and the complete Mermaid flow diagram.

### Trust Gates Discovery
- **Problem/Goal:** How do we protect the vault from agent hallucinations without blocking developer velocity?
- **Decision:** Three gates: Linguistic (SLM-flagged linter, non-blocking), Procedural (Event Log), Epistemic (Human-only gate for Evergreen/Consolidated).
- **Changes:** Created `specs/ontology/trust-gates/discovery-trust-gates.md`. Refined: (1) Linter uses an SLM (e.g., Phi-3) to pre-filter domain nouns before checking dictionary. (2) Session logs and event table are distinct things. (3) Agent-to-Agent Reviewer loop is mandatory for application-level doc updates.

### Agency System Discovery
- **Problem/Goal:** What exact agent personas are needed, and what are their hard boundaries?
- **Decision:** 5 distinct roles with defined scopes. The Updater and Bayesian serve different functions (code-sync vs. epistemic trust respectively). Vault Keeper's draft noise is mitigated with a TTL garbage-collection job.
- **Changes:** Created `specs/ontology/roles/discovery-agency-system.md`. Key addition: the Bayesian evaluates trust via in-graph edge density (citation count). Information Keeper uses Graph-Dropping RAG with contextual embeddings.

### Data Foundations Discovery
- **Problem/Goal:** What is the minimal tech stack needed to build the data foundation before the agents?
- **Decision:** Dedicated Django app `ontology/` with `OntologyEvent`, `OntologyNode`, `OntologyEdge` models. pgvector for embedding storage. Gemini Embedding 2 for contextual embeddings. Single `sync_vault_node(path)` function as the one-and-only update path.
- **Changes:** Created `specs/ontology/data-foundations/discovery-data-foundations.md`. Covers proposed schemas, location options, embedding sync strategy, pgvector explained, and an 8-step build sequence.

### Ontology Constitution Updates
- **Problem/Goal:** `docs/vault/ontology-constitution.md` (formerly `README.md`) was incomplete. It didn't reflect the agent system, trust gates, or DRY rules.
- **Decision:** Propose formal additions: 5 new document types (`#session`, `#adr`, `#system`), Agent Framework table, Trust Gates section, Redundancy/DRY rules.
- **Changes:** Added `§6 Redundancy & The DRY Principle` directly to the constitution. Remaining proposed changes documented in the `constitution_updates.md` artifact for review.

Key outputs:
- `docs/vault/dictionary-business.md` — Refined with CCB vs Credit Rights distinction, Filters, Parcela, KitType nuance
- `specs/ontology/day-0-strategy.md` — 5-stage Mermaid flow, System of Trust narrative
- `specs/ontology/trust-gates/discovery-trust-gates.md` — Trust gates discovery with SLM filter and Agent Reviewer loop
- `specs/ontology/roles/discovery-agency-system.md` — Agency system discovery with graph theory for Bayesian
- `specs/ontology/event-sourcing/discovery-event-sourcing.md` — Event sourcing discovery
- `specs/ontology/data-foundations/discovery-data-foundations.md` — Full data stack proposal
- `docs/vault/ontology-constitution.md` — Added DRY/Redundancy rule

## Key Decisions

- **DRY Rule:** Evergreen/Consolidated documents must have each claim in exactly ONE place. Lower-level documents (Draft, Active) may have redundancy — the Bayesian normalizes it before promotion.
- **Linter Strategy:** SLM (not regex) pre-filters domain nouns from code diffs, then checks against `dictionary-business.md`. Non-blocking (drops PR comment only). Temperature=0.
- **Agent-to-Agent Reviewer is mandatory:** The Updater cannot merge application spec changes without the Reviewer agent cross-checking against the actual code diff.
- **Human gate only at top two levels:** Only `evergreen` and `consolidated` transitions require human PR approval.
- **Django `ontology/` app:** Tables live in the project repo managed via Django ORM and migrations, not raw SQL or a separate service.
- **Single update path:** `sync_vault_node(path)` is the only function that writes to `ontology_nodes`, `ontology_edges`, and `ontology_events`. Agents never write to these directly.
- **pgvector:** Embedding store inside Postgres. Zero new services. Enables JOIN between event log and embeddings in a single query.
- **Graph-Dropping RAG:** The Information Keeper uses a router LLM to find the best "entry node" in the graph, then crawls typed edges. Contextual embeddings (including neighbor node titles) improve the entry node selection.
- **Build Sequence:** Event Log → Node/Edge tables → frontmatter parser → pgvector/embeddings → SLM linter → Updater/Reviewer → Bayesian → Information Keeper.

## Files Changed

### Code
None — this was a pure design session.

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `docs/vault/dictionary-business.md` | `modified` | Refined definitions, added Filtros, Parcela, KitType nuance |
| `docs/vault/ontology-constitution.md` | `modified` | Added §6 Redundancy & DRY Principle |
| `specs/ontology/day-0-strategy.md` | `modified` | Complete rewrite with System of Trust, Mermaid diagram, agent framework |
| `specs/ontology/trust-gates/discovery-trust-gates.md` | `created` | Trust gates discovery document |
| `specs/ontology/roles/discovery-agency-system.md` | `created` | Agency system roles discovery document |
| `specs/ontology/event-sourcing/discovery-event-sourcing.md` | `created` | Event sourcing discovery document |
| `specs/ontology/data-foundations/discovery-data-foundations.md` | `created` | Data foundations discovery with full tech stack proposal |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Apply `constitution_updates.md` changes to `ontology-constitution.md` | Session decision | ⚠️ HIGH | Open |
| Create `ontology/` Django app with `OntologyEvent` model | Data foundations | ⚠️ HIGH | Open |
| Create `ontology_nodes` + `ontology_edges` models | Data foundations | ⚠️ HIGH | Open |
| Write frontmatter parser + `sync_vault_node()` | Data foundations | ⚠️ HIGH | Open |
| Enable pgvector in Postgres | Data foundations | MEDIUM | Open |
| Set up Gemini Embedding 2 embedding pipeline | Data foundations | MEDIUM | Open |
| SLM linter GitHub Action (Phi-3 mini) | Trust gates | MEDIUM | Open |
| Add `#system`, `#adr`, `#session` to `conventions.md` document types | Constitution | MEDIUM | Open |
| Add missing edge types (`updates`, `resolves`, `implements`, `deprecates`) to `conventions.md` | Session discussion | MEDIUM | Open |
| Resolve typo in filename: `ontology-constitution.md` → `ontology-constitution.md` | Observation | LOW | Open |

## Open Questions

- Should the folder structure of `docs/vault/` be reorganized to separate "schema documents" (constitution, dictionary, conventions) from "content documents" (premises, axioms, specs)?
- When should the `vault_session_cleanup.py` cron job run for Draft garbage collection — weekly? On merge?
- Should `convicção` / `veracidade` labels be retained alongside the maturity levels, or simplified since they are now covered by the level progression?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-constitution.md]] | `updates` | DRY/Redundancy rule added; further updates proposed in artifact |
| [[vault/confidence-levels.md]] | `contextualizes` | The maturity levels are the core input for the Bayesian agent's governance logic |
| [[vault/conventions.md]] | `contextualizes` | Edge types and document types referenced throughout; new types proposed |
| [[vault/dictionary-business.md]] | `updates` | Refined definitions for all core domain terms |
