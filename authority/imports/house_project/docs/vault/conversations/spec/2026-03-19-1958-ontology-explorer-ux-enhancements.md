---
tags: [ontology, frontend, visualization]
node_type: spec
is_session: true
layer:[[ontology, application]]
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T19:58:06-03:00
expires: 2026-05-18
conversation_id: e6f002bd-618b-4160-8ed1-68f1f4592054
# --- Structured fields for Bayesian consumption ---
version: 0.1.0
last_updated: 2026-03-19

decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 4
importance_rationale: "Implemented UX enhancements for the ontology 3D explorer, including trackpad gestures for navigation, more prominent progressive labels, and inline document description fetching."
---

# Ontology Explorer UX Enhancements

**Date:** 2026-03-19 19:58 (UTC-3)
**Tags:** #ontology #frontend #visualization

## Summary

This session focused on improving the user experience of the 3D ontology visualization. The primary goal was to make navigation more intuitive for notebook trackpad users, who represent the primary interaction paradigm. We also improved the legibility and discovery of nodes in the graph by tuning how their labels render at different zoom levels and adding contextual descriptions to the sidebar. We modified the main viewer HTML (and its template) to handle new interactions without introducing new heavyweight dependencies.

### 3D Trackpad Navigation
- **Problem/Goal:** 3D OrbitControls default to mouse-based interactions that are clunky on a trackpad (two-finger scroll pans the camera instead of zooming or rotating).
- **Decision:** Repurpose `controls.touches` for two-finger drag to rotate, and implement a hybrid pinch-to-zoom detection using `e.ctrlKey` (Firefox/Chrome heuristic) and explicit `gesture` events for Safari.
- **Changes:** Updated `explorer.template.html` and `explorer.html` to remap `controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }`. Replaced standard wheel-zoom with logic that differentiates between typical scroll (pan/orbit) and pinch gesture (zoom), adjusting zoom sensitivity accordingly.

### Progressive Label Tuning
- **Problem/Goal:** Node labels were too small, faded in too late during zoom sequences, and didn't display for enough nodes, making discovery harder.
- **Decision:** Lower the mass thresholds required for a text sprite to render and increase the text weight and opacity so they pop earlier.
- **Changes:** Tuned the visualization constants: lowered `LABEL_THRESHOLD` from `0.6` to `0.25`, `MIN_MASS_FOR_LABEL` from `0.05` to `0.02`, increased `hubFontSize`, and raised the `baseAlpha` from `0.3` to `0.5`.

### Inline Node Descriptions
- **Problem/Goal:** Clicking a node opened the sidebar with high-level metrics, but users still had to completely open the document modal to know what the document was actually about.
- **Decision:** Fetch and display a brief summary (first meaningful paragraph) of the document directly in the sidebar as soon as a node is focused.
- **Changes:** Added an asynchronous fetch in `openSidebar()` that resolves the node's markdown path, strips out YAML frontmatter and titles, finds the first non-empty text paragraph, truncates it to ~200 characters, and injects it below the "View Document" button.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Implemented gestures, label rendering constants, and async description fetch. |
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Generated file synced with template modifications. |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault/ontology-conventions.md]] | `updates` | Implements visualization improvements for the ontology ecosystem. |
