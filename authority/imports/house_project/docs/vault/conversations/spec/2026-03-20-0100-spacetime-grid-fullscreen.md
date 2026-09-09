---
tags: [vault, visualization, physics, spacetime]
node_type: spec
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-20
timestamp: 2026-03-20T01:01:00-03:00
expires: 2026-05-19
conversation_id: df036658-3294-4b7a-ab91-2840bcd50a04
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-20

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/ontology-visualization/discovery-spacetime-grid.md]
promoted_candidates: []
expected_importance: 5
importance_rationale: "First implementation of spacetime grid visualization — a new physics-based visual primitive for the ontology explorer that makes gravitational field topology visible, with a known positioning issue documented for follow-up."
---

# Spacetime Grid Implementation & Fullscreen Fix

**Date:** 2026-03-20 01:01 (UTC-3)
**Tags:** #vault #visualization #physics #spacetime

## Summary

This session implemented two features for the ontology explorer visualization. First, the fullscreen button was fixed so that entering fullscreen mode hides all UI overlays (left panel, sidebar, legend, stats HUD, keyboard hints, toggle buttons) and displays only the graph. Second, the 3D spacetime grid feature from `discovery-spacetime-grid.md` was implemented — a deformable wireframe mesh below the graph that sinks under massive nodes to visualize gravitational potential wells. The user also made independent improvements to the auto-orbit system (manual turntable rotation) and added a smooth camera center-shift feature. The spacetime grid has a known positioning issue where the mesh doesn't align with node positions due to fixed Y placement and incomplete extent calculation. A detailed fix plan was documented in the implementation plan.

### Fullscreen Fix
- **Problem/Goal:** The fullscreen button only made the `#canvas` div fullscreen, but HUD elements inside it (stats, zoom-level, keyboard-hint, focus-hint) remained visible
- **Decision:** Fullscreen the entire `document.documentElement` instead of just `#canvas`, and use a CSS class (`fullscreen-clean`) to hide all overlays
- **Changes:** Added `fullscreen-clean` CSS rules, modified `toggleFullscreen()` to add/remove the class and close sidebar/doc-modal on enter, added cleanup on `fullscreenchange` exit event

### 3D Spacetime Grid
- **Problem/Goal:** The gravitational field is invisible — users see the effects of gravity (node sizes, clustering) but not the field topology itself
- **Decision:** Implement as a 3D wireframe `PlaneGeometry` (50×50 subdivisions) below the graph, with vertices displaced downward by gravitational potential Φ = -G × Σ(m_i / (dist + ε))
- **Changes:** Added `createSpacetimeMesh()`, `removeSpacetimeMesh()`, `updateSpacetimeDeformation()`, `toggleSpacetimeGrid()` functions; toggle checkbox in control panel (3D-only, purple accent); `showSpacetimeGrid` state; proper cleanup on graph reinit; 500ms update interval with truncation radius optimization

### Known Issue: Grid-Node Alignment
- **Problem:** The mesh sits at fixed `Y = -80` while force-graph-3d scatters nodes across all Y values. Grid extent only considers X/Z, not the full 3D scatter
- **Fix plan documented:** Dynamic Y positioning (below lowest node), 3-axis extent calculation, per-cycle Y repositioning

Key outputs:
- `explorer.template.html` — fullscreen fix + spacetime grid implementation
- `discovery-spacetime-grid.md` — updated to in-progress v0.2.0 with implementation status
- Implementation plan — documented grid-node alignment fix

## Key Decisions

- **Fullscreen scope:** Fullscreen the entire page (not just canvas) with a CSS class to hide overlays, rather than restructuring the DOM
- **3D-only:** Spacetime grid is 3D-only per user request — no 2D heatmap implementation
- **Grid below nodes:** Mesh positioned below the graph to create the rubber-sheet illusion (answered open question #1 in discovery doc)
- **Softening constant ε=25:** Prevents singularities at node centers without flattening the wells too much
- **50×50 subdivisions:** Balance between visual detail and performance with ~200 nodes

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Added fullscreen-clean CSS, modified toggleFullscreen(), added spacetime grid module (create/remove/update/toggle), toggle HTML, state, and buildControlPanel wiring |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated from template |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/discovery-spacetime-grid.md` | `modified` | Updated status to in-progress, bumped to v0.2.0, added implementation status section, answered open question #1 |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Grid-node Y alignment fix | User feedback | ⚠️ HIGH | Documented in implementation plan |
| 2D heatmap mode | discovery-spacetime-grid.md | MEDIUM | Deferred per user preference |
| Animated deformation (gravitational waves) | discovery-spacetime-grid.md open question #2 | LOW | Not started |
| Shelf interaction with grid | discovery-spacetime-grid.md open question #3 | LOW | Not started |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[discovery-spacetime-grid]] | `implements` | Implemented the 3D wireframe mesh from this discovery spec |
| [[vault-explorer-discovery]] | `refines` | Extended the explorer with fullscreen clean mode and spacetime grid toggle |
