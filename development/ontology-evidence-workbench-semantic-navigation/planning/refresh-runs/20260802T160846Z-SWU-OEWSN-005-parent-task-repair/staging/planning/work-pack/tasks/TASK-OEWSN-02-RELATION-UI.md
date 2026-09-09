# TASK-OEWSN-02: Relation Rendering and Keyboard Operation

Status: selected-awaiting-task-session-preflight. The prior SWU-OEWSN-005 Task
Session attempt `20260802T030021Z` and
`BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION` remain immutable terminal BLOCK
history. SWU-OEWSN-022 terminal PASS and its Invoke Refresh owner closeout now
satisfy the predecessor contract and bind the actual builder/test postimages.
`mutation_authorized` remains false; no product mutation is authorized before a
fresh SWU-OEWSN-005 Task Session preflight and admission PASS.

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

- Prior terminal preflight: BLOCK under
  `BLK-OEWSN-005-SEMANTIC-BUILD-EVOLUTION`; retained as immutable source
  evidence.
- Planning repair: complete. SWU-OEWSN-022 owns the reusable builder evolution;
  terminal receipt
  `planning/work-pack/session-evidence/SWU-OEWSN-022/20260802T135709Z/receipt.json`
  and owner closeout
  `planning/refresh-runs/20260802T135709Z-SWU-OEWSN-022-closeout/refresh-report.json`
  PASS. They bind builder postimage
  `6a762811808932c698ebebb7eb176b27bf7f65c5153ef03edc9010a26c9aee24`
  (64405 bytes) and test postimage
  `bdb5d6440533134c23fd6504f45ae4214ec59f12b751e68574b2ba327134de18`
  (24823 bytes), satisfying the predecessor condition for selected
  SWU-OEWSN-005.
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
- Dependencies: SWU-OEWSN-004 and SWU-OEWSN-022.
- Material write scope: new immutable per-unit binding
  `OEWSN-BUILD.SWU-OEWSN-005.binding.json` and cumulative patch
  `0003-oew-semantic-navigation.patch` only.
- Logical patch targets: `OewApp.tsx`, `EvidenceWorkspace.tsx`,
  `EvidenceInspector.tsx`, `oew.css` and new `relationRendering.test.tsx` in the
  isolated source tree. The four historical overlay files are read-only and
  must not be edited in place.
- Cumulative build contract: the per-unit binding references the exact v1
  predecessor binding digest, preserves its historical base, binds the
  generalized builder/test postimages from SWU-OEWSN-022, binds patch 0003 and
  typed-test identities, and derives owner/output identity from SWU-OEWSN-005.
  Patch 0003 applies exactly once after byte-verifying and applying patches
  0001–0002; path escape, reapplication, collision, apply failure and
  owner/output mismatch fail closed.
- Exact execution outputs: build handle, immutable `dashboard-dist/`, retained
  `semantic-patch-snapshot/`, tree-bound `browser-evidence/` and terminal Task
  Session receipt under the selected SWU and fresh attempt identity.
- Done: renderers consume no raw edge semantics; named graphics meet 3:1;
  exact text/direction survives color removal
- Acceptance evidence: component tests, screenshot/DOM/contrast artifacts
- Validation: focused typed tests and selected-edge Chromium matrix
- Execution owner: subagent or local fallback
- Handoff: ready for `task-session:execute:SWU-OEWSN-005`. Task Session must
  build fresh strict context, verify the current admission contract, bind the
  two material baselines and return admission PASS before any product write.

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
restoration failure blocks the task. Editing historical overlay files in place,
stale mutation admission, an unowned cumulative build evolution, a patch that
does not apply exactly once after patches 0001–0002, or unreachable mandatory
build/browser evidence also blocks before product mutation. The prior blocker
receipt remains history; any recurrence must return a new fingerprint rather
than silently reopening the resolved planning receipt.
