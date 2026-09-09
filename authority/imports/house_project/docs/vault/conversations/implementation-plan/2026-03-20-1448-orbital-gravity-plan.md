---
tags: [ontology, visualization, physics]
node_type: implementation-plan
is_session: true
layer: ontology
nature: [technical, explanatory]
status: active
created: 2026-03-20
timestamp: 2026-03-20T14:48:00-03:00
expires: 2026-05-19
conversation_id: dd01a4cc-2ec0-4275-8d3e-304b90b80323
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-04-07

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/ontology-visualization/discovery-gravity-strategies.md]
promoted_candidates: []
expected_importance: 6
importance_rationale: "Designed and documented a new Hierarchical Orbital Gravity strategy for the ontology visualization, addressing node clustering via mass differentials."
---

# Orbital Gravity Implementation Plan

**Date:** 2026-03-20 14:48 (UTC-3)
**Tags:** #ontology #visualization #physics

## Summary

This session focused on improving the graph spatial layout for the Ontology Visualization Explorer. The user requested that the vertical distance on 3D planes for heavy objects be mathematically expanded to avoid visual overlap. We implemented this by calculating dynamic Z-axis gaps proportional to the maximum mass of an ontology layer. 

Subsequently, the user proposed a conceptual layout enhancement: "Hierarchical Orbital Gravity". In this model, heavy objects attract lighter objects into orbit, while massive hubs interact loosely to remain separated. We conceptually validated the mechanics using the `d3-force-3d` engine, created a detailed implementation plan for evaluating this strategy, and updated the discovery spec to reflect "Strategy 6". The session was closed safely reflecting these new architectural guidelines.

### Dynamic Z-Axis Distances
- **Problem/Goal:** Heavy hubs were rendering too close to nodes on adjacent Z-layers when 3D Shelves mode was enabled, causing cluster overlap.
- **Decision:** Distance between planes should scale dynamically with the sum of the maximum node mass on each separated plane.
- **Changes:** Rewrote the `updateGraph` layout generation in `explorer.template.html` to pre-calculate accumulative `SHELF_GAP` using layer mass density equations. Added `README.md` documentation.

### Hierarchical Orbital Gravity Design
- **Problem/Goal:** The user desired a mechanism where heavy objects create literal gravitational fields.
- **Decision:** Use a combination of mass-differential link springs and target-oriented structural forces, saving the design as an implementation plan for future work.
- **Changes:** Wrote `implementation-plan-orbital-gravity.md` and appended "Strategy 6" directly into `discovery-gravity-strategies.md`.

## Key Decisions
- **Z-Axis Gap Scaling:** Multiply max mass by an arbitrary intensity factor (4) capped at 300 extra coordinates to achieve discernible gaps without clipping the camera frustum.
- **New Gravity Perspective:** Accepted the celestial mechanics conceptual model to map semantic distance to physical grouping forces.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Augmented Z-axis placement math and camera frustum range to resolve clustering overlap on shelf layers. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/README.md` | `created` | Baseline configuration mapping for humans and agents. |
| `specs/ontology/ontology-visualization/implementation-plan-orbital-gravity.md` | `created` | Step-by-step logic requirements for introducing Strategy 6 into the explorer's force simulation. |
| `specs/ontology/ontology-visualization/discovery-gravity-strategies.md` | `modified` | Cataloged the new Hierarchical Orbital Gravity strategy and comparison matrix. |
