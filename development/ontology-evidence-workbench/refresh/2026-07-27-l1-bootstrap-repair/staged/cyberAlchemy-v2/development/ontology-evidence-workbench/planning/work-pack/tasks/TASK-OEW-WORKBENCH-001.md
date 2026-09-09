# TASK-OEW-WORKBENCH-001 — Trust-Aware Interface Overlay

Layer/wave: L1 / W1
Dependencies: SWU-OEW-006B verified L1 build handle
State: replanned; blocked until 006B is selected and passes
Implementation seam: OEW-owned overlay applied to the pinned upstream source;
upstream files remain generated build inputs.

## Implementation Detail

The overlay adds `packages/dashboard/src/oew/**` plus one explicit entrypoint
patch. It loads presentation graph, sidecar, and adapter receipt as separate
contracts; stores source selection by exact evidence reference; reuses upstream
graph/layout/search primitives; and renders feature-specific trust/evidence
surfaces.

Each region is an independent SWU because data admission, trust display,
inspector semantics, view parity, navigation, tour, and responsive behavior
have different acceptance boundaries.

All units consume the immutable build interface admitted by 006B. They may add
only their declared overlay/test bytes; they may not provision tools, alter the
effective lock, reuse a workspace installation, or accept their own build.

## Smallest Working Units

### SWU-OEW-007 — Load Exact OEW Read Models

- Primary behavior: verify/load graph, sidecar, and adapter receipt into a
  source-reference-indexed UI store.
- Dependencies: 006B.
- Target inventory:
  - `.../upstream/overlay/overlay-manifest.json`
  - `.../upstream/patches/0001-oew-entrypoint.patch`
  - `.../upstream/overlay/packages/dashboard/src/oew/types.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/store.ts`
  - `.../test/ui-store.test.mjs`
- Algorithm: fetch tokenized files → validate versions/receipt digest → index
  source refs → reject missing/duplicate/mismatched mapping → initialize
  evidence-only state.
- Validation: `npm run test:ui-store`.
- Expected handle: `oew-ui-store/v1`.
- Split analysis: data readiness is independent of every rendered region.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-007/receipt.json`.
- Historical result: `BLOCK`; the former target graph lacked its validation
  seam and no implementation target was mutated. This refreshed unit is
  unselected and may run only after 006B passes and a new human selection is
  made.

### SWU-OEW-008 — Render Receipt-Backed Trust Rail

- Primary behavior: show source/adapter verification, candidate-only status,
  authority effect, freshness, and upstream pin from validated receipts.
- Dependencies: 007.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/TrustRail.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/TrustRail.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/trust.css`
- Done: missing/failed proof cannot render a verified label; status is textual,
  icon/shape-supported, and persistent.
- Validation: `npm run test:trust-rail`.
- Expected handle: `oew-trust-rail/v1`.
- Split analysis: trust display can pass without inspector/view parity.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-008/receipt.json`.

### SWU-OEW-009 — Render Exact Evidence Inspector

- Primary behavior: display exact source node/edge, relation, generalized
  mapping/loss, disposition, diagnostics, paths, digests, and authority effect.
- Dependencies: 007.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/inspector.css`
- Done: `derives-from` and indeterminate `specializes` never appear as only
  `builds_on`/`related`; missing exact sidecar blocks the panel.
- Validation: `npm run test:evidence-inspector`.
- Expected handle: `oew-evidence-inspector/v1`.
- Split analysis: inspector exactness has its own source/display oracle and
  does not require three-view navigation.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-009/receipt.json`.

### SWU-OEW-010 — Synchronize Graph, Outline, and Table

- Primary behavior: one source selection/filter state yields semantically
  equivalent graph, outline, and table views.
- Dependencies: 007, 009.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceWorkspace.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceOutline.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceTable.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/viewParity.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/viewParity.test.ts`
- Algorithm: derive all views from one indexed source model; emit normalized
  per-surface state snapshot; parity oracle compares selected ID, exact
  relation, disposition, diagnostic, and path membership.
- Validation: `npm run test:view-parity`.
- Expected handle: `oew-equivalent-views/v1`.
- Split analysis: parity is one cross-surface semantic behavior; search/tour/
  responsive concerns can pass independently.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-010/receipt.json`.

### SWU-OEW-011 — Add Search, Filters, and Keyboard Commands

- Primary behavior: navigate/filter the exact indexed evidence model without
  changing source selection semantics.
- Dependencies: 010.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/CommandPalette.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceFilters.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/keyboard.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/navigation.test.tsx`
- Done: text/kind/exact-relation/disposition/diagnostic filters and documented
  keyboard commands work in all views; invalid deep links recover safely.
- Validation: `npm run test:navigation`.
- Expected handle: `oew-navigation/v1`.
- Split analysis: navigation controls do not own tour order or responsive layout.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-011/receipt.json`.

### SWU-OEW-012 — Add the Poker Guided Tour

- Primary behavior: guide the exact ordered O13 story without altering graph
  membership.
- Dependencies: 010, 011.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/PokerTour.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/tours/poker-o13.json`
  - `.../upstream/overlay/packages/dashboard/src/oew/PokerTour.test.tsx`
- Done: ordered focus F1/R1/D1, D2 visible conflict, indeterminate specializes,
  receipt step, stable reduced-motion behavior.
- Validation: `npm run test:poker-tour`.
- Expected handle: `oew-poker-tour/v1`.
- Split analysis: tour is one deterministic teaching sequence and can fail
  independently of core navigation/layout.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-012/receipt.json`.

### SWU-OEW-013 — Implement Responsive and Reduced-Motion Layout

- Primary behavior: preserve trust/exact evidence access across wide, tablet,
  and mobile layout modes.
- Dependencies: 008–012.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/OewApp.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/oew.css`
  - `.../upstream/overlay/packages/dashboard/src/oew/responsive.test.tsx`
- Done: desktop three-pane, tablet drawers, mobile outline-first, focus order,
  no color-only state, reduced motion.
- Validation: `npm run test:responsive`.
- Expected handle: `oew-responsive-shell/v1`.
- Split analysis: responsive composition is one region-layout behavior;
  browser/a11y execution and receipts are separate in 014.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-013/receipt.json`.

All `.../` paths expand to the exact OEW implementation root and are fully
normalized in `swu-manifest.json`.

The former selection source under
`planning/work-pack/decisions/G-OEW-L1-SELECTION/` is retained as historical
evidence only. The repaired graph has no selected SWU. Every future unit needs
explicit selection and a fresh Task Session preflight.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
