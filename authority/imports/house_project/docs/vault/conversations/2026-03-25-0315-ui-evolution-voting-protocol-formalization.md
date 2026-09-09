---
tags: [ui-evolution, newspaper, agents]
node_type: spec
is_session: true
layer: [domain, architecture]
nature: [technical, procedural]
status: active
created: 2026-03-25
timestamp: 2026-03-25T03:15:00-03:00
expires: 2026-05-24
conversation_id: 971f0b12-540d-4fde-b091-f5ce17abe6ab
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated:
  - specs/newspaper/agents/ui_evolution/manifesto.md
  - specs/newspaper/agents/ui_evolution/backlog.md
  - specs/newspaper/agents/ui_evolution/newsletter.md
  - specs/newspaper/agents/info-exchange.md
  - specs/newspaper/orchestrator/newsletter.md
  - specs/newspaper/evolution/index.html
promoted_candidates: []
expected_importance: 7
importance_rationale: "Ratified Constitution Rule #6 (mandatory voting UI on every newspaper generation) and formalized the UI→Backend telemetry contract, permanently closing the evolutionary feedback loop."
satisfaction_mean: 8
satisfaction_min: 7
satisfaction_max: 9
satisfaction_std: 0.7
version: 0.1.0
last_updated: 2026-03-25
---

# Formalizing Mandatory Voting Protocol for Newspaper UI Evolution

**Date:** 2026-03-25 03:15 (UTC-3)
**Tags:** #ui-evolution #newspaper #agents

## Summary

This session formalized the UI Evolution Agent's responsibility for embedding voting interfaces into every newspaper generation (`gen_*.html`), ensuring that the Gödel Machine's evolutionary feedback loop is never broken. The primary outcome was the ratification of **Constitution Rule #6** in the UI Evolution manifesto, which mandates that every new template must natively embed the Global Voting Bar and Atomic Context Evaluators, with all vote data routed to the Data & Backend Engineer Agent via `window.parent.registerAtomicVote()`.

Additionally, all historic mockup HTMLs (`a_dark_sepia`, `b_swiss_minimalism`, `c_terminal_green`, `d_brazilian_modernist`, `e_futuristic_context`, `5_amazonia_solarpunk`) were recovered from `/tmp/`, copied into `specs/newspaper/mockups/`, registered in the Genetic Platform's `index.html` Matrix Grid, and retroactively injected with the Global Voting Bar. The session concluded with a formal broadcast to all 5 agents via `info-exchange.md`, detailing the exact contract between the UI Agent (ballot builder), Backend Agent (persistence), and Darwin Engine (consumption).

### Recovery & Integration of Historic Mockups
- **Problem/Goal:** Older mockups existed only in `/tmp/newspaper-mockups/` and were not indexed by the Genetic Platform Matrix, making them invisible to the evolutionary engine.
- **Decision:** All mockups must be in the project tree and registered in `generationsData`.
- **Changes:** Copied 6 HTML files to `specs/newspaper/mockups/`, added them to `index.html` `generationsData` and `loreDatabase`, injected voting bars via Python script.

### Constitution Rule #6 — Mandatory Voting UI
- **Problem/Goal:** No formal rule existed requiring voting UI on every generation. New templates could be created without telemetry, breaking the evolutionary loop.
- **Decision:** Ratified as an immutable design constitution in the UI Evolution manifesto.
- **Changes:** Added Rule #6 to `manifesto.md`, created a standing-order backlog item, posted the formal directive to `info-exchange.md` for all agents.

### Voting Contract Formalization
- **Problem/Goal:** The boundary between "who builds the ballot" and "who persists the data" was implicit, not contractual.
- **Decision:** UI Agent builds the voting widgets; Backend Agent persists via `evolution_server.py` → `telemetry_db.json`; Darwin Engine consumes the data.
- **Changes:** Documented the full contract in `info-exchange.md` with explicit per-agent responsibilities.

Key outputs:
- `specs/newspaper/agents/ui_evolution/manifesto.md` — Rule #6 added
- `specs/newspaper/agents/ui_evolution/backlog.md` — Overhauled with completed and standing-order items
- `specs/newspaper/agents/info-exchange.md` — Formal voting protocol broadcast
- `specs/newspaper/evolution/index.html` — All mockups registered in Matrix

## Key Decisions

- **Mandatory Voting UI (Rule #6):** Every new `gen_*.html` MUST embed voting. No exceptions. UI Agent builds, Backend Agent persists.
- **1-to-5 Scale Standard:** Binary +1/-1 is officially deprecated. The 1-to-5 scale with `data-tooltip` metric explanations is the permanent standard.
- **Archive Recovery:** All historic mockups are now permanently cataloged in the Genetic Platform Matrix Grid.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/newspaper/evolution/index.html` | `modified` | Added all mockup HTMLs to `generationsData` and `loreDatabase` |
| `specs/newspaper/mockups/a_dark_sepia.html` | `modified` | Injected Global Voting Bar |
| `specs/newspaper/mockups/b_swiss_minimalism.html` | `modified` | Injected Global Voting Bar |
| `specs/newspaper/mockups/c_terminal_green.html` | `modified` | Injected Global Voting Bar |
| `specs/newspaper/mockups/d_brazilian_modernist.html` | `modified` | Injected Global Voting Bar |
| `specs/newspaper/mockups/e_futuristic_context.html` | `modified` | Injected Global Voting Bar |
| `specs/newspaper/mockups/5_amazonia_solarpunk.html` | `modified` | Injected Global Voting Bar |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/newspaper/agents/ui_evolution/manifesto.md` | `modified` | Added Constitution Rule #6, updated Section 4 current state |
| `specs/newspaper/agents/ui_evolution/backlog.md` | `modified` | Overhauled with completed tasks and standing orders |
| `specs/newspaper/agents/ui_evolution/newsletter.md` | `modified` | Added voting protocol ratification entry |
| `specs/newspaper/agents/info-exchange.md` | `modified` | Posted formal voting protocol directive to all agents |
| `specs/newspaper/orchestrator/newsletter.md` | `modified` | Added archive integration entry |

## Connections

- **Validates:** The voting protocol formalization validates the Darwin-Gödel Engine's directive (info-exchange.md, lines 605-676) requiring explicit page-level voting with semantic metric labeling.
- **Extends:** Extends the Orchestrator's baseline objectives (info-exchange.md, lines 386-417) by codifying the UI Agent's voting responsibility as a constitutional rule.

## Open Questions

- The Backend Agent should confirm that `evolution_server.py` correctly handles the increased volume of votes from the newly exposed mockup archive.
- The Darwin Engine should confirm it can process votes from "FOSSIL" tagged generations alongside active ones without skewing fitness calculations.
