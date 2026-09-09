# TASK-OEWSN-02: Relation Rendering and Keyboard Operation

Status: blocked. SWU-OEWSN-005 Task Session attempt `20260802T030021Z`
returned terminal BLOCK before product mutation. No successor is selected and
`mutation_authorized` remains false.

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

- Terminal preflight: BLOCK under
  `BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION`.
- Evidence: the Work Pack and manifest selected SWU-OEWSN-005, but the mutation
  admission contract, cumulative semantic build binding and mandatory
  build/browser output identities remained SWU-OEWSN-004 specific or outside
  this SWU's declared ownership.
- Product files changed: zero.
- Preserved residue: `OEWSN-RELATION-DUPLICATE-TUPLES`; ambiguous source tuples
  must continue to fail `GRAPH_EDGE_AMBIGUOUS`.

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
- Handoff: blocked; route to an explicitly authorized Invoke Refresh repair for
  the stale admission, cumulative-build and evidence-output contracts. Do not
  retry Task Session until that owner receipt passes.

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
restoration failure blocks the task. Stale mutation admission, an unowned
cumulative build evolution or unreachable mandatory build/browser evidence
also blocks before product mutation; those conditions are recorded as
`BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION` and remain owned by Invoke Refresh.
