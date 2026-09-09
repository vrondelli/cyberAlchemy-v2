---
tags: [vault, ontology]
node_type: spec
is_session: true
layer: ontology
nature: technical
status: active
created: 2026-03-19
timestamp: 2026-03-19T18:30:00-03:00
expires: 2026-05-18
conversation_id: 1979f97e-2d45-45fc-aa58-e6b6e9b7926a
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: [specs/ontology/ontology-visualization/explorer.template.html]
promoted_candidates: []
expected_importance: 5
importance_rationale: "Implemented 5 gravitational visual enhancements (particles, curvature, hub labels, mass metric, link tooltips) to the ontology explorer, making the physics model visible to the user and establishing the visual foundation for future gravity strategy and 3D navigation work."
version: 0.1.0
last_updated: 2026-03-19
---

# Ontology Visualization — Gravitational Enhancements

**Date:** 2026-03-19 18:30 (UTC-3)
**Tags:** #vault #ontology

## Summary

This session implemented five visual enhancements to the ZefraHub Ontology Explorer that make the gravitational physics model visible and informative to the user. The changes build on the existing mass-based physics system (PageRank + In-degree) by adding directional particles, curved links, persistent hub labels, a Mass metric in the sidebar, and gravitational pull tooltips on link hover.

The session also produced a comparative analysis of three new documents (`discovery-3d-navigation.md`, `discovery-gravity-strategies.md`, `implementation-plan-3d-navigation.md`) against the current implementation, concluding that the axes are orthogonal: this session covered the *visual* layer (making gravity visible), while the new documents propose the *navigation* layer (making gravity explorable) and *alternative mass strategies* (different perspectives on the graph).

Two bugs were discovered and fixed during verification: `.linkCurveRotation()` is a 3D-only API that broke the 2D ForceGraph chain, and the hub aura gradient assumed `rgb()` color format but received hex strings from `nodeColor()`.

The user subsequently removed particles, curvature, and link tooltips from the 2D mode (keeping them only in 3D), and added a guard in `nodeCanvasObject` for nodes not yet positioned by d3.

### Gravitational Visual Enhancements
- **Problem/Goal:** The gravitational physics model was invisible — mass affected layout but the user couldn't see the gravitational pull, flow direction, or mass hierarchy at a glance.
- **Decision:** Implement 5 enhancements: directional particles, curved links, hub labels, Mass metric, link tooltips.
- **Changes:**
  - `linkParticles/Speed/Width` — particle count and speed proportional to combined mass
  - `linkCurvature` — curvature from mass differential (satellite→hub curves more)
  - `nodeCanvasObject` — always-visible labels + radial gradient aura for nodes with `_mass_norm > 0.35`
  - `METRICS_CATALOG` — new Mass entry as first default metric
  - `linkTooltip` — ★-rated gravitational pull with attractor identification

### Comparative Analysis of New Documents
- **Problem/Goal:** Three new documents were added to the visualization spec directory. User wanted to understand overlap and gaps.
- **Decision:** The axes are orthogonal — no conflict. Current session = physics visual layer; new docs = camera navigation + alternative mass strategies.
- **Changes:** Created a comparison artifact analyzing all 3 documents feature by feature.

Key outputs:
- `explorer.template.html` — 5 gravitational visual enhancements
- `comparison_analysis.md` — artifact comparing new docs vs. current implementation

## Key Decisions

- **Hub label threshold at `_mass_norm > 0.35`**: Only the most massive nodes get persistent labels, avoiding label clutter. Lower threshold would show too many; higher would miss important hubs.
- **Particle count 0–4 per link**: Skips links with combined mass < 2 to avoid visual noise on weak connections. Max 4 prevents performance issues.
- **Curvature from mass differential, not absolute mass**: Equal-mass links stay nearly straight (peer-to-peer); asymmetric links curve (orbital trajectory). Range 0.05–0.25.
- **Mass as first default metric**: Prepended to `selectedMetrics` and bumped `STATE_VERSION` to 10 to force cache reset.
- **User removed 2D particles/curvature/tooltips**: Post-implementation UX decision — these effects work better in the 3D space where they don't clutter the 2D canvas.

## Files Changed

### Code

| File | Action | Description |
|------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.template.html` | `modified` | Added 5 gravitational visual enhancements: particle functions, curvature functions, hub labels, Mass metric, link tooltips. Fixed 2D black screen bug (removed 3D-only `.linkCurveRotation()` from 2D chain). Fixed hex color parsing in hub aura gradient. |

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/explorer.html` | `modified` | Regenerated from template with new gravitational enhancements |

## Gaps & Backlog

| Item | Source | Priority | Status |
|------|--------|----------|--------|
| Betweenness centrality (Strategy 2) | `discovery-gravity-strategies.md` | MEDIUM | Not started |
| ForceAtlas2 central gravity (Strategy 4) | `discovery-gravity-strategies.md` | MEDIUM | Not started |
| Epistemic link-type weights (Strategy 5) | `discovery-gravity-strategies.md` | MEDIUM | Not started |
| Strategy selector dropdown + dynamic slider | `discovery-gravity-strategies.md` | MEDIUM | Not started |
| Damping / zoom logarítmico / frustum dinâmico | `implementation-plan-3d-navigation.md` | MEDIUM | Not started |
| Fly-to with Slerp (quaternion arc) | `implementation-plan-3d-navigation.md` | MEDIUM | Not started |
| Keyboard navigation (WASD) | `implementation-plan-3d-navigation.md` | LOW | Not started |
| Auto-orbit | `implementation-plan-3d-navigation.md` | LOW | Not started |
| Orientation gizmo | `implementation-plan-3d-navigation.md` | LOW | Not started |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault-explorer-discovery]] | `refines` | Adds gravitational visual layer to the explorer design |
| [[implementation-plan]] | `implements` | Implements the gravitational physics visualization from the base plan |
| [[discovery-gravity-strategies]] | `contextualizes` | Analyzed overlap — this session covers visual effects; that doc covers alternative mass strategies |
| [[discovery-3d-navigation]] | `contextualizes` | Analyzed overlap — this session covers physics visuals; that doc covers camera navigation |
