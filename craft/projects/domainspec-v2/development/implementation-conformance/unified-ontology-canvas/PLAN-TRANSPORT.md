# Plan Transport

- Plan status: authored, repaired after bounded review, and internally validated.
- Mutation status: blocked; `selected_swu=none`.
- Recommended first unit: `SWU-UOC-001`.
- First-unit write scope: only `unified-canvas-model.mjs` and its validator in
  the existing ontology-experiment directory.
- First-unit exclusions: HTML/SVG, layout, CSS, interactions, JSON source files,
  docs, dependencies, browser automation, Git, promotion.
- Lifecycle: Task Session executes one selected unit; Invoke Refresh applies the
  exact closeout contract; no successor auto-runs.
- Context Builder: generate the selected unit's execution pack at Task Session
  time from its task file and exact source anchors.
- Claim ceiling: Plan evidence only; no product evidence exists from this run.
- Work Pack shape: fifteen one-behavior mutation SWUs, one task per SWU, plus a
  product-read-only verification task; exact browser mode begins at SWU-UOC-004.
