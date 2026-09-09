---
tags: [ontology, visualization]
node_type: spec
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T19:40:00-03:00
expires: 2026-05-18
conversation_id: 5dc01a30-558c-48d0-b114-45ac37e26093
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/ontology-visualization/explorer.template.html]
promoted_candidates: []
expected_importance: 4
importance_rationale: "Implemented progressive label reveal, link visibility tuning, pin markers, and 3D zoom recentering — all UX polish for the existing ontology explorer with no architectural impact."
version: 0.1.0
last_updated: 2026-03-19
---

# Progressive Labels, Link Visibility, Pin Markers & 3D Zoom Recentering

**Date:** 2026-03-19 19:40 (UTC-3)
**Tags:** #ontology #visualization

## Summary

This session implemented four UX improvements to the Ontology Explorer visualization in `explorer.template.html`, based on the proposals in `discovery-progressive-labels.md`. The work focused on making the graph more readable and navigable at different zoom levels in both 2D and 3D modes.

The main changes were: (1) progressive zoom-based label reveal replacing the binary hub threshold, (2) intelligent word-wrapping for long node labels, (3) improved link visibility for low-connection nodes, (4) a toggleable pin marker for spatial orientation, and (5) automatic orbit target recentering when zooming in 3D.

### Progressive Label Reveal
- **Problem/Goal:** Labels were either always visible (for hubs) or invisible (for everything else), causing clutter at zoom-out and missing information at zoom-in.
- **Decision:** Replace the binary `isHub` threshold with a continuous `labelScore = _mass_norm × globalScale` formula. Labels appear when `labelScore > 0.6` (the `LABEL_THRESHOLD` constant), with a smooth fade-in over a `LABEL_FADE_RANGE` of 0.4.
- **Changes:** Rewrote `nodeCanvasObject` label logic in 2D. Added SpriteText labels in 3D via `nodeThreeObject` returning `THREE.Group` with aura + label sprite. 3D label opacity controlled in `startCameraLoop` based on camera distance.

### Intelligent Word-Wrapping
- **Problem/Goal:** Long node labels (e.g., "implementation plan complementary table registration") overflowed their node boundaries.
- **Decision:** Add `wrapText()` (canvas-measured, for 2D) and `wrapTextSimple()` (character-count, for 3D SpriteText) utility functions. Max 3 lines with ellipsis truncation.
- **Changes:** Added both utility functions. Integrated into `nodeCanvasObject` and SpriteText sprite creation.

### Link Visibility for Low-Connection Nodes
- **Problem/Goal:** Links between low-mass nodes were nearly invisible (alpha 0.08, width 0.3px), especially in 3D with perspective.
- **Decision:** Raise the floor opacity from 0.08 to 0.25 and the floor width from 0.3 to 1.0. High-mass link appearance remains essentially unchanged.
- **Changes:** Modified `linkColor()` (alpha range 0.25–0.55) and `linkWidth()` (width range 1.0–2.8).

### Pin Marker (Toggle)
- **Problem/Goal:** User wanted a way to place a visible anchor point on the canvas for spatial orientation while navigating.
- **Decision:** Single toggle pin — click background to place, click again to remove. Only one pin exists at a time. In 2D: rendered as orange crosshair with 📌 icon via `onRenderFramePost`. In 3D: rendered as a `THREE.RingGeometry` mesh.
- **Changes:** Added `pinMarker`, `clearPin()`, `togglePin2D()`, `togglePin3D()`, `drawPin2D()` functions. Changed `onBackgroundClick` from clearing focus to placing/removing pin. Right-click clears focus + pin.

### 3D Zoom Target Recentering
- **Problem/Goal:** When zooming into a dense cluster in 3D, the orbit center stayed at the graph centroid, making rotation feel disconnected from the zoomed area.
- **Decision:** On zoom-in, raycast the cursor position and blend the orbit target toward it (8% lerp per wheel tick). Zoom-out keeps the current target.
- **Changes:** Modified the custom wheel handler in the 3D `OrbitControls` setup.

Key outputs:
- `explorer.template.html` — all changes applied here
- `discovery-progressive-labels.md` — status updated to `consolidated`

## Key Decisions

- **Progressive reveal threshold:** `LABEL_THRESHOLD = 0.6` with `LABEL_FADE_RANGE = 0.4` — chosen to show only top 3–5 hubs at default zoom while revealing medium nodes at moderate zoom.
- **Link opacity floor 0.25:** Tripled from 0.08 to ensure low-connection links are clearly visible without overpowering the gravitational brightness gradient.
- **Single pin marker:** User explicitly requested only one pin at a time with toggle behavior, replacing an earlier multi-pin design.
- **3D zoom recentering blend factor 0.08:** Subtle enough that single scroll ticks don't jerk the camera but cumulative scrolls smoothly shift the orbit target.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Progressive labels (2D + 3D), word-wrapping, link visibility, pin markers, 3D zoom recentering |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated from template |
| `specs/ontology/ontology-visualization/graph_data.json` | `modified` | Regenerated graph data |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/discovery-progressive-labels.md` | `modified` | Status updated from `draft` to `consolidated`, veracidade `medium` → `high`, version `0.1.0` → `1.0.0` |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[ontology/ontology-visualization/discovery-progressive-labels.md]] | `implements` | Implemented all proposals from this discovery document |
| [[ontology/ontology-visualization/implementation-plan.md]] | `refines` | Added progressive labels and pin markers to the explorer specified here |
| [[ontology/ontology-visualization/vault-explorer-discovery.md]] | `contextualizes` | Extends the original explorer design with label and navigation improvements |
