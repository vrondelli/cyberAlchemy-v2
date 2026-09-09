# TASK-OEWSN-03: Projected Home, Portals, and Cards

## Objective

Replace all-graph entry with the approved Body War projected home while keeping
portal evidence, exact restoration and explicit all-loaded escape.

## Algorithm and state

Admit OD-01 profile IDs, derive current-filter cluster/card counts, create one
`NavigationFrame` before each portal/all-loaded transition, and restore the
frame on Back. Card copy, icons and counts are profile projections only.

## Smallest Working Units

### SWU-OEWSN-007 — Derive the approved Home projection

- Primary behavior: approved profile -> ordered bounded Home read model
- Independent acceptance: pure fixture returns only approved contexts, counts,
  provenance and all-loaded escape
- Split analysis: ID admission and ordered projection are inseparable; rendering
  and portal transitions are later units
- Dependencies: SWU-001, SWU-004
- Source anchors: CR-03; approved profile; Design entry flow
- Write scope: new `semanticNavigationProfile.ts`, `projectedHome.ts`,
  `projectedHome.test.ts`, `store.ts` type/state additions and patch 0003
- Done: unknown/pending/stale profile fails closed; no ontology membership is derived
- Evidence/validation: fixture tests and source-ID/digest assertions
- Owner/handoff: Task Session subagent/local fallback; return read-model receipt

### SWU-OEWSN-008 — Implement portal, Back, and all-loaded restoration

- Primary behavior: one portal/all-loaded round trip restores the exact frame
- Independent acceptance: scope/filter/selection/direction/viewport/focus ledger passes
- Split analysis: transition and restoration form one reversible state behavior;
  card presentation is independent SWU-009
- Dependencies: SWU-007, SWU-006
- Source anchors: Design state view; CR-03 restoration residue
- Write scope: `store.ts`, `OewApp.tsx`, `navigation.test.tsx`,
  `responsive.test.tsx`, `oew.css` and patch 0003
- Done: destination heading focus, Back, fallback focus and responsive reflow are explicit
- Evidence/validation: state fixtures plus desktop/narrow keyboard Chromium path
- Owner/handoff: Task Session subagent/local fallback; return navigation receipt

### SWU-OEWSN-009 — Render profile-owned card semantics

- Primary behavior: each card shows purpose, redundant icon/text, projection
  counts and exact entrance evidence
- Independent acceptance: card DOM/accessibility/screenshot contract passes
- Split analysis: icon, adjacent text and count/purpose are one card semantic
  record; portal state already closes separately
- Dependencies: SWU-007
- Source anchors: profile category icon contract; CR-10/11 boundary
- Write scope: `ProjectedHome.tsx`, `ProjectedHome.test.tsx`,
  `categoryIcons.tsx`, `oew.css` and patch 0003
- Done: icon never stands alone; count says current projection; zero policy is
  not applied here until SWU-020
- Evidence/validation: component/accessibility snapshot and desktop/narrow screenshot review
- Owner/handoff: Task Session subagent/local fallback; return card receipt

## Failure modes

Unapproved context, all-graph fallback on error, hard-coded counts, icon-only
kind, portal without exact evidence, state loss, overlap/clipping or language
that implies ontology membership blocks the task.
