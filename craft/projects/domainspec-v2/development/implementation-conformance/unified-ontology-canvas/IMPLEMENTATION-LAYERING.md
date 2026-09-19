---
module: unified-ontology-canvas
version: candidate-v0
status: draft
updatedAt: 2026-07-31
docType: implementation-layering
---

# Implementation Layering: Unified Ontology Canvas

## Target And Scope

- Target: dependency-free local ontology canvas experiment.
- Current state: brownfield five-lens renderer; unified projection absent.
- Readiness profile: pilot/local experiment only.

## Layer Decision Table

| Layer | Decision question | Minimum unit(s) | Included | Deferred | Exit evidence | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether the complete bundle can become one exact, deterministic, routable graph without semantic inference. | 001 projection, 002 node layout, 003 edge routing | stable IDs, explicit gaps, profile/evaluation provenance, five bands, ports/routes | DOM/SVG and human interaction | exact model/layout commands and positive/negative fixtures | continue only if exactness, stability, overlap, and route checks pass |
| L1 | After this layer, we know whether one canvas can render and support core reversible interaction while preserving graph identity. | 004 static render, 005 visibility, 006 focus/trace, 007 inspection, 008 viewport | browser harness scaffold, one SVG, graph-preserving filters/focus, exact inspector, bounded transform | navigator equivalence, custom keyboard, responsive/accessibility refinements | exact browser modes `static`, `visibility`, `focus`, `inspect`, `viewport` | continue only if graph ID and TypeScript provenance remain stable |
| L2 | After this layer, we know whether the canvas is equivalently operable and explainable across keyboard and responsive conditions. | 009 navigator, 010 canvas keyboard, 011 popover focus, 012 responsive reflow, 013 reduced motion, 014 non-color semantics, 015 recomposition | accessibility/responsive behaviors and final journey | minimap, shareable state, external layout, adapters, representative usability threshold | exact browser modes per SWU plus final `journey` | accept local pilot or remediate; no release claim |
| L3 | After this layer, we know whether optional overview/packaging additions are justified. | future separate Define | none | minimap, larger corpus, shareable URL, packaging | new approved evidence package | defer |

## Non-Regression Guardrails

- Later layers rerun L0 model/layout validators and retain exact profile fields.
- No visual convenience infers a missing bridge or hides coverage as absence.
- The browser harness exists from the first HTML mutation so every HTML SWU has
  executable independent acceptance.
- No package root or external dependency is added only for Playwright/layout.
- Browser evidence remains local-candidate evidence.

## Recommended Next Layer

- Next: L0.
- First SWU: `SWU-UOC-001` (recommended, not selected).
- Decision unlocked: exact unified graph assembly independent of rendering.
