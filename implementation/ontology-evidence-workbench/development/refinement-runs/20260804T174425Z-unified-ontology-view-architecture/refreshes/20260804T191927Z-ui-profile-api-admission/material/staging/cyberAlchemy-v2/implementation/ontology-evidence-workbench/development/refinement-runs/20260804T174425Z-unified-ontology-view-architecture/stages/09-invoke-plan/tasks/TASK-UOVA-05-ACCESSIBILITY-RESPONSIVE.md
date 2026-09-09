# TASK-UOVA-05 — Accessibility and Responsive Behavior

Goal: keep graph meaning and navigation usable across desktop, narrow, keyboard, forced-color, reduced-motion, and zoom states.

Write scope: OEW overlay workspace/inspector/navigation components and styles, browser/component tests, and session evidence.

## SWU-UOVA-015 — Desktop non-occluding inspector

Primary behavior: opening evidence never covers the selected relation or its endpoints.

Algorithm: measure selected geometry and proposed inspector region; choose non-overlapping dock placement or reduce/recenter the graph viewport; after layout/resize revalidate the intersection; if no desktop arrangement meets the contract, present the inspector as a resizable region and preserve graph visibility.

Acceptance: selected node, relation, and parallel-edge fixtures at supported desktop widths; zero intersection or documented reflow; `INSPECTOR_OCCLUSION` negative catches overlay. Dependencies: 012, 014. Select 016.

## SWU-UOVA-016 — Narrow modal and focus lifecycle

Primary behavior: at 390px, inspector/filter/path surfaces are titled modal sheets with deterministic return focus.

Algorithm: capture initiating control; mount one modal with heading and close affordance; make background inert; trap Tab/Shift+Tab; close by control or Escape; wait for prior scene commit; restore focus through the Navigation Frame fallback order.

Acceptance: keyboard-only open/use/close, inert background, focus trap, Escape, route change, missing initiator fallback, cancellation, no horizontal page overflow. Dependencies: 006, 011, 013–014. Select 017.

## SWU-UOVA-017 — Redundant-mode resilience

Primary behavior: meaning remains available without animation, authored color, pointer, normal text scale, or the spatial renderer.

Algorithm: map predicates to text plus patterns/borders in forced colors; disable animated layout/viewport in reduced motion; expose a documented graph entry and linear navigation path; preserve 44px-like target affordances without forcing overflow; reflow at 200% text; announce scene/selection changes; fall back to Full Index if adapter fails.

Acceptance: 390px, 200% text, forced colors, reduced motion, keyboard-only, and renderer-failure runs; relation direction/predicate, node kind, portal boundary, selection, and focus remain perceivable. Dependencies: 011, 014–016. Select 018.

Validation includes focused tests and later pinned Chromium acceptance; component tests alone are not terminal evidence. Closeout synchronizes the row, task, W3, and Work Pack. Expected result: mode-by-mode receipt with raw viewport/overflow/focus/DOM observations and screenshots only as supplemental evidence.
