---
tags: [agents, ontology]
node_type: constitution
is_session: true
layer: architecture
nature: procedural
status: active
created: 2026-03-25
timestamp: 2026-03-25T03:38:30-03:00
expires: 2026-05-24
conversation_id: 901ef56a-1109-4a7d-b40b-896f151ac8cb
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-25

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/newspaper/docs/newspaper-communication-protocol.md, specs/newspaper/orchestrator/manifesto.md, specs/newspaper/agents/system-state.md, specs/newspaper/agents/info-exchange.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Ratified the Condensation Law — a new constitutional rule governing info-exchange.md lifecycle, flush triggers, and the three-file observability architecture for all Gödel Machine agents."
---

# Codifying the Info-Exchange Flush Protocol (The Condensation Law)

**Date:** 2026-03-25 03:38 (UTC-3)
**Tags:** #agents #ontology

## Summary

This session addressed a critical information architecture problem in the Gödel Machine ecosystem: the `info-exchange.md` file had grown to 909 lines (62KB) of dead historical chatter that agents were burning context tokens to re-read. The Orchestrator assessed the archive, confirmed all critical decisions had already been absorbed into `system-state.md` and `evolution-wall.md`, and executed a clean flush to Epoch 2. The session then escalated from a one-time cleanup to a **permanent constitutional rule** — codifying the flush protocol as enforceable law across the entire agent ecosystem.

The result is a formalized three-file observability architecture: `system-state.md` (what IS), `evolution-wall.md` (what WAS DECIDED), and `info-exchange.md` (what IS HAPPENING NOW), with clear ownership and mutability rules for each.

### Info-Exchange Archive Flush (Epoch 1 → Epoch 2)
- **Problem/Goal:** `info-exchange.md` had accumulated 909 lines of founding agent conversations that were now codified elsewhere, wasting agent context windows.
- **Decision:** Flush the archive entirely, preserving only a clean bootstrap entry.
- **Changes:** Expanded `system-state.md` from 97 → ~130 lines (added full 8-axis voting taxonomy, data contracts, constitutional rules, 2 new open loops). Reset `info-exchange.md` to ~50 lines with Epoch 2 header. Logged flush decision in `evolution-wall.md`.

### Codifying the Condensation Law
- **Problem/Goal:** The Operator mandated that `info-exchange.md` must *always* stay clean — the flush must be a repeatable protocol, not a one-time event.
- **Decision:** Formalize the flush as Section 5 of `newspaper-communication-protocol.md` with explicit triggers (~50 entries or ~30KB), a 4-step condensation procedure, epoch numbering, and Orchestrator-only authority.
- **Changes:** Added Section 5 (Periodic Flush Protocol) and Section 6 (Three-File Architecture table) to the communication protocol. Added Rule #7 to orchestrator `manifesto.md`. Added Rule #9 to `system-state.md`. Updated `info-exchange.md` header to reference the formal procedure.

Key outputs:
- `newspaper-communication-protocol.md` — Sections 5-6: flush triggers, procedure, epoch numbering, authority, three-file architecture table
- `orchestrator/manifesto.md` — Rule #7: Periodic Info-Exchange Flush
- `system-state.md` v2.0.0 — Expanded state dashboard with full voting taxonomy and data contracts
- `info-exchange.md` — Clean Epoch 2 with flush protocol reference

## Key Decisions

- **The Condensation Law:** `info-exchange.md` is a live communication channel, NOT a permanent archive. The Orchestrator MUST flush it when it exceeds ~50 entries or ~30KB.
- **Flush authority is exclusive to the Orchestrator.** No individual agent may delete or truncate `info-exchange.md`.
- **Three-file observability architecture:** State → `system-state.md`, History → `evolution-wall.md`, Communication → `info-exchange.md`. Each has clear ownership and mutability rules.
- **Open actions survive flushes.** Before flushing, the Orchestrator must scan for unacknowledged `Action Required` entries and either preserve or resolve them.

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/newspaper/agents/info-exchange.md` | `modified` | Flushed 909-line Epoch 1 archive → ~50-line Epoch 2 bootstrap with flush protocol reference |
| `specs/newspaper/agents/system-state.md` | `modified` | Expanded from 97 → ~130 lines: added full 8-axis voting taxonomy, data contracts, constitutional rules, open loops |
| `specs/newspaper/agents/evolution-wall.md` | `modified` | Added Epoch 2 flush decision entry |
| `specs/newspaper/docs/newspaper-communication-protocol.md` | `modified` | Added Section 5 (Periodic Flush Protocol) and Section 6 (Three-File Architecture) |
| `specs/newspaper/orchestrator/manifesto.md` | `modified` | Added Rule #7 (Periodic Info-Exchange Flush / The Condensation Law) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `specs/newspaper/docs/newspaper-communication-protocol.md` | `refines` | Extended the communication protocol with formal flush lifecycle rules (Sections 5-6) |
| `specs/newspaper/orchestrator/manifesto.md` | `refines` | Added constitutional convention #7 defining Orchestrator flush authority |
| `docs/vault/conversations/2026-03-25-0622-info-exchange-restructure.md` | `derives-from` | This session directly continues the documentation restructure that created `system-state.md` and the archive redirect |

## Satisfaction

| Metric | Value |
|--------|-------|
| Score | 8 |
| Min | 7 |
| Max | 9 |
| Std | 0.7 |
