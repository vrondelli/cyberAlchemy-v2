# Interfaces

## `UnifiedCanvasView`

The existing dependency-free HTML remains the only human-facing interface in
scope. It consumes the current relative JSON paths and exposes:

- open/close Explore and node inspector popovers;
- pan, zoom, fit-all, fit-selection, and reset;
- family/maturity/profile/relation filters that preserve graph identity;
- search and navigator results over visible or all nodes;
- node selection and complete available trace highlighting;
- keyboard/list navigation with the same IDs and relationships;
- visible local/candidate/non-authority and supplied-fixture cues.

The interface performs no writes, network calls beyond same-origin static JSON
loading, source execution, ontology editing, approval, or promotion.

## Internal Projection Boundary

`buildUnifiedCanvasProjection(data, selectedProfile)` is planned as a pure
function within the existing HTML module. Its returned contract must be testable
without SVG or DOM mutation before the renderer adopts it.
