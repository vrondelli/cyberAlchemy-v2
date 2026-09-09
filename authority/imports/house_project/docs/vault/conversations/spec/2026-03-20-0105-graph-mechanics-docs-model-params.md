---
tags: [ontology, vault]
node_type: spec
is_session: true
layer: ontology
nature: [explanatory, technical]
status: active
created: 2026-03-20
timestamp: 2026-03-20T01:05:00-03:00
expires: 2026-05-19
conversation_id: e845f240-62c1-48d2-beb9-89180a5b3a2d
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/ontology-visualization/graph-mechanics.md]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Created the authoritative reference doc for all graph visualization mechanics and added mass exponent parameter + strategy explanation modals, but impact is localized to the explorer tool."
version: 0.1.0
last_updated: 2026-03-20
---

# Graph Mechanics Documentation & Model Parameters

**Date:** 2026-03-20 01:05 (UTC-3)
**Tags:** #ontology #vault

## Summary

This session produced the authoritative reference document for the Ontology Explorer's visualization mechanics and added two new features to the explorer: a configurable mass exponent parameter and per-strategy explanation modals. The session began with the user asking for an explanation of how auto-orbit works, expanded into a full documentation effort covering all implemented mechanics, then evolved into a conceptual discussion about whether the physics model is truly "gravitational" (it's not — it's electrostatic repulsion + springs that produces emergent centrality resembling gravity). This distinction was documented formally. The user then requested a Model Parameters UI section, strategy explanations accessible from the UI, and updates to the reference doc.

### Auto-Orbit Mechanics Explanation
- **Problem/Goal:** User wanted a clear explanation of how auto-orbit works in 3D mode
- **Decision:** Document all graph visualization mechanics in a single reference file
- **Changes:** Created `graph-mechanics.md` covering physics, visual rendering, camera, shelves, filtering, and UI behaviors. User then edited the auto-orbit section to clarify XZ-plane rotation vs quaternion rotation, added camera center shift section, and expanded UI behavior sections.

### Electrostatic vs Gravitational Model
- **Problem/Goal:** User observed that the model uses repulsion (not attraction) for mass, questioning whether we're actually modeling gravity
- **Decision:** Documented the distinction clearly — the model is electrostatic (all-repulsion + springs), but emergent behavior mimics gravity. The metaphor is kept for intuitive communication.
- **Changes:** Added §1.0 "The Electrostatic Analogy" to `graph-mechanics.md` with a comparison table.

### Mass Exponent Parameter
- **Problem/Goal:** User wanted to control how dramatically heavy nodes dominate the layout (linear vs quadratic mass scaling)
- **Decision:** Added `massExponent` parameter (0.5–2.0) that raises mass to a configurable power in charge and collision formulas
- **Changes:** Modified `setPhysics()` to use `Math.pow(mass, exp)`, added collapsible "⚙ Model Parameters" UI section with slider, wired state persistence, bumped STATE_VERSION to 12.

### Strategy Explanation Modals
- **Problem/Goal:** User wanted hover tooltips and click-to-view detailed explanations for each gravity strategy
- **Decision:** Hover shows tooltip summary on dropdown options; ⓘ button opens the doc-modal with three-tier explanation (Summary → How It Works → Technical Details)
- **Changes:** Added `tooltip` and `explanation` objects to all 5 `GRAVITY_STRATEGIES` entries, created `openStrategyExplanation()` function, added ⓘ button next to Layout Strategy dropdown.

Key outputs:
- `graph-mechanics.md` — Full reference document for all visualization mechanics
- `explorer.template.html` — Model Parameters UI, mass exponent slider, strategy explanations

## Key Decisions

- **Physics model naming:** The model is electrostatic (repulsion + springs), not gravitational. The "gravity" metaphor is kept for UX intuition.
- **Mass exponent range:** 0.5–2.0, allowing sub-linear (egalitarian) to quadratic (dominant hierarchy) layouts.
- **Strategy explanation format:** Hover tooltip on dropdown for quick reference + ⓘ button opening the doc-modal for full three-tier explanation.
- **ForceAtlas2 preference:** User expressed preference for ForceAtlas2 as a favorite strategy.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Added mass exponent parameter to `setPhysics()`, Model Parameters collapsible UI, strategy info button, `openStrategyExplanation()` function, tooltip/explanation data on all 5 strategies, bumped STATE_VERSION to 12 |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/graph-mechanics.md` | `created` | Authoritative reference for all graph visualization mechanics — physics, rendering, camera, interaction, filtering |
| `specs/ontology/ontology-visualization/vault-explorer-discovery.md` | `already up-to-date` | Already references graph-mechanics.md (line 29) |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology/ontology-visualization/vault-explorer-discovery.md]] | `refines` | graph-mechanics.md provides the detailed runtime specification that vault-explorer-discovery.md references |
| [[ontology/ontology-visualization/discovery-gravity-strategies.md]] | `contextualizes` | The gravity strategies documented here were first explored in the discovery doc |
