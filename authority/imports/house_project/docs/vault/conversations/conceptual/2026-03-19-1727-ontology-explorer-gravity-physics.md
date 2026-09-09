---
tags: [ontology, vault, agents]
node_type: conceptual
is_session: true
layer: ontology
nature: [explanatory, technical]
status: active
created: 2026-03-19
timestamp: 2026-03-19T17:27:00-03:00
expires: 2026-05-18
conversation_id: c853a7dd-3677-43f0-a3f4-2ad8800e2c69
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 6
importance_rationale: "Established mass-based physics and gravitational link visualization for the Ontology Explorer, but introduced a critical 2D rendering regression that blocks the default view — next agent must fix this before proceeding with any visualization work."
user_satisfaction: 4
user_satisfaction_min: 2
user_satisfaction_max: 6
user_satisfaction_std: 1.5
version: 0.1.0
last_updated: 2026-03-19
---

# Ontology Explorer — Gravity Physics, Navigation & 2D Rendering Bug

**Date:** 2026-03-19 17:27 → 18:23 (UTC-3)
**Tags:** #ontology #vault #agents

## Summary

This session attempted to implement a "spacetime gravity" simulation for the Ontology Explorer's graph
visualization. The core idea: documents with high PageRank + In-degree act as gravity wells, attracting
their dependents visually. Multiple approaches were tried — some accepted, most rejected. A UI slider
for Gravitational Constant (G) was added. By the end, a **critical 2D rendering regression** was
introduced and not resolved: the 2D ForceGraph canvas shows as completely black. The 3D graph works
fine. The bug analysis below is the most valuable output of this session for the next agent.

### Topic 1: Mass-Based Physics (Accepted, Working)
- **Problem/Goal:** Make the graph layout express document importance spatially
- **Decision:** `_mass = (PageRank / maxPR * 10) + log(1 + inDegree)`, normalized to `_mass_norm ∈ [0, 1]`
- **Changes:** Added mass computation in `computeMetrics`, `massById` O(1) lookup, `setPhysics()` with mass-based charge strength and link distance, G slider (0.1–4.0)

### Topic 2: Gravitational Beam Links (Accepted, Working in 3D)
- **Decision:** Link width (0.3–2.5px) and opacity (0.08–0.50) scale with combined mass of connected nodes
- **Changes:** Rewrote `linkColor()` and `linkWidth()` to use `massById` lookups

### Topic 3: 3D Aura Effects (Accepted, Working)
- **Decision:** Three.js Additive Blending spheres as auras around nodes with `_mass_norm > 0.15`
- **Changes:** `nodeThreeObject` with `THREE.SphereGeometry` and `THREE.AdditiveBlending`

### Topic 4: Camera Fly-To (Accepted, Working in 3D)
- **Decision:** Smooth LERP camera transition to clicked node in 3D
- **Changes:** `graph3d.cameraPosition()` with 1200ms transition in `onNodeClick`

### Topic 5: Orbital Force (REJECTED — Made Navigation Impossible)
- Implemented tangential d3 force with Kepler speed + perpetual simulation (alphaMin=0)
- User rejected: "muito ruim para navegar" — perpetual motion made exploration impossible
- **Fully reverted:** `orbitalForce()`, `STAR_MAP`, `ADJ`, and `d3AlphaMin(0)` all removed

### Topic 6: Y-Axis Mass Gravity (REJECTED — Collapsed Graph)
- Custom force pushing nodes to Y positions based on mass. Collapsed graph into a vertical spike
- **Fully reverted**

### Topic 7: User's Own Edits (Applied by User, Not Me)
The user manually edited `explorer.template.html` to add:
- Hub glow aura in 2D (`nodeCanvasObject` — radial gradient around high-mass nodes)
- Hub persistent labels (always-on labels for nodes with `_mass_norm > 0.35`)
- Link curvature, particles, curve rotation, tooltips with gravitational pull star rating
- Mass metric in `METRICS_CATALOG`
- STATE_VERSION bumped to 10
- All of these were also manually replicated into `explorer.html`

## ⚠️ CRITICAL BUG: 2D ForceGraph Renders Black Canvas

**Status:** UNRESOLVED. This is the #1 priority for the next agent.

### Symptoms
- The 2D canvas is created, correctly sized, and injected into `#graph-container`
- The canvas is entirely black — zero nodes, zero links rendered
- `nodeCanvasObject` is **never called** by the ForceGraph render loop
- Manual canvas drawing (e.g., `ctx.fillRect`) works — the canvas element is functional
- No JavaScript errors appear in the console
- 3D mode works perfectly in the same session — toggling to 3D shows the full graph
- The issue persists across fresh page loads with cleared localStorage

### What Was Tried (All Failed)
1. Removed `linkCurvature`, `linkDirectionalParticles`, `linkParticleSpeed`, `linkParticleWidth`, `linkDirectionalParticleColor`, `linkLabel` from 2D init → **Still broken**
2. Called `graph2d.zoomToFit()` → No effect
3. Called `graph2d.resumeAnimation()` → No effect
4. Called `updateGraph(true)` to force reinit → No effect
5. Cleared localStorage, hard refreshed → No effect
6. Added coordinate guard (`if (node.x === undefined) return`) → Not tested yet

### Diagnostic Clues
- `graph2d.d3Alpha` is **not a function** — this is unusual. On a properly initialized ForceGraph, this should exist. Suggests the `graph2d` object might be in a broken state.
- `graph2d.refresh` is **not a function** — same pattern.
- The render frame counter (injected via onRenderFramePost hook) shows 0 calls — the ForceGraph animation loop is not running at all.
- Pre-render counter also shows 0 — the internal `_tick` function never fires.

### Root Cause Hypothesis (NOT CONFIRMED)
The `ForceGraph()(container)` chain is failing silently. One possibility:
1. **Three.js interference:** `three@0.158.0` is loaded globally before `force-graph@1.43.5`. Three.js defines a `THREE` global that might shadow or pollute some Canvas2D-related functionality that force-graph expects.
2. **Method chain break:** Some method in the `.nodeLabel().nodeVal()...` chain might not exist in `force-graph@1.43.5`, returning `undefined` instead of `this`. This would cause `graph2d` to be `undefined` or a partial object.
3. **Container timing:** The `container.innerHTML = ''` before init might cause the ForceGraph to fail to find or attach to the DOM node correctly.

### Recommended Debug Strategy for Next Agent
1. **Bisect the chain:** Start with a minimal `ForceGraph()(container).graphData(data)` — no `.nodeLabel`, no `.nodeCanvasObject`, nothing. Does it render? If yes, add methods one by one until it breaks.
2. **Check library version:** Try loading `force-graph@1.44` or `@latest` instead of `@1.43.5` — the 2D library might have a bug fixed in newer versions.
3. **Check if Three.js is the culprit:** Move the Three.js `<script>` import to after the ForceGraph import, or load it conditionally only in 3D mode.
4. **Compare with a working state:** `git diff` the template against the last known working commit to identify exactly which line broke 2D.

## Key Decisions

- **Mass = PageRank + log(1 + InDegree):** Combines recursive influence with structural in-degree
- **No perpetual animation:** Orbits were rejected. Gravity is structural (layout) + visual (link beams, auras)
- **Camera fly-to over orbit:** Direct camera transitions are more useful for exploration
- **G slider (0.1–4.0):** User-controllable gravitational constant affecting all physics

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Mass computation, G slider, setPhysics, link gravitational beams, camera fly-to, 3D auras, coordinate guard. Removed: hub rings, orbital force, Y-gravity, link particles from 2D |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated from template + user manual edits (hub auras, particles, curvature, tooltips, Mass metric, new vault nodes in graph data) |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `gravity_physics_concept.md` (artifact) | `created` | Conceptual document proposing spacetime gravity model |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| **2D ForceGraph renders black canvas** | This session | ⚠️ HIGH | UNRESOLVED — blocks default view |
| 3D navigation controls (WASD keyboard) | Observation | LOW | Not started |
| 130+ unresolved wikilinks in parser | Parser logs | LOW | Known issue |
| Y-axis mass gradient idea needs subtler approach | User feedback | MEDIUM | Deferred |

## Open Questions

- Why does `graph2d.d3Alpha` not exist on the initialized object?
- Is Three.js's global `THREE` polluting something the 2D force-graph needs?
- Would upgrading `force-graph` from 1.43.5 to latest fix the render loop?
- Should we move Three.js to a dynamic import only loaded when 3D is activated?

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `contextualizes` | Node type colors and labels used for visualization |
| [[vault/ontology-axioms.md]] | `contextualizes` | Axioms are the highest-mass nodes in the gravity model |
