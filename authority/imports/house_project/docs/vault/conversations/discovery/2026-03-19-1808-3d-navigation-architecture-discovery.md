---
tags: [ontology, vault, visualization]
node_type: discovery
is_session: true
layer: ontology
nature: [explanatory, technical]
status: active
created: 2026-03-19
timestamp: 2026-03-19T18:08:51-03:00
expires: 2026-05-18
conversation_id: 7896e80e-be01-4ef4-a324-9540db6c2dfd
decisions_made: true
contradictions_found: false
contradictions_resolved: false
specs_updated: []
promoted_candidates: []
expected_importance: 5
importance_rationale: "Produced a detailed discovery and 6-phase implementation plan for quaternion-based 3D navigation in the Ontology Explorer, establishing the technical approach for camera controller, Slerp fly-to, damping, logarithmic zoom, keyboard nav, and frustum management."
version: 0.1.0
last_updated: 2026-03-19
---

# 3D Navigation Architecture — Discovery & Implementation Plan

**Date:** 2026-03-19 18:08 (UTC-3)
**Tags:** #ontology #vault #visualization

## Summary

This session analyzed whether the principles of 3D Spatial Navigation Architecture (synthetic camera model, quaternions, Slerp, damping, logarithmic zoom, frustum management) apply to the existing ZefraHub Ontology Explorer. The Explorer currently uses `3d-force-graph` (wrapping Three.js `OrbitControls`) with basic Euler-angle derived spherical coordinates, no meaningful damping, linear zoom, linear fly-to interpolation, and fixed frustum planes.

The conclusion was that **all principles are directly applicable** — the current navigation UX has 5 concrete diagnosed problems (gimbal lock risk, robotic movement, imprecise zoom, fly-to cutting through the graph, and clipping of distant shelved nodes) that the proposed architecture solves using APIs already available in Three.js r158 without changing libraries or adding dependencies.

Two documents were produced:

### Discovery — Diagnosis and Applicability Analysis
- **Problem/Goal:** Evaluate whether 3D spatial navigation theory applies to the current Explorer codebase
- **Decision:** All 5 principles (quaternions, Slerp, damping, logarithmic zoom, dynamic frustum) are directly applicable and implementable on the existing Three.js APIs
- **Changes:** Created `specs/ontology/ontology-visualization/discovery-3d-navigation.md` with full diagnosis of current problems, theory mapping, and applicability conclusion

### Implementation Plan — 6-Phase Technical Roadmap
- **Problem/Goal:** Define a concrete implementation strategy with code-level detail
- **Decision:** 6-phase approach: (1) Camera Controller with damping + log zoom + dynamic frustum, (2) Slerp fly-to, (3) WASD keyboard navigation, (4) Auto-orbit, (5) Unified animation loop, (6) HUD indicators
- **Changes:** Created `specs/ontology/ontology-visualization/implementation-plan-3d-navigation.md` with detailed code snippets for each phase

Key outputs:
- `specs/ontology/ontology-visualization/discovery-3d-navigation.md` — Discovery document with diagnosis and theory mapping
- `specs/ontology/ontology-visualization/implementation-plan-3d-navigation.md` — 6-phase implementation plan with code details

## Key Decisions

- **Quaternions for rotation:** Replace OrbitControls spherical coordinates with quaternion-based rotation via `THREE.Quaternion` to avoid gimbal lock
- **Slerp for fly-to:** Replace linear `cameraPosition()` interpolation with `THREE.Quaternion.slerp()` for smooth arc transitions
- **Logarithmic zoom:** Disable OrbitControls zoom and implement custom scroll handler where zoom speed scales with distance
- **Dynamic frustum:** Adjust `camera.near/far` based on distance and shelf range to prevent clipping
- **Keyboard navigation:** WASD + QE + Shift/Space for full spatial control with damped velocity
- **No library change:** All improvements implemented over existing Three.js r158 APIs exposed by `3d-force-graph`

## Files Changed

### Documents

| Document | Action | Description |
|----------|--------|-------------|
| `specs/ontology/ontology-visualization/discovery-3d-navigation.md` | `created` | Discovery: diagnosis of 5 current UX problems, theory mapping, applicability analysis |
| `specs/ontology/ontology-visualization/implementation-plan-3d-navigation.md` | `created` | 6-phase implementation plan with code-level detail for each phase |

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[vault-explorer-discovery]] | `refines` | Extends the original explorer design with advanced 3D navigation concepts |
| [[implementation-plan]] | `refines` | Extends the base implementation plan with navigation-specific phases |
