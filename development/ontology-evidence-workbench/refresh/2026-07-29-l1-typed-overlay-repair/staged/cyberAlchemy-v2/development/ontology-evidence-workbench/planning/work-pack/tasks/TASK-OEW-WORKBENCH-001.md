# TASK-OEW-WORKBENCH-001 — Trust-Aware Interface Overlay

Layer/wave: L1 / W1
Dependencies: SWU-OEW-006P verified L1 toolchain handle
State: SWU-OEW-007 and SWU-OEW-008F complete; SWU-OEW-007T uniquely selected for typed-overlay repair
Implementation seam: OEW-owned overlay applied to the pinned upstream source;
upstream files remain generated build inputs.

## Implementation Detail

The overlay adds `packages/dashboard/src/oew/**` plus one explicit entrypoint
patch. It loads presentation graph, sidecar, and adapter receipt as separate
contracts; stores source selection by exact evidence reference; reuses upstream
graph/layout/search primitives; and renders feature-specific trust/evidence
surfaces.

The former plan made each UI region a separate execution selector. That
decomposition is retained below as historical design detail, but 008–013 are
no longer executable candidates. Their shared store, entrypoint, overlay,
package registry, and Poker journey made the coordination cost larger than the
component risk and exposed an undeclared-runner blocker before UI mutation.

The current Plan recomposes the unimplemented regions into one vertical UI
source unit. It consumes the immutable toolchain interface admitted by 006P
and the exact-source store admitted by 007. It may add only its declared
overlay/test bytes; it may not provision tools, alter the effective lock,
reuse a workspace installation, or claim a final build. SWU-OEW-013B owns the
post-feature build and independent verifier.

## Completed First Working Version Source Unit

### SWU-OEW-008F — Assemble the Poker Evidence Review Workbench

- Primary behavior: deliver one coherent local review journey over the
  verified Poker candidate evidence.
- Dependencies: completed 006P and 007 receipts.
- User-visible flow:
  1. persistent source/adapter/candidate/authority trust rail;
  2. `F1 → R1 → D1` exact grounding trace with `D2` conflict residue;
  3. exact inspector for relation, mapping loss, policy, diagnostics, path,
     digest, and receipt;
  4. equivalent Graph, Outline, and Table selection;
  5. search, filters, keyboard commands, deep-link recovery, Poker tour,
     receipt drawer, and responsive/reduced-motion shell.
- Target inventory:
  - `.../upstream/overlay/first-working-version-manifest.json`
  - `.../upstream/overlay/packages/dashboard/src/oew/TrustRail.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/TrustRail.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/trust.css`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceInspector.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/inspector.css`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceWorkspace.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceOutline.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceTable.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/viewParity.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/viewParity.test.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/CommandPalette.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/EvidenceFilters.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/keyboard.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/navigation.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/PokerTour.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/tours/poker-o13.json`
  - `.../upstream/overlay/packages/dashboard/src/oew/PokerTour.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/OewApp.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/oew.css`
  - `.../upstream/overlay/packages/dashboard/src/oew/responsive.test.tsx`
  - `.../test/trust-rail.test.mjs`
  - `.../test/evidence-inspector.test.mjs`
  - `.../test/view-parity.test.mjs`
  - `.../test/navigation.test.mjs`
  - `.../test/poker-tour.test.mjs`
  - `.../test/responsive.test.mjs`
- Validation:
  `npm run test:trust-rail && npm run test:evidence-inspector && npm run test:view-parity && npm run test:navigation && npm run test:poker-tour && npm run test:responsive`.
- Done: all focused commands execute under pinned Node, the new manifest binds
  completed 007 plus all 008F source, the Poker journey is internally
  coherent, protected equality passes, and no final-build/browser claim is
  emitted.
- Expected handle: `oew-first-working-version-source/v1`.
- Split analysis: individual components remain focused assertions inside this
  unit, but none is a usable prototype or owns a stable independent runtime
  boundary. Final build, browser lifecycle, and independent verification
  remain separately falsifiable in 013B, 014, and 014V.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-008F/receipt.json`.
- Result: PASS — 28/28 live targets equal admitted staging, 18/18 focused
  tests pass, the package registry is unchanged, and protected equality holds.
- Handoff: the captured four-unit series advances once to selected
  `SWU-OEW-013B`; a fresh Task Session preflight remains mandatory.

## Active Typed-Input Repair

### SWU-OEW-007T — Repair the Strict Overlay Boundary

- Primary behavior: repair only the strict TypeScript boundary exposed by
  013B attempt 003, then rebind the exact current input bytes without producing
  the final build.
- Dependencies: completed 007 and 008F receipts.
- Exact target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/types.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts`
  - `.../upstream/overlay/packages/dashboard/src/oew/store.ts`
  - `.../upstream/overlay/overlay-manifest.json`
  - `.../upstream/overlay/first-working-version-manifest.json`
  - `.../upstream/L1-BUILD.lock.json`
- Read-only validators: existing `test/ui-store.test.mjs`; no test-file change.
- Validation: `npm run test:ui-store`, then in the exact fresh locked workroot
  `pnpm --filter @understand-anything/dashboard build`, expanded
  `tsc -b && vite build`.
- Done: the three strict source errors are repaired without `any`, tsconfig,
  package, generated-build, or unrelated changes; both manifests bind current
  bytes while retaining completed-007 historical receipt/preimage bindings;
  the lock retains `owner_swu`, `consumer_swu`, `build_owner_swu`, and
  `runtime_owner_swu` as `SWU-OEW-013B` and records `SWU-OEW-007T` only as
  mutation/binding owner.
- Expected handle: `oew-typed-overlay-repair/v1`.
- Split analysis: source fixes and their exact bindings close one typed-input
  behavior. Final build execution and verification remain owned by 013B.
- Closeout: shared contract; receipt
  `session-evidence/SWU-OEW-007T/receipt.json`.
- Handoff: stop; report 013B eligible without selecting it.

## Superseded Component Decomposition

### SWU-OEW-007 — Load Exact OEW Read Models

- Primary behavior: verify/load graph, sidecar, and adapter receipt into a
  source-reference-indexed UI store.
- Dependencies: 006P.
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
  unselected and may run only after 006P passes and a new human selection is
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
evidence only, as is the consumed 006B selector. The repaired graph has no
selected SWU. The component records 008–013 are retained as blocked or
unexecuted history and are superseded by 008F. They cannot be selected.

## Execution State

- SWU-OEW-007: PASS — exact graph/sidecar/receipt loading, eight-source-reference store, 3/3 tests, 6/6 target parity, protected equality.
- SWU-OEW-008: BLOCK — `test:trust-rail` resolves to an absent undeclared
  runner; pinned Node cannot directly execute the declared `.test.tsx`; no
  implementation mutation; protected equality 12,989/12,989.
- SWU-OEW-009 through 013: unexecuted and superseded by 008F.
- SWU-OEW-008F: PASS — complete source slice, 18/18 focused tests, 28/28
  staged/live parity, unchanged package registry, and protected equality.
- SWU-OEW-007T: selected for a fresh Task Session preflight; no source
  implementation or typed-build evidence exists yet.
- Next route: Task Session for only `SWU-OEW-007T`; 013B remains blocked and
  may be reported eligible only after passing 007T closeout.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
