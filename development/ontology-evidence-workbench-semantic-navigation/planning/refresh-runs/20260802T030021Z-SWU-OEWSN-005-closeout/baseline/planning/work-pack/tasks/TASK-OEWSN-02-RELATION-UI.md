# TASK-OEWSN-02: Relation Rendering and Keyboard Operation

## Objective

Use only the versioned relation record to make relation identity visible,
non-color-recoverable and role-sensitive for keyboard users.

## Implementation detail

Render exact predicate text, arrow/direction, source/target, provenance and
authority from the record. CSS tokens are generated from profile mapping keys,
not edge IDs. Inert geometry has no tab stop or activation role. Actionable
instances use one documented focus model and open the exact relation inspector
with Enter/Space.

## Smallest Working Units

### SWU-OEWSN-005 — Render redundant relation semantics

- Primary behavior: the selected relation shows exact fields and stable
  predicate color/presentation pattern with non-color redundancy
- Independent acceptance: selected-edge default/grayscale/forced-color witness
- Split analysis: visual structure, token mapping and exact label are one
  semantic rendering boundary; keyboard activation is independently SWU-006
- Dependencies: SWU-004
- Source anchors: CR-01, Design Relation Visual Language and quality extension
- Write scope: `OewApp.tsx`, `EvidenceWorkspace.tsx`, `EvidenceInspector.tsx`,
  `relationRendering.test.tsx`, `oew.css` and patch 0003
- Done: renderers consume no raw edge semantics; named graphics meet 3:1;
  exact text/direction survives color removal
- Acceptance evidence: component tests, screenshot/DOM/contrast artifacts
- Validation: focused typed tests and selected-edge Chromium matrix
- Execution owner: subagent or local fallback
- Handoff: exact selectors, token mapping and browser receipt

### SWU-OEWSN-006 — Enforce role-sensitive edge keyboard behavior

- Primary behavior: only actionable relation instances enter focus and activate
- Independent acceptance: inert edge tab count zero; actionable edge has
  visible focus, exact accessible name, Enter/Space result and restoration
- Split analysis: focus membership and activation must close together to avoid
  a focusable no-op; rendering semantics already pass in SWU-005
- Dependencies: SWU-005
- Source anchors: CR-02, activation/result/dismissal/restoration matrix
- Write scope: `keyboard.ts`, `store.ts`, `OewApp.tsx`,
  `navigation.test.tsx` and patch 0003
- Done: documented direct/roving model and complete exact-instance round trip
- Acceptance evidence: keyboard trace, accessibility snapshot and focus ledger
- Validation: focused typed tests plus keyboard-only Chromium assertion
- Execution owner: subagent or local fallback
- Handoff: focus model, action contract, trace and receipt

## Failure modes

Color-only identity, arbitrary per-edge color, focus on inert geometry,
Enter no-op, inspector mismatch, hidden exact predicate, missing marker or
restoration failure blocks the task.
