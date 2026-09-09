---
tags: [vault, ontology, visualization]
node_type: spec
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T18:33:05-03:00
expires: 2026-05-18
conversation_id: 28fd89c4-423f-49fa-b96a-3531ceac4eea
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: [specs/ontology/ontology-visualization/discovery-progressive-labels.md]
expected_importance: 6
importance_rationale: "Implemented 5 selectable gravity strategies with Brandes betweenness, advanced 3D camera controller (Slerp fly-to, log zoom, keyboard nav, auto-orbit), and mass-proportional collision — these shape how the entire vault ontology is spatially explored."
version: 0.1.0
last_updated: 2026-03-19
---

# Camera & Gravity Improvements for Ontology Explorer

**Date:** 2026-03-19 18:33 (UTC-3)
**Tags:** #vault #ontology #visualization

## Summary

This session implemented two major enhancement tracks for the ZefraHub Ontology Explorer: an advanced 3D camera controller and a selectable gravity strategy engine. Both were designed following discovery documents produced in prior sessions (`discovery-3d-navigation.md` and `discovery-gravity-strategies.md`).

The camera controller replaces the default Three.js `OrbitControls` behavior with damped rotation, logarithmic zoom, dynamic frustum management, Slerp-based fly-to transitions, full WASD keyboard navigation, and an auto-orbit mode. The gravity strategy engine introduces 5 selectable mass formulas — including Brandes' betweenness centrality algorithm — with a dropdown UI and dynamic per-strategy parameter slider. A mass-proportional collision force was added to prevent heavy nodes from overlapping in dense regions. Post-implementation, keyboard navigation was refined: Space/Shift vertical directions were swapped per user feedback, `preventDefault` was added for all navigation keys to stop browser defaults (Space scrolling), and WASD panning was extended to work in 2D mode via `graph2d.centerAt()`.

The session also produced a graph design techniques audit comparing the Explorer against 12 industry-standard graph visualization techniques, identifying zoom-based progressive label reveal as the highest-value missing technique. A discovery document for progressive label reveal and intelligent word-wrapping was written as the follow-up.

### 3D Camera Controller
- **Problem/Goal:** Default `OrbitControls` provided no damping, linear zoom, basic fly-to, and no keyboard navigation.
- **Decision:** Implement all improvements inline in `explorer.template.html` without forking libraries.
- **Changes:** Added `updateFrustum()`, `flyToNode()` with `THREE.Quaternion.slerp()`, `processKeyboardInput()` (WASD/QE/Space/Shift/R/F), `processAutoOrbit()`, `startCameraLoop()`, logarithmic wheel zoom handler, zoom level HUD badge, and keyboard hint overlay.

### Gravity Strategy Engine
- **Problem/Goal:** Mass computation was hardcoded to PageRank + In-degree. No way to explore alternative structural perspectives.
- **Decision:** Implement 5 strategies with a dropdown selector and dynamic parameter slider.
- **Changes:** Added Brandes' betweenness centrality (O(V·E)), weighted link types for epistemic curvature, `GRAVITY_STRATEGIES` array, `recalculateMass()`, ForceAtlas2 radial gravity via `d3.forceRadial()`, strategy dropdown and parameter slider in UI, STATE_VERSION bumped to 11.

### Mass-Proportional Collision Force
- **Problem/Goal:** Heavy nodes clustered together in dense regions, making labels and auras overlap.
- **Decision:** Add `d3.forceCollide` with mass-proportional radii plus increased link distance floor for heavy-heavy edges.
- **Changes:** Collision radius scales as `5 + massNorm * 55 * √G`, heavy edges get `minMass * 15` floor distance bonus.

### Graph Design Techniques Audit
- **Problem/Goal:** User shared a reference framework of 12 graph design techniques and wanted to know which we apply.
- **Decision:** Produced an analysis artifact mapping each technique to current implementation status.
- **Changes:** Created `graph_design_techniques_audit.md` identifying progressive label reveal as the #1 missing technique.

### Discovery — Progressive Label Reveal
- **Problem/Goal:** Binary hub/non-hub label system doesn't adapt to zoom level, causing clutter at zoom-out and hidden information at zoom-in.
- **Decision:** Wrote a discovery document proposing zoom-based progressive reveal and intelligent word-wrapping.
- **Changes:** Created `discovery-progressive-labels.md` with implementation plans for both 2D canvas and 3D sprites.

### Keyboard Navigation Fixes
- **Problem/Goal:** Space key scrolled the page instead of moving down. Shift did nothing. WASD only worked in 3D, not 2D.
- **Decision:** Add `preventDefault` for all navigation keys, swap Space/Shift directions, extend WASD to 2D.
- **Changes:** Added `NAV_KEYS` set with `preventDefault`, swapped Space (↓) / Shift (↑) directions, added 2D panning branch in `processKeyboardInput()` using `graph2d.centerAt()`, started animation loop in 2D mode, adaptive keyboard hint text per mode.

Key outputs:
- `explorer.template.html` — all camera + gravity + keyboard changes
- `explorer.html` — regenerated from template via `explorer.py`
- `discovery-progressive-labels.md` — discovery for next iteration
- `graph_design_techniques_audit.md` — analysis artifact (in brain/)

## Key Decisions

- **Camera: Slerp over linear fly-to** — quaternion arc interpolation prevents the camera from cutting through the graph during transitions.
- **Camera: custom wheel zoom over OrbitControls zoom** — logarithmic scaling gives precision near clusters and speed when far away.
- **Gravity: 5 strategies, not 3** — included ForceAtlas2 (central gravity) and Epistemic Curvature (weighted link types) in addition to the three originally proposed.
- **Collision: mass-proportional radii** — using `d3.forceCollide` instead of increasing charge strength to avoid over-expanding the entire graph when only dense pockets need separation.
- **Keyboard: Space=down, Shift=up** — swapped from initial implementation after user testing revealed the directions felt inverted.
- **Keyboard: WASD in 2D** — extended panning to 2D mode via `graph2d.centerAt()` since the 2D graph also benefits from keyboard navigation.
- **Progressive labels deferred** — identified as highest-value missing technique but scoped into a separate discovery/implementation cycle.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Added camera controller (Slerp, log zoom, frustum, keyboard nav, auto-orbit, HUD), gravity strategies engine (5 strategies, betweenness centrality, UI controls, ForceAtlas2 radial), mass-proportional collision force, STATE_VERSION bump to 11 |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated from template via `explorer.py` |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/discovery-progressive-labels.md` | `created` | Discovery for zoom-based progressive label reveal and intelligent word-wrapping |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Zoom-based progressive label reveal | Graph design audit | ⚠️ HIGH | Discovery written, awaiting implementation |
| Intelligent word-wrapping for long labels | Graph design audit | MEDIUM | Discovery written, awaiting implementation |
| 3D persistent label sprites | Discovery | MEDIUM | Design proposed but not implemented |
| Label overlap suppression heuristic | Discovery | LOW | Identified as mitigation for dense clusters |

## Open Questions

- Should the label visibility threshold (0.6) be exposed as a UI slider, or is a fixed tunable sufficient?
- For 3D labels, should we use `SpriteText` or `CSS2DRenderer`? SpriteText is simpler but CSS2D gives better text quality.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology/ontology-visualization/discovery-3d-navigation.md]] | `implements` | Implemented all proposed camera improvements (damping, Slerp, log zoom, frustum, keyboard, auto-orbit) |
| [[ontology/ontology-visualization/discovery-gravity-strategies.md]] | `implements` | Implemented all 5 gravity strategies with UI selector |
| [[ontology/ontology-visualization/discovery-progressive-labels.md]] | `contextualizes` | Produced discovery doc as next-step output from graph design audit |
