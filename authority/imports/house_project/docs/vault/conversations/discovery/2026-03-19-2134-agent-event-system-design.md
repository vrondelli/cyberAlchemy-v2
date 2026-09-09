---
tags: [ontology, agents, event-system]
node_type: discovery
is_session: true
layer: ontology
nature: [explanatory, technical]
status: active
created: 2026-03-19
timestamp: 2026-03-19T21:34:00-03:00
expires: 2026-05-18
conversation_id: 1a4bbb72-018e-418a-9c89-b633886d4555
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/event-sourcing/discovery-event-sourcing.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Designed the Agent Event System from scratch — event catalog, emission mechanism, storage decision (SQLite), reliability tiers, and fragilities — establishing the foundation for all future agent observability in the ontology."
version: 0.1.0
last_updated: 2026-03-19
---

# Agent Event System Design

**Date:** 2026-03-19 21:34 (UTC-3)
**Tags:** #ontology #agents #event-system

## Summary

This session designed the **Agent Event System** end-to-end — a structured mechanism for recording what AI agents do when interacting with the Vault. The work started with an evaluation of the existing event sourcing documentation and evolved into a concrete specification for two initial events (`DOCUMENT_MODIFIED` and `DOCUMENT_REFERENCED`), a storage decision (SQLite), a reliability model (two tiers), and a comprehensive fragilities analysis.

### Event Table Evaluation & Mini-Agent Pattern
- **Problem/Goal:** Evaluate the existing `ontology_events` table concept and assess whether a "mini-agent observer" could record agent behavior.
- **Decision:** The mini-agent approach (LLM watching another LLM) was rejected under the Efeito Lindy — it's a 2023-era pattern with no historical track record. Self-monitoring (the agent instrumenting itself) is more robust, following the 50+ year pattern of application logging.
- **Changes:** Created an initial evaluation artifact documenting the Lindy analysis.

### Agent Event Catalog v0.1
- **Problem/Goal:** Define what events to record and what the payload should contain.
- **Decision:** Start with two events only (Occam's Razor): `DOCUMENT_MODIFIED` (Tier 1, mandatory, real-time) and `DOCUMENT_REFERENCED` (Tier 2, best-effort). Others (`SESSION_CLOSED`, `DOCUMENT_CONTRADICTED`, `DOCUMENT_PROMOTED`, `EDGE_CREATED`, `QUERY_ANSWERED`) are cataloged for the future.
- **Changes:** Created `discovery-agent-events.md` with full envelope schema, payload definitions, and emission mechanism. Event catalog location still under discussion (proposed: `docs/vault/architecture/`).

### Emission Mechanism & Reliability
- **Problem/Goal:** How to ensure events are actually emitted, given that we don't control the agent's runtime in the IDE.
- **Decision:** Tier 1 events (`DOCUMENT_MODIFIED`) are emitted in real-time via `run_command` with `sqlite3 INSERT`, immediately after each modification. The `/close-session` workflow serves as a safety net (not the primary mechanism). Tier 2 events are best-effort via textual instructions in `AGENTS.md`.
- **Changes:** Updated discovery document with concrete `sqlite3` commands and `CREATE TABLE` schema.

### Epistemic Principles Vault Node
- **Problem/Goal:** The project accumulates reasoning heuristics (Lindy Effect, Occam's Razor, Orthogonality) that guide design decisions but had no formal home.
- **Decision:** Created a dedicated vault node cataloging all epistemic principles with origins, Lindy age, and concrete applications in this project.
- **Changes:** Created `docs/vault/concepts/epistemic-principles.md` with 4 principles and admission criteria for new ones.

### Storage & Volume
- **Problem/Goal:** Where to store 500+ events/day without polluting the Git repository.
- **Decision:** SQLite at `~/.ontology/events.db`. CSV rejected (too much Git noise). Postgres deferred to when Docker is the primary runtime.
- **Changes:** Documented in the discovery with full `CREATE TABLE` schema.

Key outputs:
- `specs/ontology/event-sourcing/discovery-agent-events.md` — Full discovery document
- `docs/vault/concepts/epistemic-principles.md` — Epistemic principles vault node
- `specs/ontology/event-sourcing/discovery-event-sourcing.md` — Updated with agent reference events

## Key Decisions

- **Self-monitoring over observer pattern:** Agents emit their own events (Lindy-proven logging pattern) instead of a separate observer LLM (2023-era pattern).
- **Two events to start:** `DOCUMENT_MODIFIED` (Tier 1) and `DOCUMENT_REFERENCED` (Tier 2). Others in backlog.
- **Real-time emission for Tier 1:** `DOCUMENT_MODIFIED` fires immediately after modifications, not batched at `/close-session`.
- **SQLite for storage:** `~/.ontology/events.db`, not CSV (Git pollution) or Postgres (Docker dependency).
- **Vocabulary-controlled payloads:** `purpose` field uses enum `{understanding, debugging, validating, referencing, modifying, planning}`.
- **Entropy as ordinal:** `{high_uncertainty, medium_uncertainty, low_uncertainty, resolved}` instead of floats (LLMs are bad at calibrated numeric scores).
- **Event catalog placement:** Under discussion — proposed `docs/vault/architecture/agent-event-catalog.md` (separate from discovery).

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/event-sourcing/discovery-agent-events.md` | `created` | Full discovery: event catalog, envelope, tiers, emission mechanism, storage, fragilities |
| `docs/vault/concepts/epistemic-principles.md` | `created` | Vault node with Occam, Lindy, Event Sourcing, Orthogonality principles |
| `specs/ontology/event-sourcing/discovery-event-sourcing.md` | `modified` | Added mention of agent consultation events and link to new discovery |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Create SQLite database (`~/.ontology/events.db`) | This session | ⚠️ HIGH | Pending |
| Add event emission rules to `AGENTS.md` | This session | ⚠️ HIGH | Pending |
| Create formal event catalog document in `docs/vault/architecture/` | This session | MEDIUM | Pending — placement under discussion |
| Implement entropy measurement (ordinal categories) | This session | LOW | Deferred to P&D phase |
| Backfill historical events from existing session nodes | F6 fragility | LOW | Deferred |

## Open Questions

- Where should the Agent Event Catalog live? `docs/vault/architecture/` or elsewhere?
- Should `DOCUMENT_REFERENCED` only fire for documents registered as ontology nodes, or for any path under `/docs/vault/` and `/specs/`?
- When to implement the backlog events (`SESSION_CLOSED`, `DOCUMENT_CONTRADICTED`, etc.)?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [discovery-agent-events.md](file:///Users/victorboscaro/house_project/specs/ontology/event-sourcing/discovery-agent-events.md) | `implements` | This session produced the discovery document |
| [epistemic-principles.md](file:///Users/victorboscaro/house_project/docs/vault/concepts/epistemic-principles.md) | `implements` | This session created the epistemic principles vault node |
| [discovery-event-sourcing.md](file:///Users/victorboscaro/house_project/specs/ontology/event-sourcing/discovery-event-sourcing.md) | `updates` | Added agent reference events and cross-link |
| [ontology-architecture-draft.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-architecture-draft.md) | `derives-from` | The Agent Framework defines the agents whose events we want to capture |
| [ontology-conventions.md](file:///Users/victorboscaro/house_project/docs/vault/ontology-conventions.md) | `contextualizes` | Classification system used for this session node and the new vault documents |
| [risks.md](file:///Users/victorboscaro/house_project/specs/ontology/risks.md) | `contextualizes` | Fragilities F1-F7 address risk scenarios documented there |
