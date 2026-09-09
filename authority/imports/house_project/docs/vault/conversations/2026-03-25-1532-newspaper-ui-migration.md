---
tags: [frontend, pipeline]
node_type: spec
is_session: true
layer: application
nature: technical
status: active
created: 2026-03-25
timestamp: 2026-03-25T15:32:00-03:00
expires: 2026-05-24
conversation_id: 16de94a5-3bfe-4cbf-837f-974ad51a32a8
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-25

decisions_made: false
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Successfully migrated all 18 legacy UI templates to consume Editor-in-Chief JSON payloads and transmit standardized 8-axis telemetry back to the Darwin Engine."
---

# Newspaper UI Full Migration

**Date:** 2026-03-25 15:32 (UTC-3)
**Tags:** #frontend #pipeline

## Summary

The session successfully migrated the final batch of legacy templates (including `gen_005_explore_cyber_archive.html` through `gen_015`) to natively consume dynamic `Editor-in-Chief` payloads via `window.parent.currentPayload` instead of relying on static hardcoded HTML. At the same time, the primitive and disjointed feedback inputs across all generations were removed and substituted with the universally compliant Protocol v1.0.0 Atomic Evaluator framework (an 8-axis rubric with 1-5 scales and comments). The main orchestrator `index.html` was also updated so that its generic 'fitness' and 'upvote' mechanisms post correct JSON payload structures mimicking the canonical atomic votes.

### Dynamic Payload Migration
- **Problem/Goal:** All initial UI prototypes (`gen_005` to `gen_015`) possessed statically defined editorial columns, titles, and tags. This prevented them from rendering the real daily JSON data from the Editor.
- **Decision:** Establish a generic wrapper (`renderUI()`) iterating over `payload.articles` to inject data directly into the DOM while keeping the layout logic specific to the template version.
- **Changes:** Refactored HTML structure of templates, replacing text nodes with dynamic injections and providing a `mockPayload` fallback.

### Vote Standardization (Protocol v1.0.0)
- **Problem/Goal:** `evolution_server.py` enforces a strict metric/score schema preventing generic "component" and "sentiment" votes. Legacy templates couldn't be parsed.
- **Decision:** Align all templates with the exact 8-axis standard metric array: `editorial_density`, `structure`, `tone`, `form`, `topology`, `visual_entropy`, `interaction_mechanics`, `global_fitness`.
- **Changes:** Universal implementation of the atomic voting grid inside template loop injections and adjustments to `index.html`'s `commitVote()` logic.

Key outputs:
- `gen_*` UI Templates — Now fully integrated with Editor content and Darwin metric extraction.
- `index.html` — Synced payload variables and repaired top-level button metrics.

## Key Decisions

- **Architecture:** `index.html` uses generic names in its UI (like the UPVOTE platform button) but transmits mapped `global_fitness` metrics via `registerAtomicVote()`.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/index.html` | `modified` | Adjusted the Upvote/Commit fitness workflows. |
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/gen_005_explore_cyber_archive.html` | `modified` | Replaced HTML content loops with JS render blocks. |
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/gen_007_structural_split_pane.html` | `modified` | Same. |
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/gen_008_solarpunk_complete.html` | `modified` | Same. |
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/gen_009_a_brutalist.html` | `modified` | Same. |
| `/Users/victorboscaro/house_project/specs/newspaper/evolution/gen_009_b_editorial.html` | `modified` | Same. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `/Users/victorboscaro/house_project/specs/newspaper/agents/info-exchange.md` | `modified` | Logged to the orchestration loop that migration is fully 100% complete and verified. |
