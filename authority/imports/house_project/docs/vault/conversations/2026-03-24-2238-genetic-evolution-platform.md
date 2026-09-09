---
tags: [frontend, architecture]
node_type: spec
is_session: true
layer: [application, architecture]
nature: [technical, procedural]
status: active
created: 2026-03-24
timestamp: 2026-03-24T22:38:27-03:00
expires: 2026-05-23
conversation_id: 085032ce-11d8-41b0-81f6-609a22e08a01
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-24

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/newspaper/evolution/README.md, specs/newspaper/README_AESTHETICS.md]
promoted_candidates: []
expected_importance: 7
importance_rationale: "Built the Genetic Evolution Platform dashboard to manage newspaper aesthetic mutations and enforce UI constitutional traits."
---

# Building the Genetic Evolution Platform for the Daily Graph

**Date:** 2026-03-24 22:38 (UTC-3)
**Tags:** #frontend #architecture

## Summary

This session focused on evolving the "O Grafo Diário" (The Daily Graph) newspaper by establishing a formal Genetic Evolution Platform. The goal was to build a "megalomaniac" laboratory where aesthetic mutations of the newspaper could be previewed, cataloged, and voted on, ensuring they adhere to strict constitutional UI traits. We created the main dashboard (`index.html`) with a dual-tab system for live rendering and lineage telemetry scoring. Furthermore, we implemented the first generation of active mutations (Gen 011 A/B), equipping them with dynamic data injection capabilities and the mandatory UI elements (hidden 3s delay side drawers, atomic component voting, reading level depth toggles). We also refined the editorial voice concept, injecting distinct tone styles (Academic, Direct, Casual) into the templates to allow for style voting alongside layout voting.

### Defining Constitutional Traits
- **Problem/Goal:** The newspaper needed formal aesthetic guardrails to ensure consistency across evolutionary jumps.
- **Decision:** Established "Fixed Traits" inside `README_AESTHETICS.md` and `evolution/README.md`.
- **Changes:** Mandated 3-second delay hover side drawers, explicit diagnostic telemetry panels, atomic component voting, and reading depth controls.

### Building the Evolution Platform Dashboard
- **Problem/Goal:** Needed a centralized hub to compare, load, and manage aesthetic templates with contextual data.
- **Decision:** Built a dedicated single-page application (`index.html`) using a tabbed interface.
- **Changes:** Created `evolution/index.html` with a "Live Render" tab (iframe preview with Data context selector) and a "Catalog & Scores" tab displaying telemetry on the fitness and voice style of each lineage.

### Implementing Gen 011 Mutations
- **Problem/Goal:** Required new templates that obeyed the constitutional traits and supported dynamic data injection without a backend.
- **Decision:** Developed `gen_011_a_exploit.html` (Solarpunk Refined) and `gen_011_b_explore.html` (Cyber-Terminal).
- **Changes:** Integrated a URL-based internal JavaScript data mock capability supporting different editorial styles (Academic, Direct, Casual), allowing the user to evaluate and vote on the specific voice of the AI alongside the layout.

## Key Decisions
- **Aesthetic Governance:** Muted side panels into 3-second hover triggers to maximize reading focus without losing navigation.
- **Editorial Voice Voting:** Divorced visual layout from writing style, adding explicit UI controls for voting on the editorial tone (Academic/Direct/Casual).
- **Tooling Independence:** Achieved dynamic data context testing entirely on the client side using URL parameters to bypass the need for an active local server during the prototyping phase.

## Files Changed

### Code
| File | Action | Description |
|------|--------|-------------|
| `specs/newspaper/evolution/index.html` | `created` | Built the central dashboard interface with tabs and iframe logic |
| `specs/newspaper/evolution/gen_011_a_exploit.html` | `created` | Created the Solarpunk Exploit mutation with DB injection |
| `specs/newspaper/evolution/gen_011_b_explore.html` | `created` | Created the Cyber-Terminal Explore mutation with DB injection |

### Documents
| Document | Action | Description |
|----------|--------|-------------|
| `specs/newspaper/README_AESTHETICS.md` | `modified` | Added constitutional rules for UI traits |
| `specs/newspaper/evolution/README.md` | `modified` | Documented the Explore/Exploit strategy and genetic traits |
